// P0: Framebuffer budget for the ACTUAL source-earned Clockwork->Void crossing.
// A cold WebGL frame can return after the autonomous climber has already
// jumped off Floor9's genuine arrival roof. The former grounded-only rule
// immediately reset pixel ratio to 1 during that live flight, forcing another
// large framebuffer allocation precisely while old/new world GPU programs
// were still uploading. Keep one bounded resolution ramp through the SAME
// genuine source run, regardless of subsequent authentic airborne movement.
// Nothing buffers/replays poses, changes authority, HUD, DOM, or other tiers.
// 25fps source-pinned F8->F9 footage exposed a >600ms first F9 WebGL
// return. Changing .72 -> .82 -> .90 -> .96 -> 1 every submitted frame
// reallocates the actual WebGL drawing buffer up to FIVE times at the same
// critical cold-upload boundary. One reduced-size epoch, ONE restoration;
// do not pretend renderer-return CPU time is GPU time or device FPS.
const COLD_SCALE = .72;
const MIN_RETURNED_FRAMES = 4;
const MAX_RETURNED_FRAMES = 8;
const CHEAP_WEBGL_RETURN_MS = 180;

function liveFrame(snapshot, options) {
  return snapshot?.lifecycle === 'running' && snapshot.floor === 9 &&
    typeof snapshot.runToken === 'string' && snapshot.runToken.length > 0 &&
    Number.isSafeInteger(snapshot.tick) &&
    snapshot.player?.health > 0 &&
    !options?.stale && options?.quality === 'low' &&
    options?.camera === 'follow' && options?.reducedMotion !== true;
}

function realRoofOrFlight(snapshot) {
  const p = snapshot.player;
  return (p.grounded === true &&
      (p.groundedPlatformId === 'f9:ground' ||
       p.groundedPlatformId === 'f8:cap')) ||
    (p.grounded === false && p.state === 'airborne' &&
     p.groundedPlatformId == null && Number.isFinite(p.vy));
}

function eligibleStart(snapshot, passage, retained, options) {
  if (!liveFrame(snapshot, options) || !realRoofOrFlight(snapshot)) return null;
  const ownedPassage = passage?.stage === 'handoff' &&
    passage.continuousGroundedHandoff === true &&
    passage.runToken === snapshot.runToken && passage.floor === 9 &&
    Number.isSafeInteger(passage.sourceTick) &&
    passage.sourceTick <= snapshot.tick &&
    snapshot.tick - passage.sourceTick <= 48;
  const ownedOriginal = retained?.floor === 9 &&
    retained.runToken === snapshot.runToken &&
    retained.oldCapId === 'f8:cap' &&
    Number.isSafeInteger(retained.crossingTick) &&
    Number.isSafeInteger(retained.sourceTick) &&
    retained.sourceTick >= retained.crossingTick &&
    retained.sourceTick - retained.crossingTick <= 12 &&
    retained.sourceTick <= snapshot.tick &&
    snapshot.tick - retained.crossingTick <= 48 &&
    Number.isSafeInteger(retained.submittedFrames) &&
    retained.submittedFrames >= 0 && retained.submittedFrames <= 8 &&
    Number.isFinite(retained.visibleSeconds) &&
    retained.visibleSeconds >= 0 && retained.visibleSeconds < 1.25 &&
    snapshot.lastGuardianCrossing?.sourceTick === retained.crossingTick &&
    snapshot.lastGuardianCrossing?.runToken === snapshot.runToken &&
    snapshot.lastGuardianCrossing?.fromFloor === 8 &&
    snapshot.lastGuardianCrossing?.toFloor === 9 &&
    snapshot.lastGuardianCrossing?.guardian?.kind === 'guardian' &&
    snapshot.lastGuardianCrossing.guardian.active === false &&
    snapshot.lastGuardianCrossing.guardian.health <= 0 &&
    snapshot.lastGuardianCrossing?.cap?.id === 'f8:cap';
  if (!ownedPassage && !ownedOriginal) return null;
  return ownedOriginal ? retained.crossingTick : passage.sourceTick;
}

