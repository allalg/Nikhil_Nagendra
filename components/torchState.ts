import * as THREE from "three";

// Module-level shared ref — Torch.tsx writes here every frame,
// WallSconces.tsx reads here every frame to check proximity.
// Avoids prop-drilling through Canvas / R3F context.
export const torchPosRef = { current: new THREE.Vector3(0, 22, 2.5) };
