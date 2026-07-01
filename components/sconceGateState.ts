// Shared gate state — WallSconces writes here, Preloader reads.
// When the user lights ANY sconce on the loading screen, this gate opens
// and all other sconces ignite simultaneously.

type GateListener = () => void;

let _isOpen = false;
const _listeners: GateListener[] = [];

export const sconceGateState = {
  get isOpen() {
    return _isOpen;
  },

  /** Called by WallSconces when the first sconce is lit */
  open() {
    if (_isOpen) return;
    _isOpen = true;
    _listeners.forEach((fn) => fn());
  },

  /** Subscribe to gate-open event. Returns unsubscribe function. */
  onOpen(fn: GateListener): () => void {
    _listeners.push(fn);
    // If already open, fire immediately
    if (_isOpen) fn();
    return () => {
      const idx = _listeners.indexOf(fn);
      if (idx >= 0) _listeners.splice(idx, 1);
    };
  },
};
