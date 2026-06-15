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

  const audioSynthRef = useRef<{ start: () => void; stop: () => void } | null>(null);

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

  // ── Procedural Audio Synthesizer ──────────────────────────────────────────
  useEffect(() => {
    class ProceduralAmbientSynth {
      private ctx: AudioContext | null = null;
      private gainNode: GainNode | null = null;
      private isPlaying = false;
      private crackleInterval: ReturnType<typeof setInterval> | null = null;

      start() {
        if (this.isPlaying) return;
        try {
          const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          this.ctx = new AudioContextClass();
          this.gainNode = this.ctx.createGain();
          this.gainNode.gain.setValueAtTime(0.4, this.ctx.currentTime); // Master volume up
          this.gainNode.connect(this.ctx.destination);

          const sampleRate = this.ctx.sampleRate;
          const bufferSize = 2 * sampleRate;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.05 * white) / 1.05; // Slightly brighter noise
            lastOut = output[i];
            output[i] *= 4.0;
          }

          const rumbleSource = this.ctx.createBufferSource();
          rumbleSource.buffer = noiseBuffer;
          rumbleSource.loop = true;
          const rumbleFilter = this.ctx.createBiquadFilter();
          rumbleFilter.type = "lowpass";
          rumbleFilter.frequency.setValueAtTime(150, this.ctx.currentTime); // Raised from 55Hz to 150Hz for laptop speakers
          rumbleSource.connect(rumbleFilter);
          rumbleFilter.connect(this.gainNode);
          rumbleSource.start(0);

          this.crackleInterval = setInterval(() => {
            if (!this.ctx || this.ctx.state === "suspended") return;
            if (Math.random() > 0.4) this.playSparkCrackle();
          }, 150);

          this.isPlaying = true;
        } catch (err) {
          console.error("Web Audio Synthesizer failed:", err);
        }
      }

      private playSparkCrackle() {
        if (!this.ctx || !this.gainNode) return;
        const duration = 0.01 + Math.random() * 0.02; // Slightly longer crackle
        const sparkBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
        const data = sparkBuffer.getChannelData(0);
        for (let i = 0; i < sparkBuffer.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = sparkBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1200 + Math.random() * 1500;
        filter.Q.value = 3.0; // Less resonant for a thicker snap
        const sparkGain = this.ctx.createGain();
        sparkGain.gain.setValueAtTime(0.8 + Math.random() * 0.5, this.ctx.currentTime); // Much louder crackle
        sparkGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(sparkGain);
        sparkGain.connect(this.gainNode);
        source.start(0);
      }

      stop() {
        if (this.crackleInterval) { clearInterval(this.crackleInterval); this.crackleInterval = null; }
        if (this.ctx) { this.ctx.close(); this.ctx = null; }
        this.isPlaying = false;
      }
    }

    audioSynthRef.current = new ProceduralAmbientSynth();
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
        <div className="flex items-center gap-1.5 text-amber-200/35 group-hover:text-amber-200/65 transition-colors duration-500 bg-black/20 rounded-md px-2 py-1 backdrop-blur-sm border border-transparent group-hover:border-amber-900/30">
          {isAudioPlaying ? (
            /* Sound waves */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 5.5v5l3-2v-1l-3-2z" fill="currentColor" stroke="none" opacity="0.8"/>
              <path d="M4 5.5v5" />
              <path d="M6.5 3.5c1.5 1 2.5 2.7 2.5 4.5s-1 3.5-2.5 4.5" />
              <path d="M9.5 2c2 1.5 3.5 3.7 3.5 6s-1.5 4.5-3.5 6" />
            </svg>
          ) : (
            /* Muted */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 5.5v5l3-2v-1l-3-2z" fill="currentColor" stroke="none" opacity="0.8"/>
              <path d="M4 5.5v5" />
              <path d="M8 5l4 6M12 5l-4 6" />
            </svg>
          )}
          <span className="text-[9px] tracking-widest uppercase opacity-70">
            {isAudioPlaying ? "cave sound on" : "cave sound off"}
          </span>
        </div>
      </button>

    </div>
  );
}
