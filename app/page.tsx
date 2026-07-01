"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/Preloader";
import CursorTorch from "@/components/CursorTorch";
import AtmosphericOverlay from "@/components/AtmosphericOverlay";
import CaveNav from "@/components/CaveNav";
import ProjectPreview from "@/components/ProjectPreview";
import DecodeHandwriting from "@/components/DecodeHandwriting";

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
  const [canvasReady, setCanvasReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Mobile is either narrow screen or portrait orientation
      setIsMobile(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-black select-none custom-cursor-active">
      
      {/* 
        Native Mobile Scroll Container 
        Appears only after entering the cave.
        Allows native browser vertical scrolling which we sync to the 3D camera.
      */}
      {isMobile && entered && (
        <div 
          id="mobile-scroll-container"
          className="absolute inset-0 z-40 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full h-[700vh]" />
        </div>
      )}

      <Preloader isLoading={!canvasReady} onEnter={handleEnter} />

      {/* Full-screen 3D cave */}
      <CinematicCanvas
        onLoaded={() => setCanvasReady(true)}
        isMobile={isMobile ?? false}
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
