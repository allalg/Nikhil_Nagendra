"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { torchPosRef } from "./torchState";

interface TorchProps {
  baseIntensity?: number;
}

export default function Torch({ baseIntensity = 22 }: TorchProps) {
  const coreLightRef = useRef<THREE.PointLight>(null);
  const turbLightRef = useRef<THREE.PointLight>(null);
  const haloLightRef = useRef<THREE.PointLight>(null);

  const smoothPos = useRef(new THREE.Vector3(0, 22, 2.5));
  const targetPos = useRef(new THREE.Vector3(0, 22, 2.5));

  useFrame((state) => {
    const { pointer, viewport, clock, camera } = state;
    const time = clock.getElapsedTime();

    if (!coreLightRef.current || !turbLightRef.current || !haloLightRef.current) return;

    // Wall is flat at z≈0. Torch at z=2.5, safely in front.
    targetPos.current.x = camera.position.x + (pointer.x * viewport.width) / 2;
    targetPos.current.y = camera.position.y + (pointer.y * viewport.height) / 2;
    targetPos.current.z = 2.5;

    smoothPos.current.lerp(targetPos.current, 0.05);

    const driftX = Math.sin(time * 0.8) * 0.05;
    const driftY = Math.cos(time * 0.65) * 0.04;

    const px = smoothPos.current.x + driftX;
    const py = smoothPos.current.y + driftY;
    const pz = smoothPos.current.z;

    // Write to shared ref so WallSconces can check proximity
    torchPosRef.current.set(px, py, pz);

    // Core flame — direct hot-spot on the stone
    coreLightRef.current.position.set(px, py, pz);
    const cf = 1.0 + Math.sin(time * 5.2) * 0.09 + (Math.random() - 0.5) * 0.04;
    coreLightRef.current.intensity = baseIntensity * 0.55 * cf;
    coreLightRef.current.color.setHSL(0.085, 0.95, 0.58);

    // Turbulence — asymmetric shimmer
    turbLightRef.current.position.set(
      px + Math.sin(time * 4.1) * 0.2 + (Math.random() - 0.5) * 0.07,
      py + Math.cos(time * 3.3) * 0.15 + (Math.random() - 0.5) * 0.07,
      pz
    );
    const tf = 1.0 + Math.sin(time * 9.3) * 0.2 + (Math.random() - 0.5) * 0.06;
    turbLightRef.current.intensity = baseIntensity * 0.28 * tf;
    turbLightRef.current.color.setHSL(0.062, 0.92, 0.50);

    // Wide halo — long-range warm bleed
    haloLightRef.current.position.set(px, py, pz + 0.5);
    const hf = 1.0 + Math.sin(time * 0.9) * 0.08;
    haloLightRef.current.intensity = baseIntensity * 0.20 * hf;
    haloLightRef.current.color.setHSL(0.042, 0.88, 0.42);
  });

  return (
    <>
      {/*
        ── NO AMBIENT / DIRECTIONAL LIGHTS ─────────────────────────────────
        The cave is PITCH BLACK. Only these three point lights (the cursor
        torch) and permanently-lit wall sconces provide illumination.
        This creates the torch-reveal mechanic the user wants.
      */}

      {/* Core Flame — cursor interactive hot-spot */}
      <pointLight ref={coreLightRef} distance={20} decay={0.9} />

      {/* Turbulence shimmer */}
      <pointLight ref={turbLightRef} distance={16} decay={1.1} />

      {/* Wide Halo — long-range warm bleed from torch */}
      <pointLight ref={haloLightRef} distance={45} decay={0.7} />
    </>
  );
}
