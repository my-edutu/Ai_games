// Public, cosmetic portcullis moment. A closed→open event may be staged
// only after both states were actually disclosed by the same authoritative run.
// Never examine undiscovered topology, private AI plans or required hidden keys.
export const GATE_RETRACTION_SECONDS = 0.85;
// The genuine witnessed key burst and its compact HUD share one visual lifespan.
// A readable release + linger: physical shards spread promptly, remain
// perceivable long enough for the real autonomous action to register, then fade.
export const PUBLIC_PICKUP_RELEASE_SECONDS = 0.82;
export const PUBLIC_PICKUP_VISUAL_SECONDS = 2.4;
// Visual-only pacing: if software graphics stalls, don't skip the physical lift.
// Authoritative time, AI, countdown and route motion remain untouched.
export const MAX_GATE_VISUAL_FRAME_SECONDS = 0.035;
// A disclosed pressure mechanism is presentation, never game authority.
// A public near-contact first displays its full relay warning; its ivory
// shutters and rising carriage then receive distinct visible time windows.
// Pure scalar maths: no per-frame objects, hidden map, RNG or game clock.
export const PUBLIC_PRESSURE_VISUAL_SECONDS = 1.25;
// Real autonomous steps can move Pip past a published pressure cell in 360ms.
// Keep three ordered physical acts, but finish while that encounter is visible.
// The cadence is from the public presentation, never hidden AI or topology.
export function publicPressureSequenceSeconds(stepDurationMs) {
  const ms = Number.isFinite(stepDurationMs) && stepDurationMs > 0 ? stepDurationMs : 360;
  return Math.min(PUBLIC_PRESSURE_VISUAL_SECONDS, Math.max(.40, ms / 1000 * 1.2));
}
export function observedPressureProgress(target, elapsedSeconds, visualSeconds = PUBLIC_PRESSURE_VISUAL_SECONDS) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const seconds = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0;
  const duration = Number.isFinite(visualSeconds) && visualSeconds > 0
    ? visualSeconds : PUBLIC_PRESSURE_VISUAL_SECONDS;
  return Math.min(1, target, .20 + seconds / duration);
}
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


// The physical key-theatre finishes its REAL witnessed opening before its
// superstructure sinks into the already-known floor vault. No new route,
// treasure, threat, hidden map query or allocation is implied.
export const PUBLIC_SPENT_KEY_THEATRE_DROP = 2.6;
export function publicSpentKeyTheatreDrop(collected, elapsed, reducedMotion = false) {
  if (!collected) return 0;
  if (reducedMotion || elapsed === Infinity) return PUBLIC_SPENT_KEY_THEATRE_DROP;
  if (!Number.isFinite(elapsed) || elapsed <= 1.36) return 0;
  const p = Math.max(0, Math.min(1, (elapsed - 1.36) / .84));
  return PUBLIC_SPENT_KEY_THEATRE_DROP * p * p * (3 - 2 * p);
}
