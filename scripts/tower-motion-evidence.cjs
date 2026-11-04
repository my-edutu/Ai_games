'use strict';
// Scope: capture integrity only. A submitted WebGL call is NOT a presented
// GPU frame, and the CI software renderer is NOT an intended device.
const PERFORMANCE_UNVERIFIED = 'UNVERIFIED: submitted intervals are not presented GPU frames or intended-device FPS';

function assessTowerMotion(samples, options = {}) {
  const minDurationMs = Number.isFinite(options.minDurationMs) ? Math.max(10000, options.minDurationMs) : 10000;
  const requireOutcomeRestart = options.requireOutcomeRestart === true;
  const blockers = [];
  if (!Array.isArray(samples) || samples.length < 2) {
    return { scopedPass: false, blockers: ['insufficient-observations'], performanceGate: PERFORMANCE_UNVERIFIED };
  }
  // Simulation runs legitimately reset tick to zero after a death/intermission.
  // A decreasing tick is valid ONLY if the immutable public run token changes;
  // the skipped interval is not proof the restart animation was visually shown.
  let tickAdvance = 0, runTransitions = 0;
  const valid = samples.every((s, i) => {
    if (!s || !Number.isFinite(s.atMs) || !Number.isFinite(s.tick)
      || !Number.isFinite(s.frames) || typeof s.checksum !== 'string'
      || typeof s.runToken !== 'string' || !s.runToken.length) return false;
    if (!i) return true;
    const prior = samples[i - 1];
    if (s.atMs <= prior.atMs || s.frames < prior.frames) return false;
    if (s.runToken !== prior.runToken) { runTransitions++; return true; }
    if (s.tick < prior.tick) return false;
    tickAdvance += s.tick - prior.tick;
    return true;
  });
  if (!valid) blockers.push('invalid-observation');
  const first = samples[0], last = samples[samples.length - 1];
  const wallMs = last.atMs - first.atMs;
  // tickDelta remains a compatibility field, but now describes TOTAL valid
  // within-run advance, never a misleading final-minus-first across restarts.
  const tickDelta = tickAdvance;
  const renderedDelta = last.frames - first.frames;
  const checksums = new Set(samples.map(s => s.checksum));
  const canvasHashes = new Set(samples.map(s => s.canvasHash).filter(Boolean));
  if (!(wallMs >= minDurationMs)) blockers.push('capture-too-short');
  // A frozen run's genuine result phase can be shorter than one rendered
  // 25fps frame or a 1s diagnostic sample. The actual result and score persist
  // in the *source-backed intermission card* and are visible in the native
  // video. Require two DOM-visible real result observations >=500ms apart,
  // including an intermission, followed by a new AUTHENTIC running token.
  // Source trace alone never satisfies this rule, nor does run-token rollover.
  // The 1-second diagnostic sampler can genuinely miss a short painted
  // intermission. An OPTIONAL passive browser witness may observe the same
  // unmodified source-backed DOM at 200ms cadence without screenshots, speed
  // changes or source edits. Never accept a synthetic run-token change, card
  // without authoritative sourceResult, or a witness beyond the recorded film.
  const outcomeWitness = requireOutcomeRestart && Array.isArray(options.outcomeWitness)
    ? options.outcomeWitness.filter(item =>
      item && Number.isFinite(item.atMs) &&
      item.atMs >= first.atMs && item.atMs <= last.atMs &&
      typeof item.runToken === 'string' && item.runToken.length > 0 &&
      samples.some(source => source.runToken === item.runToken))
    : [];
  const visibleOutcomeSamples = requireOutcomeRestart ?
    [...samples, ...outcomeWitness]
      .filter(sample => ['result', 'intermission'].includes(sample.scene) &&
        ['game', 'technical', 'operator'].includes(sample.sourceResult?.kind) &&
        sample.observedResultCard?.visible === true &&
        sample.observedResultCard.runToken === sample.runToken &&
        typeof sample.observedResultCard.title === 'string' &&
        sample.observedResultCard.title.length > 0 &&
        typeof sample.observedResultCard.height === 'string' &&
        sample.observedResultCard.height.length > 0)
      .sort((a,b) => a.atMs - b.atMs) : [];
  const observedOutcomeRestart = visibleOutcomeSamples.some(firstVisible =>
    visibleOutcomeSamples.some(secondVisible =>
      secondVisible.atMs > firstVisible.atMs &&
      secondVisible.runToken === firstVisible.runToken &&
      secondVisible.sourceResult.kind === firstVisible.sourceResult.kind &&
      secondVisible.sourceResult.reason === firstVisible.sourceResult.reason &&
      secondVisible.atMs - firstVisible.atMs >= 500 &&
      (firstVisible.scene === 'intermission' || secondVisible.scene === 'intermission') &&
      samples.some(next => next.atMs > secondVisible.atMs &&
        next.runToken !== firstVisible.runToken && next.scene === 'running')));
  if (requireOutcomeRestart && !observedOutcomeRestart) {
    blockers.push('complete-terminal-intermission-restart-not-observed');
  }
  if (!(tickDelta >= 40) || checksums.size < 2) blockers.push('authoritative-ticks-not-advancing');
  if (!(renderedDelta >= 10)) blockers.push('renderer-submissions-not-advancing');
  if (canvasHashes.size < 2) blockers.push('canvas-pixels-not-changing');
  if (!Number.isFinite(last.frameMs?.samples) || last.frameMs.samples < 8) blockers.push('renderer-intervals-not-measured');
  if (samples.some(s => s.contextLost || s.renderErrors !== 0)) blockers.push('renderer-error-or-context-loss');
  return { scopedPass: blockers.length === 0, blockers, wallMs, minDurationMs, tickDelta, tickAdvance, runTransitions,
    transitionEvidence: 'OPEN: sampled restart is not proof of rendered death/intermission/restart',
    genuineDomResultSamples: visibleOutcomeSamples.length,
    passiveOutcomeWitnessSamples: outcomeWitness.length,
    observedOutcomeRestart,
    outcomeVideoGate: 'OPEN: DOM visibility and valid source phases do not replace inspection of the full-motion original WebM',
    renderedDelta,
    uniqueChecksums: checksums.size, uniqueCanvasFrames: canvasHashes.size,
    submittedFrameIntervals: last.frameMs ?? null,
    performanceGate: PERFORMANCE_UNVERIFIED };
}
module.exports = { assessTowerMotion };
