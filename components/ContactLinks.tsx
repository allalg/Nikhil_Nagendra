"use client";

import { useEffect, useRef } from "react";
import { cameraPosRef } from "./scrollState";

// ── Link definitions ──────────────────────────────────────────────────────────
// Canvas coordinates from CaveWall.tsx drawCharcoalMarkings (contact section).
// Canvas is 1024×2560, mapped onto a 20×65 world-unit plane.
//
// LinkedIn text:  drawWobblyText(..., "LinkedIn", 724, 2248, B)
// GitHub text:    drawWobblyText(..., "GitHub — allalg", 724, 2280, B)

interface LinkDef {
  label: string;
  canvasX: number;
  canvasY: number;
  canvasW: number;
  canvasH: number;
  href: string;
}

const CONTACT_LINKS: LinkDef[] = [
  {
    label: "LinkedIn",
    canvasX: 700, canvasY: 2440, canvasW: 160, canvasH: 30,
    href: "https://www.linkedin.com/in/nikhil-nagendra-a89828160/",
  },
  {
    label: "GitHub — allalg",
    canvasX: 700, canvasY: 2472, canvasW: 220, canvasH: 30,
    href: "https://github.com/allalg",
  },
];

// Convert canvas drawing coords → world 3D coords
function canvasToWorld(cx: number, cy: number): [number, number] {
  const worldX = (cx / 1024) * 20 - 10;
  const worldY = 32.5 - (cy / 2560) * 65;
  return [worldX, worldY];
}

// Project world coords to screen pixels
function worldToScreen(
  wx: number, wy: number,
  camX: number, camY: number,
  screenW: number, screenH: number
): [number, number] {
  const camZ = 4.5;
  const fovRad = (70 * Math.PI) / 180;
  const halfH = Math.tan(fovRad / 2) * camZ;
  const halfW = halfH * (screenW / screenH);

  const ndcX = (wx - camX) / halfW;
  const ndcY = (wy - camY) / halfH;

  return [
    ((ndcX + 1) / 2) * screenW,
    ((1 - ndcY) / 2) * screenH,
  ];
}

export default function ContactLinks() {
  const zoneRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const frameId = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const camX = cameraPosRef.current.x;
      const camY = cameraPosRef.current.y;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      for (let i = 0; i < CONTACT_LINKS.length; i++) {
        const link = CONTACT_LINKS[i];
        const el = zoneRefs.current[i];
        if (!el) continue;

        const [wx1, wy1] = canvasToWorld(link.canvasX, link.canvasY);
        const [wx2, wy2] = canvasToWorld(link.canvasX + link.canvasW, link.canvasY + link.canvasH);

        const [sx1, sy1] = worldToScreen(wx1, wy1, camX, camY, sw, sh);
        const [sx2, sy2] = worldToScreen(wx2, wy2, camX, camY, sw, sh);

        const left = Math.min(sx1, sx2);
        const top = Math.min(sy1, sy2);
        const width = Math.abs(sx2 - sx1);
        const height = Math.abs(sy2 - sy1);

        const onScreen = top > -50 && top < sh + 50 && left > -100 && left < sw + 100;
        if (onScreen) {
          el.style.display = "flex";
          el.style.left = `${left - 24}px`;
          el.style.top = `${top - 24}px`;
          el.style.width = `${width + 48}px`;
          el.style.height = `${height + 48}px`;
          el.style.fontSize = `${height * 0.75}px`;
        } else {
          el.style.display = "none";
        }
      }

      frameId.current = requestAnimationFrame(update);
    };

    frameId.current = requestAnimationFrame(update);
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, []);

  return (
    <>
      {CONTACT_LINKS.map((link, i) => (
        <a
          key={link.label}
          ref={(el) => { zoneRefs.current[i] = el; }}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute pointer-events-auto cursor-pointer contact-link-zone"
          style={{
            display: "none",
            alignItems: "center",
            fontFamily: "Myfont, cursive",
            color: "transparent",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgb(100, 220, 255)";
            e.currentTarget.style.textShadow = "0 0 10px rgba(0, 180, 255, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "transparent";
            e.currentTarget.style.textShadow = "none";
          }}
          onClick={(e) => {
            e.preventDefault();
            window.open(link.href, "_blank", "noopener,noreferrer");
          }}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
