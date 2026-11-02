// Presentation-only balance for an actually occupied, source-driven carriage.
// A new spectator, a duplicate snapshot, a stale connection, or an AI-selected
// future platform cannot move the climber's skeleton. The physical deck and
// authoritative player contact are the only inputs; no independent clock.
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function createObservedMovingDeckRide() {
  let run = null, floor = null, platformId = null, lastTick = -1, lastX = null;
  let drivenTick = -1, lean = 0, deltaX = 0;
  const reset = () => {
    run = null; floor = null; platformId = null; lastTick = -1;
    lastX = null; drivenTick = -1; lean = 0; deltaX = 0;
  };
  function sample(snapshot, footing, options = {}) {
    const player = snapshot?.player;
    if (options.stale || !snapshot || snapshot.lifecycle !== 'running' ||
      !player || player.health <= 0 || player.state !== 'standing' ||
      !footing?.grounded || typeof footing.platformId !== 'string' ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !Number.isSafeInteger(snapshot.floor) ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0) {
      reset(); return null;
    }
    const deck = snapshot.platforms?.find(item => item.id === footing.platformId);
    if (!deck || deck.kind !== 'moving' || !Number.isFinite(deck.x) ||
      !Number.isFinite(deck.width) || deck.width <= 0) {
      reset(); return null;
    }
    const freshContact = run !== snapshot.runToken || floor !== snapshot.floor ||
      platformId !== deck.id || snapshot.tick < lastTick;
    if (freshContact) {
      run = snapshot.runToken; floor = snapshot.floor; platformId = deck.id;
      lastTick = snapshot.tick; lastX = deck.x; drivenTick = -1;
      lean = 0; deltaX = 0;
    } else if (snapshot.tick > lastTick) {
      const steps = snapshot.tick - lastTick;
      const displacement = deck.x - lastX;
      // One authoritative fixed-step interval may be missed in software GL;
      // accept only bounded gaps and real signed deck displacements.
      if (steps <= 8 && Number.isFinite(displacement) &&
        Math.abs(displacement) >= 250 && Math.abs(displacement) <= 28000 * steps) {
        deltaX = displacement;
        lean = clamp(displacement / (7000 * steps), -1, 1);
        drivenTick = snapshot.tick;
      } else {
        // Decay in SOURCE ticks only, never according to renderer speed.
        lean *= Math.pow(.68, Math.min(12, steps));
        deltaX = 0;
        if (steps > 8) { lean = 0; drivenTick = -1; }
      }
      lastTick = snapshot.tick; lastX = deck.x;
    }
    const age = drivenTick < 0 ? Infinity : snapshot.tick - drivenTick;
    if (age > 6) lean = 0;
    return {
      platformId, sourceTick: snapshot.tick, lastDrivenTick: drivenTick,
      actualDisplacement: deltaX,
      // Reduced motion preserves the true resting pose; all 3D recoil/lean
      // becomes neutral without changing deck, actor or fixed-step authority.
      lean: options.reducedMotion ? 0 : clamp(lean, -1, 1),
      grounded: true,
      evidence: 'Consecutive real fixed-step displacement on the currently occupied moving deck',
    };
  }
  return { sample, reset };
}
