'use strict';
// Scope: capture integrity only. A submitted WebGL call is NOT a presented
// GPU frame, and the CI software renderer is NOT an intended device.
const PERFORMANCE_UNVERIFIED = 'UNVERIFIED: submitted intervals are not presented GPU frames or intended-device FPS';

function assessTowerMotion(samples) {
  const blockers = [];
  if (!Array.isArray(samples) || samples.length < 2) {
    return { scopedPass: false, blockers: ['insufficient-observations'], performanceGate: PERFORMANCE_UNVERIFIED };
  }
  const valid = samples.every((s, i) => s && Number.isFinite(s.atMs) && Number.isFinite(s.tick)
    && Number.isFinite(s.frames) && typeof s.checksum === 'string'
    && (!i || (s.atMs > samples[i - 1].atMs && s.tick >= samples[i - 1].tick && s.frames >= samples[i - 1].frames)));
  if (!valid) blockers.push('invalid-observation');
  const first = samples[0], last = samples[samples.length - 1];
  const wallMs = last.atMs - first.atMs;
  const tickDelta = last.tick - first.tick;
  const renderedDelta = last.frames - first.frames;
  const checksums = new Set(samples.map(s => s.checksum));
  const canvasHashes = new Set(samples.map(s => s.canvasHash).filter(Boolean));
  if (!(wallMs >= 10000)) blockers.push('capture-too-short');
  if (!(tickDelta >= 40) || checksums.size < 2) blockers.push('authoritative-ticks-not-advancing');
  if (!(renderedDelta >= 10)) blockers.push('renderer-submissions-not-advancing');
  if (canvasHashes.size < 2) blockers.push('canvas-pixels-not-changing');
  if (!Number.isFinite(last.frameMs?.samples) || last.frameMs.samples < 8) blockers.push('renderer-intervals-not-measured');
  if (samples.some(s => s.contextLost || s.renderErrors !== 0)) blockers.push('renderer-error-or-context-loss');
  return { scopedPass: blockers.length === 0, blockers, wallMs, tickDelta, renderedDelta,
    uniqueChecksums: checksums.size, uniqueCanvasFrames: canvasHashes.size,
    submittedFrameIntervals: last.frameMs ?? null,
    performanceGate: PERFORMANCE_UNVERIFIED };
}
module.exports = { assessTowerMotion };
