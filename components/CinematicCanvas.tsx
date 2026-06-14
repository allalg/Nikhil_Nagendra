"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CaveWall from "./CaveWall";
import Torch from "./Torch";
import EmberParticles from "./EmberParticles";
import DustMotes from "./DustMotes";
import WallSconces from "./WallSconces";
import { scrollProgressRef } from "./scrollState";

interface CinematicCanvasProps {
  onLoaded: () => void;
}

// ── MOUSE-DRIVEN FREE-LOOK CAMERA ─────────────────────────────────────────────
//
// The mouse/torch drives the 3D camera in ALL directions:
//
//   Y axis (vertical):
//     Mouse at top    → camera pans UP   → shows Hero section     (y = +18)
//     Mouse at bottom → camera pans DOWN → shows Contact section  (y = -23)
//     Full travel: 41 world units over the full screen height
//     Mapping: cameraY = pointer.y * 20.5 - 2.5
//       (pointer.y=+1 → y=+18 hero, pointer.y=-1 → y=-23 contact)
//
//   X axis (horizontal):
//     Mouse at right edge → camera pans right → reveals right side of wall
//     Mouse at left  edge → camera pans left  → reveals left side of wall
//     Range: ±5 world units
//
//   Dead zone: centre 8% of screen doesn't pan (prevents jitter at rest)
//   Lerp speed: 0.035 — slow cinematic weighted lag, feels like floating
//
// Camera Y range: +22 (hero top) to -23 (contact bottom) = 45 world units total.
// Hero heading is at world y≈24. With FOV=70, z=4.5:
//   visible height = 2*4.5*tan(35°) = 6.3 units.
//   Camera at y=22 shows world y=18.85→25.15, fully covering the hero (y≈24).
//
// Mapping: targetY = pointer.y * 22.5 - 0.5
//   pointer.y = +1 → targetY = +22  (top = hero)
//   pointer.y = -1 → targetY = -23  (bottom = contact)
function FreeLookController() {
  const camX   = useRef(0);
  const camY   = useRef(22);

  useFrame(({ camera, pointer }) => {
    const dead    = 0.08;
    const maxX    = 5.0;
    // Full Y range: pointer +1 → cameraY +22 (hero), pointer -1 → cameraY -23 (contact)
    // formula: targetY = pointer.y * 22.5 - 0.5
    const targetY = pointer.y * 22.5 - 0.5;

    // Horizontal: dead-zone ramp
    let tx = 0;
    if (Math.abs(pointer.x) > dead) {
      const t = (Math.abs(pointer.x) - dead) / (1 - dead);
      tx = Math.sign(pointer.x) * t * maxX;
    }

    // Smooth lerp — heavy cinematic lag
    camX.current = THREE.MathUtils.lerp(camX.current, tx, 0.035);
    camY.current = THREE.MathUtils.lerp(camY.current, targetY, 0.035);

    camera.position.x = camX.current;
    camera.position.y = camY.current;
    camera.position.z = 4.5;

    // Always face wall head-on
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // Progress: 0 = hero (y=22), 1 = contact (y=-23)
    // Write to shared ref — NO setState, NO React re-render
    scrollProgressRef.current = Math.min(Math.max((22 - camY.current) / 45, 0), 1);
  });

  return null;
}

export default function CinematicCanvas({ onLoaded }: CinematicCanvasProps) {
  return (
    <div className="fixed inset-0 w-full h-full bg-black select-none overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 22, 4.5], fov: 70, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 22, 0);
          setTimeout(() => onLoaded(), 800);
        }}
        className="w-full h-full pointer-events-auto cursor-none"
      >
        <color attach="background" args={["#000000"]} />

        <FreeLookController />

        {/* Flat sandstone cave wall — 20×52 world units */}
        <CaveWall />

        {/* Cursor torch — ONLY light source in pitch-black cave */}
        <Torch baseIntensity={28} />

        {/* Wall sconces — click with torch to ignite permanently */}
        <WallSconces />

        {/* Volumetric cave dust */}
        <DustMotes />

        {/* Rising embers */}
        <EmberParticles />
      </Canvas>
    </div>
  );
}
