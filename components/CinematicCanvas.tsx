"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CaveWall from "./CaveWall";
import SurroundWalls from "./SurroundWalls";
import Torch from "./Torch";
import EmberParticles from "./EmberParticles";
import DustMotes from "./DustMotes";
import WallSconces from "./WallSconces";
import { scrollProgressRef, cameraPosRef } from "./scrollState";
import { sconceGateState } from "./sconceGateState";

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
// Sconce 0 position — camera locks here until gate opens
const SCONCE_0_X = -2.5;
const SCONCE_0_Y = 28.5;

function FreeLookController() {
  const camX     = useRef(SCONCE_0_X);
  const camY     = useRef(SCONCE_0_Y);
  const hasMoved = useRef(false);
  const initialPointer = useRef<{x: number, y: number} | null>(null);
  
  const { size } = useThree();
  const isMobile = size.width < 768 || size.height > size.width;

  useFrame(({ camera, pointer }) => {
    // ── GATE CHECK: lock camera on sconce 0 until user lights it ──────────
    if (!sconceGateState.isOpen) {
      // Camera stays fixed on sconce 0 — no mouse movement allowed
      camX.current = THREE.MathUtils.lerp(camX.current, SCONCE_0_X, 0.05);
      camY.current = THREE.MathUtils.lerp(camY.current, SCONCE_0_Y, 0.05);

      camera.position.x = camX.current;
      camera.position.y = camY.current;
      camera.position.z = isMobile ? 9.0 : 4.5;
      camera.lookAt(camera.position.x, camera.position.y, 0);

      scrollProgressRef.current = 0;
      cameraPosRef.current.x = camX.current;
      cameraPosRef.current.y = camY.current;
      return;
    }

    // Detect first real mouse movement after gate opens,
    // BUT only allow it after the camera has finished its automatic pan to the name
    const NAME_X = -4.0;
    const NAME_Y = 28.5;
    
    // Check if we have reached the name position
    const reachedName = Math.abs(camX.current - NAME_X) < 0.1 && Math.abs(camY.current - NAME_Y) < 0.1;

    if (reachedName && !hasMoved.current) {
      if (!initialPointer.current) {
        // Record the mouse's resting position at the exact moment we reach the name
        initialPointer.current = { x: pointer.x, y: pointer.y };
      } else {
        // Only unlock if the mouse actually moves away from its resting position
        const dx = pointer.x - initialPointer.current.x;
        const dy = pointer.y - initialPointer.current.y;
        if (Math.abs(dx) > 0.03 || Math.abs(dy) > 0.03 || isMobile) { // on mobile, immediately unlock since no pointer movement
          hasMoved.current = true;
        }
      }
    }

    const dead = 0.08;
    const maxX = 5.0;
    
    let targetY = pointer.y * 32 - 3;
    let tx = 0;
    let targetZ = 4.5;

    if (isMobile) {
      targetZ = 12.0; // Pull camera far back to fit 10-unit wide wall on narrow screen
      // Read Y position from native scroll container
      const container = document.getElementById("mobile-scroll-container");
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          const scrollProgress = container.scrollTop / maxScroll;
          targetY = 29 - scrollProgress * 64; // +29 down to -35
        }
      }
    } else {
      // Horizontal pan logic for desktop only
      if (!hasMoved.current) {
        targetY = NAME_Y;
        tx = NAME_X;
      } else {
        if (Math.abs(pointer.x) > dead) {
          const t = (Math.abs(pointer.x) - dead) / (1 - dead);
          tx = Math.sign(pointer.x) * t * maxX;
        }
      }
    }

    // Smooth lerp — heavy cinematic lag
    camX.current = THREE.MathUtils.lerp(camX.current, tx, 0.035);
    camY.current = THREE.MathUtils.lerp(camY.current, targetY, 0.035);

    camera.position.x = camX.current;
    camera.position.y = camY.current;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);

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
        camera={{ position: [0, 29, 4.5], fov: 70, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 29, 0);
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
