// Infer presentation velocity in simulation units per tick, independent of polling.
export function snapshotVelocity(previousPosition, position, elapsedTicks) {
  if (![previousPosition, position, elapsedTicks].every(Number.isFinite) || elapsedTicks <= 0) return 0;
  return (position - previousPosition) / elapsedTicks;
}
