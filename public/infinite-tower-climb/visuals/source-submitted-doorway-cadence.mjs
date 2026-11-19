// The first actual Floor 9 GPU frame can follow a long blocked WebGL rebuild.
// Camera smoothing must measure the *submitted* frame, not spend the entire
// unseen wall-time gap in one jump from the original physical bronze doorway.
// This modifies presentation only; the authoritative simulation is untouched.
const finite = Number.isFinite;
export const MAX_SOURCE_DOOR_CAMERA_STEP_SECONDS = 1 / 25;
export function sourceSubmittedDoorwayCameraDt(dt, lens, source, view) {
  if (!finite(dt) || dt <= 0 || !source || !view) return dt;
  if (lens?.sourceBound !== true || lens.coldOriginalArch !== true ||
      !Number.isSafeInteger(lens.sourceTick) || lens.sourceTick !== source.tick ||
      source.floor !== 9 || source.lifecycle !== 'running' ||
      !(source.player?.health > 0) || view.camera !== 'follow' ||
      view.stale || view.reducedMotion) return dt;
  return Math.min(dt, MAX_SOURCE_DOOR_CAMERA_STEP_SECONDS);
}

// The original 390x844 gameplay film can lose the REAL moving hero after a
// cold first-F9 WebGL return. The deliberately slow old-doorway camera step
// then preserves the bronze framing while the 20Hz source body has advanced
// offscreen. The already-rendered camera is tested against the CURRENT
// source-owned complete body (head, soles, left/right shoulders) BEFORE its
// next camera motion. Only a visibly cropped/behind-camera original actor
// releases the former 40ms cap, to a bounded 140ms rescue step. Do not use a
// source floor number, future target, stale packet or FPS estimate as a crop.
export const MAX_CROPPED_HERO_CAMERA_STEP_SECONDS = .14;
export function sourceCroppedHeroRecoveryDt(dt, cameraDt, body, lens, source, view) {
  if (!finite(dt) || dt <= 0 || !finite(cameraDt) ||
      cameraDt <= 0 || cameraDt >= dt ||
      sourceSubmittedDoorwayCameraDt(dt,lens,source,view) === dt ||
      !body || body.sourceTick !== source?.tick ||
      !Number.isSafeInteger(body.sourceTick) ||
      !finite(body.aspect) || body.aspect <= 0 || body.aspect > 3 ||
      !finite(body.maxAbsX) || body.maxAbsX < 0 ||
      !finite(body.maxAbsY) || body.maxAbsY < 0 ||
      typeof body.depthValid !== 'boolean')
    return cameraDt;
  const horizontalLimit = body.aspect < .85 ? .82 : .90;
  const cropped = body.maxAbsX > horizontalLimit ||
    body.maxAbsY > .90 || !body.depthValid;
  return cropped
    ? Math.max(cameraDt, Math.min(dt,MAX_CROPPED_HERO_CAMERA_STEP_SECONDS))
    : cameraDt;
}
