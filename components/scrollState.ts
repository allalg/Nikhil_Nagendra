// Module-level shared ref — FreeLookController writes here every frame,
// AtmosphericOverlay & CaveNav read here via rAF loops.
// Same pattern as torchState.ts — avoids prop-drilling & per-frame setState.
export const scrollProgressRef = { current: 0 };

// Camera world-space position — written by FreeLookController every frame.
// ProjectPreview reads this to position hover zones accurately.
export const cameraPosRef = { current: { x: 0, y: 22 } };
