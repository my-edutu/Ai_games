// Source-owned presentation only. The caller invokes this after a witnessed,
// same-run, inventory-confirmed public key pickup. No maze/private state,
// actor movement, HUD, camera allocation or gameplay authority is used.
const HERO_THREE_QUARTER_ANGLE = .30;
const HERO_DISTANCE = 19.5;
const HERO_ELEVATION = 13.8;

// Reuse the renderer's existing THREE.Vector3. The character's last publicly
// observed heading is frozen at collection so the camera does not chase the
// autonomous actor through unrelated subsequent steps.
export function setWitnessedPickupStoryCameraOffset(offset, publicHeading) {
  if (!offset || typeof offset.set !== 'function' || !Number.isFinite(publicHeading))
    return false;
  const bearing = publicHeading + HERO_THREE_QUARTER_ANGLE;
  offset.set(
    Math.sin(bearing) * HERO_DISTANCE,
    HERO_ELEVATION,
    Math.cos(bearing) * HERO_DISTANCE
  );
  return true;
}
