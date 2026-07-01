"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/Preloader";
import CursorTorch from "@/components/CursorTorch";
import AtmosphericOverlay from "@/components/AtmosphericOverlay";
import CaveNav from "@/components/CaveNav";
import ProjectPreview from "@/components/ProjectPreview";
import DecodeHandwriting from "@/components/DecodeHandwriting";
import MobileView from "@/components/MobileView";

const CinematicCanvas = dynamic(() => import("@/components/CinematicCanvas"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />,
});

const NAV_SECTIONS = [
  { label: "Hero",       progress: 0.0  },
  { label: "About",      progress: 0.19 },
  { label: "Projects",   progress: 0.37 },
  { label: "Skills",     progress: 0.52 },
  { label: "Journey",    progress: 0.65 },
  { label: "Philosophy", progress: 0.82 },
  { label: "Contact",    progress: 1.0  },
];

export default function Home() {
  // canvasReady: WebGL/3D scene is loaded and rendering
  // entered: user has lit a sconce and the preloader has exited
  const [canvasReady, setCanvasReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Mobile doesn't need to wait for a 3D canvas to load
    if (isMobile) {
      setCanvasReady(true);
    }
  }, [isMobile]);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  // Prevent hydration mismatch by rendering a simple black screen until we know the device type
  if (isMobile === null) {
    return <main className="w-screen h-screen bg-black" />;
  }

  if (isMobile) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
        <MobileView entered={entered} onEnter={handleEnter} />
        {/* Decode handwriting popup still accessible on mobile */}
        <DecodeHandwriting />
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none custom-cursor-active">
      <Preloader isLoading={!canvasReady} onEnter={handleEnter} />

      {/* Full-screen 3D cave */}
      <CinematicCanvas
        onLoaded={() => setCanvasReady(true)}
      />

      {/* Contact links overlay */}
      <AtmosphericOverlay
        visibleAfterLoading={entered}
      />

      {/* Project preview popups on hover */}
      <ProjectPreview visible={entered} />

      {/* Cave nav dots — display only, shows current section */}
      <CaveNav
        sections={NAV_SECTIONS}
        onNavigate={() => {}}
        visible={entered}
      />

      {/* Decode handwriting popup */}
      <DecodeHandwriting />

      {/* Custom wooden torch cursor */}
      <CursorTorch visibleAfterLoading={true} />
    </main>
  );
}
