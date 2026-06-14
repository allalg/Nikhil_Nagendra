// Module-level shared ref — FreeLookController writes here every frame,
// AtmosphericOverlay & CaveNav read here via rAF loops.
// Same pattern as torchState.ts — avoids prop-drilling & per-frame setState.
export const scrollProgressRef = { current: 0 };
