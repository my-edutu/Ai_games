'use strict';

// P0: classify real, returned WebGL doorway evidence without inventing pixels.
// The native video is never changed or inferred from these projections.
function finiteProjection(p) {
  return Array.isArray(p) && p.length === 3 &&
    p.every(Number.isFinite) && p[2] >= -1 && p[2] <= 1;
}
function safelyFramed(p) {
  return finiteProjection(p) && Math.abs(p[0]) <= .78 &&
    Math.abs(p[1]) <= .76;
}
function summarizePhysicalDoorwaySubmissions(observations, limit = 56) {
  const episodes = new Map();
  if (!Array.isArray(observations)) observations = [];
  for (const observation of observations) {
    const audit = observation?.observedPhysicalDoorwaySubmissionAudit;
    if (!Array.isArray(audit?.frames)) continue;
    for (const frame of audit.frames) {
      // The native candidate's FIRST real F9 WebGL return may precede
      // publication of lastGuardianCrossing. Scene then reports the separately
      // validated same-run, source-grounded old-cap receipt (not a victory
      // record). The old classifier rejected this genuine returned frame and
      // incorrectly declared NO_RETAINED_BROWSER_AUDIT for both viewports.
      // Admit ONLY that exact read-only source-evidence type, never an
      // arbitrary null crossing or a predicted guardian defeat.
      if (!frame || frame.floor !== 9 ||
          typeof frame.runToken !== 'string' || !frame.runToken ||
          !Number.isSafeInteger(frame.sourceTick)) continue;
      const hasRecord = Number.isSafeInteger(frame.crossingTick);
      const groundedReceipt = !hasRecord &&
        frame.crossingTick == null &&
        frame.evidenceKind === 'verified-original-grounded-source-receipt' &&
        Number.isSafeInteger(frame.observedOriginalReceiptTick);
      if (!hasRecord && !groundedReceipt) continue;
      const anchorTick = hasRecord
        ? frame.crossingTick : frame.observedOriginalReceiptTick;
      const ageTicks = frame.sourceTick - anchorTick;
      if (ageTicks < 0 || ageTicks > (hasRecord ? 55 : 12)) continue;
      // Never combine a second passage after restart with the first episode.
      // An actual immutable record, when subsequently available, shares the
      // same crossing tick but retains its STRONGER distinct evidence kind.
      const key = frame.runToken + ':' + anchorTick;
      if (!episodes.has(key)) episodes.set(key, new Map());
      const episode = episodes.get(key);
      if (!episode.has(frame.sourceTick) && episode.size < limit)
        episode.set(frame.sourceTick, {
          ...frame,
          evidenceClassification: hasRecord
            ? 'immutable-source-crossing-record'
            : 'verified-grounded-source-receipt-only',
          readAtMs: Number.isFinite(observation.atMs)
            ? observation.atMs : null,
          heroNdc: Array.isArray(frame.heroNdc) ? [...frame.heroNdc] : null,
          originalGateNdc: Array.isArray(frame.originalGateNdc)
            ? [...frame.originalGateNdc] : null,
        });
    }
  }
  const first = episodes.entries().next().value;
  if (!first) return {
    state:'NOT EVALUATED', nativeVerdict:'NOT EVALUATED',
    firstEpisode:null, returnedFrameCount:0, firstReturnedSourceGapTicks:null,
    rootCause:'NO_RETAINED_BROWSER_AUDIT',
    limitation:'No source-verified returned-WebGL samples were exported; this does not prove that the gateway was absent from native video.',
  };
  const [episode, tickMap] = first;
  const frames = [...tickMap.values()].sort((a,b)=>a.sourceTick-b.sourceTick);
  const firstFrame=frames[0];
  const originalRetained=frames.filter(f=>f.retainedOriginalGpu===true).length;
  const originalGroundedReceiptFrames=frames.filter(f=>
    f.evidenceClassification==='verified-grounded-source-receipt-only').length;
  const immutableGuardianRecordFrames=frames.filter(f=>
    f.evidenceClassification==='immutable-source-crossing-record').length;
  const bothInProjectedFrame=frames.filter(f=>f.bothInProjectedSafeFrame===true).length;
  const coreBlocked=frames.filter(f=>f.heroCoreClear===false ||
    f.originalGateCoreClear===false).length;
  const gatewayNotFramed=frames.filter(f=>!safelyFramed(f.originalGateNdc)).length;
  const heroNotFramed=frames.filter(f=>!safelyFramed(f.heroNdc)).length;
  const rootCause=originalRetained===0
    ? 'ORIGINAL_GATE_NOT_RETAINED_IN_RETURNED_SCENE'
    : gatewayNotFramed===frames.length
      ? 'ORIGINAL_GATE_OUTSIDE_PROJECTED_CAMERA'
      : coreBlocked===frames.length
        ? 'CAMERA_TO_BODY_OR_GATE_CORE_RAY_BLOCKED'
        : bothInProjectedFrame>0
          ? 'BOTH_PROJECTED_NOT_NATIVE_PIXEL_VERIFIED'
          : 'MIXED_SCENE_CAMERA_VISIBILITY_UNRESOLVED';
  return {
    state:'RETURNED_WEBGL_PROJECTIONS_ONLY', nativeVerdict:'NOT EVALUATED',
    firstEpisode:episode, observedEpisodeCount:episodes.size,
    returnedFrameCount:frames.length,
    firstReturnedSourceGapTicks:firstFrame.sourceTick-firstFrame.crossingTick,
    retainedOriginalGpuFrames:originalRetained,
    originalGroundedReceiptFrames,
    immutableGuardianRecordFrames,
    guardianVictoryProof:immutableGuardianRecordFrames > 0
      ? 'IMMUTABLE_CROSSING_RECORD_OBSERVED'
      : 'NOT EVALUATED — receipt alone never certifies guardian defeat',
    bothInProjectedSafeFrameCount:bothInProjectedFrame,
    originalGatewayOutOfSafeCameraCount:gatewayNotFramed,
    heroOutOfSafeCameraCount:heroNotFramed,
    coreRayBlockedCount:coreBlocked,
    rootCause, frames,
    limitation:'Renderer-return and projected 3D coordinates only. No native WebM pixel or perceptual assessment, and no independent review or device FPS. Original gameplay remains unmodified.',
  };
}
module.exports={summarizePhysicalDoorwaySubmissions};
