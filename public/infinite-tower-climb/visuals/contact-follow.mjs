// Presentation-only contact correction: standing soles belong to the actual
// collision platform, not to the preceding interpolated airborne Y position.
// Horizontal smoothing and airborne motion remain unchanged; this never writes
// to the authoritative simulation, replay, physics or AI state.
export function followClimberContact(position, target, blend, state) {
  position.lerp(target, blend);
  if (state === 'standing') position.y = target.y;
  return position;
}
