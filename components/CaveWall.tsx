"use client";

import { useMemo, useEffect, useState } from "react";
import * as THREE from "three";

// --- 1. Highly Optimized Mathematics & Noise Library ---

const p = new Uint8Array(512);
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
  190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
  88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
  77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
  102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
  135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
  5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 162, 112, 87, 21, 29, 116,
  31, 206, 128, 109, 249, 156, 127, 180, 97, 17, 221, 111, 95, 14, 14, 254, 88, 119, 162, 74, 223,
  50, 244, 46, 115, 39, 12, 191, 224, 222, 26, 35, 97, 228, 251, 16, 252, 56, 61, 86, 164, 152, 172,
  29, 129, 234, 61, 154, 150, 149, 118, 189, 174, 110, 72, 195, 163, 135, 201, 84, 204, 195, 217,
  249, 236, 252, 201, 143, 90, 184, 176, 124, 195, 207, 174, 250, 51, 206, 204, 188, 141, 114, 83,
  56, 116, 77, 64, 158, 241, 172, 168, 150, 129, 233, 89, 18, 137, 225, 223, 222, 115, 222, 93,
  252, 243, 64, 12, 22, 205, 175, 204, 33, 34, 121, 8, 135, 223, 224, 250, 190, 251, 161, 191, 58,
  168, 24, 96, 25, 15, 101, 251, 224, 124, 152
];

for (let i = 0; i < 256; i++) { p[i] = permutation[i]; p[i + 256] = permutation[i]; }

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t: number, a: number, b: number) => a + t * (b - a);
const grad = (hash: number, x: number, y: number) => {
  const h = hash & 15; const u = h < 8 ? x : y; const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
};
const perlin = (x: number, y: number) => {
  const xInt = Math.floor(x); const yInt = Math.floor(y);
  const X = xInt & 255; const Y = yInt & 255;
  const xf = x - xInt; const yf = y - yInt;
  const u = fade(xf); const v = fade(yf);
  const A = p[X] + Y; const B = p[X + 1] + Y;
  return lerp(v, lerp(u, grad(p[A], xf, yf), grad(p[B], xf - 1, yf)),
    lerp(u, grad(p[A + 1], xf, yf - 1), grad(p[B + 1], xf - 1, yf - 1)));
};
const fbm = (x: number, y: number, octaves = 2) => {
  let value = 0.0, amplitude = 0.5, frequency = 1.0;
  for (let i = 0; i < octaves; i++) { value += amplitude * perlin(x * frequency, y * frequency); frequency *= 2.0; amplitude *= 0.5; }
  return value;
};
const getGeology = (px: number, py: number) => {
  const warpX = fbm(px * 1.2, py * 1.2, 2) * 0.4;
  const warpY = fbm(py * 1.2 + 2.0, px * 1.2 + 1.0, 2) * 0.4;
  const wx = px + warpX; const wy = py + warpY;
  const undulation = fbm(wx * 1.4, wy * 1.4, 3) * 0.42;
  const strataFreq = 16.0;
  const strataY = wy * strataFreq + fbm(wx * 2.8, wy * 1.8, 3) * 1.8;
  const strataVal = Math.sin(strataY);
  const strataLedges = (Math.sign(strataVal) * Math.pow(Math.abs(strataVal), 0.7)) * 0.08;
  const wrinkle1 = 1.0 - Math.abs(perlin(wx * 3.5, wy * 3.5));
  const wrinkle2 = 1.0 - Math.abs(perlin(wx * 7.0, wy * 7.0));
  const wrinkles = wrinkle1 * 0.18 + wrinkle2 * 0.07;
  const crackNoise = perlin(wx * 6.0 + 4.2, wy * 6.0 - 1.8);
  const crackLine = Math.abs(crackNoise);
  let crackDepth = 0.0;
  if (crackLine < 0.02) crackDepth = (1.0 - crackLine / 0.02) * 0.12;
  const totalHeight = undulation + strataLedges + wrinkles - crackDepth;
  const h = Math.min(Math.max((totalHeight + 0.6) / 1.4, 0.0), 1.0);
  return { totalHeight, crackDepth, strataY, h };
};

