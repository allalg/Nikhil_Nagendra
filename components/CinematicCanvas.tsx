"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CaveWall from "./CaveWall";
import SurroundWalls from "./SurroundWalls";
import Torch from "./Torch";
import EmberParticles from "./EmberParticles";
import DustMotes from "./DustMotes";
import WallSconces from "./WallSconces";
import { scrollProgressRef, cameraPosRef } from "./scrollState";

interface CinematicCanvasProps {
  onLoaded: () => void;
}

// ── MOUSE-DRIVEN FREE-LOOK CAMERA ─────────────────────────────────────────────
//
// The mouse/torch drives the 3D camera in ALL directions:
//
//   Y axis (vertical):
//     Mouse at top    → camera pans UP   → shows Hero section     (y = +29)
//     Mouse at bottom → camera pans DOWN → shows Contact section  (y = -35)
//     Full travel: 64 world units over the full screen height
//     Mapping: cameraY = pointer.y * 32 - 3
//       (pointer.y=+1 → y=+29 hero, pointer.y=-1 → y=-35 contact)
//
//   X axis (horizontal):
//     Mouse at right edge → camera pans right → reveals right side of wall
//     Mouse at left  edge → camera pans left  → reveals left side of wall
//     Range: ±5 world units
//
//   Dead zone: centre 8% of screen doesn't pan (prevents jitter at rest)
//   Lerp speed: 0.035 — slow cinematic weighted lag, feels like floating
//
// Camera Y range: +29 (hero top) to -35 (contact bottom) = 64 world units total.
function FreeLookController() {
  const camX     = useRef(-4.0); // Start at left
  const camY     = useRef(28.5); // Start at top
  const hasMoved = useRef(false);

  useFrame(({ camera, pointer }) => {
    // Detect first real mouse movement
    if (!hasMoved.current && (pointer.x !== 0 || pointer.y !== 0)) {
      hasMoved.current = true;
    }

    const dead = 0.08;
    const maxX = 5.0;
    
    let targetY = pointer.y * 32 - 3;
    let tx = 0;

    if (!hasMoved.current) {
      // Default idle position: Top Left (focus on the name)
      targetY = 28.5;
      tx = -4.0;
    } else {
      // Horizontal: dead-zone ramp
      if (Math.abs(pointer.x) > dead) {
        const t = (Math.abs(pointer.x) - dead) / (1 - dead);
        tx = Math.sign(pointer.x) * t * maxX;
      }
    }

    // Smooth lerp — heavy cinematic lag
    camX.current = THREE.MathUtils.lerp(camX.current, tx, 0.035);
    camY.current = THREE.MathUtils.lerp(camY.current, targetY, 0.035);

    camera.position.x = camX.current;
    camera.position.y = camY.current;
    camera.position.z = 4.5;

    // Always face wall head-on
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // Progress: 0 = hero (y=29), 1 = contact (y=-35)
    // Write to shared ref — NO setState, NO React re-render
    scrollProgressRef.current = Math.min(Math.max((29 - camY.current) / 64, 0), 1);

    // Write camera position for ProjectPreview overlay
    cameraPosRef.current.x = camX.current;
    cameraPosRef.current.y = camY.current;
  });

  return null;
}

export default function CinematicCanvas({ onLoaded }: CinematicCanvasProps) {
  return (
    <div className="fixed inset-0 w-full h-full bg-black select-none overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [-4.0, 28.5, 4.5], fov: 70, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(-4.0, 28.5, 0);
          setTimeout(() => onLoaded(), 800);
        }}
        className="w-full h-full pointer-events-auto cursor-none"
      >
        <color attach="background" args={["#000000"]} />

        <FreeLookController />

        {/* Flat sandstone cave wall — 20×65 world units */}
        <CaveWall />

        {/* Surrounding stone panels — no text, fill camera edges */}
        <SurroundWalls />

        {/* Cursor torch — primary light source */}
        <Torch baseIntensity={36} />

        {/* Wall sconces — click with torch to ignite permanently */}
        <WallSconces />

        {/* ── Section ambient lights ──────────────────────────────────────── */}
        {/* Subtle permanent warm glow at hero and contact sections so the    */}
        {/* charcoal text there is more legible even before the torch arrives. */}
        <pointLight
          position={[0, 29, 3.5]}
          color="#cc8844"
          intensity={6}
          distance={18}
          decay={1.2}
        />
        <pointLight
          position={[0, -29, 3.5]}
          color="#cc8844"
          intensity={6}
          distance={18}
          decay={1.2}
        />

        {/* Volumetric cave dust */}
        <DustMotes />

        {/* Rising embers */}
        <EmberParticles />
      </Canvas>
    </div>
  );
}
