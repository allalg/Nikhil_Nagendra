"use client";

import { useEffect, useRef, useState } from "react";
import { scrollProgressRef } from "./scrollState";

interface NavSection {
  label: string;
  progress: number;
}

interface CaveNavProps {
  sections: NavSection[];
  onNavigate: (progress: number) => void;
  visible: boolean;
}

export default function CaveNav({ sections, onNavigate, visible }: CaveNavProps) {
  const [isVisible, setIsVisible] = useState(false);


  // Refs for each dot element — we'll imperatively update styles in rAF
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevActiveRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [visible]);

  // ── Imperative rAF loop — reads scrollProgressRef, updates dots directly ──
  // Replaces the old pattern where scrollProgress was a React prop. Now we only
  // touch the DOM elements whose active state actually changed.
  useEffect(() => {
    if (!isVisible) return;

    const tick = () => {
      const progress = scrollProgressRef.current;

      // Determine active index
      let activeIndex = 0;
      for (let i = 0; i < sections.length; i++) {
        if (progress >= sections[i].progress - 0.01) activeIndex = i;
      }

      // Only update DOM if active section changed
      if (activeIndex !== prevActiveRef.current) {
        const prev = prevActiveRef.current;

        // Deactivate previous dot
        const prevDot = dotRefs.current[prev];
        if (prevDot) {
          prevDot.style.width = "5px";
          prevDot.style.height = "5px";
          prevDot.style.background = "rgba(180,83,9,0.4)";
          prevDot.style.boxShadow = "none";
        }
        const prevLabel = labelRefs.current[prev];
        if (prevLabel) {
          prevLabel.style.maxWidth = "0px";
          prevLabel.style.opacity = "0";
        }

        // Activate new dot
        const newDot = dotRefs.current[activeIndex];
        if (newDot) {
          newDot.style.width = "8px";
          newDot.style.height = "8px";
          newDot.style.background = "radial-gradient(circle, #fcd34d, #f59e0b)";
          newDot.style.boxShadow = "0 0 8px 3px rgba(251,146,60,0.7), 0 0 20px 6px rgba(180,83,9,0.3)";
        }
        const newLabel = labelRefs.current[activeIndex];
        if (newLabel) {
          newLabel.style.maxWidth = "90px";
          newLabel.style.opacity = "1";
        }

        prevActiveRef.current = activeIndex;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, sections]);

  if (!isVisible) return null;

  return (
    <nav
      className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col items-start gap-0 transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-label="Cave section navigation"
      style={{ paddingLeft: "18px" }}
    >
      {/* Vertical scratched connecting line */}
      <div
        className="absolute left-[22px] top-0 bottom-0 pointer-events-none"
        style={{
          width: "1px",
          background: "linear-gradient(to bottom, transparent, rgba(180,83,9,0.25) 20%, rgba(180,83,9,0.25) 80%, transparent)",
        }}
      />

      {sections.map((section, i) => {
        const isInitiallyActive = i === 0;

        return (
          <button
            key={section.label}
            onClick={() => onNavigate(section.progress)}
            onMouseEnter={() => {
              setHoveredIndex(i);
              const dot = dotRefs.current[i];
              if (dot && prevActiveRef.current !== i) {
                dot.style.background = "rgba(251,191,36,0.65)";
                dot.style.boxShadow = "0 0 5px 2px rgba(251,146,60,0.4)";
              }
              const label = labelRefs.current[i];
              if (label) {
                label.style.maxWidth = "90px";
                label.style.opacity = "1";
              }
            }}
            onMouseLeave={() => {
              setHoveredIndex(null);
              const dot = dotRefs.current[i];
              if (dot && prevActiveRef.current !== i) {
                dot.style.background = "rgba(180,83,9,0.4)";
                dot.style.boxShadow = "none";
              }
              const label = labelRefs.current[i];
              if (label && prevActiveRef.current !== i) {
                label.style.maxWidth = "0px";
                label.style.opacity = "0";
              }
            }}
            className="relative flex items-center group cursor-none"
            style={{
              paddingTop: i === 0 ? "0" : "18px",
            }}
            aria-label={`Navigate to ${section.label}`}
          >
            {/* Etched dot marker — initial styles set here, rAF updates them */}
            <div
              ref={(el) => { dotRefs.current[i] = el; }}
              className="relative z-10 rounded-full transition-all duration-500"
              style={{
                width: isInitiallyActive ? "8px" : "5px",
                height: isInitiallyActive ? "8px" : "5px",
                background: isInitiallyActive
                  ? "radial-gradient(circle, #fcd34d, #f59e0b)"
                  : "rgba(180,83,9,0.4)",
                boxShadow: isInitiallyActive
                  ? "0 0 8px 3px rgba(251,146,60,0.7), 0 0 20px 6px rgba(180,83,9,0.3)"
                  : "none",
                marginRight: "0",
                flexShrink: 0,
              }}
            />

            {/* Section label — slides in on hover */}
            <div
              ref={(el) => { labelRefs.current[i] = el; }}
              className="ml-3 font-handwritten text-amber-200/80 whitespace-nowrap overflow-hidden transition-all duration-300 ease-out"
              style={{
                fontSize: "12px",
                letterSpacing: "0.08em",
                maxWidth: isInitiallyActive ? "90px" : "0px",
                opacity: isInitiallyActive ? 1 : 0,
                textShadow: "0 0 8px rgba(251,146,60,0.5)",
              }}
            >
              {section.label.toLowerCase()}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
