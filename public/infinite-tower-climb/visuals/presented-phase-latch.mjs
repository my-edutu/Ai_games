// The original fixed-step host is authoritative, but HTTP acceptance is not
// a submitted 3D frame. Align ordinary HUD phase/floor with the EXACT source
// snapshot rendered in Three.js; do not claim GPU completion or native pixels.
// Genuine terminal/recovery/upgrade UI remains accessible without WebGL.
export function createPresentedPhaseLatch() {
  let waiting = null, visible = null;
  let supersededUnsubmitted = 0, rendererCommitted = 0, sourceOnly = 0;
  return {
    accept(frame) {
      if (!frame?.snapshot || typeof frame.snapshot.runToken !== 'string' ||
          !Number.isSafeInteger(frame.snapshot.tick) ||
          !Number.isSafeInteger(frame.snapshot.floor)) return false;
      if (waiting && waiting !== frame) supersededUnsubmitted++;
      waiting = frame;
      return true;
    },
    submitted(exactSnapshot) {
      if (!waiting || waiting.snapshot !== exactSnapshot) return null;
      visible = waiting; waiting = null; rendererCommitted++;
      return visible;
    },
    immediate(frame) {
      if (!frame?.snapshot) return null;
      visible = frame; waiting = null; sourceOnly++;
      return frame;
    },
    visible() { return visible; },
    pending() { return waiting !== null; },
    diagnostics() { return { rendererCommitted, sourceOnly,
      supersededUnsubmitted, pending: waiting !== null,
      caveat: 'Three.js renderer-return is not native video or GPU-present proof' }; },
    clear() { waiting = null; visible = null; },
  };
}
