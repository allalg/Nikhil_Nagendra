"use client";

import { useMemo, useEffect, useState } from "react";
import * as THREE from "three";

// ── Exact same Perlin/geology pipeline as CaveWall ────────────────────────────
// Duplicated here so this module is self-contained. The noise MUST be identical
// so that adjacent panels produce visually continuous stone.

const p = new Uint8Array(512);
const permutation = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,162,112,87,21,29,116,
  31,206,128,109,249,156,127,180,97,17,221,111,95,14,14,254,88,119,162,74,223,
  50,244,46,115,39,12,191,224,222,26,35,97,228,251,16,252,56,61,86,164,152,172,
  29,129,234,61,154,150,149,118,189,174,110,72,195,163,135,201,84,204,195,217,
  249,236,252,201,143,90,184,176,124,195,207,174,250,51,206,204,188,141,114,83,
  56,116,77,64,158,241,172,168,150,129,233,89,18,137,225,223,222,115,222,93,
  252,243,64,12,22,205,175,204,33,34,121,8,135,223,224,250,190,251,161,191,58,
  168,24,96,25,15,101,251,224,124,152
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

// ── Panel definitions ─────────────────────────────────────────────────────────
// Center wall: PlaneGeometry(20, 52) at origin.
//   World x: -10 to +10,  world y: -26 to +26
//   CaveWall maps pixel coords to noise with:  px = x/10  (-1 to 1),  py = y/26  (-1 to 1)
//
// For surround panels, we sample noise in the SAME coordinate space so the
// geology is continuous. Each panel defines its world-space bounds, and we
// convert those to the center wall's noise coordinate space:
//   noisePx = worldX / 10,   noisePy = worldY / 26

interface PanelDef {
  // World-space position (centre of the panel mesh)
  position: [number, number, number];
  // Mesh dimensions
  width: number;
  height: number;
  // World-space bounds — used to sample noise in the correct coordinate range
  worldMinX: number;
  worldMaxX: number;
  worldMinY: number;
  worldMaxY: number;
}

// Overlap the center wall by 1 world unit on the shared edge to prevent seam gaps.
// Panels sit at z=-0.08 so they render BEHIND the center wall in the overlap zone,
// avoiding Z-fighting artifacts (both walls use the same geology → identical Z).
const PANELS: PanelDef[] = [
  // Left panel: worldX from -30 to -9 (1u overlap), full height
  {
    position: [-19.5, 0, -0.08], width: 21, height: 52,
    worldMinX: -30, worldMaxX: -9, worldMinY: -26, worldMaxY: 26,
  },
  // Right panel: worldX from +9 to +30 (1u overlap), full height
  {
    position: [19.5, 0, -0.08], width: 21, height: 52,
    worldMinX: 9, worldMaxX: 30, worldMinY: -26, worldMaxY: 26,
  },
  // Top panel: worldY from +25 to +46 (1u overlap), full width + side overlap
  {
    position: [0, 35.5, -0.08], width: 62, height: 21,
    worldMinX: -30, worldMaxX: 30, worldMinY: 25, worldMaxY: 46,
  },
  // Bottom panel: worldY from -46 to -25 (1u overlap), full width + side overlap
  {
    position: [0, -35.5, -0.08], width: 62, height: 21,
    worldMinX: -30, worldMaxX: 30, worldMinY: -46, worldMaxY: -25,
  },
];

