"use client";

import { useEffect, useState, useRef } from "react";

interface PreloaderProps {
  isLoading: boolean;
}

// The text to reveal letter-by-letter
const INTRO_TEXT = "some caves hold stories.";

export default function Preloader({ isLoading }: PreloaderProps) {
  const [mounted, setMounted] = useState(true);
  const [phase, setPhase] = useState(0);
  // phase 0: pure dark with tiny ember dot
  // phase 1: ember glow expands, floating particles
  // phase 2: handwritten text fades in letter by letter
  // phase 3: text fades out, glow dims
  // phase 4: minimal — waiting for WebGL
  // phase 5: full fade out and unmount

  const [textVisible, setTextVisible] = useState(false);
  const [textFadingOut, setTextFadingOut] = useState(false);
  const [exitFade, setExitFade] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => timersRef.current.forEach(clearTimeout);

  useEffect(() => {
    // Cinematic intro sequence timing
    const t1 = setTimeout(() => setPhase(1), 600);   // Ember glow emerges
    const t2 = setTimeout(() => setPhase(2), 2200);  // Text begins appearing
    const t3 = setTimeout(() => setTextVisible(true), 2200);
    const t4 = setTimeout(() => {                      // Text fades out
      setTextFadingOut(true);
      setPhase(3);
    }, 5200);
    const t5 = setTimeout(() => setPhase(4), 6400);   // Minimal wait state

    timersRef.current = [t1, t2, t3, t4, t5];
    return clearTimers;
  }, []);

  // When intro done AND WebGL loaded — start exit
  useEffect(() => {
    if (phase >= 4 && !isLoading) {
      const t = setTimeout(() => {
        setExitFade(true);
        setTimeout(() => setMounted(false), 1400);
      }, 400);
      timersRef.current.push(t);
    }
  }, [phase, isLoading]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black select-none transition-opacity duration-[1200ms] cubic-bezier-transition ${
        exitFade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* === EMBER CORE === */}
      <div className="relative flex items-center justify-center">

        {/* Outer volumetric halo — expands in phase 1 */}
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

        {/* === FLOATING EMBER PARTICLES (phase 1+) === */}
        {phase >= 1 && [
          { x: "-18px", y: "-85px", size: "3px", delay: "0.3s", dur: "2.8s", opacity: 0.7 },
          { x: "22px",  y: "-110px", size: "2px", delay: "0.8s", dur: "3.2s", opacity: 0.5 },
          { x: "-8px",  y: "-140px", size: "2.5px", delay: "0.5s", dur: "3.8s", opacity: 0.6 },
          { x: "35px",  y: "-90px",  size: "2px", delay: "1.1s", dur: "2.5s", opacity: 0.45 },
          { x: "-30px", y: "-120px", size: "2px", delay: "0.9s", dur: "3.5s", opacity: 0.4 },
          { x: "10px",  y: "-160px", size: "1.5px", delay: "1.4s", dur: "4.0s", opacity: 0.35 },
          { x: "-42px", y: "-95px",  size: "2px", delay: "1.8s", dur: "2.9s", opacity: 0.3 },
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

        {/* === EMBER DOT CORE (always visible) === */}
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

      {/* === HANDWRITTEN TEXT REVEAL === */}
      {textVisible && (
        <div
          className={`absolute font-myfont text-amber-200/90 select-none pointer-events-none ${
            textFadingOut ? "animate-text-fade-out" : ""
          }`}
          style={{
            fontSize: "clamp(18px, 2.2vw, 28px)",
            letterSpacing: "0.04em",
            bottom: "38%",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            textShadow: "0 0 20px rgba(251,146,60,0.4)",
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
                // Preserve spaces
                whiteSpace: char === " " ? "pre" : "normal",
              }}
            >
              {char}
            </span>
          ))}
        </div>
      )}

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
