'use strict';
// Read-only 20 Hz causal witness. An episode, not a wall-clock span or a
// collection of separate runs, must contain each transition. This is NOT
// proof of visible WebM pixels, an independent playtest, or a quality score.
function createTowerCausalWitness(limit = 16) {
  const episodes = [];
  const byId = new Map();
  const capFor = state => state.chunks?.find(c => c.floor === 8)?.platforms
    ?.find(p => p.id === 'f8:cap');
  const hasDeadGuardian = state => state.enemies?.some(e =>
    e.floor === 8 && e.kind === 'guardian' && e.active === false && e.health <= 0);
  const hasEvent = (events, type, predicate = () => true) =>
    events.some(e => e.type === type && predicate(e.data || {}));
  // A spawn plus an idle/airborne next tick is not floor-nine traversal.
  // Count a later physics-earned landing on an onward floor-nine deck, or
  // genuine progression beyond it, without inventing motion from a timer.
  const floorNineRoute = state => state.lifecycle === 'running' &&
    (state.floor > 9 || (state.floor === 9 &&
      state.player?.grounded === true &&
      /^f9:(p[1-6]|cap)$/.test(state.player.groundedPlatformId || '')));
  // The physical guardian encounter also includes a real floor-eight
  // crusher. A near-body active jaw or source-published 12-tick warning
  // only counts when the SAME grounded climber survives the next source
  // step. Distant timers, unrelated hazards and scripted frames do not.
  const sourceCrusherPressure = state => {
    if (state.floor !== 8 || state.lifecycle !== 'running' ||
        !state.player?.grounded ||
        state.player.groundedPlatformId !== 'f8:cap') return null;
    const shutter = state.chunks?.find(c => c.floor === 8)?.hazards
      ?.find(h => h.id === 'f8:guardian-shutter' && h.kind === 'crusher');
    const p = state.player;
    if (!shutter || ![state.tick, shutter.activeFromTick,
        shutter.activeEvery, shutter.activeFor, shutter.x, shutter.y,
        shutter.width, shutter.height, p.position?.x, p.position?.y,
        p.halfWidth, p.halfHeight].every(Number.isSafeInteger) ||
        shutter.activeEvery <= 0 || shutter.activeFor <= 0 ||
        shutter.activeFor >= shutter.activeEvery ||
        shutter.activeFromTick < 0 || shutter.width <= 0 ||
        shutter.height <= 0 || p.halfWidth <= 0 || p.halfHeight <= 0 ||
        p.health <= 0) return null;
    const phase = state.tick < shutter.activeFromTick ? -1 :
      (state.tick - shutter.activeFromTick) % shutter.activeEvery;
    const active = phase >= 0 && phase < shutter.activeFor;
    const countdown = phase < 0 ? shutter.activeFromTick - state.tick :
      active ? 0 : shutter.activeEvery - phase;
    if (!active && (countdown < 1 || countdown > 12)) return null;
    const feet = p.position.y - p.halfHeight;
    const head = p.position.y + p.halfHeight;
    // Twenty thousand source units is an honest close-contact warning
    // margin, not a claim that the shutter already hit the body.
    const buffer = 20000;
    if (p.position.x + p.halfWidth + buffer < shutter.x ||
        p.position.x - p.halfWidth - buffer > shutter.x + shutter.width ||
        head <= shutter.y || feet >= shutter.y + shutter.height) return null;
    return { hazardId: shutter.id, warningTicks: countdown,
      active, centerDistance: Math.abs(p.position.x -
        (shutter.x + Math.floor(shutter.width / 2))) };
  };
  const record = (episode, kind, state, extra = {}) => {
    if (episode[kind]) return;
    episode[kind] = { tick: state.tick, floor: state.floor, ...extra };
  };
  function observe(before, after, events = []) {
    if (!before || !after || typeof before.runId !== 'string' || !before.runId ||
      typeof after.runId !== 'string' || !after.runId || !Array.isArray(events)) return;
    let ep = byId.get(before.runId);
    if (!ep && episodes.length < limit) {
      ep = { episode: episodes.length, runId: before.runId, firstFloor: before.floor };
      episodes.push(ep); byId.set(before.runId, ep);
    }
    if (!ep) return;
    const sameRun = before.runId === after.runId;
    const exposed = sameRun && ep.liveGuardian && before.floor === 8 &&
      after.floor === 8 && after.lifecycle === 'running' &&
      after.player?.health > 0 ? sourceCrusherPressure(before) : null;
    if (exposed) record(ep, 'crusherPressureSurvived', after, exposed);
    if (before.lifecycle === 'running' && before.floor === 8 &&
        before.enemies?.some(e => e.kind === 'guardian' && e.floor === 8 && e.active))
      record(ep, 'liveGuardian', before);
    if (sameRun && hasEvent(events, 'enemy-defeated', d => d.kind === 'guardian' &&
      typeof d.id === 'string' && d.id.startsWith('f8:')) && ep.liveGuardian)
      record(ep, 'guardianDefeated', after);
    const cap = capFor(after);
    if (ep.guardianDefeated && sameRun && before.floor === 8 &&
        after.floor === 8 && after.lifecycle === 'running' &&
        hasDeadGuardian(after) && cap && after.player?.grounded === true &&
        after.player.groundedPlatformId === cap.id &&
        Number.isFinite(after.player.position?.x)) {
      record(ep, 'groundedEarnedWalk', after, { x: after.player.position.x, capId: cap.id });
      if (ep.groundedEarnedWalk && after.player.position.x > ep.groundedEarnedWalk.x)
        record(ep, 'advancedOnCap', after, { x: after.player.position.x });
    }
    const priorCap = capFor(before);
    const earned=events.find(e=>e.type==='floor-complete'&&
      e.data?.floor===9)?.data?.guardianPassage;
    const crossed=earned&&priorCap&&earned.fromFloor===8&&
      earned.capId===priorCap.id&&earned.groundedPlatformId===priorCap.id&&
      earned.guardianId==='f8:guardian'&&
      [earned.exitX,earned.clearanceX,earned.crossingX].every(Number.isSafeInteger)&&
      earned.clearanceX>earned.exitX&&earned.crossingX>=earned.clearanceX;
    if (sameRun && ep.guardianDefeated && ep.groundedEarnedWalk && crossed &&
        before.floor === 8 && after.floor === 9 &&
        before.player?.grounded === true && priorCap &&
        before.player.groundedPlatformId === priorCap.id &&
        hasDeadGuardian(before) &&
        hasEvent(events, 'floor-complete', d => d.floor === 9))
      record(ep, 'earnedFloorNine', after, {
        priorGroundedX: before.player.position.x, capId: priorCap.id,
        observedActualCrossingX: earned.crossingX,
        clearanceX: earned.clearanceX, guardianId: earned.guardianId,
        physicalFullBodyClearance: 'AUTHORITATIVE tick event, not proof of a painted video frame',
      });
    if (sameRun && ep.earnedFloorNine && before.floor >= 9 &&
        after.tick > ep.earnedFloorNine.tick && floorNineRoute(after))
      record(ep, 'floorNineContinues', after);
    if (sameRun && ep.floorNineContinues &&
        ['result', 'intermission'].includes(after.lifecycle) && after.result &&
        after.result.kind === 'game' &&
        ['fall', 'hazard', 'health-depleted', 'timer-expired', 'stagnation']
          .includes(after.result.reason))
      record(ep, 'sourceResult', after, { reason: after.result.reason, kind: after.result.kind });
    if (sameRun && ep.sourceResult && after.lifecycle === 'intermission')
      record(ep, 'intermission', after);
    if (!sameRun && ep.intermission && before.lifecycle === 'intermission' &&
        hasEvent(events, 'restart') && after.lifecycle === 'running')
      record(ep, 'restarted', after, { nextRunId: after.runId });
  }
  function summary() {
    const milestones = ['liveGuardian', 'crusherPressureSurvived',
      'guardianDefeated', 'groundedEarnedWalk',
      'advancedOnCap', 'earnedFloorNine', 'floorNineContinues', 'sourceResult',
      'intermission', 'restarted'];
    const rows = episodes.map(ep => ({ episode: ep.episode, runId: ep.runId,
      firstFloor: ep.firstFloor, markers: Object.fromEntries(
        milestones.filter(k => ep[k]).map(k => [k, ep[k]])),
      completeSourceChain: milestones.every(k => ep[k]),
      firstMissing: milestones.find(k => !ep[k]) || null }));
    return { kind: 'unmodified-fixed-step-source-episode-chain',
      qualityVerdict: 'NOT EVALUATED', sampleBound: limit,
      fullSourceChainObserved: rows.some(r => r.completeSourceChain),
      episodes: rows,
      caveat: 'A complete same-run episode requires a living guardian, close actual-source crusher warning/activation survived, earned grounded passage, a later landing beyond the floor-nine spawn, a real game outcome and restart. Technical/operator interruptions and mere idle tick advance cannot qualify. Source is NOT a rendered crossing, film, device FPS or blind review.' };
  }
  return { observe, summary };
}
module.exports = { createTowerCausalWitness };
