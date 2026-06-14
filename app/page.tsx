"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/Preloader";
import CursorTorch from "@/components/CursorTorch";
import AtmosphericOverlay from "@/components/AtmosphericOverlay";
import CaveNav from "@/components/CaveNav";
import ProjectPreview from "@/components/ProjectPreview";

const CinematicCanvas = dynamic(() => import("@/components/CinematicCanvas"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />,
});

const NAV_SECTIONS = [
  { label: "Hero",       progress: 0.0  },
  { label: "About",      progress: 0.24 },
  { label: "Projects",   progress: 0.47 },
  { label: "Journey",    progress: 0.70 },
  { label: "Philosophy", progress: 0.88 },
  { label: "Contact",    progress: 1.0  },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // scrollProgress is now in scrollState.ts (shared ref) —
  // no React state needed, no per-frame re-renders.

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none custom-cursor-active">
      <Preloader isLoading={isLoading} />

      {/*
        Full-screen 3D cave — mouse drives camera in ALL directions.
        Moving torch down → camera pans to Contact section.
        Moving torch up   → camera pans to Hero section.
        Moving torch left/right → reveals cave wall sides.
        No scrolling needed.
      */}
      <CinematicCanvas
        onLoaded={() => setIsLoading(false)}
      />

      {/* Contact links overlay */}
      <AtmosphericOverlay
        visibleAfterLoading={!isLoading}
      />

      {/* Project preview popups on hover */}
      <ProjectPreview visible={!isLoading} />

      {/* Cave nav dots — display only, shows current section */}
      <CaveNav
        sections={NAV_SECTIONS}
        onNavigate={() => {}}
        visible={!isLoading}
      />

      {/* Custom wooden torch cursor */}
      <CursorTorch visibleAfterLoading={!isLoading} />
    </main>
  );
}
