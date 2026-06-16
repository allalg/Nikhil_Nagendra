"use client";

import { useEffect, useRef, useState } from "react";
import { scrollProgressRef } from "./scrollState";
import ContactLinks from "./ContactLinks";

interface AtmosphericOverlayProps {
  visibleAfterLoading: boolean;
}

export default function AtmosphericOverlay({ visibleAfterLoading }: AtmosphericOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const audioSynthRef = useRef<any>(null);

  // DOM refs for imperative updates driven by scrollProgressRef
  const heroHintRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visibleAfterLoading) return;
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, [visibleAfterLoading]);

  // ── Imperative rAF loop — reads scrollProgressRef, updates DOM directly ───
  useEffect(() => {
    if (!isVisible) return;

    const tick = () => {
      const p = scrollProgressRef.current;

      if (heroHintRef.current) {
        if (p < 0.08) {
          heroHintRef.current.style.display = "";
          heroHintRef.current.style.opacity = String(Math.max(0, 1 - p * 14));
        } else {
          heroHintRef.current.style.display = "none";
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible]);

  // ── Background MP3 Audio Player ──────────────────────────────────────────
  useEffect(() => {
    class BackgroundAudioPlayer {
      private audio: HTMLAudioElement | null = null;
      private isPlaying = false;

      start() {
        if (this.isPlaying) return;
        try {
          if (!this.audio) {
            // Using the exact file path uploaded by the user in the public folder
            this.audio = new Audio("/background_music/- Dark Tomb -  Cave Sounds  5 Minutes.mp3");
            this.audio.loop = true;
            this.audio.volume = 0.6; // Adjust master volume as needed
          }
          this.audio.play().catch((err) => console.error("Audio playback failed (browser might be blocking autoplay until interaction):", err));
          this.isPlaying = true;
        } catch (err) {
          console.error("Audio player failed:", err);
        }
      }

      stop() {
        if (this.audio) {
          this.audio.pause();
        }
        this.isPlaying = false;
      }
    }

    audioSynthRef.current = new BackgroundAudioPlayer();
    return () => { if (audioSynthRef.current) audioSynthRef.current.stop(); };
  }, []);

  const handleAudioToggle = () => {
    if (!audioSynthRef.current) return;
    if (isAudioPlaying) {
      audioSynthRef.current.stop();
      setIsAudioPlaying(false);
    } else {
      audioSynthRef.current.start();
      setIsAudioPlaying(true);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-40 select-none font-handwritten">

      {/*
        ── CONTACT LINK ZONES ─────────────────────────────────────────────────
        Camera-tracked clickable zones positioned over the LinkedIn and GitHub
        text on the cave wall. Uses cameraPosRef for pixel-perfect positioning.
        Hover glow signals clickability.
      */}
      <ContactLinks />

      {/*
        ── FIXED HUD ELEMENTS ────────────────────────────────────────────────
        These stay fixed to the viewport at all times.
      */}

      {/* ── HERO: "move torch to explore" instruction ── */}
      <div
        ref={heroHintRef}
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "6%",
        }}
      >
        <div className="flex flex-col items-center gap-1 text-amber-200/55 font-handwritten">
          <div className="flex items-center gap-2 text-xs tracking-widest uppercase">
            {/* Tiny mouse icon drawn in CSS */}
            <span
              className="inline-block border border-amber-200/40 rounded-full"
              style={{ width: 10, height: 14, borderRadius: "5px 5px 4px 4px" }}
            />
            <span>move torch to reveal</span>
          </div>
          {/* Scroll arrow */}
          <div className="flex flex-col items-center gap-0.5 mt-1 opacity-70">
            <span className="text-[10px] tracking-widest">scroll</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2v8M3 7l3 3 3-3" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── AUDIO TOGGLE ── bottom-left, always visible ── */}
      {/* Hitbox expanded drastically because the custom torch cursor makes precise clicking difficult */}
      <button
        onClick={handleAudioToggle}
        className="absolute pointer-events-auto cursor-none group p-8 -m-8"
        style={{ left: "1.5%", bottom: "3%" }}
        aria-label={isAudioPlaying ? "Mute cave ambience" : "Play cave ambience"}
      >
        <div className="relative flex items-center gap-2 text-amber-50 group-hover:text-white transition-all duration-300 bg-amber-900/60 group-hover:bg-amber-800/80 rounded-md px-4 py-2.5 backdrop-blur-md border border-amber-500/60 group-hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          {/* Catchy Sonar Ping (only when muted) */}
          {!isAudioPlaying && (
            <div className="absolute inset-0 rounded-md border-2 border-amber-400 animate-ping opacity-75 pointer-events-none"></div>
          )}
          
          {isAudioPlaying ? (
            /* Sound waves */
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-10">
              <path d="M1 5.5v5l3-2v-1l-3-2z" fill="currentColor" stroke="none" opacity="0.9"/>
              <path d="M4 5.5v5" />
              <path d="M6.5 3.5c1.5 1 2.5 2.7 2.5 4.5s-1 3.5-2.5 4.5" />
              <path d="M9.5 2c2 1.5 3.5 3.7 3.5 6s-1.5 4.5-3.5 6" />
            </svg>
          ) : (
            /* Muted */
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative z-10">
              <path d="M1 5.5v5l3-2v-1l-3-2z" fill="currentColor" stroke="none" opacity="0.9"/>
              <path d="M4 5.5v5" />
              <path d="M8 5l4 6M12 5l-4 6" />
            </svg>
          )}
          <span className="text-[12px] font-bold tracking-widest uppercase opacity-100 drop-shadow-md relative z-10">
            {isAudioPlaying ? "cave sound on" : "cave sound off"}
          </span>
        </div>
      </button>

    </div>
  );
}
