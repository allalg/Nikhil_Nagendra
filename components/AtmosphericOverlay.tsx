"use client";

import { useEffect, useRef, useState } from "react";
import { scrollProgressRef } from "./scrollState";

interface AtmosphericOverlayProps {
  visibleAfterLoading: boolean;
}

export default function AtmosphericOverlay({ visibleAfterLoading }: AtmosphericOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const audioSynthRef = useRef<any>(null);

  // DOM refs for imperative updates driven by scrollProgressRef
  const scrollLayerRef = useRef<HTMLDivElement>(null);
  const heroHintRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visibleAfterLoading) return;
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, [visibleAfterLoading]);

  // ── Imperative rAF loop — reads scrollProgressRef, updates DOM directly ───
  // This replaces the old pattern where scrollProgress was a React prop that
  // caused re-renders every frame. Now we only touch the DOM properties that
  // actually change (transform, opacity, display).
  useEffect(() => {
    if (!isVisible) return;

    const tick = () => {
      const p = scrollProgressRef.current;

      if (scrollLayerRef.current) {
        scrollLayerRef.current.style.transform = `translateY(-${p * 500}vh)`;
      }

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
      private crackleInterval: any = null;

      start() {
        if (this.isPlaying) return;
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          this.ctx = new AudioContextClass();
          this.gainNode = this.ctx.createGain();
          this.gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);
          this.gainNode.connect(this.ctx.destination);

          const sampleRate = this.ctx.sampleRate;
          const bufferSize = 2 * sampleRate;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          }

          const rumbleSource = this.ctx.createBufferSource();
          rumbleSource.buffer = noiseBuffer;
          rumbleSource.loop = true;
          const rumbleFilter = this.ctx.createBiquadFilter();
          rumbleFilter.type = "lowpass";
          rumbleFilter.frequency.setValueAtTime(55, this.ctx.currentTime);
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
        const duration = 0.004 + Math.random() * 0.012;
        const sparkBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
        const data = sparkBuffer.getChannelData(0);
        for (let i = 0; i < sparkBuffer.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = sparkBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1400 + Math.random() * 1100;
        filter.Q.value = 5.0;
        const sparkGain = this.ctx.createGain();
        sparkGain.gain.setValueAtTime(0.004 + Math.random() * 0.01, this.ctx.currentTime);
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
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
        ── SCROLL-TRACKING LAYER ──────────────────────────────────────────────
        Contains invisible clickable zones that sit perfectly over the charcoal
        text etched into the 3D cave wall. No hover highlights, no popups —
        the torch illuminating the stone IS the reveal mechanic.

        Transform is now updated imperatively via rAF (scrollLayerRef).
      */}
      <div
        ref={scrollLayerRef}
        className="absolute w-full pointer-events-none"
        style={{
          top: 0,
          left: 0,
          height: "100vh",
        }}
      >
        {/* ── CONTACT SECTION (scrollProgress ≈ 1.0, top ≈ 550–565%) ─────── */}
        {/* Invisible links over the contact details drawn on the cave wall.
            No hover effect — cursor torch lights up the stone text instead. */}

        <a
          href="mailto:nikhilnag98@gmail.com"
          className="absolute cursor-none pointer-events-auto"
          style={{ left: "7%", width: "32%", top: "552%", height: "5%" }}
          aria-label="Email Nikhil"
        />
        <a
          href="tel:+919986890905"
          className="absolute cursor-none pointer-events-auto"
          style={{ left: "7%", width: "28%", top: "558%", height: "5%" }}
          aria-label="Call Nikhil"
        />
        <a
          href="https://www.linkedin.com/in/nikhil-nagendra-a89828160/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute cursor-none pointer-events-auto"
          style={{ left: "65%", width: "22%", top: "552%", height: "5%" }}
          aria-label="LinkedIn"
        />
        <a
          href="https://github.com/allalg"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute cursor-none pointer-events-auto"
          style={{ left: "65%", width: "25%", top: "558%", height: "5%" }}
          aria-label="GitHub"
        />
      </div>

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
      <button
        onClick={handleAudioToggle}
        className="absolute pointer-events-auto cursor-none"
        style={{ left: "1.5%", bottom: "3%", padding: "6px 10px" }}
        aria-label={isAudioPlaying ? "Mute cave ambience" : "Play cave ambience"}
      >
        <div className="flex items-center gap-1.5 text-amber-200/35 hover:text-amber-200/65 transition-colors duration-500">
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
