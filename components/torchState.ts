import * as THREE from "three";

// Module-level shared ref — Torch.tsx writes here every frame,
// WallSconces.tsx reads here every frame to check proximity.
// Avoids prop-drilling through Canvas / R3F context.
export const torchPosRef = { current: new THREE.Vector3(0, 22, 2.5) };

// Screen-space pixel position of the torch (written by Torch.tsx, read by CursorTorch.tsx).
// This ensures the HTML cursor overlay and the 3D light are always in perfect sync.
export const torchScreenRef = { current: { x: 0, y: 0 } };
