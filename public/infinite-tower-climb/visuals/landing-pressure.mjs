// Shared PRESENT-source landing pressure for the actual airborne pilot,
// its 3D navigation stones, arrival dock and exterior camera. This never
// predicts a collision, guesses a future trap cycle or changes simulation.
const finite = Number.isFinite;
export function observedLandingHazardPressure(snapshot, hazard, deckTop) {
  const player = snapshot?.player;
  if (!player || !hazard || !finite(deckTop) ||
      ![hazard.x, hazard.y, hazard.width, hazard.height,
        player.halfHeight].every(finite) ||
      hazard.width <= 0 || hazard.height <= 0 || player.halfHeight <= 0)
    return false;
  // Same public last-six-ticks descending gate as tactical
  // observedLandingCorridor. A warning is real source state, never inferred
  // from an animation clock or visual interpolation.
  const descending = (player.state === 'airborne' ||
    player.state === 'dashing') && finite(player.vy) && player.vy < 0;
  const imminent = descending &&
    Number.isSafeInteger(hazard.chargeTicksRemaining) &&
    hazard.chargeTicksRemaining >= 1 && hazard.chargeTicksRemaining <= 6;
  return (hazard.active === true || imminent) &&
    hazard.y < deckTop + 2 * player.halfHeight &&
    hazard.y + hazard.height > deckTop;
}
