"use client";

import { useEffect, useState, useRef } from "react";
import { sconceGateState } from "./sconceGateState";

interface PreloaderProps {
  isLoading: boolean;
  onEnter: () => void;
}

const INTRO_TEXT = "some caves hold stories.";

export default function Preloader({ isLoading, onEnter }: PreloaderProps) {
  const [mounted, setMounted] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [ignited, setIgnited] = useState(false);
  const [exitFade, setExitFade] = useState(false);
  const canvasReadyRef = useRef(false);

  // Phase-in sequence (text → prompt)
  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 600);
    const t2 = setTimeout(() => setPromptVisible(true), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Track when canvas/WebGL is ready
  useEffect(() => {
    if (!isLoading) canvasReadyRef.current = true;
  }, [isLoading]);

  // Listen for sconce gate opening (user lit a real 3D sconce)
  useEffect(() => {
    const unsub = sconceGateState.onOpen(() => {
      if (ignited) return;
      setIgnited(true);

      // Wait for ignition to feel dramatic, then exit
      const exitDelay = setTimeout(() => {
        // If canvas is ready, fade out immediately. Otherwise poll briefly.
        const doExit = () => {
          setExitFade(true);
          setTimeout(() => {
            setMounted(false);
            onEnter();
          }, 1200);
        };

        if (canvasReadyRef.current) {
          doExit();
        } else {
          const poll = setInterval(() => {
            if (canvasReadyRef.current) {
              clearInterval(poll);
              doExit();
            }
          }, 100);
          // Safety: force exit after 3s even if canvas never signals ready
          setTimeout(() => {
            clearInterval(poll);
            doExit();
          }, 3000);
        }
      }, 1000);

      return () => clearTimeout(exitDelay);
    });

    return unsub;
  }, [ignited, onEnter]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center select-none pointer-events-none transition-opacity duration-[1200ms] cubic-bezier-transition ${exitFade ? "opacity-0" : "opacity-100"
        }`}
    >
      {/* Dark overlay that lets the 3D scene bleed through subtly.
          Semi-transparent so the sconce ember glow is visible underneath. */}
      <div
        className="absolute inset-0 transition-opacity duration-[1200ms] pointer-events-none"
        style={{
          background: ignited
            ? "transparent"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0.95) 100%)",
          opacity: exitFade ? 0 : 1,
        }}
      />

      {/* === CONTENT LAYER (above dark overlay) === */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full pointer-events-none">
        {/* === INTRO TEXT === */}
        <div
          className="font-myfont text-amber-200/90 pointer-events-none"
          style={{
            fontSize: "clamp(18px, 2.2vw, 28px)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            textShadow: "0 0 20px rgba(251,146,60,0.4)",
            marginBottom: "80px",
            opacity: textVisible && !ignited ? 1 : 0,
            transition: "opacity 0.8s ease-out",
          }}
          aria-label={INTRO_TEXT}
        >
          {textVisible &&
            INTRO_TEXT.split("").map((char, i) => (
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

        {/* === SCONCE AREA INDICATOR ===
            A subtle glowing ring that draws the eye toward the real 3D sconce
            visible through the semi-transparent overlay. The actual sconce is
            rendered by WallSconces.tsx in the 3D canvas behind this overlay. */}
        {!ignited && promptVisible && (
          <div
            className="relative flex flex-col items-center"
            style={{ marginBottom: "40px" }}
          >
            {/* Pulsing ring around the sconce area */}
            <div
              className="animate-ember-breathe rounded-full"
              style={{
                width: "100px",
                height: "100px",
                border: "1.5px solid rgba(251,146,60,0.25)",
                boxShadow:
                  "0 0 30px rgba(251,146,60,0.15), inset 0 0 20px rgba(251,146,60,0.08)",
              }}
            />
          </div>
        )}

        {/* === PROMPT TEXT & INSTRUCTIONS === */}
        <div
          className={`pointer-events-none transition-all duration-700 flex flex-col items-center ${promptVisible && !ignited
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
            }`}
        >
          <span
            className="font-myfont animate-prompt-pulse"
            style={{
              fontSize: "clamp(18px, 2.2vw, 28px)",
              color: "rgba(255, 225, 160, 1)", // Brightened significantly
              letterSpacing: "0.08em",
              textShadow: "0 0 16px rgba(251,146,60,0.8), 0 0 30px rgba(251,146,60,0.4)", // Stronger glow
            }}
          >
            light a sconce to enter
          </span>
          <span
            className="font-myfont mt-4"
            style={{
              fontSize: "clamp(18px, 2.2vw, 28px)",
              color: "rgba(237, 173, 24, 0.96)",
              letterSpacing: "0.06em",
              textShadow: "0 0 16px rgba(251,146,60,0.8), 0 0 30px rgba(251,146,60,0.4)", // Stronger glow
            }}
          >
            ➡️ move your mouse to guide the torch and click
          </span>
          <span
            className="font-myfont mt-2"
            style={{
              fontSize: "clamp(20px, 2.2vw, 28px)",
              color: "rgba(237, 173, 24, 0.96)",
              letterSpacing: "0.06em",
              textShadow: "0 0 16px rgba(251,146,60,0.8), 0 0 30px rgba(251,146,60,0.4)", // Stronger glow
            }}
          >
            ➡️ The <b>"Decode My Handwriting"</b> button will help you read the cave walls<br /> if my handwriting gets a little too adventurous.<br /> I only wish the examiners had this feature while correcting my papers! 😂
          </span>
        </div>

        {/* === ENTERING CAVE TEXT (after ignition) === */}
        {ignited && (
          <div
            className="mt-6 pointer-events-none"
            style={{ animation: "charReveal 0.6s ease-out 0.3s both" }}
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
        )}
      </div>

      {/* Warm screen wash on ignition */}
      {ignited && (
        <div
          className="fixed inset-0 animate-warm-wash pointer-events-none z-20"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(251,146,60,0.25) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Subtle vignette (always) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 75%, rgba(0,0,0,0.6) 100%)",
          opacity: exitFade ? 0 : 1,
          transition: "opacity 1.2s ease-out",
        }}
      />
    </div>
  );
}
