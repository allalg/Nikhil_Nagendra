"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { torchPosRef } from "./torchState";

const SCONCES: { id: number; pos: [number, number, number] }[] = [
  { id: 0,  pos: [-3.8,  22.5, 0.0] },
  { id: 1,  pos: [ 3.8,  22.5, 0.0] },
  { id: 2,  pos: [-4.2,  11.0, 0.0] },
  { id: 3,  pos: [ 4.2,  11.0, 0.0] },
  { id: 4,  pos: [-3.8,   1.0, 0.0] },
  { id: 5,  pos: [ 3.8,   1.0, 0.0] },
  { id: 6,  pos: [-4.2,  -9.5, 0.0] },
  { id: 7,  pos: [ 4.2,  -9.5, 0.0] },
  { id: 8,  pos: [-3.8, -17.5, 0.0] },
  { id: 9,  pos: [ 3.8, -17.5, 0.0] },
  { id: 10, pos: [ 0.0, -23.0, 0.0] },
];

// LatheGeometry profile — classic torch flame silhouette
// (wide belly at y≈0.28, tapers to sharp tip at y=1.0)
function makeFlameGeo(widthScale: number) {
  return new THREE.LatheGeometry([
    new THREE.Vector2(0.00,                0.00),
    new THREE.Vector2(0.52 * widthScale,   0.10),
    new THREE.Vector2(0.68 * widthScale,   0.28),
    new THREE.Vector2(0.58 * widthScale,   0.50),
    new THREE.Vector2(0.38 * widthScale,   0.68),
    new THREE.Vector2(0.18 * widthScale,   0.85),
    new THREE.Vector2(0.00,                1.00),
  ], 14);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SINGLE SCONCE
//
//  ZERO-LAG DESIGN: ALL Three.js objects (flame meshes, point lights, embers)
//  are ALWAYS present in the scene graph — they are never created or destroyed
//  after mount. Only visibility and light intensity are toggled in useFrame.
//  This is why clicking a sconce is instant with no frame stutter.
// ─────────────────────────────────────────────────────────────────────────────
function SconceUnit({
  position,
  isLit,
}: {
  position: [number, number, number];
  isLit: boolean;
}) {
  // ── All refs — manipulated in useFrame only, never in React render ─────────
  const flameGroupRef  = useRef<THREE.Group>(null);
  const outerFlameRef  = useRef<THREE.Mesh>(null);
  const innerFlameRef  = useRef<THREE.Mesh>(null);
  const tipRef         = useRef<THREE.Mesh>(null);
  const emberPoolRef   = useRef<THREE.Mesh>(null);
  const cupRef         = useRef<THREE.Mesh>(null);       // cup rim — glows red
  // Lights — always in scene, intensity=0 when unlit
  const mainLightRef   = useRef<THREE.PointLight>(null);
  const baseLightRef   = useRef<THREE.PointLight>(null);
  // Ember indicators
  const dimEmberRef    = useRef<THREE.Mesh>(null);
  const readyEmberRef  = useRef<THREE.Mesh>(null);

  const posVec = useRef(new THREE.Vector3(...position));

  // Flame geometries built once at mount — shared across re-renders
  const outerGeo = useMemo(() => makeFlameGeo(1.0), []);
  const innerGeo = useMemo(() => makeFlameGeo(0.58), []);

  // Track lit state in a ref so useFrame doesn't need a closure over isLit
  const isLitRef = useRef(false);
  isLitRef.current = isLit;

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime();
    const lit  = isLitRef.current;
    const dist = torchPosRef.current.distanceTo(posVec.current);
    const near = dist < 5.5;

    // ── Flame group visibility (no create/destroy — just show/hide) ─────────
    if (flameGroupRef.current) flameGroupRef.current.visible = lit;

    // ── Cup emissive colour (set on material directly) ──────────────────────
    if (cupRef.current) {
      const mat = cupRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = lit ? 1.5 : 0;
    }

    // ── Ember indicators ─────────────────────────────────────────────────────
    if (dimEmberRef.current)   dimEmberRef.current.visible   = !lit && !near;
    if (readyEmberRef.current) readyEmberRef.current.visible = !lit && near;

    // ── Lights: zero intensity when unlit, flickering when lit ───────────────
    if (!mainLightRef.current || !baseLightRef.current) return;
    if (!lit) {
      mainLightRef.current.intensity = 0;
      baseLightRef.current.intensity = 0;
      return;
    }

    // ── FLAME ANIMATION (only runs when lit) ─────────────────────────────────
    if (outerFlameRef.current) {
      outerFlameRef.current.position.x =
        Math.sin(t * 1.8) * 0.045 + Math.sin(t * 3.3 + 0.7) * 0.020;
      outerFlameRef.current.rotation.z =
        Math.sin(t * 1.2) * 0.10 + Math.sin(t * 2.6 + 1.1) * 0.040;
      const wx = 1.0 + Math.sin(t * 4.1) * 0.14;
      const wy = 1.0 + Math.cos(t * 2.9 + 0.3) * 0.10;
      outerFlameRef.current.scale.set(wx, wy, wx * 0.75);
    }
    if (innerFlameRef.current) {
      innerFlameRef.current.position.x =
        Math.sin(t * 2.4 + 0.9) * 0.030 + Math.sin(t * 5.1) * 0.015;
      innerFlameRef.current.rotation.z = Math.sin(t * 1.9 + 1.3) * 0.07;
      const wx2 = 1.0 + Math.sin(t * 6.7 + 1.5) * 0.18;
      const wy2 = 1.0 + Math.cos(t * 4.3 + 2.0) * 0.12;
      innerFlameRef.current.scale.set(wx2, wy2, wx2 * 0.70);
    }
    if (tipRef.current) {
      const ts = 0.80 + Math.sin(t * 15.0) * 0.20;
      tipRef.current.scale.setScalar(ts);
      tipRef.current.position.x = Math.sin(t * 2.1) * 0.025;
    }
    if (emberPoolRef.current) {
      const es = 0.90 + Math.sin(t * 3.1) * 0.10;
      emberPoolRef.current.scale.set(es, 1, es);
    }

    // ── LIGHT FLICKER ────────────────────────────────────────────────────────
    const f = 1 + Math.sin(t * 6.3) * 0.18 + (Math.random() - 0.5) * 0.10;
    mainLightRef.current.intensity = 38 * f;
    mainLightRef.current.color.setHSL(
      0.07 + Math.sin(t * 0.7) * 0.012, 0.97,
      0.50 + Math.sin(t * 3.1) * 0.05,
    );
    baseLightRef.current.intensity = 14 + Math.sin(t * 1.2) * 2.5;
  });

  const cupZ   = 0.48;
  const flameY = 0.38;
  const flameZ = cupZ;

  return (
    <group position={position}>

      {/* ── IRON BRACKET ─────────────────────────────────────────────────── */}
      <mesh position={[0, -0.10, 0.03]}>
        <boxGeometry args={[0.22, 0.62, 0.04]} />
        <meshStandardMaterial color="#18100a" roughness={0.88} metalness={0.55} />
      </mesh>
      {/* Large decorative ring */}
      <mesh position={[0, 0.08, 0.07]}>
        <torusGeometry args={[0.16, 0.028, 10, 24]} />
        <meshStandardMaterial color="#201408" roughness={0.80} metalness={0.60} />
      </mesh>
      <mesh position={[0, 0.08, 0.06]}>
        <circleGeometry args={[0.13, 20]} />
        <meshStandardMaterial color="#14100a" roughness={0.92} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 0.10]}>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color="#28180a" roughness={0.70} metalness={0.70} />
      </mesh>
      {/* Plate rivets */}
      {[[-0.07, 0.20], [0.07, 0.20], [-0.07, -0.34], [0.07, -0.34]].map(([rx, ry], i) => (
        <mesh key={i} position={[rx, ry, 0.06]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="#241808" roughness={0.70} metalness={0.65} />
        </mesh>
      ))}
      {/* Horizontal arm */}
      <mesh position={[0, 0.08, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.030, 0.030, 0.50, 10]} />
        <meshStandardMaterial color="#18100a" roughness={0.85} metalness={0.55} />
      </mesh>
      {/* Diagonal support arm */}
      {(() => {
        const start = new THREE.Vector3(0, -0.28, 0.08);
        const end   = new THREE.Vector3(0,  0.00, 0.50);
        const mid   = start.clone().add(end).multiplyScalar(0.5);
        const dir   = end.clone().sub(start);
        const len   = dir.length();
        const quat  = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), dir.normalize()
        );
        return (
          <mesh position={[mid.x, mid.y, mid.z]} quaternion={quat}>
            <cylinderGeometry args={[0.022, 0.022, len, 8]} />
            <meshStandardMaterial color="#18100a" roughness={0.85} metalness={0.55} />
          </mesh>
        );
      })()}
      {/* Joint ring */}
      <mesh position={[0, 0.08, 0.52]}>
        <torusGeometry args={[0.044, 0.016, 8, 16]} />
        <meshStandardMaterial color="#201408" roughness={0.80} metalness={0.60} />
      </mesh>

      {/* ── TORCH CUP (chalice shape) ─────────────────────────────────────── */}
      {/* Rim — glows red when lit, toggled via ref in useFrame */}
      <mesh ref={cupRef} position={[0, 0.28, cupZ]}>
        <cylinderGeometry args={[0.115, 0.105, 0.06, 10, 1, true]} />
        <meshStandardMaterial
          color="#6b3a14" roughness={0.90} side={THREE.DoubleSide}
          emissive="#ff1400" emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0, 0.18, cupZ]}>
        <cylinderGeometry args={[0.110, 0.090, 0.18, 10]} />
        <meshStandardMaterial color="#7a4018" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.09, cupZ]}>
        <cylinderGeometry args={[0.094, 0.094, 0.04, 10]} />
        <meshStandardMaterial color="#4a2810" roughness={0.88} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.02, cupZ]}>
        <cylinderGeometry args={[0.090, 0.065, 0.14, 10]} />
        <meshStandardMaterial color="#7a4018" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.06, cupZ]}>
        <cylinderGeometry args={[0.065, 0.055, 0.10, 10]} />
        <meshStandardMaterial color="#5a2e10" roughness={0.90} />
      </mesh>
      <mesh position={[0, -0.12, cupZ]}>
        <cylinderGeometry args={[0.075, 0.075, 0.04, 10]} />
        <meshStandardMaterial color="#3a1e0a" roughness={0.88} metalness={0.30} />
      </mesh>

      {/* ── EMBER INDICATORS ─────────────────────────────────────────────── */}
      <mesh ref={dimEmberRef} position={[0, 0.32, cupZ]}>
        <sphereGeometry args={[0.055]} />
        <meshStandardMaterial color="#cc2200" emissive="#aa1400" emissiveIntensity={7} transparent opacity={0.90} />
      </mesh>
      <mesh ref={readyEmberRef} position={[0, 0.32, cupZ]} visible={false}>
        <sphereGeometry args={[0.080]} />
        <meshStandardMaterial color="#ff5500" emissive="#ff2200" emissiveIntensity={14} transparent opacity={0.95} />
      </mesh>

      {/* ── FLAME GROUP — always mounted, visible toggled in useFrame ─────── */}
      {/* This is the key to zero-lag ignition: all objects exist from mount.  */}
      {/* No Three.js allocation happens when the sconce is clicked.           */}
      <group ref={flameGroupRef} visible={false}>
        {/* Ember pool */}
        <mesh ref={emberPoolRef} position={[0, flameY - 0.06, flameZ]}>
          <cylinderGeometry args={[0.090, 0.090, 0.04, 12]} />
          <meshStandardMaterial color="#ff1400" emissive="#dd0800" emissiveIntensity={8} />
        </mesh>

        {/* Outer flame — LatheGeometry silhouette */}
        <mesh ref={outerFlameRef} position={[0, flameY, flameZ]} scale={[0.50, 0.72, 0.38]}>
          <primitive object={outerGeo} />
          <meshStandardMaterial
            color="#ff4400" emissive="#dd2200" emissiveIntensity={5}
            transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>

        {/* Inner flame */}
        <mesh ref={innerFlameRef} position={[0, flameY + 0.02, flameZ]} scale={[0.30, 0.65, 0.22]}>
          <primitive object={innerGeo} />
          <meshStandardMaterial
            color="#ffcc00" emissive="#ffaa00" emissiveIntensity={9}
            transparent opacity={0.93} side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>

        {/* White-hot tip */}
        <mesh ref={tipRef} position={[0, flameY + 0.62, flameZ]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#fffff0" emissiveIntensity={18} />
        </mesh>
      </group>

      {/* ── POINT LIGHTS — always in scene, intensity=0 when unlit ───────── */}
      {/* Keeping lights always mounted avoids the scene-graph insertion lag  */}
      {/* that would occur if we conditionally rendered them.                 */}
      <pointLight
        ref={mainLightRef}
        position={[0, flameY + 0.30, flameZ + 0.5]}
        color="#e87010"
        intensity={0}
        distance={44}
        decay={0.75}
      />
      <pointLight
        ref={baseLightRef}
        position={[0, flameY, flameZ]}
        color="#c04008"
        intensity={0}
        distance={18}
        decay={1.0}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function WallSconces() {
  const [litSet, setLitSet] = useState<Set<number>>(new Set());
  const litSetRef = useRef<Set<number>>(new Set());
  litSetRef.current = litSet;

  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      SCONCES.forEach((s) => {
        if (litSetRef.current.has(s.id)) return;
        const proj = new THREE.Vector3(...s.pos).project(camera);
        if (proj.z > 1) return;
        const d = Math.sqrt((ndcX - proj.x) ** 2 + (ndcY - proj.y) ** 2);
        if (d < 0.28) setLitSet((prev) => new Set([...prev, s.id]));
      });
    };
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [camera, gl.domElement]);

  return (
    <>
      {SCONCES.map((s) => (
        <SconceUnit key={s.id} position={s.pos} isLit={litSet.has(s.id)} />
      ))}
    </>
  );
}