export function createTowerColdFloorResolution() {
  let bound = null, submittedFrames = 0, fastReturnStreak = 0, finished = null;

  function reset() {
    bound = null;
    submittedFrames = 0;
    fastReturnStreak = 0;
  }

  // The optional retained witness is returned by the existing real Three
  // world owner; the original crossing is cross-checked against authority.
  // A passage that began grounded can continue while that SAME body truly
  // flies, even if its short presentation cue has subsequently expired.
  function observe(snapshot, passage, options = {}, retained = null) {
    if (!liveFrame(snapshot, options)) {
      reset();
      return 1;
    }
    if (bound) {
      if (snapshot.runToken !== bound.runToken ||
          snapshot.floor !== 9 || snapshot.tick < bound.lastTick ||
          snapshot.tick - bound.sourceTick > 96) {
        reset();
        return 1;
      }
      bound.lastTick = snapshot.tick;
      return COLD_SCALE;
    }
    const sourceTick = eligibleStart(snapshot, passage, retained, options);
    if (sourceTick === null ||
        (finished?.runToken === snapshot.runToken &&
         finished.sourceTick === sourceTick)) return 1;
    bound = {runToken:snapshot.runToken, floor:9,
      sourceTick, lastTick:snapshot.tick};
    submittedFrames = 0;
    fastReturnStreak = 0;
    return COLD_SCALE;
  }

  // A return is a real renderer.render() completion; a source tick or stalled
  // browser poll never advances this display-only quality budget. The first
  // four submitted frames remain a single .72 drawing-buffer allocation.
  // After that, two consecutive *measured* inexpensive returns may restore
  // original resolution, or eight returns force a bounded restoration.
  // Missing/invalid costs never qualify as fast. No source gameplay is read
  // forward, replayed, frozen or invented.
  function submitted(snapshot, rendererReturnMs = NaN) {
    if (!bound || submittedFrames >= MAX_RETURNED_FRAMES ||
        snapshot?.lifecycle !== 'running' ||
        snapshot.runToken !== bound.runToken ||
        snapshot.floor !== bound.floor ||
        !(snapshot.player?.health > 0) ||
        !Number.isSafeInteger(snapshot.tick) ||
        snapshot.tick < bound.lastTick ||
        snapshot.tick - bound.sourceTick > 96) return false;
    submittedFrames++;
    if (Number.isFinite(rendererReturnMs) && rendererReturnMs >= 0 &&
        rendererReturnMs <= CHEAP_WEBGL_RETURN_MS)
      fastReturnStreak = Math.min(2, fastReturnStreak + 1);
    else fastReturnStreak = 0;
    if (submittedFrames >= MAX_RETURNED_FRAMES ||
        (submittedFrames >= MIN_RETURNED_FRAMES && fastReturnStreak >= 2)) {
      finished = { runToken: bound.runToken, sourceTick: bound.sourceTick };
      // The next actual frame restores the existing resolution with exactly
      // one resize. Never start another epoch for this physical crossing.
      bound = null;
    }
    return true;
  }

  function diagnostics() {
    return {
      active: bound !== null,
      submittedFrames,
      scale: bound ? COLD_SCALE : 1,
      fastReturnStreak,
      maxFrames: MAX_RETURNED_FRAMES,
      maxScaleTransitionsPerEarnedEpisode: 2,
      sourceTick: bound?.sourceTick ?? null,
      lastTick: bound?.lastTick ?? null,
      finishedSourceTick: finished?.sourceTick ?? null,
      evidence: 'Source-owned WebGL-return framebuffer policy, NOT device FPS, GPU completion or native-pixel quality'
    };
  }
  return {observe, submitted, reset, diagnostics};
}
