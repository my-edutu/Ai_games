// Public, cosmetic portcullis moment. A closed→open event may be staged
// only after both states were actually disclosed by the same authoritative run.
// Never examine undiscovered topology, private AI plans or required hidden keys.
export const GATE_RETRACTION_SECONDS = 0.85;
// Visual-only pacing: if software graphics stalls, don't skip the physical lift.
// Authoritative time, AI, countdown and route motion remain untouched.
export const MAX_GATE_VISUAL_FRAME_SECONDS = 0.035;
export function advanceGateVisualClock(previous, frameSeconds) {
  if (!Number.isFinite(previous) || previous < 0) return 0;
  if (!Number.isFinite(frameSeconds) || frameSeconds <= 0) return previous;
  return previous + Math.min(frameSeconds, MAX_GATE_VISUAL_FRAME_SECONDS);
}

const key = door => `${Math.min(door.a, door.b)}:${Math.max(door.a, door.b)}`;
const valid = door => Number.isSafeInteger(door?.a) && Number.isSafeInteger(door?.b)
  && door.a >= 0 && door.b >= 0 && door.a !== door.b && typeof door.open === 'boolean';

export function observedGateOpenings(before, after) {
  if (!before || !after || typeof before.runToken !== 'string'
    || before.runToken !== after.runToken || before.result || after.result
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick <= before.tick || !Array.isArray(before.doors)
    || !Array.isArray(after.doors)) return [];
  const previous = new Map(before.doors.filter(valid).map(door => [key(door), door.open]));
  return after.doors.filter(door => valid(door) && door.open === true
    && previous.get(key(door)) === false).map(door => ({ a: door.a, b: door.b }));
}

// The source-of-truth passage is OPEN immediately; a purely rendered grille
// retracts upwards for no more than 0.85 s. Reduced-motion hides it immediately.
// No per-frame mesh, material, timer, network request or authority mutation.
export function gateRetractionPose(elapsed, reducedMotion = false) {
  if (reducedMotion || !Number.isFinite(elapsed))
    return { visible: false, raise: 1.55, scaleY: 0.005 };
  const progress = Math.max(0, Math.min(1, elapsed / GATE_RETRACTION_SECONDS));
  // A massive counterweight starts under tension, then gathers speed.
  // Cubic ease-out made the grille visually disappear in the authentic
  // 0.595s WebGL mid-lift frame even though the model was still animating.
  // A deliberate accelerating rise retains full-height readable bars at
  // the actual opening moment, then clears the authoritative open path.
  const eased = progress * progress;
  return {
    visible: progress < 1,
    raise: 1.55 * eased,
    scaleY: Math.max(.005, 1 - eased),
  };
}
