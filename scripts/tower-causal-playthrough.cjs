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
  const floorNine = state => state.floor >= 9 && state.lifecycle === 'running';
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
    if (sameRun && ep.guardianDefeated && ep.groundedEarnedWalk &&
        before.floor === 8 && after.floor === 9 &&
        before.player?.grounded === true && priorCap &&
        before.player.groundedPlatformId === priorCap.id &&
        hasDeadGuardian(before) &&
        hasEvent(events, 'floor-complete', d => d.floor === 9))
      record(ep, 'earnedFloorNine', after, {
        priorGroundedX: before.player.position.x, capId: priorCap.id,
        physicalFullBodyClearance: 'AUTHORITY RULE ONLY: requires source rule and replay inspection',
      });
    if (sameRun && ep.earnedFloorNine && before.floor >= 9 &&
        after.tick > ep.earnedFloorNine.tick && floorNine(after))
      record(ep, 'floorNineContinues', after);
    if (sameRun && ep.floorNineContinues &&
        ['result', 'intermission'].includes(after.lifecycle) && after.result &&
        ['game', 'technical', 'operator'].includes(after.result.kind))
      record(ep, 'sourceResult', after, { reason: after.result.reason, kind: after.result.kind });
    if (sameRun && ep.sourceResult && after.lifecycle === 'intermission')
      record(ep, 'intermission', after);
    if (!sameRun && ep.intermission && before.lifecycle === 'intermission' &&
        hasEvent(events, 'restart') && after.lifecycle === 'running')
      record(ep, 'restarted', after, { nextRunId: after.runId });
  }
  function summary() {
    const milestones = ['liveGuardian', 'guardianDefeated', 'groundedEarnedWalk',
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
      caveat: 'A matching same-run 20 Hz source chain is NOT a rendered crossing, continuous film, frame-time measurement, independent blind review or final quality verdict.' };
  }
  return { observe, summary };
}
module.exports = { createTowerCausalWitness };
