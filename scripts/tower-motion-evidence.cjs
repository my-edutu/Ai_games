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
  const visibleOutcomeSamples = requireOutcomeRestart ? samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => ['result', 'intermission'].includes(sample.scene) &&
      ['game', 'technical', 'operator'].includes(sample.sourceResult?.kind) &&
      sample.observedResultCard?.visible === true &&
      sample.observedResultCard.runToken === sample.runToken &&
      typeof sample.observedResultCard.title === 'string' &&
      sample.observedResultCard.title.length > 0 &&
      typeof sample.observedResultCard.height === 'string' &&
      sample.observedResultCard.height.length > 0) : [];
  const observedOutcomeRestart = visibleOutcomeSamples.some(first =>
    visibleOutcomeSamples.some(second =>
      second.index > first.index && second.sample.runToken === first.sample.runToken &&
      second.sample.sourceResult.kind === first.sample.sourceResult.kind &&
      second.sample.sourceResult.reason === first.sample.sourceResult.reason &&
      second.sample.atMs - first.sample.atMs >= 500 &&
      (first.sample.scene === 'intermission' || second.sample.scene === 'intermission') &&
      samples.some((next, index) => index > second.index &&
        next.runToken !== first.sample.runToken && next.scene === 'running')));
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
    observedOutcomeRestart,
    outcomeVideoGate: 'OPEN: DOM visibility and valid source phases do not replace inspection of the full-motion original WebM',
    renderedDelta,
    uniqueChecksums: checksums.size, uniqueCanvasFrames: canvasHashes.size,
    submittedFrameIntervals: last.frameMs ?? null,
    performanceGate: PERFORMANCE_UNVERIFIED };
}
module.exports = { assessTowerMotion };
