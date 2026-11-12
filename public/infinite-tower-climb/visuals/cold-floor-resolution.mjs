// A first honest Floor 9 scene can be extremely expensive to submit on
// software/low-end WebGL (source-bound 960x600/390x844 real capture).
// Reserve a small THREE FRAMEBUFFER budget only for a genuine, grounded,
// same-run earned guardian gateway. Never downscale DOM/HUD text, change
// physics, fabricate a gateway, or treat browser receipt as a drawn frame.
//
// This does NOT claim GPU-present, native-video synchronization or device FPS.
const INITIAL_SCALES = Object.freeze([0.78, 0.86, 0.93]);

function eligible(snapshot, passage, options) {
  return snapshot?.lifecycle === 'running' &&
    snapshot.floor === 9 &&
    typeof snapshot.runToken === 'string' && snapshot.runToken.length > 0 &&
    Number.isSafeInteger(snapshot.tick) &&
    snapshot.player?.health > 0 &&
    snapshot.player?.grounded === true &&
    snapshot.player?.groundedPlatformId === 'f9:ground' &&
    passage?.stage === 'handoff' &&
    passage.continuousGroundedHandoff === true &&
    passage.runToken === snapshot.runToken &&
    passage.floor === snapshot.floor &&
    Number.isSafeInteger(passage.sourceTick) &&
    snapshot.tick >= passage.sourceTick &&
    !options?.stale && options?.quality === 'low' &&
    options?.camera === 'follow' &&
    options?.reducedMotion !== true;
}

export function createTowerColdFloorResolution() {
  let bound = null;
  let submittedFrames = 0;

  function reset() {
    bound = null;
    submittedFrames = 0;
  }

  function observe(snapshot, passage, options = {}) {
    if (!eligible(snapshot, passage, options)) {
      reset();
      return 1;
    }
    // No floating reference to a previous expedition, floor or guardian.
    if (!bound ||
        bound.runToken !== snapshot.runToken ||
        bound.floor !== snapshot.floor ||
        bound.sourceTick !== passage.sourceTick) {
      bound = {
        runToken: snapshot.runToken,
        floor: snapshot.floor,
        sourceTick: passage.sourceTick,
      };
      submittedFrames = 0;
    }
    return INITIAL_SCALES[submittedFrames] ?? 1;
  }

  function submitted(snapshot) {
    if (!bound || submittedFrames >= INITIAL_SCALES.length ||
        snapshot?.lifecycle !== 'running' ||
        snapshot.runToken !== bound.runToken ||
        snapshot.floor !== bound.floor ||
        !Number.isSafeInteger(snapshot.tick) ||
        snapshot.tick < bound.sourceTick ||
        snapshot.player?.health <= 0) return false;
    submittedFrames++;
    return true;
  }

  function diagnostics() {
    return {
      active: bound !== null && submittedFrames < INITIAL_SCALES.length,
      submittedFrames,
      scale: INITIAL_SCALES[submittedFrames] ?? 1,
      sourceTick: bound?.sourceTick ?? null,
    };
  }

  return { observe, submitted, reset, diagnostics };
}
