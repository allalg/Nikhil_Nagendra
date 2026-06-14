"use client";

import { useEffect, useRef, useState } from "react";

interface CursorTorchProps {
  visibleAfterLoading: boolean;
}

export default function CursorTorch({ visibleAfterLoading }: CursorTorchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sparksContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse coordinate tracking
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const lastEmberTime = useRef(0);
  const frameId = useRef<number | null>(null);

  useEffect(() => {
    if (!visibleAfterLoading) return;

    // Fade in the custom cursor slightly after loading completes
    const fadeTimer = setTimeout(() => {
      setIsVisible(true);
    }, 400);

    return () => clearTimeout(fadeTimer);
  }, [visibleAfterLoading]);

  useEffect(() => {
    if (!isVisible) return;

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Initial position centering
    currentRef.current.x = window.innerWidth / 2;
    currentRef.current.y = window.innerHeight / 2;
    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;

    // High performance particle generator (pure DOM manipulation to bypass React renders)
    // Pool capped at 30 to prevent DOM bloat during fast mouse movement.
    const MAX_SPARKS = 30;
    const createSpark = (x: number, y: number) => {
      if (!sparksContainerRef.current) return;
      if (sparksContainerRef.current.childElementCount >= MAX_SPARKS) return;

      const spark = document.createElement("span");
      spark.className = "absolute w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_2px_rgba(245,158,11,0.6)] pointer-events-none ember-spark";

      // Randomize rise and sway parameters
      const swayX = `${(Math.random() - 0.5) * 80}px`;
      const riseY = `${-80 - Math.random() * 100}px`;
      const duration = `${0.6 + Math.random() * 0.8}s`;

      spark.style.setProperty("--sway-x", swayX);
      spark.style.setProperty("--rise-y", riseY);
      spark.style.setProperty("--duration", duration);

      // Position spark near the flame tip (slightly offset)
      const offsetWordX = (Math.random() - 0.5) * 12;
      const offsetWordY = -4 + (Math.random() - 0.5) * 8;

      spark.style.left = `${x + offsetWordX}px`;
      spark.style.top = `${y + offsetWordY}px`;

      sparksContainerRef.current.appendChild(spark);

      // Auto-cleanup DOM nodes
      setTimeout(() => {
        spark.remove();
      }, 1500);
    };

    // Lerp loop — same 0.042 factor as the 3D Torch light
    const tick = () => {
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      currentRef.current.x += (targetX - currentRef.current.x) * 0.042;
      currentRef.current.y += (targetY - currentRef.current.y) * 0.042;

      // Update torch cursor position directly in the DOM
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0)`;
      }

      // Spawn thermodynamic floating embers on motion or slowly at rest
      const now = performance.now();
      const velocity = Math.sqrt(
        Math.pow(targetX - currentRef.current.x, 2) +
        Math.pow(targetY - currentRef.current.y, 2)
      );

      const spawnRate = velocity > 5 ? 80 : 350;

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
      {/* 1. Spark Embers Layer (Absolute overlays) */}
      <div ref={sparksContainerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 2. Premium Hand-Drawn SVG Torch Cursor container */}
      <div
        ref={containerRef}
        className="absolute left-0 top-0 w-48 h-64 origin-[48px_20px] pointer-events-none transition-opacity duration-500 select-none"
        style={{
          // Center the flame tip (around x=48, y=20 within the 192x256 canvas)
          marginLeft: "-48px",
          marginTop: "-20px",
          willChange: "transform",
        }}
      >
        {/* Flame Corona Glow Layer (faint breathing radial heat-haze backplate) */}
        <div className="absolute w-56 h-56 rounded-full bg-orange-600/10 blur-[36px] -left-4 -top-8 pointer-events-none animate-pulse-glow" />

        {/* Dynamic Layered Flame Elements (Organic four-layer wiggler) */}
        <div className="absolute left-[32px] top-[10px] w-8 h-20 flex flex-col justify-end items-center origin-bottom">
          {/* Flame layer 0: Wide outer heat-haze glow */}
          <div className="absolute w-[44px] h-[72px] bg-gradient-to-t from-red-600/20 via-orange-500/10 to-transparent rounded-full opacity-35 blur-[5px] animate-flame-outer origin-bottom" />

          {/* Flame layer 1: Outer glowing shape (red-orange) */}
          <div className="absolute w-[30px] h-[52px] bg-gradient-to-t from-red-600 via-orange-500 to-amber-500 rounded-[50%_50%_35%_35%/60%_60%_40%_40%] opacity-45 blur-[1px] animate-flame-outer origin-bottom" />

          {/* Flame layer 2: Middle hot glow (orange-yellow) */}
          <div className="absolute w-[22px] h-[40px] bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 rounded-[50%_50%_30%_30%/65%_65%_35%_35%] opacity-80 blur-[0.6px] animate-flame-mid origin-bottom" />

          {/* Flame layer 3: Inner core spark (bright gold-white) */}
          <div className="absolute w-[12px] h-[26px] bg-gradient-to-t from-amber-400 via-yellow-100 to-white rounded-[50%_50%_25%_25%/70%_70%_30%_30%] opacity-95 animate-flame-core origin-bottom shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
        </div>

        {/* Premium Hand-Crafted Wood Torch Staff and Binding SVG */}
        <svg
          width="96"
          height="180"
          viewBox="0 0 96 180"
          className="absolute left-0 top-0 overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glowing Embers Gradient */}
            <linearGradient id="emberGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#ffb300" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#ff5722" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#b71c1c" stopOpacity="0.4" />
            </linearGradient>
            
            {/* Driftwood Vertical Shading - representing intense warm fire light at top fading to deep charcoal */}
            <linearGradient id="woodShadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff9a3c" />  {/* Warm incandescent flame glow directly painting the top */}
              <stop offset="10%" stopColor="#d35400" /> {/* Warm glowing amber wood */}
              <stop offset="25%" stopColor="#5c381c" /> {/* Rich mahogany driftwood brown */}
              <stop offset="65%" stopColor="#361f0e" /> {/* Deep shadow dark wood */}
              <stop offset="100%" stopColor="#120803" /> {/* Carbonized charcoal bottom handle */}
            </linearGradient>

            {/* Bronze Shading for Antique Relic Rings */}
            <linearGradient id="bronzeShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#543c22" />
              <stop offset="35%" stopColor="#cfa870" />
              <stop offset="65%" stopColor="#ebd2a9" />
              <stop offset="100%" stopColor="#3d2a15" />
            </linearGradient>

            {/* Charcoal / Soot Overlay Gradient */}
            <linearGradient id="sootGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0502" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#1a0d05" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#331c0d" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* SCONCE HEAD: Ancient Wrought-Iron Cage holding fire */}
          {/* 1. Incandescent Glowing charcoal backplate */}
          <path
            d="M30 66 L66 66 L58 86 L38 86 Z"
            fill="url(#emberGlow)"
          />
          
          {/* 2. Hot Glowing Charcoal chunks (blur filter handles the glowing bleeding light) */}
          <circle cx="42" cy="77" r="4.5" fill="#ff7043" opacity="0.9" />
          <circle cx="54" cy="79" r="3.5" fill="#ffa726" opacity="0.95" />
          <rect x="46" y="72" width="7" height="6" rx="2" fill="#d84315" opacity="0.8" />
          <circle cx="48" cy="81" r="2.5" fill="#ffcc80" opacity="0.9" />

          {/* 3. Dark, hand-forged horizontal iron bands */}
          <path d="M28 66 C40 68 56 68 68 66" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <path d="M28 66 C40 69 56 69 68 66" stroke="#424242" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M33 76 C42 77.5 54 77.5 63 76" stroke="#1c1c1c" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M36 86 C42 87 54 87 60 86" stroke="#212121" strokeWidth="3.5" strokeLinecap="round" />

          {/* 4. Hand-forged vertical iron cage bars (drawn over embers to wrap them) */}
          <path d="M30 66 Q36 76 38 86" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 66 Q43 76 43.5 86" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M48 66.5 L48 86.5" stroke="#1c1c1c" strokeWidth="2" strokeLinecap="round" />
          <path d="M57 66 Q53 76 52.5 86" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M66 66 Q60 76 58 86" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />

          {/* WOODEN HANDLE: Crooked, Rugged Driftwood Staff */}
          {/* 1. Main branch shape (Substantial 12px to 16px thickness snugly fitting under sconce collar) */}
          <path
            d="M 41 86 C 41 98, 39 110, 39 122 C 39 135, 42 148, 43 162 C 44 169, 44 175, 45 180 L 57 180 C 56 175, 55 169, 54 162 C 53 148, 55 135, 56 122 C 57 110, 54 98, 55 86 Z"
            fill="url(#woodShadow)"
            stroke="#120803"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 2. Soot & Heat-Carbonization overlay shape right under wrought-iron collar */}
          <path
            d="M 41 86 C 41 95, 39 104, 39 112 C 44 112, 50 110, 55 106 C 54 98, 55 92, 55 86 Z"
            fill="url(#sootGrad)"
          />

          {/* 3. Fine organic wood grain details following wobbly 3D contours */}
          <path d="M 44 86 C 44 95, 42 105, 42 115 C 41 123, 44 127, 44 133 C 44 145, 46 157, 47 180" stroke="#2d1607" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
          <path d="M 48 86 C 48 95, 47 105, 47 114 C 48 116, 50 118, 50 120 C 50 122, 48 124, 48 126 C 47 135, 49 148, 50 180" stroke="#2d1607" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M 52 86 C 51 98, 50 110, 51 122 C 52 135, 52 148, 53 180" stroke="#2d1607" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

          {/* 4. Deep organic bark knot details wrapping the grain */}
          <ellipse cx="49" cy="120" rx="3.2" ry="4.2" fill="#120501" />
          <path d="M 45.8 120 C 45.8 115, 52.2 115, 52.2 120 C 52.2 125, 45.8 125, 45.8 120" stroke="#1f0902" strokeWidth="1.2" fill="none" opacity="0.9" />
          <path d="M 43.8 120 C 43.8 111, 54.2 111, 54.2 120 C 54.2 129, 43.8 129, 43.8 120" stroke="#2c1205" strokeWidth="1.0" fill="none" opacity="0.7" />

          {/* 5. Tactile bark crevices & fissures */}
          <path d="M 40 94 Q 41 100 40 106" stroke="#120501" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <path d="M 53 145 Q 51 152 52 160" stroke="#120501" strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
          <path d="M 45 165 L 46 174" stroke="#120501" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />

          {/* 6. Firelight highlights catching organic ridges */}
          <path d="M 41.5 87 C 41.5 98, 39.5 110, 39.5 122" stroke="#ffb066" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <path d="M 43.5 126 C 43.5 138, 44.5 150, 45.5 162" stroke="#e07d3c" strokeWidth="1.0" strokeLinecap="round" opacity="0.35" />

          {/* BINDINGS & RELICS: Leather straps and bronze rings snugly wrapped to exact wood coordinates */}
          
          {/* 1. Criss-crossed leather bindings around top neck (y=90 to y=100) */}
          <path d="M 41 90 C 45 92, 51 92, 55 90" stroke="#7a5230" strokeWidth="3" strokeLinecap="round" />
          <path d="M 40.5 95 L 54.5 100" stroke="#5d3c22" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 54.5 95 L 40.5 100" stroke="#7a5230" strokeWidth="2.8" strokeLinecap="round" />
          
          {/* 2. Antique Bronze Relic Ring 1 (y=105) */}
          <path d="M 38.5 105 C 42 107, 52 107, 55.5 105" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 39 105 C 42 106.5, 52 106.5, 55 105" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.0" strokeLinecap="round" />
          <path d="M 38.5 107 C 42 108.5, 52 108.5, 55.5 107" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

          {/* 3. Middle Leather Grip Wraps (y=110 to y=120) */}
          <path d="M 39 110 C 43 112, 51 112, 55 110" stroke="#7a5230" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 39 115 C 42 117, 51 117, 55 115" stroke="#5d3c22" strokeWidth="3" strokeLinecap="round" />
          <path d="M 38.5 120 C 42 122, 51 122, 55.5 120" stroke="#7a5230" strokeWidth="3.2" strokeLinecap="round" />

          {/* 4. Hanging loose leather ties (organic human-touch threads) */}
          <path d="M 42 120 Q 37 130, 39 138" stroke="#5d3c22" strokeWidth="2.0" strokeLinecap="round" />
          <path d="M 43 121 Q 46 132, 43 140" stroke="#7a5230" strokeWidth="1.6" strokeLinecap="round" />

          {/* 5. Antique Bronze Relic Ring 2 (y=130) */}
          <path d="M 40.5 130 C 43.5 132, 52.5 132, 55.5 130" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 41 130 C 43.5 131.5, 52.5 131.5, 55 130" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.0" strokeLinecap="round" />
          <path d="M 40.5 132 C 43.5 133.5, 52.5 133.5, 55.5 132" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

          {/* 6. Lower Grip Leather Wraps (y=140 to y=150) */}
          <path d="M 43 140 C 46 142, 51 142, 54 140" stroke="#5d3c22" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 44.5 150 C 47.5 152, 52 152, 55 150" stroke="#7a5230" strokeWidth="3.5" strokeLinecap="round" />

          {/* 7. Antique Bronze Relic Ring 3 (y=160) */}
          <path d="M 42.5 160 C 45.5 162, 51.5 162, 54.5 160" stroke="url(#bronzeShade)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 43 160 C 45.5 161.5, 51.5 161.5, 54 160" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.0" strokeLinecap="round" />
          <path d="M 42.5 162 C 45.5 163.5, 51.5 163.5, 54.5 162" stroke="#1a0c02" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
