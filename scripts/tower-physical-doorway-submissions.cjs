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
      if (!frame || frame.floor !== 9 ||
          typeof frame.runToken !== 'string' || !frame.runToken ||
          !Number.isSafeInteger(frame.crossingTick) ||
          !Number.isSafeInteger(frame.sourceTick) ||
          frame.sourceTick < frame.crossingTick ||
          frame.sourceTick - frame.crossingTick > 55) continue;
      // Never combine a second passage after restart with the first episode.
      const key = frame.runToken + ':' + frame.crossingTick;
      if (!episodes.has(key)) episodes.set(key, new Map());
      const episode = episodes.get(key);
      if (!episode.has(frame.sourceTick) && episode.size < limit)
        episode.set(frame.sourceTick, {
          ...frame, readAtMs: Number.isFinite(observation.atMs)
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
    bothInProjectedSafeFrameCount:bothInProjectedFrame,
    originalGatewayOutOfSafeCameraCount:gatewayNotFramed,
    heroOutOfSafeCameraCount:heroNotFramed,
    coreRayBlockedCount:coreBlocked,
    rootCause, frames,
    limitation:'Renderer-return and projected 3D coordinates only. No native WebM pixel or perceptual assessment, and no independent review or device FPS. Original gameplay remains unmodified.',
  };
}
module.exports={summarizePhysicalDoorwaySubmissions};
