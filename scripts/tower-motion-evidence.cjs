'use strict';
// Scope: capture integrity only. A submitted WebGL call is NOT a presented
// GPU frame, and the CI software renderer is NOT an intended device.
const PERFORMANCE_UNVERIFIED = 'UNVERIFIED: submitted intervals are not presented GPU frames or intended-device FPS';

function assessTowerMotion(samples) {
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
  if (!(wallMs >= 10000)) blockers.push('capture-too-short');
  if (!(tickDelta >= 40) || checksums.size < 2) blockers.push('authoritative-ticks-not-advancing');
  if (!(renderedDelta >= 10)) blockers.push('renderer-submissions-not-advancing');
  if (canvasHashes.size < 2) blockers.push('canvas-pixels-not-changing');
  if (!Number.isFinite(last.frameMs?.samples) || last.frameMs.samples < 8) blockers.push('renderer-intervals-not-measured');
  if (samples.some(s => s.contextLost || s.renderErrors !== 0)) blockers.push('renderer-error-or-context-loss');
  return { scopedPass: blockers.length === 0, blockers, wallMs, tickDelta, tickAdvance, runTransitions,
    transitionEvidence: 'OPEN: sampled restart is not proof of rendered death/intermission/restart', renderedDelta,
    uniqueChecksums: checksums.size, uniqueCanvasFrames: canvasHashes.size,
    submittedFrameIntervals: last.frameMs ?? null,
    performanceGate: PERFORMANCE_UNVERIFIED };
}
module.exports = { assessTowerMotion };
