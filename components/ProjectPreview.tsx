"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { cameraPosRef } from "./scrollState";

// ── Project definitions ───────────────────────────────────────────────────────
// Canvas coordinates of each project title (from CaveWall.tsx drawCharcoalMarkings)
// Canvas is 1024×2048 drawing units, mapped onto a 20×52 world-unit plane.
//
// Conversion:
//   worldX = (canvasX / 1024) * 20 - 10    (center wall: x from -10 to +10)
//   worldY = 26 - (canvasY / 2048) * 52    (y=0 at top → world y=+26)

interface ProjectDef {
  name: string;
  // Canvas-space bounding box of the project title (drawing coords)
  canvasX: number;      // left edge
  canvasY: number;      // top edge (baseline − ascent)
  canvasW: number;      // width
  canvasH: number;      // height
  // Preview image path (in /public)
  image: string;
  // GitHub repo link
  link: string;
}

const PROJECTS: ProjectDef[] = [
  {
    name: "MEDI-XPRESS",
    canvasX: 112, canvasY: 982, canvasW: 200, canvasH: 30,
    image: "/project_preview/Ambulance.png",
    link: "https://github.com/NitinBharadwajMVS/em-link-med",
  },
  {
    name: "GAMEATHON",
    canvasX: 397, canvasY: 982, canvasW: 175, canvasH: 30,
    image: "/project_preview/gameathon.png",
    link: "https://github.com/Kavana917/What-If-",
  },
  {
    name: "TRADING BOT",
    canvasX: 692, canvasY: 982, canvasW: 195, canvasH: 30,
    image: "/project_preview/trading_bot.png",
    link: "https://github.com/allalg/simplified-trading-bot",
  },
  {
    name: "FINDB",
    canvasX: 112, canvasY: 1132, canvasW: 105, canvasH: 30,
    image: "/project_preview/FinDb.png",
    link: "https://github.com/allalg/acc_ledger",
  },
  {
    name: "ACIS-X",
    canvasX: 397, canvasY: 1132, canvasW: 130, canvasH: 30,
    image: "/project_preview/ACIS-X.png",
    link: "https://github.com/allalg/ACIS-X",
  },
  {
    name: "RAG ENGINE",
    canvasX: 692, canvasY: 1132, canvasW: 185, canvasH: 30,
    image: "/project_preview/RAG.png",
    link: "https://github.com/allalg/devfolio",
  },
];

// Convert canvas drawing coords → world 3D coords (on the z=0 wall plane)
function canvasToWorld(cx: number, cy: number): [number, number] {
  const worldX = (cx / 1024) * 20 - 10;
  const worldY = 32.5 - (cy / 2560) * 65;
  return [worldX, worldY];
}

// Project world coords to screen pixels given camera state
// Camera: perspective FOV=70, z=4.5, looking at z=0
function worldToScreen(
  wx: number,
  wy: number,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number
): [number, number] {
  const camZ = 4.5;
  const fovRad = (70 * Math.PI) / 180;
  const halfH = Math.tan(fovRad / 2) * camZ;
  const halfW = halfH * (screenW / screenH);

  const relX = wx - camX;
  const relY = wy - camY;

  const ndcX = relX / halfW;
  const ndcY = relY / halfH;

  const sx = ((ndcX + 1) / 2) * screenW;
  const sy = ((1 - ndcY) / 2) * screenH;

  return [sx, sy];
}

interface ProjectPreviewProps {
  visible: boolean;
}