export default function CaveWall({ isMobile = false }: { isMobile?: boolean }) {
  const [textures, setTextures] = useState<{
    albedoMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    // Load the user's personal handwriting font before drawing on canvas.
    // FontFace API ensures the font is available to canvas ctx.font calls.
    const fontFace = new FontFace(
      'Myfont',
      'url(/My_font/Myfont-Regular.ttf)'
    );
    fontFace.load().then((loaded) => {
      document.fonts.add(loaded);
      // Defer so browser paints the preloader first, THEN runs the heavy JS
      requestAnimationFrame(() => requestAnimationFrame(() => buildTextures()));
    }).catch(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => buildTextures()));
    });

    function buildTextures() {
      // Base noise at 256×640 (4× fewer samples than before).
      // Quality is identical — we bilinearly upscale to 1024×2560 anyway,
      // and the stone doesn't need high-freq detail at the base level.
      const baseW = 256;
      const baseH = isMobile ? 800 : 640;
      const finalSizeW = 1024;
      const finalSizeH = isMobile ? 3200 : 2560;

      const baseHeight = new Float32Array(baseW * baseH);
      const baseCrack = new Float32Array(baseW * baseH);
      const baseStrataY = new Float32Array(baseW * baseH);

      for (let y = 0; y < baseH; y++) {
        const py = (y / baseH) * 2.0 - 1.0;
        for (let x = 0; x < baseW; x++) {
          const px = (x / baseW) * 2.0 - 1.0;
          const geo = getGeology(px, py);
          const idx = y * baseW + x;
          baseHeight[idx] = geo.h;
          baseCrack[idx] = geo.crackDepth;
          baseStrataY[idx] = geo.strataY;
        }
      }

      const heightMap = new Float32Array(finalSizeW * finalSizeH);
      const crackMap = new Float32Array(finalSizeW * finalSizeH);
      const strataYMap = new Float32Array(finalSizeW * finalSizeH);

      // Bilinear upscaling from 512x1024 → 1024x2048
      for (let y = 0; y < finalSizeH; y++) {
        const srcY = (y / finalSizeH) * (baseH - 1);
        const y0 = Math.floor(srcY); const y1 = Math.min(y0 + 1, baseH - 1);
        const dy = srcY - y0;
        for (let x = 0; x < finalSizeW; x++) {
          const srcX = (x / finalSizeW) * (baseW - 1);
          const x0 = Math.floor(srcX); const x1 = Math.min(x0 + 1, baseW - 1);
          const dx = srcX - x0;
          const idx00 = y0 * baseW + x0; const idx10 = y0 * baseW + x1;
          const idx01 = y1 * baseW + x0; const idx11 = y1 * baseW + x1;
          const fIdx = y * finalSizeW + x;
          heightMap[fIdx] = baseHeight[idx00] * (1 - dx) * (1 - dy) + baseHeight[idx10] * dx * (1 - dy) + baseHeight[idx01] * (1 - dx) * dy + baseHeight[idx11] * dx * dy;
          crackMap[fIdx] = baseCrack[idx00] * (1 - dx) * (1 - dy) + baseCrack[idx10] * dx * (1 - dy) + baseCrack[idx01] * (1 - dx) * dy + baseCrack[idx11] * dx * dy;
          strataYMap[fIdx] = baseStrataY[idx00] * (1 - dx) * (1 - dy) + baseStrataY[idx10] * dx * (1 - dy) + baseStrataY[idx01] * (1 - dx) * dy + baseStrataY[idx11] * dx * dy;
        }
      }

      let randSeed = 12345;
      const fastRandom = () => { randSeed = (randSeed * 1664525 + 1013904223) | 0; return (randSeed >>> 0) / 4294967296; };

      for (let i = 0; i < finalSizeW * finalSizeH; i++) {
        heightMap[i] = Math.min(Math.max(heightMap[i] + (fastRandom() - 0.5) * 0.024, 0.0), 1.0);
      }

      // Canvases — rectangular 1024×2048
      const albedoCanvas = document.createElement("canvas");
      albedoCanvas.width = finalSizeW; albedoCanvas.height = finalSizeH;
      const albedoCtx = albedoCanvas.getContext("2d")!;
      const albedoImgData = albedoCtx.createImageData(finalSizeW, finalSizeH);

      const finalNormalCanvas = document.createElement("canvas");
      finalNormalCanvas.width = finalSizeW; finalNormalCanvas.height = finalSizeH;
      const finalNormalCtx = finalNormalCanvas.getContext("2d")!;
      const normalImgData = finalNormalCtx.createImageData(finalSizeW, finalSizeH);

      const finalRoughnessCanvas = document.createElement("canvas");
      finalRoughnessCanvas.width = finalSizeW; finalRoughnessCanvas.height = finalSizeH;
      const finalRoughnessCtx = finalRoughnessCanvas.getContext("2d")!;
      const roughnessImgData = finalRoughnessCtx.createImageData(finalSizeW, finalSizeH);

      const bumpStrength = 8.0;

      for (let y = 0; y < finalSizeH; y++) {
        for (let x = 0; x < finalSizeW; x++) {
          const fIdx = y * finalSizeW + x;
          const idx = fIdx * 4;
          const xLeft = (x - 1 + finalSizeW) % finalSizeW; const xRight = (x + 1) % finalSizeW;
          const yUp = (y - 1 + finalSizeH) % finalSizeH; const yDown = (y + 1) % finalSizeH;
          const h = heightMap[fIdx];
          const dx2 = (heightMap[y * finalSizeW + xRight] - heightMap[y * finalSizeW + xLeft]) * bumpStrength;
          const dy2 = (heightMap[yDown * finalSizeW + x] - heightMap[yUp * finalSizeW + x]) * bumpStrength;
          const len = Math.sqrt(dx2 * dx2 + dy2 * dy2 + 1.0);
          normalImgData.data[idx] = Math.floor((-dx2 / len * 0.5 + 0.5) * 255);
          normalImgData.data[idx + 1] = Math.floor((-dy2 / len * 0.5 + 0.5) * 255);
          normalImgData.data[idx + 2] = Math.floor((1.0 / len * 0.5 + 0.5) * 255);
          normalImgData.data[idx + 3] = 255;
          let roughnessVal = Math.min(Math.max(0.96 - h * 0.04 + (fastRandom() - 0.5) * 0.04, 0.92), 1.0);
          roughnessImgData.data[idx] = roughnessImgData.data[idx + 1] = roughnessImgData.data[idx + 2] = Math.floor(roughnessVal * 255);
          roughnessImgData.data[idx + 3] = 255;
          const strataY = strataYMap[fIdx];
          const bandVal = Math.sin(strataY) * 0.5 + 0.5;
          let r = 0, g = 0, b = 0;
          if (bandVal < 0.12) { const t = bandVal / 0.12; r = lerp(t, 145, 95); g = lerp(t, 105, 80); b = lerp(t, 75, 70); }
          else if (bandVal < 0.28) { const t = (bandVal - 0.12) / 0.16; r = lerp(t, 95, 145); g = lerp(t, 80, 130); b = lerp(t, 70, 115); }
          else if (bandVal < 0.5) { const t = (bandVal - 0.28) / 0.22; r = lerp(t, 145, 165); g = lerp(t, 130, 125); b = lerp(t, 115, 85); }
          else if (bandVal < 0.8) { const t = (bandVal - 0.5) / 0.3; r = lerp(t, 165, 155); g = lerp(t, 125, 95); b = lerp(t, 85, 70); }
          else { const t = (bandVal - 0.8) / 0.2; r = lerp(t, 155, 145); g = lerp(t, 95, 105); b = lerp(t, 70, 75); }
          const staining = perlin((x / finalSizeW) * 3.5, (y / finalSizeH) * 3.5);
          r += staining * 14; g += staining * 8; b += staining * 3;
          const sandSpeckle = (fastRandom() - 0.5) * 6.0;
          r += sandSpeckle; g += sandSpeckle; b += sandSpeckle;
          const crack = crackMap[fIdx];
          if (crack > 0) { const df = Math.max(0.06, 1.0 - crack * 3.2); r *= df; g *= df; b *= df; }
          const heightAO = 0.75 + h * 0.45;
          r *= heightAO; g *= heightAO; b *= heightAO;
          albedoImgData.data[idx] = Math.floor(Math.min(Math.max(r, 0), 255));
          albedoImgData.data[idx + 1] = Math.floor(Math.min(Math.max(g, 0), 255));
          albedoImgData.data[idx + 2] = Math.floor(Math.min(Math.max(b, 0), 255));
          albedoImgData.data[idx + 3] = 255;
        }
      }

      albedoCtx.putImageData(albedoImgData, 0, 0);
      finalNormalCtx.putImageData(normalImgData, 0, 0);
      finalRoughnessCtx.putImageData(roughnessImgData, 0, 0);

      // ── SHARP TEXT CANVAS STRATEGY ───────────────────────────────────────────
      // Problem: 1024×2560 texture is upscaled to fill screen → blurry text.
      // Solution: create 2048×5120 "sharp" canvases. Copy stone via drawImage
      // (GPU-accelerated, fast). Then scale(2,2) so all text coordinates double,
      // giving 2× more texture pixels per world unit.
      // Stone noise generation stays at 1024×2560 (no slowdown there).
      const sharpW = 2048;
      const sharpH = 5120;

      const sharpAlbedo = document.createElement("canvas");
      sharpAlbedo.width = sharpW; sharpAlbedo.height = sharpH;
      const sharpAlbedoCtx = sharpAlbedo.getContext("2d")!;
      // Copy stone texture at 2× scale (hardware-accelerated)
      sharpAlbedoCtx.drawImage(albedoCanvas, 0, 0, sharpW, sharpH);
      // All subsequent drawing commands use 2× scale → text is 2× sharper
      sharpAlbedoCtx.scale(2, 2);

      const sharpRoughness = document.createElement("canvas");
      sharpRoughness.width = sharpW; sharpRoughness.height = sharpH;
      const sharpRoughnessCtx = sharpRoughness.getContext("2d")!;
      sharpRoughnessCtx.drawImage(finalRoughnessCanvas, 0, 0, sharpW, sharpH);
      sharpRoughnessCtx.scale(2, 2);

      const sharpNormal = document.createElement("canvas");
      sharpNormal.width = sharpW; sharpNormal.height = sharpH;
      const sharpNormalCtx = sharpNormal.getContext("2d")!;
      sharpNormalCtx.drawImage(finalNormalCanvas, 0, 0, sharpW, sharpH);

      // --- 2. Draw Charcoal Markings on SHARP 2048×4096 Canvas ---
      // albedoCtx / finalRoughnessCtx below now refer to the sharp versions.
      const drawCharcoalMarkings = () => {
        // Use sharp contexts so text is drawn at 2× resolution
        const albedoCtx = sharpAlbedoCtx;
        const finalRoughnessCtx = sharpRoughnessCtx;
        albedoCtx.save();
        finalRoughnessCtx.save();

        const drawWobblyLine = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, wobble = 2.5) => {
          const draw = (ctx: CanvasRenderingContext2D, isR: boolean) => {
            ctx.strokeStyle = isR ? "rgba(255,255,255,0.95)" : "rgba(2,1,0,0.97)";
            ctx.lineWidth = isR ? 2.5 : 2.4;
            ctx.beginPath(); ctx.moveTo(x1, y1);
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const segs = Math.max(3, Math.floor(dist / 20));
            for (let i = 1; i <= segs; i++) {
              const t = i / segs;
              const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
              if (i === segs) ctx.lineTo(px, py);
              else ctx.lineTo(px + (fastRandom() - 0.5) * wobble, py + (fastRandom() - 0.5) * wobble);
            }
            ctx.stroke();
          };
          draw(aC, false); draw(rC, true);
        };

        const drawWobblyCurve = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, pts: [number, number][], wobble = 2.5) => {
          const draw = (ctx: CanvasRenderingContext2D, isR: boolean) => {
            ctx.strokeStyle = isR ? "rgba(255,255,255,0.95)" : "rgba(2,1,0,0.97)";
            ctx.lineWidth = isR ? 2.5 : 2.4;
            ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + (fastRandom() - 0.5) * wobble, pts[i][1] + (fastRandom() - 0.5) * wobble);
            ctx.stroke();
          };
          draw(aC, false); draw(rC, true);
        };

        const drawWobblyBox = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wobble = 3.5) => {
          drawWobblyLine(aC, rC, x, y, x + w, y, wobble); drawWobblyLine(aC, rC, x + w, y, x + w, y + h, wobble);
          drawWobblyLine(aC, rC, x + w, y + h, x, y + h, wobble); drawWobblyLine(aC, rC, x, y + h, x, y, wobble);
        };

        const drawWobblyText = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, text: string, x: number, y: number, font = '22px Myfont, cursive') => {
          const draw = (ctx: CanvasRenderingContext2D, isR: boolean) => {
            ctx.font = font;
            if (isR) {
              ctx.fillStyle = "rgba(255,255,255,0.99)";
              ctx.fillText(text, x, y);
            } else {
              // Three-pass: shadow + stroke + double-fill — purely black but crisp
              ctx.fillStyle = "rgba(0,0,0,0.50)";
              ctx.fillText(text, x + 0.6, y + 0.6);

              ctx.strokeStyle = "rgba(0,0,0,0.80)";
              ctx.lineWidth = 0.8; // reduced from 1.2 so letters don't widen
              ctx.lineJoin = "round";
              ctx.strokeText(text, x, y);

              ctx.fillStyle = "rgba(0,0,0,1.0)";
              ctx.fillText(text, x, y);
              ctx.fillText(text, x, y); // drawing twice solidifies anti-aliased edges
            }
          };
          draw(aC, false); draw(rC, true);
        };

        const drawStickFigure = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, height: number, scale = 1.0) => {
          const h = height * scale; const hr = 6 * scale;
          const dH = (ctx: CanvasRenderingContext2D, isR: boolean) => {
            ctx.fillStyle = isR ? "rgba(255,255,255,0.92)" : "rgba(6,5,4,0.85)";
            ctx.beginPath(); ctx.arc(cx, cy - h / 2 - hr, hr, 0, Math.PI * 2); ctx.fill();
          };
          dH(aC, false); dH(rC, true);
          drawWobblyLine(aC, rC, cx, cy - h / 2, cx, cy + h / 6, 1.5);
          drawWobblyLine(aC, rC, cx - 12 * scale, cy - h / 4, cx, cy - h / 3, 1.5);
          drawWobblyLine(aC, rC, cx, cy - h / 3, cx + 12 * scale, cy - h / 4, 1.5);
          drawWobblyLine(aC, rC, cx, cy + h / 6, cx - 10 * scale, cy + h / 2, 1.5);
          drawWobblyLine(aC, rC, cx, cy + h / 6, cx + 10 * scale, cy + h / 2, 1.5);
        };

        const drawSmiley = (ctx: CanvasRenderingContext2D, isR: boolean, cx: number, cy: number) => {
          ctx.strokeStyle = isR ? "rgba(255,255,255,0.9)" : "rgba(6,5,4,0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, 4, 0.1, Math.PI - 0.1); ctx.stroke();
          ctx.fillStyle = isR ? "rgba(255,255,255,0.9)" : "rgba(6,5,4,0.85)";
          ctx.fillRect(cx - 3, cy - 3, 1.2, 1.2); ctx.fillRect(cx + 1.5, cy - 3, 1.2, 1.2);
        };

        const drawPrehistoricDeer = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, scale = 1.0) => {
          drawWobblyCurve(aC, rC, [[cx + 10 * scale, cy - 20 * scale], [cx + 18 * scale, cy - 35 * scale], [cx + 25 * scale, cy - 42 * scale]], 2.5);
          drawWobblyLine(aC, rC, cx + 18 * scale, cy - 35 * scale, cx + 10 * scale, cy - 38 * scale);
          drawWobblyLine(aC, rC, cx + 22 * scale, cy - 39 * scale, cx + 18 * scale, cy - 44 * scale);
          drawWobblyCurve(aC, rC, [[cx + 5 * scale, cy - 20 * scale], [cx - 2 * scale, cy - 32 * scale], [cx - 8 * scale, cy - 38 * scale]], 2.5);
          drawWobblyCurve(aC, rC, [[cx + 15 * scale, cy - 15 * scale], [cx + 25 * scale, cy - 12 * scale], [cx + 20 * scale, cy - 6 * scale], [cx + 8 * scale, cy - 10 * scale]], 2.0);
          drawWobblyCurve(aC, rC, [[cx + 8 * scale, cy - 10 * scale], [cx - 10 * scale, cy + 5 * scale], [cx - 50 * scale, cy + 2 * scale]], 2.5);
          drawWobblyCurve(aC, rC, [[cx + 8 * scale, cy - 10 * scale], [cx - 12 * scale, cy + 18 * scale], [cx - 45 * scale, cy + 15 * scale], [cx - 50 * scale, cy + 2 * scale]], 2.5);
          drawWobblyLine(aC, rC, cx - 10 * scale, cy + 18 * scale, cx - 12 * scale, cy + 52 * scale, 3.0);
          drawWobblyLine(aC, rC, cx - 14 * scale, cy + 18 * scale, cx - 8 * scale, cy + 52 * scale, 3.0);
          drawWobblyLine(aC, rC, cx - 46 * scale, cy + 15 * scale, cx - 52 * scale, cy + 52 * scale, 3.0);
          drawWobblyLine(aC, rC, cx - 48 * scale, cy + 15 * scale, cx - 44 * scale, cy + 52 * scale, 3.0);
          drawWobblyLine(aC, rC, cx - 50 * scale, cy + 2 * scale, cx - 56 * scale, cy - 4 * scale, 2.0);
        };

        const drawPrehistoricBison = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, scale = 1.0) => {
          drawWobblyCurve(aC, rC, [[cx, cy + 5 * scale], [cx + 25 * scale, cy - 25 * scale], [cx + 60 * scale, cy - 20 * scale], [cx + 100 * scale, cy + 10 * scale]], 3.0);
          drawWobblyCurve(aC, rC, [[cx, cy + 5 * scale], [cx - 20 * scale, cy + 20 * scale], [cx - 10 * scale, cy + 45 * scale], [cx + 18 * scale, cy + 38 * scale]], 2.5);
          drawWobblyCurve(aC, rC, [[cx - 10 * scale, cy + 12 * scale], [cx - 28 * scale, cy - 2 * scale], [cx - 24 * scale, cy - 14 * scale]], 2.0);
          drawWobblyCurve(aC, rC, [[cx + 18 * scale, cy + 38 * scale], [cx + 45 * scale, cy + 52 * scale], [cx + 90 * scale, cy + 45 * scale], [cx + 100 * scale, cy + 10 * scale]], 3.0);
          drawWobblyLine(aC, rC, cx + 22 * scale, cy + 44 * scale, cx + 18 * scale, cy + 85 * scale, 3.0);
          drawWobblyLine(aC, rC, cx + 28 * scale, cy + 44 * scale, cx + 26 * scale, cy + 85 * scale, 3.0);
          drawWobblyLine(aC, rC, cx + 92 * scale, cy + 42 * scale, cx + 86 * scale, cy + 85 * scale, 3.0);
          drawWobblyLine(aC, rC, cx + 96 * scale, cy + 42 * scale, cx + 98 * scale, cy + 85 * scale, 3.0);
          drawWobblyLine(aC, rC, cx + 100 * scale, cy + 10 * scale, cx + 106 * scale, cy + 42 * scale, 2.0);
        };

        // Icon helpers
        const drawEnvelopeIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2; drawWobblyBox(aC, rC, cx - r, cy - r + 3, size, size - 6, 1.0);
          drawWobblyLine(aC, rC, cx - r, cy - r + 3, cx, cy, 0.8); drawWobblyLine(aC, rC, cx + r, cy - r + 3, cx, cy, 0.8);
        };
        const drawPhoneIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyCurve(aC, rC, [[cx - r + 2, cy - r + 3], [cx + 2, cy + 2], [cx + r - 3, cy - r + 3]], 1.5);
          drawWobblyLine(aC, rC, cx - r, cy - r + 2, cx - r + 3, cy - r + 4, 1.2); drawWobblyLine(aC, rC, cx + r - 3, cy - r + 4, cx + r, cy - r + 2, 1.2);
        };
        const drawLinkedinIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2; drawWobblyBox(aC, rC, cx - r, cy - r, size, size, 1.0);
          drawWobblyText(aC, rC, "in", cx - 5, cy + 4, 'bold 11px sans-serif');
        };
        const drawGithubIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          drawWobblyCurve(aC, rC, [[cx - 6, cy], [cx - 6, cy - 6], [cx + 6, cy - 6], [cx + 6, cy]], 1.2);
          drawWobblyCurve(aC, rC, [[cx - 6, cy], [cx, cy + 5], [cx + 6, cy]], 1.2);
          drawWobblyCurve(aC, rC, [[cx - 5, cy - 6], [cx - 8, cy - 11], [cx - 2, cy - 6]], 1.0);
          drawWobblyCurve(aC, rC, [[cx + 2, cy - 6], [cx + 8, cy - 11], [cx + 5, cy - 6]], 1.0);
        };
        const drawEyeIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyCurve(aC, rC, [[cx - r, cy], [cx, cy - r + 3], [cx + r, cy]], 1.2);
          drawWobblyCurve(aC, rC, [[cx - r, cy], [cx, cy + r - 3], [cx + r, cy]], 1.2);
          const dP = (ctx: CanvasRenderingContext2D, isR: boolean) => { ctx.fillStyle = isR ? "rgba(255,255,255,0.9)" : "rgba(6,5,4,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill(); };
          dP(aC, false); dP(rC, true);
        };
        const drawMountainIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyCurve(aC, rC, [[cx - 8, cy + r - 2], [cx - 2, cy - r + 3], [cx + 4, cy + r - 2]], 1.2);
          drawWobblyCurve(aC, rC, [[cx - 2, cy + r - 2], [cx + 4, cy - r + 6], [cx + 10, cy + r - 2]], 1.2);
        };
        const drawMeditatingIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 20) => {
          const h = size - 6;
          const dH = (ctx: CanvasRenderingContext2D, isR: boolean) => { ctx.fillStyle = isR ? "rgba(255,255,255,0.9)" : "rgba(6,5,4,0.85)"; ctx.beginPath(); ctx.arc(cx, cy - h / 2, 3.5, 0, Math.PI * 2); ctx.fill(); };
          dH(aC, false); dH(rC, true);
          drawWobblyLine(aC, rC, cx, cy - h / 2 + 3, cx, cy + h / 6, 1.0);
          drawWobblyCurve(aC, rC, [[cx - 9, cy + h / 6 + 2], [cx - 4, cy + h / 6 - 2], [cx + 4, cy + h / 6 - 2], [cx + 9, cy + h / 6 + 2]], 1.2);
          drawWobblyCurve(aC, rC, [[cx - 8, cy + h / 6], [cx - 6, cy - 2], [cx, cy - h / 2 + 6]], 1.2);
          drawWobblyCurve(aC, rC, [[cx + 8, cy + h / 6], [cx + 6, cy - 2], [cx, cy - h / 2 + 6]], 1.2);
        };
        const drawCaduceusIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyLine(aC, rC, cx, cy - r, cx, cy + r, 1.0);
          drawWobblyCurve(aC, rC, [[cx - 4, cy - 4], [cx, cy - 2], [cx + 4, cy], [cx, cy + 2], [cx - 4, cy + 4], [cx, cy + 6]], 1.2);
          drawWobblyLine(aC, rC, cx - 6, cy - r + 3, cx + 6, cy - r + 3, 1.0);
        };
        const drawWiltedFlowerIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyCurve(aC, rC, [[cx - 1, cy + r], [cx - 2, cy], [cx - 6, cy - 2]], 1.2);
          const hx = cx - 6, hy = cy - 2;
          drawWobblyCurve(aC, rC, [[hx - 3, hy - 3], [hx + 2, hy - 2], [hx - 1, hy + 3], [hx - 3, hy - 3]], 0.8);
          const cY = cy - r + 3;
          drawWobblyCurve(aC, rC, [[cx + r - 12, cY], [cx + r - 8, cY - 4], [cx + r - 2, cY - 3], [cx + r, cY], [cx + r - 12, cY]], 1.2);
          drawWobblyLine(aC, rC, cx + r - 8, cY + 3, cx + r - 9, cY + 6, 0.5);
          drawWobblyLine(aC, rC, cx + r - 4, cY + 3, cx + r - 5, cY + 6, 0.5);
        };
        const drawLaptopIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyBox(aC, rC, cx - r + 2, cy - r, size - 4, size - 8, 1.0);
          drawWobblyLine(aC, rC, cx - r, cy + r - 2, cx + r, cy + r - 2, 1.2);
        };
        const drawControllerIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyBox(aC, rC, cx - r, cy - r + 2, size, size - 4, 1.2);
          drawWobblyLine(aC, rC, cx - 4, cy - 3, cx - 4, cy + 3, 0.8); drawWobblyLine(aC, rC, cx - 7, cy, cx - 1, cy, 0.8);
          drawWobblyLine(aC, rC, cx + 3, cy - 1, cx + 4, cy - 1, 0.5); drawWobblyLine(aC, rC, cx + 5, cy + 2, cx + 6, cy + 2, 0.5);
        };
        const drawDatabaseIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2, h2 = size - 4;
          drawWobblyCurve(aC, rC, [[cx - r, cy - h2 / 2], [cx, cy - h2 / 2 + 2], [cx + r, cy - h2 / 2]], 0.8);
          drawWobblyCurve(aC, rC, [[cx - r, cy - h2 / 2], [cx, cy - h2 / 2 - 2], [cx + r, cy - h2 / 2]], 0.8);
          drawWobblyCurve(aC, rC, [[cx - r, cy], [cx, cy + 2], [cx + r, cy]], 0.8);
          drawWobblyLine(aC, rC, cx - r, cy - h2 / 2, cx - r, cy, 1.0); drawWobblyLine(aC, rC, cx + r, cy - h2 / 2, cx + r, cy, 1.0);
          drawWobblyCurve(aC, rC, [[cx - r, cy + h2 / 2], [cx, cy + h2 / 2 + 2], [cx + r, cy + h2 / 2]], 0.8);
          drawWobblyLine(aC, rC, cx - r, cy, cx - r, cy + h2 / 2, 1.0); drawWobblyLine(aC, rC, cx + r, cy, cx + r, cy + h2 / 2, 1.0);
        };
        const drawAmbulanceIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyBox(aC, rC, cx - r, cy - r, size, size, 1.2);
          drawWobblyLine(aC, rC, cx, cy - r + 3, cx, cy + r - 3, 1.0); drawWobblyLine(aC, rC, cx - r + 3, cy, cx + r - 3, cy, 1.0);
        };
        const drawGridBoardIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyBox(aC, rC, cx - r, cy - r, size, size - 4, 1.2);
          drawWobblyLine(aC, rC, cx - r + 3, cy + r - 2, cx - r, cy + r + 3, 1.0); drawWobblyLine(aC, rC, cx + r - 3, cy + r - 2, cx + r, cy + r + 3, 1.0);
          drawWobblyLine(aC, rC, cx - r + 3, cy, cx + r - 3, cy, 0.8); drawWobblyLine(aC, rC, cx, cy - r + 2, cx, cy + r - 2, 0.8);
        };
        const drawHeartIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const draw = (ctx: CanvasRenderingContext2D, isR: boolean) => {
            ctx.strokeStyle = isR ? "rgba(255,255,255,0.92)" : "rgba(6,5,4,0.85)"; ctx.lineWidth = isR ? 2.5 : 2.0;
            ctx.beginPath();
            ctx.moveTo(cx, cy + size * 0.35);
            ctx.bezierCurveTo(cx - size * 0.6, cy, cx - size * 0.6, cy - size * 0.4, cx, cy - size * 0.1);
            ctx.bezierCurveTo(cx + size * 0.6, cy - size * 0.4, cx + size * 0.6, cy, cx, cy + size * 0.35);
            ctx.stroke();
          };
          draw(aC, false); draw(rC, true);
        };
        const drawBrushIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyLine(aC, rC, cx - r, cy - r, cx + r - 4, cy + r - 4, 1.5);
          drawWobblyCurve(aC, rC, [[cx + r - 4, cy + r - 4], [cx + r, cy + r], [cx + r - 5, cy + r + 2], [cx + r - 2, cy + r - 4]], 1.0);
        };
        const drawBookIcon = (aC: CanvasRenderingContext2D, rC: CanvasRenderingContext2D, cx: number, cy: number, size = 18) => {
          const r = size / 2;
          drawWobblyBox(aC, rC, cx - r, cy - r, size, size, 1.2);
          drawWobblyLine(aC, rC, cx - 2, cy - r, cx - 2, cy + r, 1.0);
          drawWobblyLine(aC, rC, cx - r + 3, cy - 4, cx - 4, cy - 4, 0.8);
          drawWobblyLine(aC, rC, cx - r + 3, cy + 2, cx - 4, cy + 2, 0.8);
        };

        // ── TYPOGRAPHY SIZES — using the user's personal Myfont handwriting ──
        // Sizes boosted 50-60% for cave-wall legibility at torch-reveal distances
        const H1 = 'bold 52px Myfont, cursive';
        const H2 = 'bold 36px Myfont, cursive';
        const H3 = 'bold 26px Myfont, cursive';
        const B = '22px Myfont, cursive';
        const IT = 'italic 22px Myfont, cursive';
        const SM = '18px Myfont, cursive';

        // ═══════════════════════════════════════════════════
        // SECTION 0 — HERO (canvas y: 80–500)
        // Camera sees this at scrollProgress ≈ 0
        // ═══════════════════════════════════════════════════

        // A. Hero headline (left, x=80)
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Nikhil", 80, 130, H1);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Nagendra.", 80, 190, H1);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 80, 205, 295, 205, 1.5);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Building intelligent systems", 80, 240, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "at the intersection of", 80, 260, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "AI, finance & human resilience.", 80, 280, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "somehow ended up doing all three", 80, 318, IT);
        // Explore with me
        drawWobblyText(albedoCtx, finalRoughnessCtx, "explore with me →", 90, 360, IT);

        // B. STATUS box (left, x=80, y=385)
        drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, 375, 215, 110, 2.5);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "STATUS", 94, 398, H3);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "doing better.", 94, 420, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "still building.", 94, 440, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "still curious.", 94, 460, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "still me.", 94, 480, B);
        drawSmiley(albedoCtx, false, 268, 476);
        drawSmiley(finalRoughnessCtx, true, 268, 476);

        // C. Mountain Peaks (center, x=390–640)
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 390, 210, 455, 80, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 455, 80, 510, 210, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 430, 210, 495, 60, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 495, 60, 555, 210, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 520, 210, 575, 90, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 575, 90, 625, 210, 3.0);
        // Snow caps
        for (let off = 8; off <= 30; off += 8) {
          drawWobblyLine(albedoCtx, finalRoughnessCtx, 455 + off * 0.7, 80 + off, 455 + off * 0.7 - 6, 80 + off + 10, 1.5);
          drawWobblyLine(albedoCtx, finalRoughnessCtx, 495 + off * 0.7, 60 + off, 495 + off * 0.7 - 6, 60 + off + 10, 1.5);
        }
        // Path below mountains
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[475, 210], [465, 250], [490, 285], [475, 320]], 2.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[487, 210], [477, 250], [502, 285], [487, 320]], 2.0);
        drawStickFigure(albedoCtx, finalRoughnessCtx, 480, 275, 24, 0.85);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 488, 263, 500, 248, 1.0);

        // D. Campfire scene (center-lower)
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 390, 430, 430, 430, 3.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 400, 440, 420, 420, 3.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[402, 425], [410, 400], [418, 425]], 2.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[407, 425], [413, 393], [419, 425]], 2.0);
        drawStickFigure(albedoCtx, finalRoughnessCtx, 372, 428, 20, 0.85);
        drawStickFigure(albedoCtx, finalRoughnessCtx, 450, 428, 20, 0.85);

        // E. Prehistoric deer + bison
        drawPrehistoricDeer(albedoCtx, finalRoughnessCtx, 590, 215, 0.85);
        drawPrehistoricBison(albedoCtx, finalRoughnessCtx, 580, 330, 0.80);

        // F. Quote box (right, x=730)
        drawWobblyBox(albedoCtx, finalRoughnessCtx, 730, 90, 210, 130, 2.5);
        drawWobblyText(albedoCtx, finalRoughnessCtx, '"The cave you', 744, 125, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, 'fear to enter', 744, 148, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, 'holds the treasure', 744, 171, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, 'you seek."', 744, 194, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, '— Joseph Campbell', 760, 214, SM);

        // G. Scroll cue (right)
        drawWobblyText(albedoCtx, finalRoughnessCtx, "scroll ↓", 840, 320, IT);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 872, 335, 872, 360, 1.5);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 872, 360, 867, 353, 1.0);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 872, 360, 877, 353, 1.0);

        // Ambient audio icon (bottom-left hero)
        drawWobblyText(albedoCtx, finalRoughnessCtx, "♪ cave ambience", 84, 498, SM);

        // ═══════════════════════════════════════════════════
        // SECTION 1 — ABOUT (canvas y: 550–900)
        // Camera sees this at scrollProgress ≈ 0.25
        // ═══════════════════════════════════════════════════

        let currentY = 570;
        // Separator
        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, currentY - 35, 960, currentY - 35, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "01) ABOUT", 80, currentY, H2);
        
        currentY += 45;

        // Bio
        drawWobblyText(albedoCtx, finalRoughnessCtx, "computer science engineer.", 80, currentY, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "backgrounds in medicine & finance.", 80, currentY + 20, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "building human-centered technology.", 80, currentY + 40, B);

        currentY += 85;

        // Interests (left column)
        const intX = 80;
        drawMountainIcon(albedoCtx, finalRoughnessCtx, intX + 9, currentY, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Explorer — treks, nature, wandering", intX + 28, currentY + 3, B);

        currentY += 30;
        const gearX = intX; // gear drawn as box with lines
        drawDatabaseIcon(albedoCtx, finalRoughnessCtx, gearX + 9, currentY, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Builder — systems, hackathons, ideas", gearX + 28, currentY + 3, B);

        currentY += 30;
        drawBrushIcon(albedoCtx, finalRoughnessCtx, intX + 9, currentY, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Creative — painting, origami, cooking", intX + 28, currentY + 3, B);

        currentY += 30;
        drawEyeIcon(albedoCtx, finalRoughnessCtx, intX + 9, currentY, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Thinker — philosophy, Vedanta, psych", intX + 28, currentY + 3, B);

        currentY += 30;
        drawHeartIcon(albedoCtx, finalRoughnessCtx, intX + 9, currentY, 16);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "Humanitarian — NGOs, healthcare empathy", intX + 28, currentY + 3, B);

        // Personal handwritten side notes
        const notesX = isMobile ? 80 : 560;
        let notesY = isMobile ? currentY + 50 : 620;
        const notesSpacing = isMobile ? 30 : 40;
        
        drawWobblyText(albedoCtx, finalRoughnessCtx, "books > people (most days)", notesX, notesY, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "good food. better mood.", notesX, notesY + notesSpacing, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "ideas that escaped my head.", notesX, notesY + notesSpacing * 2, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "a little bit of everything", notesX, notesY + notesSpacing * 3, IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "(in a good way).", notesX, notesY + (isMobile ? notesSpacing * 3 + 20 : notesSpacing * 3 + 20), IT);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "terrible handwriting since birth.", notesX, notesY + notesSpacing * 4 + 10, IT);

        // Exploring figure on a path
        let figY = isMobile ? notesY + notesSpacing * 6 : 845;
        let figX = isMobile ? 80 : 560;
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[figX, figY + 25], [figX + 90, figY + 5], [figX + 160, figY + 30], [figX + 250, figY + 10], [figX + 340, figY + 25]], 3.0);
        drawStickFigure(albedoCtx, finalRoughnessCtx, figX + 100, figY, 22, 0.9);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "still exploring.", figX + 120, figY + 40, IT);

        currentY = figY + 100;

        // ═══════════════════════════════════════════════════
        // SECTION 2 — PROJECTS
        // ═══════════════════════════════════════════════════

        if (!isMobile) currentY = 920; // reset for desktop exactness

        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, currentY, 960, currentY, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "02) PROJECTS", 80, currentY + 35, H2);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "ideas. code. impact.", isMobile ? 80 : 370, isMobile ? currentY + 65 : currentY + 38, IT);

        let pY = currentY + (isMobile ? 110 : 80);
        
        // Helper for drawing a project
        const drawProject = (title: string, r1: string, r2: string, tag: string, pX: number, py: number, iconFn: Function) => {
            iconFn(albedoCtx, finalRoughnessCtx, pX + 9, py + 5, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, title, pX + 32, py, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, r1, pX + 32, py + 20, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, r2, pX + 32, py + 38, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, tag, pX + 14, py + 60, IT);
        };

        if (isMobile) {
            drawProject("MEDI-XPRESS", "ambulance-hospital", "coordination platform", "healthcare chaos → scalable", 80, pY, drawAmbulanceIcon);
            pY += 100;
            drawProject("GAMEATHON", "Multi-agent game logic", "built under extreme pressure", "3hr sleep. questionable decisions.", 80, pY, drawControllerIcon);
            pY += 100;
            drawProject("TRADING BOT", "Binance Futures testnet bot", "market, limit & stop-limit", "paper profits. real lessons.", 80, pY, drawDatabaseIcon);
            pY += 100;
            drawProject("FINDB", "High-throughput ledger DBMS", "for financial consolidation", "CA trauma → useful at last.", 80, pY, drawDatabaseIcon);
            pY += 100;
            drawProject("ACIS-X", "Real-time credit intelligence", "multi-agent risk scoring", "signals in. decisions out. no sleep.", 80, pY, drawDatabaseIcon);
            pY += 100;
            drawProject("RAG ENGINE", "Vector + graph retrieval", "ChromaDB meets NetworkX", "documents finally make sense.", 80, pY, drawEyeIcon);
            pY += 100;
            currentY = pY + 20;
        } else {
            drawProject("MEDI-XPRESS", "ambulance-hospital", "coordination platform", "healthcare chaos → scalable", 80, pY, drawAmbulanceIcon);
            drawProject("GAMEATHON", "Multi-agent game logic", "built under extreme pressure", "3hr sleep. questionable decisions.", 365, pY, drawControllerIcon);
            drawProject("TRADING BOT", "Binance Futures testnet bot", "market, limit & stop-limit", "paper profits. real lessons.", 660, pY, drawDatabaseIcon);
            
            pY += 150;
            drawProject("FINDB", "High-throughput ledger DBMS", "for financial consolidation", "CA trauma → useful at last.", 80, pY, drawDatabaseIcon);
            drawProject("ACIS-X", "Real-time credit intelligence", "multi-agent risk scoring", "signals in. decisions out. no sleep.", 365, pY, drawDatabaseIcon);
            drawProject("RAG ENGINE", "Vector + graph retrieval", "ChromaDB meets NetworkX", "documents finally make sense.", 660, pY, drawEyeIcon);
            currentY = pY + 100;
        }


        // ═══════════════════════════════════════════════════
        // SECTION 3 — SKILLS & ACHIEVEMENTS
        // ═══════════════════════════════════════════════════

        if (!isMobile) currentY = 1250;

        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, currentY, 960, currentY, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "TOOLBOX", 80, currentY + 35, H3);

        let ySkill = currentY + 75;
        
        const drawSkill = (title: string, x1: number, y1: number, boxW: number, text: string) => {
            drawWobblyText(albedoCtx, finalRoughnessCtx, title, x1, y1, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, x1, y1 + 8, boxW, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, text, x1 + 10, y1 + 26, B);
        };

        if (isMobile) {
            drawWobblyText(albedoCtx, finalRoughnessCtx, "systems & architecture", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 165, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Dist Systems", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 160, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Event-Driven", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 155, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Agent-Based", 90, ySkill + 26, B);
            ySkill += 55;

            drawWobblyText(albedoCtx, finalRoughnessCtx, "artificial intelligence", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 185, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "AI Agent Design", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 140, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Prompt Eng", 90, ySkill + 26, B);
            ySkill += 55;

            drawWobblyText(albedoCtx, finalRoughnessCtx, "backend & data", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 180, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "SQL DB Design", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 135, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "REST APIs", 90, ySkill + 26, B);
            ySkill += 55;
            
            drawWobblyText(albedoCtx, finalRoughnessCtx, "engineering core", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 96, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Python", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 88, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "JS/TS", 90, ySkill + 26, B);
            ySkill += 45;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 130, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "React/Next", 90, ySkill + 26, B);
            ySkill += 65;
        } else {
            // Row 1
            drawWobblyText(albedoCtx, finalRoughnessCtx, "systems & architecture", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 165, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Dist Systems", 90, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 300, ySkill + 8, 160, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Event-Driven", 310, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 510, ySkill + 8, 155, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Agent-Based", 520, ySkill + 26, B);
            ySkill += 50;

            // Row 2
            drawWobblyText(albedoCtx, finalRoughnessCtx, "artificial intelligence", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 185, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "AI Agent Design", 90, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 300, ySkill + 8, 140, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Prompt Eng", 310, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 510, ySkill + 8, 180, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Gen AI Systems", 520, ySkill + 26, B);
            ySkill += 50;

            // Row 3
            drawWobblyText(albedoCtx, finalRoughnessCtx, "backend & data", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 180, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "SQL DB Design", 90, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 300, ySkill + 8, 135, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "REST APIs", 310, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 510, ySkill + 8, 160, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Auth Systems", 520, ySkill + 26, B);
            ySkill += 50;

            // Row 4
            drawWobblyText(albedoCtx, finalRoughnessCtx, "security & finance", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 180, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Threat Modeling", 90, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 300, ySkill + 8, 230, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Cyber Fundamentals", 310, ySkill + 26, B);
            ySkill += 50;

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 380, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Accounting & Finance Fundamentals", 90, ySkill + 26, B);
            ySkill += 50;

            // Row 5
            drawWobblyText(albedoCtx, finalRoughnessCtx, "engineering core", 80, ySkill, SM);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, ySkill + 8, 96, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Python", 90, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 200, ySkill + 8, 88, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "JS/TS", 210, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 300, ySkill + 8, 80, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "C", 310, ySkill + 26, B);
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 400, ySkill + 8, 130, 26, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "React/Next", 410, ySkill + 26, B);
            ySkill += 60;
        }

        // ── MILESTONES (Full Width) ──
        drawWobblyText(albedoCtx, finalRoughnessCtx, "MILESTONES", 80, ySkill, H3);
        ySkill += 40;

        if (isMobile) {
            drawControllerIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Gameathon — 3rd Place", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "competitive game dev.", 114, ySkill + 23, IT);
            ySkill += 60;

            drawGridBoardIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "CTF — 6th / 36 Teams", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "cybersec & problem solving.", 114, ySkill + 23, IT);
            ySkill += 60;

            drawLaptopIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Multiple Hackathons", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "innovation & rapid prototyping.", 114, ySkill + 23, IT);
            ySkill += 60;

            drawMountainIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Himalayan Treks (x5)", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "reached 5200m. nature >> code.", 114, ySkill + 23, IT);
            ySkill += 60;

            drawWobblyText(albedoCtx, finalRoughnessCtx, "skills are just proof that you showed up.", 80, ySkill, IT);
            ySkill += 50;
        } else {
            drawControllerIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Gameathon — 3rd Place", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "competitive game dev.", 114, ySkill + 23, IT);

            drawGridBoardIcon(albedoCtx, finalRoughnessCtx, 510, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "CTF — 6th / 36 Teams", 534, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "cybersec & problem solving.", 534, ySkill + 23, IT);
            ySkill += 60;

            drawLaptopIcon(albedoCtx, finalRoughnessCtx, 90, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Multiple Hackathons", 114, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "innovation & rapid prototyping.", 114, ySkill + 23, IT);

            drawMountainIcon(albedoCtx, finalRoughnessCtx, 510, ySkill, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "Himalayan Treks (x5)", 534, ySkill + 3, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "reached 5200m. nature >> code.", 534, ySkill + 23, IT);
            ySkill += 60;

            drawWobblyText(albedoCtx, finalRoughnessCtx, "skills are just proof that you showed up.", 300, ySkill, IT);
        }

        // ═══════════════════════════════════════════════════
        // SECTION 4 — JOURNEY 
        // ═══════════════════════════════════════════════════

        if (!isMobile) ySkill = 1640;

        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, ySkill + 5, 960, ySkill + 5, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "04) JOURNEY", 80, ySkill + 40, H2);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "not a resume. a real path.", isMobile ? 80 : 300, isMobile ? ySkill + 70 : ySkill + 43, IT);

        let pathY = ySkill + 90;

        // Winding cave path
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [
          [80, pathY + 50], [160, pathY + 30], [250, pathY + 70], [350, pathY + 40], [450, pathY + 80], [560, pathY + 45], [660, pathY + 75], [770, pathY + 40], [880, pathY + 75], [960, pathY + 50]
        ], 4.0);

        if (isMobile) {
            // Stack waypoints on mobile
            drawCaduceusIcon(albedoCtx, finalRoughnessCtx, 155, pathY + 25, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "MBBS", 205, pathY + 30, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "2 years of medicine.", 110, pathY + 120, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "empathy carved deep.", 110, pathY + 138, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 200, pathY + 40, 16, 0.7);

            pathY += 150;
            drawWiltedFlowerIcon(albedoCtx, finalRoughnessCtx, 155, pathY + 25, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "THE PLOT TWIST", 205, pathY + 30, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "battles fought. ground found.", 110, pathY + 120, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 195, pathY + 40, 16, 0.7);

            pathY += 150;
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 155, pathY + 15, 22, 24, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "CA", 160, pathY + 5, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "foundation + inter G1.", 110, pathY + 120, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 215, pathY + 50, 16, 0.7);

            pathY += 150;
            drawLaptopIcon(albedoCtx, finalRoughnessCtx, 155, pathY + 25, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "B.E CSE", 205, pathY + 30, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "building now. a better direction.", 110, pathY + 120, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 195, pathY + 40, 16, 0.7);

            pathY += 170;
            drawWobblyText(albedoCtx, finalRoughnessCtx, "some paths are straight.", 80, pathY, IT);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "mine had plot twists.", 80, pathY + 30, IT);
        } else {
            drawCaduceusIcon(albedoCtx, finalRoughnessCtx, 155, pathY + 25, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "MBBS", 205, pathY + 30, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "2 years of medicine.", 110, pathY + 120, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "empathy carved deep.", 110, pathY + 138, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 200, pathY + 40, 16, 0.7);

            drawWiltedFlowerIcon(albedoCtx, finalRoughnessCtx, 440, pathY + 75, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "THE PLOT TWIST", 350, pathY + 50, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "battles fought.", 380, pathY + 120, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "ground eventually found.", 380, pathY + 138, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 480, pathY + 70, 16, 0.7);

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 642, pathY + 30, 22, 24, 1.5);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "CA", 650, pathY + 5, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "foundation + inter G1.", 600, pathY + 120, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "discipline as survival.", 600, pathY + 138, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 700, pathY + 65, 16, 0.7);

            drawLaptopIcon(albedoCtx, finalRoughnessCtx, 855, pathY + 35, 22);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "B.E CSE", 828, pathY + 5, H3);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "building now.", 820, pathY + 120, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "a better direction.", 820, pathY + 138, B);
            drawStickFigure(albedoCtx, finalRoughnessCtx, 895, pathY + 60, 16, 0.7);

            pathY += 230;
            drawWobblyText(albedoCtx, finalRoughnessCtx, "some paths are straight. mine had plot twists.", 200, pathY, IT);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "still a meaningful one.", 370, pathY + 30, IT);
        }

        // ═══════════════════════════════════════════════════
        // SECTION 5 — PHILOSOPHY
        // ═══════════════════════════════════════════════════

        if (!isMobile) pathY = 1960;
        else pathY += 80;

        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, pathY, 960, pathY, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "05) PHILOSOPHY", 80, pathY + 35, H2);

        let qY = pathY + 55;

        if (isMobile) {
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, qY, 380, 85, 2.0);
            drawEyeIcon(albedoCtx, finalRoughnessCtx, 96, qY + 28, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We do not see things as they are.", 120, qY + 23, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We see them as we are.", 120, qY + 43, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "— Anaïs Nin", 120, qY + 75, SM);
            qY += 120;

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, qY, 420, 100, 2.0);
            drawMeditatingIcon(albedoCtx, finalRoughnessCtx, 96, qY + 40, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We must be willing to let go of the life", 122, qY + 23, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "we planned so as to have the life that", 122, qY + 43, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "is waiting for us.", 122, qY + 63, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "— Joseph Campbell", 122, qY + 85, SM);
            qY += 140;

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, qY, 420, 80, 2.0);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "ideas kept me alive longer than", 100, qY + 33, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "certainty did.", 100, qY + 53, B);
            qY += 120;
        } else {
            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, qY, 380, 85, 2.0);
            drawEyeIcon(albedoCtx, finalRoughnessCtx, 96, qY + 28, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We do not see things as they are.", 120, qY + 23, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We see them as we are.", 120, qY + 43, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "— Anaïs Nin", 120, qY + 75, SM);

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 500, qY, 420, 100, 2.0);
            drawMeditatingIcon(albedoCtx, finalRoughnessCtx, 516, qY + 40, 18);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "We must be willing to let go of the life", 542, qY + 23, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "we planned so as to have the life that", 542, qY + 43, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "is waiting for us.", 542, qY + 63, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "— Joseph Campbell", 542, qY + 85, SM);

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 80, qY + 95, 420, 80, 2.0);
            drawMountainIcon(albedoCtx, finalRoughnessCtx, 96, qY + 118, 16);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "In a day, when you don't come across any", 120, qY + 118, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "problems - you can be sure that you are", 120, qY + 138, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "travelling in a wrong path", 120, qY + 158, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "— Swami Vivekananda", 120, qY + 195, SM);

            drawWobblyBox(albedoCtx, finalRoughnessCtx, 510, qY + 105, 400, 55, 2.0);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "ideas kept me alive", 530, qY + 128, B);
            drawWobblyText(albedoCtx, finalRoughnessCtx, "longer than certainty did.", 530, qY + 148, B);
            qY += 220;
        }

        // ═══════════════════════════════════════════════════
        // SECTION 6 — CONTACT
        // ═══════════════════════════════════════════════════

        if (!isMobile) qY = 2220;
        else qY += 40;

        drawWobblyLine(albedoCtx, finalRoughnessCtx, 60, qY, 960, qY, 1.0);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "06) CONTACT ME", 80, qY + 35, H2);

        // Campfire scene (center)
        const cfX = isMobile ? 250 : 500, cfY = qY + 90;
        drawWobblyLine(albedoCtx, finalRoughnessCtx, cfX - 25, cfY + 15, cfX + 25, cfY + 15, 3.5);
        drawWobblyLine(albedoCtx, finalRoughnessCtx, cfX - 12, cfY + 20, cfX + 12, cfY - 10, 3.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[cfX - 5, cfY + 10], [cfX, cfY - 18], [cfX + 5, cfY + 10]], 2.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[cfX - 3, cfY + 10], [cfX + 3, cfY - 25], [cfX + 8, cfY + 10]], 2.0);
        drawStickFigure(albedoCtx, finalRoughnessCtx, cfX - 50, cfY + 10, 20, 0.8);
        drawStickFigure(albedoCtx, finalRoughnessCtx, cfX + 52, cfY + 10, 20, 0.8);
        
        // Stars
        for (const [sx, sy] of [[cfX - 50, cfY - 50], [cfX - 30, cfY - 65], [cfX + 20, cfY - 73], [cfX + 60, cfY - 57], [cfX + 90, cfY - 70], [cfX + 110, cfY - 45], [cfX + 130, cfY - 65]] as [number, number][]) {
          const dS = (ctx: CanvasRenderingContext2D, isR: boolean) => { ctx.fillStyle = isR ? "rgba(255,255,255,0.85)" : "rgba(6,5,4,0.7)"; ctx.fillRect(sx, sy, 1.5, 1.5); };
          dS(albedoCtx, false); dS(finalRoughnessCtx, true);
        }

        let cY = cfY + (isMobile ? 60 : -25);
        let cX = isMobile ? 80 : 80;

        // Warm invitation text
        drawWobblyText(albedoCtx, finalRoughnessCtx, "if you've made it this far,", cX, cY, B);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "let's build something cool together.", cX, cY + 20, B);

        cY += 60;
        // Contact details (left)
        drawWobblyText(albedoCtx, finalRoughnessCtx, "nikhilnag98@gmail.com", 112, 2296, B);

        drawPhoneIcon(albedoCtx, finalRoughnessCtx, 88, 2315, 16);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "+91 9986890905", 112, 2318, B);

        // Social links (right of campfire)
        drawLinkedinIcon(albedoCtx, finalRoughnessCtx, 700, 2245, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "LinkedIn", 724, 2248, B);

        drawGithubIcon(albedoCtx, finalRoughnessCtx, 700, 2277, 18);
        drawWobblyText(albedoCtx, finalRoughnessCtx, "GitHub — allalg", 724, 2280, B);

        // Closing line
        drawWobblyText(albedoCtx, finalRoughnessCtx, "looking forward to our next adventure.", 500, 2323, IT);
        drawSmiley(albedoCtx, false, 840, 2318);
        drawSmiley(finalRoughnessCtx, true, 840, 2318);

        // Audio icon
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[740, 2220], [746, 2220], [752, 2211], [752, 2229], [746, 2220], [740, 2220]], 1.5);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[757, 2216], [759, 2220], [757, 2224]], 1.0);
        drawWobblyCurve(albedoCtx, finalRoughnessCtx, [[761, 2212], [764, 2220], [761, 2228]], 1.0);

        albedoCtx.restore();
        finalRoughnessCtx.restore();
      };

      drawCharcoalMarkings();

      // Use the sharp 2048×5120 canvases for all textures.
      // Text was drawn on sharpAlbedo/sharpRoughness at 2× resolution.
      const albedoTex = new THREE.CanvasTexture(sharpAlbedo);
      albedoTex.wrapS = THREE.ClampToEdgeWrapping;
      albedoTex.wrapT = THREE.ClampToEdgeWrapping;
      albedoTex.generateMipmaps = false;
      albedoTex.minFilter = THREE.LinearFilter;
      albedoTex.magFilter = THREE.LinearFilter;
      albedoTex.anisotropy = 16;

      const normalTex = new THREE.CanvasTexture(sharpNormal);
      normalTex.wrapS = THREE.ClampToEdgeWrapping;
      normalTex.wrapT = THREE.ClampToEdgeWrapping;
      normalTex.generateMipmaps = false;
      normalTex.minFilter = THREE.LinearFilter;
      normalTex.anisotropy = 16;

      const roughnessTex = new THREE.CanvasTexture(sharpRoughness);
      roughnessTex.wrapS = THREE.ClampToEdgeWrapping;
      roughnessTex.wrapT = THREE.ClampToEdgeWrapping;
      roughnessTex.generateMipmaps = false;
      roughnessTex.minFilter = THREE.LinearFilter;
      roughnessTex.anisotropy = 16;

      setTextures({ albedoMap: albedoTex, normalMap: normalTex, roughnessMap: roughnessTex });

      // ── MEMORY CLEANUP ─────────────────────────────────────────────────────
      // The intermediate Float32Array buffers (base noise + upscaled maps) are
      // no longer needed — all data is baked into the canvas textures / GPU.
      // Nulling them allows GC to reclaim ~48MB of heap.
      // (Variables are block-scoped inside buildTextures, so they'll be GC'd
      // once this function returns. But explicitly clearing references in the
      // closure helps V8 collect them sooner.)
    } // end buildTextures
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const geometry = useMemo(() => {
    // 20 wide × 65 tall — width matches camera FOV at z=4.5 with some bleed.
    // Height expanded from 52→65 to accommodate Skills & Achievements section.
    // The wall is FLAT (no dome curvature) — just gentle organic surface noise
    // so it looks like real stone, not a ceiling arch.
    // 64×240 subdivisions — normal map provides all the fine surface detail;
    // geometry just needs enough resolution for the gentle organic bumps.
    const geom = new THREE.PlaneGeometry(20, 65, 64, 240);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normX = x / 10;    // -1.0 to 1.0
      const normY = y / 32.5;  // -1.0 to 1.0
      const geo = getGeology(normX, normY);
      // Flat wall: only gentle organic bump from geology noise (±0.35)
      // No dome curvature — the wall stays near z=0, filling the full screen.
      pos.setZ(i, (geo.totalHeight - 0.5) * 0.7);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  if (!textures) return null;

  return (
    <mesh position={[0, 0, 0]} geometry={geometry}>
      <meshStandardMaterial
        map={textures.albedoMap}
        roughnessMap={textures.roughnessMap}
        normalMap={textures.normalMap}
        normalScale={new THREE.Vector2(2.5, 2.5)}
        metalness={0.0}
        roughness={0.88}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
