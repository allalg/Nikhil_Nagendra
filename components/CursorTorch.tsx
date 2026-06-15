"use client";

import { useEffect, useRef, useState } from "react";

interface CursorTorchProps {
  visibleAfterLoading: boolean;
}

export default function CursorTorch({ visibleAfterLoading }: CursorTorchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const torchBodyRef = useRef<HTMLDivElement>(null);
  const flameGroupRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sparksContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse coordinate tracking
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const prevRef = useRef({ x: 0, y: 0 });
  const lastEmberTime = useRef(0);
  const frameId = useRef<number | null>(null);

  // 3D tilt state (smoothed, applied in rAF — no React re-render)
  const tiltRef = useRef({ rotateX: 0, rotateY: 0, skewY: 0 });

  useEffect(() => {
    if (!visibleAfterLoading) return;
    const fadeTimer = setTimeout(() => setIsVisible(true), 400);
    return () => clearTimeout(fadeTimer);
  }, [visibleAfterLoading]);

  useEffect(() => {
    if (!isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Initial position centering
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    currentRef.current.x = cx;
    currentRef.current.y = cy;
    mouseRef.current.x = cx;
    mouseRef.current.y = cy;
    prevRef.current.x = cx;
    prevRef.current.y = cy;

    // True Zero-Allocation Particle Pooling
    const MAX_SPARKS = 30;
    const sparkPool = useRef<HTMLSpanElement[]>([]);
    const sparkIdx = useRef(0);

    // Initialize the pool once
    if (sparkPool.current.length === 0 && sparksContainerRef.current) {
      for (let i = 0; i < MAX_SPARKS; i++) {
        const spark = document.createElement("span");
        spark.className = "absolute w-1.5 h-1.5 rounded-full bg-amber-500 pointer-events-none ember-spark hidden";
        sparksContainerRef.current.appendChild(spark);
        sparkPool.current.push(spark);
      }
    }

    const createSpark = (x: number, y: number) => {
      if (sparkPool.current.length === 0) return;
      
      const spark = sparkPool.current[sparkIdx.current];
      sparkIdx.current = (sparkIdx.current + 1) % MAX_SPARKS;

      // Reset CSS animation
      spark.style.animation = 'none';
      void spark.offsetHeight; // force reflow to restart animation
      spark.style.animation = '';

      const swayX = `${(Math.random() - 0.5) * 80}px`;
      const riseY = `${-80 - Math.random() * 100}px`;
      const duration = `${0.6 + Math.random() * 0.8}s`;

      spark.style.setProperty("--sway-x", swayX);
      spark.style.setProperty("--rise-y", riseY);
      spark.style.setProperty("--duration", duration);

      const offsetWordX = (Math.random() - 0.5) * 12;
      const offsetWordY = -4 + (Math.random() - 0.5) * 8;

      spark.style.left = `${x + offsetWordX}px`;
      spark.style.top = `${y + offsetWordY}px`;
      
      // Make visible
      spark.classList.remove("hidden");
      
      // Hide after animation finishes instead of removing from DOM
      setTimeout(() => {
        spark.classList.add("hidden");
      }, 1500);
    };

    // Main animation loop — lerp + 3D tilt
    const tick = () => {
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      // Smooth lerp (same 0.042 factor as 3D Torch light)
      currentRef.current.x += (targetX - currentRef.current.x) * 0.042;
      currentRef.current.y += (targetY - currentRef.current.y) * 0.042;

      // Velocity for 3D tilt
      const vx = currentRef.current.x - prevRef.current.x;
      const vy = currentRef.current.y - prevRef.current.y;
      velocityRef.current.vx += (vx - velocityRef.current.vx) * 0.12;
      velocityRef.current.vy += (vy - velocityRef.current.vy) * 0.12;
      prevRef.current.x = currentRef.current.x;
      prevRef.current.y = currentRef.current.y;

      // ── 3D TILT CALCULATION ──────────────────────────────────
      // Horizontal velocity → rotateY (torch leans sideways into motion)
      // Vertical velocity   → rotateX (torch tilts forward/back)
      // Also apply a subtle skewY for parallax between handle and flame
      const maxTilt = 18; // degrees
      const maxSkew = 4;
      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

      const targetRotateY = clamp(velocityRef.current.vx * 2.5, -maxTilt, maxTilt);
      const targetRotateX = clamp(-velocityRef.current.vy * 1.8, -maxTilt * 0.6, maxTilt * 0.6);
      const targetSkewY = clamp(velocityRef.current.vx * 0.8, -maxSkew, maxSkew);

      // Smooth the tilt values
      tiltRef.current.rotateY += (targetRotateY - tiltRef.current.rotateY) * 0.08;
      tiltRef.current.rotateX += (targetRotateX - tiltRef.current.rotateX) * 0.08;
      tiltRef.current.skewY += (targetSkewY - tiltRef.current.skewY) * 0.06;

      // ── APPLY TRANSFORMS ─────────────────────────────────────
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0)`;
      }

      // 3D perspective tilt on the torch body
      if (torchBodyRef.current) {
        const rX = tiltRef.current.rotateX.toFixed(2);
        const rY = tiltRef.current.rotateY.toFixed(2);
        torchBodyRef.current.style.transform =
          `perspective(400px) rotateX(${rX}deg) rotateY(${rY}deg)`;
      }

      // Flame parallax offset — flame tips lag behind the handle slightly
      if (flameGroupRef.current) {
        const flameOffsetX = -tiltRef.current.rotateY * 0.35;
        const flameOffsetY = tiltRef.current.rotateX * 0.25;
        flameGroupRef.current.style.transform =
          `translate3d(${flameOffsetX.toFixed(1)}px, ${flameOffsetY.toFixed(1)}px, 12px)`;
      }

      // SVG handle: subtle counter-skew gives depth illusion
      if (svgRef.current) {
        const sk = tiltRef.current.skewY.toFixed(2);
        svgRef.current.style.transform = `skewY(${sk}deg)`;
      }

      // Dynamic shadow removed for performance: updating CSS drop-shadow
      // in a 60fps loop forces the browser to constantly rasterize the SVG.
      // A static shadow is applied to the SVG below instead.

      // Spawn embers
      const now = performance.now();
      const speed = Math.sqrt(
        Math.pow(targetX - currentRef.current.x, 2) +
        Math.pow(targetY - currentRef.current.y, 2)
      );
      const spawnRate = speed > 5 ? 80 : 350;
      if (now - lastEmberTime.current > spawnRate) {
        createSpark(currentRef.current.x, currentRef.current.y);
        lastEmberTime.current = now;
      }

      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none overflow-hidden">
      {/* Spark Embers Layer */}
      <div ref={sparksContainerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Torch Cursor Container — positioned by translate3d in rAF */}
      <div
        ref={containerRef}
        className="absolute left-0 top-0 w-48 h-64 pointer-events-none transition-opacity duration-500 select-none"
        style={{
          marginLeft: "-48px",
          marginTop: "-20px",
          willChange: "transform",
        }}
      >
        {/* 3D perspective wrapper — rotated by velocity in rAF */}
        <div
          ref={torchBodyRef}
          className="w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "48px 80px",  // pivot around mid-handle
            willChange: "transform, filter",
          }}
        >
          {/* Flame Corona Glow (GPU Optimized: radial-gradient instead of heavy CSS blur) */}
          <div
            className="absolute w-56 h-56 rounded-full pointer-events-none animate-pulse-glow"
            style={{
              left: "-1rem",
              top: "-2rem",
              background: "radial-gradient(circle, rgba(234,88,12,0.2) 0%, rgba(234,88,12,0.05) 40%, rgba(234,88,12,0) 70%)",
              transform: "translateZ(-8px)"
            }}
          />

          {/* Dynamic Layered Flame Elements — parallax-shifted separately */}
          <div
            ref={flameGroupRef}
            className="absolute left-[32px] top-[10px] w-8 h-20 flex flex-col justify-end items-center origin-bottom"
            style={{
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            {/* Flame layer 0: Wide outer heat-haze glow (blur removed for perf) */}
            <div
              className="absolute w-[44px] h-[72px] bg-gradient-to-t from-red-600/20 via-orange-500/10 to-transparent rounded-full opacity-35 animate-flame-outer origin-bottom"
              style={{ transform: "translateZ(-4px)" }}
            />

            {/* Flame layer 1: Outer glowing shape (red-orange) */}
            <div
              className="absolute w-[30px] h-[52px] bg-gradient-to-t from-red-600 via-orange-500 to-amber-500 rounded-[50%_50%_35%_35%/60%_60%_40%_40%] opacity-45 animate-flame-outer origin-bottom"
              style={{ transform: "translateZ(2px)" }}
            />

            {/* Flame layer 2: Middle hot glow (orange-yellow) */}
            <div
              className="absolute w-[22px] h-[40px] bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 rounded-[50%_50%_30%_30%/65%_65%_35%_35%] opacity-80 animate-flame-mid origin-bottom"
              style={{ transform: "translateZ(6px)" }}
            />

            {/* Flame layer 3: Inner core spark (bright gold-white) */}
            <div
              className="absolute w-[12px] h-[26px] bg-gradient-to-t from-amber-200 via-yellow-100 to-white rounded-[50%_50%_25%_25%/70%_70%_30%_30%] opacity-100 animate-flame-core origin-bottom"
              style={{ transform: "translateZ(10px)" }}
            />
          </div>

          {/* Premium Hand-Crafted Wood Torch Staff SVG — counter-skewed for depth */}
          <svg
            ref={svgRef}
            width="96"
            height="180"
            viewBox="0 0 96 180"
            className="absolute left-0 top-0 overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transformOrigin: "48px 86px",
              willChange: "transform",
              // drop-shadow removed: extremely slow to compute on transforming SVGs on older laptops
            }}
          >
            <defs>
              {/* Glowing Embers Gradient */}
              <linearGradient id="emberGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#ffb300" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#ff5722" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#b71c1c" stopOpacity="0.4" />
              </linearGradient>

              {/* Driftwood Vertical Shading */}
              <linearGradient id="woodShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9a3c" />
                <stop offset="10%" stopColor="#d35400" />
                <stop offset="25%" stopColor="#5c381c" />
                <stop offset="65%" stopColor="#361f0e" />
                <stop offset="100%" stopColor="#120803" />
              </linearGradient>

              {/* Bronze Shading for Antique Relic Rings */}
              <linearGradient id="bronzeShade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#543c22" />
                <stop offset="35%" stopColor="#cfa870" />
                <stop offset="65%" stopColor="#ebd2a9" />
                <stop offset="100%" stopColor="#3d2a15" />
              </linearGradient>

              {/* Charcoal / Soot Overlay */}
              <linearGradient id="sootGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a0502" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#1a0d05" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#331c0d" stopOpacity="0" />
              </linearGradient>

              {/* 3D highlight — simulated rim light on the right edge */}
              <linearGradient id="rimLight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="70%" stopColor="transparent" />
                <stop offset="95%" stopColor="#ffb066" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ff9040" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* SCONCE HEAD: Wrought-Iron Cage */}
            <path d="M30 66 L66 66 L58 86 L38 86 Z" fill="url(#emberGlow)" />

            {/* Hot Glowing Charcoal chunks */}
            <circle cx="42" cy="77" r="4.5" fill="#ff7043" opacity="0.9" />
            <circle cx="54" cy="79" r="3.5" fill="#ffa726" opacity="0.95" />
            <rect x="46" y="72" width="7" height="6" rx="2" fill="#d84315" opacity="0.8" />
            <circle cx="48" cy="81" r="2.5" fill="#ffcc80" opacity="0.9" />

            {/* Dark iron bands */}
            <path d="M28 66 C40 68 56 68 68 66" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
            <path d="M28 66 C40 69 56 69 68 66" stroke="#424242" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M33 76 C42 77.5 54 77.5 63 76" stroke="#1c1c1c" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M36 86 C42 87 54 87 60 86" stroke="#212121" strokeWidth="3.5" strokeLinecap="round" />

            {/* Vertical iron cage bars */}
            <path d="M30 66 Q36 76 38 86" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
            <path d="M39 66 Q43 76 43.5 86" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M48 66.5 L48 86.5" stroke="#1c1c1c" strokeWidth="2" strokeLinecap="round" />
            <path d="M57 66 Q53 76 52.5 86" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M66 66 Q60 76 58 86" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />

            {/* WOODEN HANDLE */}
            <path
              d="M 41 86 C 41 98, 39 110, 39 122 C 39 135, 42 148, 43 162 C 44 169, 44 175, 45 180 L 57 180 C 56 175, 55 169, 54 162 C 53 148, 55 135, 56 122 C 57 110, 54 98, 55 86 Z"
              fill="url(#woodShadow)"
              stroke="#120803"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* 3D rim-light overlay on right edge of handle */}
            <path
              d="M 41 86 C 41 98, 39 110, 39 122 C 39 135, 42 148, 43 162 C 44 169, 44 175, 45 180 L 57 180 C 56 175, 55 169, 54 162 C 53 148, 55 135, 56 122 C 57 110, 54 98, 55 86 Z"
              fill="url(#rimLight)"
            />

            {/* Soot overlay */}
            <path
              d="M 41 86 C 41 95, 39 104, 39 112 C 44 112, 50 110, 55 106 C 54 98, 55 92, 55 86 Z"
              fill="url(#sootGrad)"
            />

            {/* Wood grain */}
            <path d="M 44 86 C 44 95, 42 105, 42 115 C 41 123, 44 127, 44 133 C 44 145, 46 157, 47 180" stroke="#2d1607" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            <path d="M 48 86 C 48 95, 47 105, 47 114 C 48 116, 50 118, 50 120 C 50 122, 48 124, 48 126 C 47 135, 49 148, 50 180" stroke="#2d1607" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            <path d="M 52 86 C 51 98, 50 110, 51 122 C 52 135, 52 148, 53 180" stroke="#2d1607" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

            {/* 3D left-edge shadow line on handle */}
            <path d="M 41.5 87 C 41.5 98, 39.5 110, 39.5 122 C 39.5 135, 42.5 148, 43.5 162" stroke="#0a0300" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />

            {/* Bark knot */}
            <ellipse cx="49" cy="120" rx="3.2" ry="4.2" fill="#120501" />
            <path d="M 45.8 120 C 45.8 115, 52.2 115, 52.2 120 C 52.2 125, 45.8 125, 45.8 120" stroke="#1f0902" strokeWidth="1.2" fill="none" opacity="0.9" />
            <path d="M 43.8 120 C 43.8 111, 54.2 111, 54.2 120 C 54.2 129, 43.8 129, 43.8 120" stroke="#2c1205" strokeWidth="1.0" fill="none" opacity="0.7" />

            {/* Bark fissures */}
            <path d="M 40 94 Q 41 100 40 106" stroke="#120501" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            <path d="M 53 145 Q 51 152 52 160" stroke="#120501" strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
            <path d="M 45 165 L 46 174" stroke="#120501" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />

            {/* Firelight highlights */}
            <path d="M 41.5 87 C 41.5 98, 39.5 110, 39.5 122" stroke="#ffb066" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <path d="M 43.5 126 C 43.5 138, 44.5 150, 45.5 162" stroke="#e07d3c" strokeWidth="1.0" strokeLinecap="round" opacity="0.35" />

            {/* BINDINGS & RELICS */}
            {/* Criss-crossed leather */}
            <path d="M 41 90 C 45 92, 51 92, 55 90" stroke="#7a5230" strokeWidth="3" strokeLinecap="round" />
            <path d="M 40.5 95 L 54.5 100" stroke="#5d3c22" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 54.5 95 L 40.5 100" stroke="#7a5230" strokeWidth="2.8" strokeLinecap="round" />

            {/* Bronze Ring 1 */}
            <path d="M 38.5 105 C 42 107, 52 107, 55.5 105" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 39 105 C 42 106.5, 52 106.5, 55 105" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.0" strokeLinecap="round" />
            <path d="M 38.5 107 C 42 108.5, 52 108.5, 55.5 107" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

            {/* Middle Leather Wraps */}
            <path d="M 39 110 C 43 112, 51 112, 55 110" stroke="#7a5230" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 39 115 C 42 117, 51 117, 55 115" stroke="#5d3c22" strokeWidth="3" strokeLinecap="round" />
            <path d="M 38.5 120 C 42 122, 51 122, 55.5 120" stroke="#7a5230" strokeWidth="3.2" strokeLinecap="round" />

            {/* Hanging leather ties */}
            <path d="M 42 120 Q 37 130, 39 138" stroke="#5d3c22" strokeWidth="2.0" strokeLinecap="round" />
            <path d="M 43 121 Q 46 132, 43 140" stroke="#7a5230" strokeWidth="1.6" strokeLinecap="round" />

            {/* Bronze Ring 2 */}
            <path d="M 40.5 130 C 43.5 132, 52.5 132, 55.5 130" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 41 130 C 43.5 131.5, 52.5 131.5, 55 130" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.0" strokeLinecap="round" />
            <path d="M 40.5 132 C 43.5 133.5, 52.5 133.5, 55.5 132" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

            {/* Lower Grip Wraps */}
            <path d="M 43 140 C 46 142, 51 142, 54 140" stroke="#5d3c22" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 44.5 150 C 47.5 152, 52 152, 55 150" stroke="#7a5230" strokeWidth="3.5" strokeLinecap="round" />

            {/* Bronze Ring 3 */}
            <path d="M 42.5 160 C 45.5 162, 51.5 162, 54.5 160" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 43 160 C 45.5 161.5, 51.5 161.5, 54 160" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.0" strokeLinecap="round" />
            <path d="M 42.5 162 C 45.5 163.5, 51.5 163.5, 54.5 162" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
