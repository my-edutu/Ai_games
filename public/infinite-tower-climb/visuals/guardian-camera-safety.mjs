// Scene-only, source-observed guardian camera guard. No simulation decisions,
// camera cuts, screen-space substitutes, randomness, new draw calls or timing authority.
// This module stays pure so mobile/desktop recovery rules can be tested without WebGL.
const finite = Number.isFinite;

export function guardianFramePressure(ndc, aspect) {
  if (!Array.isArray(ndc) || ndc.length !== 3 || !ndc.every(finite) ||
    !finite(aspect) || aspect <= 0) return Infinity;
  const horizontal = aspect < .85 ? .82 : .88;
  return Math.max(0, Math.abs(ndc[0]) / horizontal - 1,
    Math.abs(ndc[1]) / .8 - 1,
    ndc[2] < -1 || ndc[2] > 1 ? 2 : 0);
}

// A guardian camera repair must not purchase an enemy close-up by moving the
// real climber outside the phone's tighter 78% action safe area.
export function actorFramePressure(ndc, aspect) {
  if (!Array.isArray(ndc) || ndc.length !== 3 || !ndc.every(finite) ||
    !finite(aspect) || aspect <= 0) return Infinity;
  return Math.max(0, Math.abs(ndc[0]) / (aspect < .85 ? .78 : .82) - 1,
    Math.abs(ndc[1]) / .78 - 1,
    ndc[2] < -1 || ndc[2] > 1 ? 2 : 0);
}

export function guardianCameraRecoveryBlend(pressure, elapsedSeconds) {
  if (!finite(pressure) || !finite(elapsedSeconds) ||
    pressure <= .02 || elapsedSeconds <= 0) return 0;
  // Never respond to simulated time, software-GL frame count or future
  // trajectory; this is a strictly bounded continuous physical camera move.
  return Math.min(.30, 1 - Math.exp(-Math.min(.06, elapsedSeconds) *
    (7 + Math.min(2, pressure) * 9)));
}

export function acceptGuardianCameraRescue({
  aspect, guardianBefore, guardianAfter, actorBefore, actorAfter,
  actorCoreClear, guardianCoreClear,
}) {
  const start = guardianFramePressure(guardianBefore, aspect);
  const end = guardianFramePressure(guardianAfter, aspect);
  const playerStart = actorFramePressure(actorBefore, aspect);
  const playerEnd = actorFramePressure(actorAfter, aspect);
  // Existing protagonist safety and exterior tower sightlines always win.
  // A cropped hero or blocked world cannot be exchanged for a pretty boss.
  if (!actorCoreClear || !guardianCoreClear || playerStart > 0 ||
    playerEnd > 0 || !finite(start) || !finite(end) || start <= .02) return false;
  // Avoid chase-camera oscillation from insignificant NDC fluctuations:
  // approve only a measurable improvement in the *same actual* guardian.
  return end < start - .025;
}
