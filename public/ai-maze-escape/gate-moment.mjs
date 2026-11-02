// Public, cosmetic portcullis moment. A closed→open event may be staged
// only after both states were actually disclosed by the same authoritative run.
// Never examine undiscovered topology, private AI plans or required hidden keys.
export const GATE_RETRACTION_SECONDS = 0.85;
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
  const eased = 1 - (1 - progress) ** 3;
  return {
    visible: progress < 1,
    raise: 1.55 * eased,
    scaleY: Math.max(.005, 1 - eased),
  };
}
