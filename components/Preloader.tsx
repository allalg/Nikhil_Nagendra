"use client";

import { useEffect, useState, useRef } from "react";

interface PreloaderProps {
  isLoading: boolean;
}

const INTRO_TEXT = "some caves hold stories.";

const INSTRUCTIONS = [
  { icon: "🔦", text: "Move your mouse to explore with the torch" },
  { icon: "🔥", text: "Click near wall sconces to ignite them" },
  { icon: "⬆⬇", text: "Move torch up / down to navigate sections" },
  { icon: "📜", text: "Hover over projects for a quick preview" },
];

export default function Preloader({ isLoading }: PreloaderProps) {
  const [mounted, setMounted] = useState(true);
  const [phase, setPhase] = useState(0);
  // phase 0: pure dark with tiny ember dot
  // phase 1: ember glow expands + floating particles
  // phase 2: intro text + instructions appear together
  // phase 3: everything fades out
  // phase 4: ready to exit

  const [textVisible, setTextVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [exitFade, setExitFade] = useState(false);
  const [minTimeReached, setMinTimeReached] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => timersRef.current.forEach(clearTimeout);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);           // Ember glow
    const t2 = setTimeout(() => {                              // Intro text
      setPhase(2);
      setTextVisible(true);
    }, 1400);
    const t3 = setTimeout(() => setShowInstructions(true), 2400);  // Instructions (staggered)
    const t4 = setTimeout(() => {                              // Fade everything out
      setFadingOut(true);
      setPhase(3);
    }, 7500);
    const t5 = setTimeout(() => setPhase(4), 8800);           // Ready to exit

    // Minimum 5 seconds
    const tMin = setTimeout(() => setMinTimeReached(true), 5000);

    timersRef.current = [t1, t2, t3, t4, t5, tMin];
    return clearTimers;
  }, []);

  // Exit when: phase ready AND WebGL loaded AND min time passed
  useEffect(() => {
    if (phase >= 4 && !isLoading && minTimeReached) {
      const t = setTimeout(() => {
        setExitFade(true);
        setTimeout(() => setMounted(false), 1400);
      }, 300);
      timersRef.current.push(t);
    }
  }, [phase, isLoading, minTimeReached]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black select-none transition-opacity duration-[1200ms] cubic-bezier-transition ${
        exitFade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* === EMBER CORE (vertically centered) === */}
      <div className="relative flex items-center justify-center" style={{ marginTop: "-60px" }}>

        {/* Outer volumetric halo */}
        {phase >= 1 && (
          <div
            className="absolute rounded-full animate-glow-expand pointer-events-none"
            style={{
              width: "340px",
              height: "340px",
              background: "radial-gradient(circle, rgba(251,146,60,0.14) 0%, rgba(180,83,9,0.07) 45%, transparent 75%)",
            }}
          />
        )}

        {/* Mid glow ring */}
        {phase >= 1 && (
          <div
            className="absolute rounded-full animate-glow-expand pointer-events-none"
            style={{
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle, rgba(251,146,60,0.3) 0%, rgba(180,83,9,0.12) 55%, transparent 80%)",
              animationDelay: "0.15s",
            }}
          />
        )}

        {/* Inner warm glow */}
        {phase >= 1 && (
          <div
            className="absolute rounded-full animate-glow-expand pointer-events-none"
            style={{
              width: "48px",
              height: "48px",
              background: "radial-gradient(circle, rgba(255,200,100,0.6) 0%, rgba(251,146,60,0.25) 60%, transparent 100%)",
              animationDelay: "0.05s",
            }}
          />
        )}

        {/* Floating ember particles */}
        {phase >= 1 && [
          { x: "-18px", y: "-85px", size: "3px", delay: "0.3s", dur: "2.8s" },
          { x: "22px",  y: "-110px", size: "2px", delay: "0.8s", dur: "3.2s" },
          { x: "-8px",  y: "-140px", size: "2.5px", delay: "0.5s", dur: "3.8s" },
          { x: "35px",  y: "-90px",  size: "2px", delay: "1.1s", dur: "2.5s" },
          { x: "-30px", y: "-120px", size: "2px", delay: "0.9s", dur: "3.5s" },
          { x: "10px",  y: "-160px", size: "1.5px", delay: "1.4s", dur: "4.0s" },
          { x: "-42px", y: "-95px",  size: "2px", delay: "1.8s", dur: "2.9s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ember-float pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              background: "rgba(251,191,36,0.9)",
              boxShadow: `0 0 4px 2px rgba(251,146,60,0.5)`,
              left: "50%",
              top: "50%",
              marginLeft: `calc(${p.size} / -2)`,
              marginTop: `calc(${p.size} / -2)`,
              "--float-x": p.x,
              "--float-y": p.y,
              "--float-dur": p.dur,
              opacity: 0,
              animationDelay: p.delay,
              animationFillMode: "both",
            } as React.CSSProperties}
          />
        ))}

        {/* Ember dot core */}
        <div
          className="relative z-10 rounded-full animate-pulse-glow"
          style={{
            width: phase >= 1 ? "6px" : "3px",
            height: phase >= 1 ? "6px" : "3px",
            background: phase >= 1
              ? "radial-gradient(circle, #fff8e1, #fbbf24)"
              : "rgba(251,191,36,0.7)",
            boxShadow: phase >= 1
              ? "0 0 12px 5px rgba(251,146,60,0.8), 0 0 30px 10px rgba(180,83,9,0.4)"
              : "0 0 4px 2px rgba(251,146,60,0.3)",
            transition: "all 0.8s ease-out",
          }}
        />
      </div>

      {/* === TEXT + INSTRUCTIONS BLOCK (below ember, always in flow) === */}
      <div
        className={`flex flex-col items-center select-none pointer-events-none ${
          fadingOut ? "animate-text-fade-out" : ""
        }`}
        style={{ marginTop: "48px" }}
      >
        {/* Intro text */}
        {textVisible && (
          <div
            className="font-myfont text-amber-200/90"
            style={{
              fontSize: "clamp(18px, 2.2vw, 28px)",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              textShadow: "0 0 20px rgba(251,146,60,0.4)",
              marginBottom: "40px",
            }}
            aria-label={INTRO_TEXT}
          >
            {INTRO_TEXT.split("").map((char, i) => (
              <span
                key={i}
                className="animate-char-reveal inline-block"
                style={{
                  animationDelay: `${i * 62}ms`,
                  animationFillMode: "both",
                  whiteSpace: char === " " ? "pre" : "normal",
                }}
              >
                {char}
              </span>
            ))}
          </div>
        )}

        {/* Interaction instructions — appear below intro text */}
        {showInstructions && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Thin divider */}
            <div
              className="instruction-reveal"
              style={{
                width: "50px",
                height: "1px",
                background: "rgba(180, 130, 60, 0.25)",
                marginBottom: "6px",
                animationDelay: "0ms",
              }}
            />

            {INSTRUCTIONS.map((item, i) => (
              <div
                key={i}
                className="instruction-reveal"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  animationDelay: `${(i + 1) * 300}ms`,
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    width: "26px",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "clamp(11px, 1.3vw, 14px)",
                    color: "rgba(220, 185, 120, 0.65)",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}

            {/* "entering cave..." tagline */}
            <div
              className="instruction-reveal"
              style={{
                marginTop: "12px",
                animationDelay: `${(INSTRUCTIONS.length + 1) * 300 + 200}ms`,
              }}
            >
              <span
                className="font-myfont"
                style={{
                  fontSize: "clamp(18px, 2.5vw, 26px)",
                  color: "rgba(251, 191, 36, 0.9)",
                  letterSpacing: "0.08em",
                  textShadow: "0 0 16px rgba(251,146,60,0.5)",
                }}
              >
                entering cave...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}
