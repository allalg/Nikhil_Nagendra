"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { torchPosRef } from "./torchState";

// Known torch base intensity — avoids needing to traverse the scene
const TORCH_BASE_INTENSITY = 28;
const TORCH_DECAY = 0.9;

// Custom shader program for highly optimized volumetric dust motes
const DustShader = {
  uniforms: {
    uTime: { value: 0 },
    uTorchPosition: { value: new THREE.Vector3(0, 0, 1.2) },
    uTorchIntensity: { value: TORCH_BASE_INTENSITY },
    uDecay: { value: TORCH_DECAY },
    uAmbient: { value: 0.08 }, // Soft ambient visibility constant
  },
  vertexShader: `
    uniform float uTime;
    attribute float aSize;
    attribute vec3 aPhase;
    varying vec3 vWorldPosition;
    varying float vSize;
    
    void main() {
      // 1. Organic slow drift physics using harmonic sine/cosine curves
      vec3 currentPos = position;
      currentPos.x += sin(uTime * 0.12 + aPhase.x) * 0.6;
      currentPos.y += cos(uTime * 0.09 + aPhase.y) * 0.5;
      currentPos.z += sin(uTime * 0.18 + aPhase.z) * 0.3;
      
      // Calculate world coordinates for accurate distance lighting in fragment shader
      vec4 worldPosition = modelMatrix * vec4(currentPos, 1.0);
      vWorldPosition = worldPosition.xyz;
      vSize = aSize;
      
      // Standard camera projection
      vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Point size attenuation (particles get smaller as they drift away from camera)
      gl_PointSize = aSize * (280.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform vec3 uTorchPosition;
    uniform float uTorchIntensity;
    uniform float uDecay;
    uniform float uAmbient;
    
    varying vec3 vWorldPosition;
    varying float vSize;
    
    void main() {
      // 1. Create a perfectly round, soft circular point with feathered edges
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distToCenter = length(coord);
      if (distToCenter > 0.5) discard;
      
      // Soft alpha dropoff towards the edges
      float circleAlpha = smoothstep(0.5, 0.18, distToCenter);
      
      // 2. Physical Quadratic Falloff calculation relative to Torch Light
      float d = distance(vWorldPosition, uTorchPosition);
      float attenuation = 1.0 / (1.0 + d * d * uDecay);
      float lightFactor = uTorchIntensity * attenuation;
      
      // 3. Double Atmosphere Color Interpolation
      // Faint ambient dark-amber in the dark vs glowing gold in the light
      vec3 darkColor = vec3(0.24, 0.21, 0.18);  // Deep organic dust slate
      vec3 lightColor = vec3(1.0, 0.78, 0.48);  // Glistening golden dust mote
      
      // Blend colors based on light proximity
      float blendFactor = clamp(lightFactor * 0.15, 0.0, 1.0);
      vec3 finalColor = mix(darkColor, lightColor, blendFactor);
      
      // 4. Subtle Ambient Visibility
      // Ensure the dust remains 8% opaque in pitch darkness to maintain spatial orientation
      float finalAlpha = circleAlpha * mix(uAmbient, 0.45, blendFactor);
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};

export default function DustMotes() {
  const count = 180; // Increased for full 52-unit vertical coverage
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate stable position, phase, and size buffers
  const [positions, phases, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 18;      // X — lateral spread
      pos[i3 + 1] = (Math.random() - 0.5) * 55;      // Y — full 52-unit vertical coverage + margin
      pos[i3 + 2] = 0.1 + Math.random() * 1.5;       // Z — float in front of wall

      ph[i3]     = Math.random() * Math.PI * 2;
      ph[i3 + 1] = Math.random() * Math.PI * 2;
      ph[i3 + 2] = Math.random() * Math.PI * 2;

      sz[i] = 0.05 + Math.random() * 0.12;
    }

    return [pos, ph, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    // Pass time uniform to shader for float offset calculations
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();

    // Read torch position directly from shared ref — NO scene.traverse()
    materialRef.current.uniforms.uTorchPosition.value.copy(torchPosRef.current);
    materialRef.current.uniforms.uTorchIntensity.value = TORCH_BASE_INTENSITY;
    materialRef.current.uniforms.uDecay.value = TORCH_DECAY;
  });

  // Statically clone uniforms to prevent shared reference bugs
  const uniforms = useMemo(() => THREE.UniformsUtils.clone(DustShader.uniforms), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 3]}
          count={count}
          array={phases}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={DustShader.vertexShader}
        fragmentShader={DustShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
