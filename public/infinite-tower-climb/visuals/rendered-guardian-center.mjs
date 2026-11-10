// Camera-only, read-only bridge between a FIXED-STEP boss identity and the
// physically drawn Three.js enemy root. World position is intentionally taken
// after scene interpolation and rig posing, never inferred from source x/y.
// The caller owns/reuses output; no authority mutation or new geometry.
export function readRenderedGuardianCenter(guardian, entries, output, scale) {
  if (!guardian || guardian.kind !== 'guardian' || guardian.active !== true ||
      !Number.isFinite(guardian.health) || guardian.health <= 0 ||
      !Number.isFinite(guardian.halfHeight) || guardian.halfHeight <= 0 ||
      typeof guardian.id !== 'string' || !guardian.id ||
      !Number.isFinite(scale) || scale <= 0 ||
      typeof entries?.get !== 'function' ||
      typeof output?.set !== 'function') return false;
  const entry = entries.get(guardian.id);
  const root = entry?.model?.group;
  if (entry?.state?.id !== guardian.id ||
      entry.state.kind !== 'guardian' || entry.state.active !== true ||
      entry.state.health <= 0 || !entry.initialized ||
      root?.visible !== true || typeof root.getWorldPosition !== 'function')
    return false;
  // This root is at the drawn boot support, while the combat framing requires
  // the actual halfway-up-body anchor. Its source half-height is only a scale,
  // NOT a substitute for the smoothed body's world position.
  root.getWorldPosition(output);
  if (![output.x, output.y, output.z].every(Number.isFinite)) return false;
  output.y += guardian.halfHeight / scale;
  return Number.isFinite(output.y);
}

 
// Camera composition must follow the actual rendered combatant, not a
// potentially distant fixed-step projection, but ONLY after the source has
// already identified an alive guardian in this run/floor. The observation is
// a retained previous 3D-submission witness (same or preceding 20Hz tick):
// no invented next pose, no stale boss after restart, no authority mutation.
export function observedDrawnGuardianCameraAnchor(guardian, drawnCenter, witness, snapshot) {
  if (!guardian || guardian.kind !== 'guardian' || guardian.active !== true ||
      !Number.isFinite(guardian.health) || guardian.health <= 0 ||
      typeof guardian.id !== 'string' || !guardian.id ||
      snapshot?.lifecycle !== 'running' || !(snapshot?.player?.health > 0) ||
      !Number.isSafeInteger(snapshot.tick) ||
      witness?.id !== guardian.id || witness.runToken !== snapshot.runToken ||
      witness.floor !== snapshot.floor ||
      !Number.isSafeInteger(witness.sourceTick) ||
      witness.sourceTick > snapshot.tick ||
      snapshot.tick - witness.sourceTick > 1 ||
      !drawnCenter || ![drawnCenter.x, drawnCenter.y, drawnCenter.z].every(Number.isFinite))
    return null;
  return drawnCenter;
}