// ── Build stone textures in the center wall's coordinate space ────────────────
// Resolution density matches the center wall: ~51 base-px per world unit (X),
// ~9.8 base-px per world unit (Y).  We use the same density proportionally.
function buildStoneTextures(def: PanelDef) {
  const worldW = def.worldMaxX - def.worldMinX;
  const worldH = def.worldMaxY - def.worldMinY;

  // Match center wall density:  256 base px / 20 world units = 12.8 px/unit (X)
  //                              512 base px / 52 world units = 9.85 px/unit (Y)
  // Use ~10 px/unit for both axes (good quality without being slow)
  const density = 10;
  const baseW = Math.round(worldW * density);
  const baseH = Math.round(worldH * density);
  // Final texture = 4× base (bilinear upscale), capped at 1024 per axis
  const finalW = Math.min(baseW * 4, 1024);
  const finalH = Math.min(baseH * 4, 1024);

  const baseHeight = new Float32Array(baseW * baseH);
  const baseCrack  = new Float32Array(baseW * baseH);
  const baseStrataY = new Float32Array(baseW * baseH);

  // Sample noise in the center wall's coordinate space:
  //   noisePx = worldX / 10,  noisePy = worldY / 26
  for (let y = 0; y < baseH; y++) {
    const worldY = def.worldMinY + (y / (baseH - 1)) * worldH;
    const py = worldY / 26;   // same as CaveWall: normY = y / 26
    for (let x = 0; x < baseW; x++) {
      const worldX = def.worldMinX + (x / (baseW - 1)) * worldW;
      const px = worldX / 10; // same as CaveWall: normX = x / 10
      const geo = getGeology(px, py);
      const idx = y * baseW + x;
      baseHeight[idx]  = geo.h;
      baseCrack[idx]   = geo.crackDepth;
      baseStrataY[idx] = geo.strataY;
    }
  }

  // Bilinear upscale
  const heightMap  = new Float32Array(finalW * finalH);
  const crackMap   = new Float32Array(finalW * finalH);
  const strataYMap = new Float32Array(finalW * finalH);

  for (let y = 0; y < finalH; y++) {
    const srcY = (y / finalH) * (baseH - 1);
    const y0 = Math.floor(srcY); const y1 = Math.min(y0 + 1, baseH - 1);
    const dy = srcY - y0;
    for (let x = 0; x < finalW; x++) {
      const srcX = (x / finalW) * (baseW - 1);
      const x0 = Math.floor(srcX); const x1 = Math.min(x0 + 1, baseW - 1);
      const dx = srcX - x0;
      const idx00 = y0 * baseW + x0; const idx10 = y0 * baseW + x1;
      const idx01 = y1 * baseW + x0; const idx11 = y1 * baseW + x1;
      const fIdx = y * finalW + x;
      heightMap[fIdx]  = baseHeight[idx00]*(1-dx)*(1-dy)+baseHeight[idx10]*dx*(1-dy)+baseHeight[idx01]*(1-dx)*dy+baseHeight[idx11]*dx*dy;
      crackMap[fIdx]   = baseCrack[idx00]*(1-dx)*(1-dy)+baseCrack[idx10]*dx*(1-dy)+baseCrack[idx01]*(1-dx)*dy+baseCrack[idx11]*dx*dy;
      strataYMap[fIdx] = baseStrataY[idx00]*(1-dx)*(1-dy)+baseStrataY[idx10]*dx*(1-dy)+baseStrataY[idx01]*(1-dx)*dy+baseStrataY[idx11]*dx*dy;
    }
  }

  // Micro grain noise — same PRNG as CaveWall
  let randSeed = 12345;
  const fastRandom = () => { randSeed = (randSeed * 1664525 + 1013904223) | 0; return (randSeed >>> 0) / 4294967296; };

  for (let i = 0; i < finalW * finalH; i++) {
    heightMap[i] = Math.min(Math.max(heightMap[i] + (fastRandom() - 0.5) * 0.024, 0.0), 1.0);
  }

  // ── Render albedo / normal / roughness — identical pipeline to CaveWall ─────
  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = finalW; albedoCanvas.height = finalH;
  const albedoCtx = albedoCanvas.getContext("2d")!;
  const albedoImgData = albedoCtx.createImageData(finalW, finalH);

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = finalW; normalCanvas.height = finalH;
  const normalCtx = normalCanvas.getContext("2d")!;
  const normalImgData = normalCtx.createImageData(finalW, finalH);

  const roughnessCanvas = document.createElement("canvas");
  roughnessCanvas.width = finalW; roughnessCanvas.height = finalH;
  const roughnessCtx = roughnessCanvas.getContext("2d")!;
  const roughnessImgData = roughnessCtx.createImageData(finalW, finalH);

  const bumpStrength = 8.0;

  for (let y = 0; y < finalH; y++) {
    for (let x = 0; x < finalW; x++) {
      const fIdx = y * finalW + x;
      const idx = fIdx * 4;
      const xLeft = (x - 1 + finalW) % finalW; const xRight = (x + 1) % finalW;
      const yUp = (y - 1 + finalH) % finalH; const yDown = (y + 1) % finalH;
      const h = heightMap[fIdx];
      const dx2 = (heightMap[y * finalW + xRight] - heightMap[y * finalW + xLeft]) * bumpStrength;
      const dy2 = (heightMap[yDown * finalW + x] - heightMap[yUp * finalW + x]) * bumpStrength;
      const len = Math.sqrt(dx2*dx2 + dy2*dy2 + 1.0);
      normalImgData.data[idx]   = Math.floor((-dx2/len * 0.5 + 0.5) * 255);
      normalImgData.data[idx+1] = Math.floor((-dy2/len * 0.5 + 0.5) * 255);
      normalImgData.data[idx+2] = Math.floor((1.0/len * 0.5 + 0.5) * 255);
      normalImgData.data[idx+3] = 255;

      let roughnessVal = Math.min(Math.max(0.96 - h * 0.04 + (fastRandom() - 0.5) * 0.04, 0.92), 1.0);
      roughnessImgData.data[idx] = roughnessImgData.data[idx+1] = roughnessImgData.data[idx+2] = Math.floor(roughnessVal * 255);
      roughnessImgData.data[idx+3] = 255;

      // Albedo — same strata color banding as CaveWall
      const strataY = strataYMap[fIdx];
      const bandVal = Math.sin(strataY) * 0.5 + 0.5;
      let r = 0, g = 0, b = 0;
      if (bandVal < 0.12)      { const t = bandVal/0.12;       r=lerp(t,145,95);  g=lerp(t,105,80); b=lerp(t,75,70); }
      else if (bandVal < 0.28) { const t=(bandVal-0.12)/0.16;  r=lerp(t,95,145);  g=lerp(t,80,130); b=lerp(t,70,115); }
      else if (bandVal < 0.5)  { const t=(bandVal-0.28)/0.22;  r=lerp(t,145,165); g=lerp(t,130,125); b=lerp(t,115,85); }
      else if (bandVal < 0.8)  { const t=(bandVal-0.5)/0.3;    r=lerp(t,165,155); g=lerp(t,125,95);  b=lerp(t,85,70); }
      else                     { const t=(bandVal-0.8)/0.2;    r=lerp(t,155,145); g=lerp(t,95,105);  b=lerp(t,70,75); }
      // Staining noise — use world-space coords matching center wall's mapping:
      // CaveWall: perlin((x/1024)*3.5, (y/2048)*3.5)  where pixel maps to world
      // as worldX = x/1024*20-10 → x/1024 = (worldX+10)/20
      //    worldY = 26-y/2048*52 → y/2048 = (26-worldY)/52
      const worldX = def.worldMinX + (x / finalW) * worldW;
      const worldY = def.worldMinY + (y / finalH) * worldH;
      const staining = perlin(((worldX + 10) / 20) * 3.5, ((26 - worldY) / 52) * 3.5);
      r += staining*14; g += staining*8; b += staining*3;
      const sandSpeckle = (fastRandom()-0.5)*6.0;
      r += sandSpeckle; g += sandSpeckle; b += sandSpeckle;
      const crack = crackMap[fIdx];
      if (crack > 0) { const df = Math.max(0.06, 1.0-crack*3.2); r*=df; g*=df; b*=df; }
      const heightAO = 0.75 + h * 0.45;
      r *= heightAO; g *= heightAO; b *= heightAO;
      albedoImgData.data[idx]   = Math.floor(Math.min(Math.max(r,0),255));
      albedoImgData.data[idx+1] = Math.floor(Math.min(Math.max(g,0),255));
      albedoImgData.data[idx+2] = Math.floor(Math.min(Math.max(b,0),255));
      albedoImgData.data[idx+3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImgData, 0, 0);
  normalCtx.putImageData(normalImgData, 0, 0);
  roughnessCtx.putImageData(roughnessImgData, 0, 0);

  const makeTex = (c: HTMLCanvasElement) => {
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    return tex;
  };

  return {
    albedoMap: makeTex(albedoCanvas),
    normalMap: makeTex(normalCanvas),
    roughnessMap: makeTex(roughnessCanvas),
  };
}

// ── Single panel component ────────────────────────────────────────────────────
function StonePanel({ def }: { def: PanelDef }) {
  const [textures, setTextures] = useState<{
    albedoMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTextures(buildStoneTextures(def));
    }));
  }, [def]);

  const geometry = useMemo(() => {
    // Match center wall's vertex density: 64 segs / 20 units = 3.2 segs/unit
    const segsX = Math.max(16, Math.round(def.width * 3.2));
    const segsY = Math.max(16, Math.round(def.height * 3.7));
    const geom = new THREE.PlaneGeometry(def.width, def.height, segsX, segsY);
    const pos = geom.attributes.position;
    const halfW = def.width / 2;
    const halfH = def.height / 2;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i); // local x: -halfW to +halfW
      const ly = pos.getY(i); // local y: -halfH to +halfH
      // Convert local mesh coords to world coords, then to noise coords
      const worldX = def.position[0] + lx;
      const worldY = def.position[1] + ly;
      const px = worldX / 10;  // same mapping as CaveWall
      const py = worldY / 26;
      const geo = getGeology(px, py);
      pos.setZ(i, (geo.totalHeight - 0.5) * 0.7);
    }
    geom.computeVertexNormals();
    return geom;
  }, [def]);

  if (!textures) return null;

  return (
    <mesh position={def.position} geometry={geometry}>
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

export default function SurroundWalls() {
  return (
    <>
      {PANELS.map((def, i) => (
        <StonePanel key={i} def={def} />
      ))}
    </>
  );
}
