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