export default function ProjectPreview({ visible }: ProjectPreviewProps) {
  const [hoveredProject, setHoveredProject] = useState<ProjectDef | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0, below: false });
  const hoveredIdxRef = useRef<number>(-1);
  const zoneRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameId = useRef<number | null>(null);

  // Position the invisible hover zones every frame
  useEffect(() => {
    if (!visible) return;

    const update = () => {
      const camX = cameraPosRef.current.x;
      const camY = cameraPosRef.current.y;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      for (let i = 0; i < PROJECTS.length; i++) {
        const p = PROJECTS[i];
        const el = zoneRefs.current[i];
        if (!el) continue;

        // Top-left corner of the title in world coords
        const [wx1, wy1] = canvasToWorld(p.canvasX, p.canvasY);
        // Bottom-right corner
        const [wx2, wy2] = canvasToWorld(p.canvasX + p.canvasW, p.canvasY + p.canvasH);

        // Screen pixel positions
        const [sx1, sy1] = worldToScreen(wx1, wy1, camX, camY, sw, sh);
        const [sx2, sy2] = worldToScreen(wx2, wy2, camX, camY, sw, sh);

        const left = Math.min(sx1, sx2);
        const top = Math.min(sy1, sy2);
        const width = Math.abs(sx2 - sx1);
        const height = Math.abs(sy2 - sy1);

        // Only show zones when they're within the viewport
        const onScreen = top > -100 && top < sh + 100 && left > -200 && left < sw + 200;
        if (onScreen) {
          el.style.display = "flex";
          el.style.left = `${left}px`;
          el.style.top = `${top}px`;
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
          el.style.fontSize = `${height * 0.75}px`;
        } else {
          el.style.display = "none";
          // If the hovered project goes off-screen, dismiss the popup
          if (hoveredIdxRef.current === i) {
            hoveredIdxRef.current = -1;
            setHoveredProject(null);
          }
        }

        // Update popup position if this project is currently hovered
        if (hoveredIdxRef.current === i && onScreen) {
          // Popup dimensions: 320px wide, ~240px tall (200 image + 30 title + 10 arrow)
          const popW = 420;
          const popH = 310;
          const gap = 12;

          let px = left + width / 2 - popW / 2; // centered on title
          let py = top - popH - gap;              // above title
          let showBelow = false;

          // If not enough room above, show below
          if (py < 8) {
            py = top + height + gap;
            showBelow = true;
          }

          // Clamp horizontally
          if (px < 8) px = 8;
          if (px + popW > sw - 8) px = sw - popW - 8;

          // Clamp vertically (in case below also overflows)
          if (py + popH > sh - 8) py = sh - popH - 8;
          if (py < 8) py = 8;

          setPopupPos({ x: px, y: py, below: showBelow });
        }
      }

      frameId.current = requestAnimationFrame(update);
    };

    frameId.current = requestAnimationFrame(update);
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [visible]);

  const handleMouseEnter = useCallback((project: ProjectDef, index: number) => {
    hoveredIdxRef.current = index;
    const el = zoneRefs.current[index];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const popW = 420;
    const popH = 310;
    const gap = 12;

    let px = rect.left + rect.width / 2 - popW / 2;
    let py = rect.top - popH - gap;
    let showBelow = false;

    if (py < 8) {
      py = rect.bottom + gap;
      showBelow = true;
    }
    if (px < 8) px = 8;
    if (px + popW > sw - 8) px = sw - popW - 8;
    if (py + popH > sh - 8) py = sh - popH - 8;
    if (py < 8) py = 8;

    setPopupPos({ x: px, y: py, below: showBelow });
    setHoveredProject(project);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredIdxRef.current = -1;
    setHoveredProject(null);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-30"
      style={{ overflow: "hidden" }}
    >
      {/* Invisible hover zones positioned over each project title */}
      {PROJECTS.map((project, i) => (
        <a
          key={project.name}
          ref={(el) => { zoneRefs.current[i] = el; }}
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute pointer-events-auto cursor-pointer"
          style={{ 
            display: "none",
            alignItems: "center",
            fontFamily: "Myfont, cursive",
            color: "transparent",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap"
          }}
          onMouseEnter={(e) => {
            handleMouseEnter(project, i);
            e.currentTarget.style.color = "rgb(100, 220, 255)";
            e.currentTarget.style.textShadow = "0 0 10px rgba(0, 180, 255, 0.6)";
          }}
          onMouseLeave={(e) => {
            handleMouseLeave();
            e.currentTarget.style.color = "transparent";
            e.currentTarget.style.textShadow = "none";
          }}
        >
          {project.name}
        </a>
      ))}

      {/* Preview popup — viewport-clamped positioning */}
      {hoveredProject && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
          }}
        >
          <div className="project-preview-popup">
            {/* Decorative arrow (above popup when showing below title) */}
            {popupPos.below && (
              <div className="flex justify-center -mb-px">
                <div
                  className="w-3 h-3 rotate-45 border-l border-t border-amber-800/40"
                  style={{ background: "#1c1408" }}
                />
              </div>
            )}

            {/* Parchment-style frame */}
            <div className="relative rounded-lg overflow-hidden shadow-2xl border border-amber-800/40"
              style={{
                background: "linear-gradient(135deg, #1a1208 0%, #2a1f10 40%, #1c1408 100%)",
                boxShadow: "0 0 30px rgba(200, 130, 50, 0.25), 0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,100,0.08)",
              }}
            >
              {/* Title bar */}
              <div className="px-3 py-1.5 border-b border-amber-900/30"
                style={{
                  background: "linear-gradient(90deg, rgba(180,120,40,0.15) 0%, rgba(120,80,20,0.08) 100%)",
                }}
              >
                <span className="text-amber-200/90 text-xs font-medium tracking-wider"
                  style={{ fontFamily: "Myfont, cursive" }}
                >
                  {hoveredProject.name}
                </span>
              </div>

              {/* Image */}
              <div className="relative w-[420px] h-[260px]"
                style={{ background: "#0c0a08" }}
              >
                <Image
                  src={hoveredProject.image}
                  alt={hoveredProject.name}
                  fill
                  className="object-contain"
                  sizes="420px"
                  priority
                />
                {/* Warm vignette overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(ellipse at center, transparent 50%, rgba(15,8,0,0.5) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Decorative arrow (below popup when showing above title) */}
            {!popupPos.below && (
              <div className="flex justify-center -mt-px">
                <div
                  className="w-3 h-3 rotate-45 border-r border-b border-amber-800/40"
                  style={{ background: "#1c1408" }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
