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
