"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { torchPosRef } from "./torchState";

interface Ember {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  size: number;
  phase: number;
  spawnType: "bottom" | "torch"; // Rising from bottom or flying off the torch
}

// ── Hoisted Color constants — zero GC pressure ──────────────────────────────
const colorSpark   = new THREE.Color("#fff2cc"); // Hot gold-white
const colorMid     = new THREE.Color("#ff8c1a"); // Fiery orange
const colorLate    = new THREE.Color("#282624"); // Cooling grey carbon/ash soot
const colorDarkRed = new THREE.Color("#881100"); // Transitional deep dimming red
const colorBlack   = new THREE.Color(0, 0, 0);
const tempColor    = new THREE.Color();

// Custom shader program for highly optimized polar-deformed embers
const EmberShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    attribute float aSize;
    attribute float aPhase;
    varying vec3 vColor;
    varying float vPhase;
    
    void main() {
      vColor = color;
      vPhase = aPhase;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation based on distance to maintain cinematic realism
      gl_PointSize = aSize * (320.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vColor;
    varying float vPhase;
    
    void main() {
      // 1. Shift to center coordinates
      vec2 uv = gl_PointCoord - vec2(0.5);
      float r = length(uv);
      
      // 2. Soft organic spark using exponential decay
      float alpha = exp(-r * 6.5);
      
      // 3. Subtle noise deformation for asymmetric wispiness
      float theta = atan(uv.y, uv.x);
      float noise = sin(theta * 3.0 + vPhase * 5.0 + uTime * 2.2) * 0.06
                  + cos(theta * 5.0 - uTime * 1.3) * 0.03;
      
      alpha *= (1.0 + noise * 2.5);
      
      // 4. Bounding boundaries
      if (r > 0.46 || alpha < 0.015) discard;
      alpha = min(alpha * 0.9, 0.85); // elegant transparency
      
      // 5. Thermodynamic hot gold core blending
      vec3 coreColor = vec3(1.0, 0.97, 0.88);
      float coreGlow = exp(-r * 12.0);
      vec3 finalColor = mix(vColor, coreColor, coreGlow * 0.8);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};


// Helper to initialize a single ember (defined outside component to satisfy React purity rules)
const createEmber = (torchRef: React.MutableRefObject<THREE.Vector3>, ember: Partial<Ember> = {}): Ember => {
  const torchPos = torchRef.current;
  const isTorchSpawn = Math.random() > 0.6; // 40% sparks from torch, 60% global floor ascent
  
  const x = isTorchSpawn 
    ? torchPos.x + (Math.random() - 0.5) * 0.3
    : (Math.random() - 0.5) * 16;
    
  const y = isTorchSpawn 
    ? torchPos.y + (Math.random() - 0.5) * 0.3
    : -10 + Math.random() * 2; // Rise from bottom

  const z = isTorchSpawn
    ? torchPos.z + (Math.random() - 0.5) * 0.2
    : 0.1 + Math.random() * 0.8; // Float slightly in front of the wall

  return {
    x,
    y,
    z,
    vx: (Math.random() - 0.5) * 0.25,
    vy: 0.35 + Math.random() * 0.45, // Vertical ascent speed
    vz: (Math.random() - 0.5) * 0.1,
    age: 0,
    life: 2.2 + Math.random() * 3.8, // 2.2 to 6 seconds lifetime
    size: 0.045 + Math.random() * 0.075, // delicate, tiny embers
    phase: Math.random() * Math.PI * 2,
    spawnType: isTorchSpawn ? "torch" : "bottom",
    ...ember
  };
};

export default function EmberParticles() {
  const count = 50; // Restrained count for premium elegance
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Statically allocate arrays for positions, colors, sizes, and phases
  const posArr = useMemo(() => new Float32Array(count * 3), [count]);
  const colorArr = useMemo(() => new Float32Array(count * 3), [count]);
  const sizeArr = useMemo(() => new Float32Array(count), [count]);
  const phaseArr = useMemo(() => new Float32Array(count), [count]);

  // Keep track of the ember objects in a mutable ref array
  const embers = useRef<Ember[]>([]);

  // Initialize embers array outside the render phase
  useEffect(() => {
    if (embers.current.length === 0) {
      for (let i = 0; i < count; i++) {
        const ember = createEmber(torchPosRef, {});
        ember.age = Math.random() * ember.life; // Pre-warm the particle system
        embers.current.push(ember);
      }
    }
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = geo.getAttribute("color") as THREE.BufferAttribute;
    const sizeAttr = geo.getAttribute("aSize") as THREE.BufferAttribute;
    const phaseAttr = geo.getAttribute("aPhase") as THREE.BufferAttribute;

    const pArray = posAttr.array as Float32Array;
    const cArray = colorAttr.array as Float32Array;
    const sArray = sizeAttr.array as Float32Array;
    const phArray = phaseAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const p = embers.current[i];
      p.age += 0.016; // Approximate delta time for 60fps

      // Respawn particle if it dies or floats off screen
      if (p.age >= p.life || p.y > 10) {
        embers.current[i] = resetEmber({});
        continue;
      }

      // 1. Organic Drift Physics
      // Horizontal sway using multi-frequency sine wave based on phase
      const sway = Math.sin(time * 1.5 + p.phase) * 0.006;
      p.x += p.vx * 0.016 + sway;
      p.y += p.vy * 0.016;
      p.z += p.vz * 0.016;

      // If spawned from torch, let them float outwards slightly with drag
      if (p.spawnType === "torch") {
        p.vx *= 0.97; // air resistance
        p.vy *= 0.98;
      }

      // 2. Thermodynamic Color Mapping (Ignites hot, transitions to red, cools to dark ash)
      const lifeRatio = p.age / p.life;
      if (lifeRatio < 0.15) {
        // Ignite: transition from hot gold-white to fiery orange
        tempColor.copy(colorSpark).lerp(colorMid, lifeRatio / 0.15);
      } else if (lifeRatio < 0.5) {
        // Mid-life: transition from fiery orange to dimming red
        tempColor.copy(colorMid).lerp(colorDarkRed, (lifeRatio - 0.15) / 0.35);
      } else if (lifeRatio < 0.85) {
        // Cooled carbon soot/ash stage
        tempColor.copy(colorDarkRed).lerp(colorLate, (lifeRatio - 0.5) / 0.35);
      } else {
        // Late-life: fade completely to black
        tempColor.copy(colorLate).lerp(colorBlack, (lifeRatio - 0.85) / 0.15);
      }

      // Write position data to attribute array
      const i3 = i * 3;
      pArray[i3] = p.x;
      pArray[i3 + 1] = p.y;
      pArray[i3 + 2] = p.z;

      // Write color data
      cArray[i3] = tempColor.r;
      cArray[i3 + 1] = tempColor.g;
      cArray[i3 + 2] = tempColor.b;

      // Write size data (embers shrink as they burn out)
      const sizeScale = lifeRatio < 0.8 ? 1.0 - lifeRatio * 0.65 : (1.0 - lifeRatio) * 1.75; // Shrink at the end
      sArray[i] = p.size * sizeScale * 1.25; // Corrected scale factor for shader material

      // Write phase data
      phArray[i] = p.phase;
    }

    // Flag attributes for GPU upload
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    phaseAttr.needsUpdate = true;

    // Pass time uniform to shader
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
    }
  });

  // Statically clone uniforms to prevent shared reference bugs
  const uniforms = useMemo(() => THREE.UniformsUtils.clone(EmberShader.uniforms), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[posArr, 3]}
          count={count}
          array={posArr}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorArr, 3]}
          count={count}
          array={colorArr}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizeArr, 1]}
          count={count}
          array={sizeArr}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phaseArr, 1]}
          count={count}
          array={phaseArr}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={EmberShader.vertexShader}
        fragmentShader={EmberShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={true}
      />
    </points>
  );
}
