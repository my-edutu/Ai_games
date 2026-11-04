// A source-owned, non-authoritative subject for the tower's EXISTING fill light.
// An active guardian is a combat subject, a charged trap is a danger subject,
// and the real selected deck is an arrival subject. This never predicts a hit,
// invents a destination, changes authority or adds a gameplay light source.
const finite = (...values) => values.every(Number.isFinite);
export function observedActionStage(snapshot, selectedDeck = null) {
  const actor = snapshot?.player;
  if (snapshot?.lifecycle !== 'running' || !actor || actor.health <= 0 ||
      !Number.isSafeInteger(snapshot.tick) || !Number.isSafeInteger(snapshot.floor) ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !finite(actor.x, actor.y, snapshot.chunkBaseY, snapshot.worldWidth) ||
      snapshot.worldWidth <= 0) return null;
  const within = (x, y, dx, dy) => finite(x, y) &&
    Math.abs(x - actor.x) <= dx && Math.abs(y - actor.y) <= dy;
  const combatIntent = ['engaging-enemy', 'bracing-telegraph',
    'evading-telegraph', 'evading-projectile'].includes(snapshot.intent?.mode);
  let guardian = null, bestGuardian = Infinity;
  for (const enemy of snapshot.enemies || []) {
    if (enemy?.kind !== 'guardian' || enemy.active !== true ||
        !finite(enemy.x, enemy.y, enemy.health, enemy.maxHealth) ||
        enemy.health <= 0 || enemy.maxHealth <= 0 ||
        !within(enemy.x, enemy.y, 135000, 65000)) continue;
    const witnessed = enemy.telegraph === true || enemy.health < enemy.maxHealth ||
      actor.attacking === true || combatIntent ||
      snapshot.intent?.targetPlatformId === `f${snapshot.floor}:cap`;
    if (!witnessed) continue;
    const score = Math.abs(enemy.x - actor.x) + 1.5 * Math.abs(enemy.y - actor.y);
    if (score < bestGuardian) { guardian = enemy; bestGuardian = score; }
  }
  if (guardian) return { kind: 'guardian', x: guardian.x, y: guardian.y,
    sourceTick: snapshot.tick, sourceId: guardian.id || null };
  let pressure = null, nearest = Infinity;
  for (const trap of snapshot.hazards || []) {
    if (!trap || !finite(trap.x, trap.y, trap.width, trap.height) ||
        trap.width <= 0 || trap.height <= 0) continue;
    const charging = Number.isSafeInteger(trap.chargeTicksRemaining) &&
      trap.chargeTicksRemaining >= 1 && trap.chargeTicksRemaining <= 12 &&
      snapshot.intent?.mode === 'evading-hazard';
    if (!trap.active && !charging) continue;
    const x = trap.x + trap.width / 2, y = trap.y + trap.height / 2;
    if (!within(x, y, 110000, 90000)) continue;
    const score = Math.abs(x - actor.x) + Math.abs(y - actor.y) * 1.5;
    if (score < nearest) {
      nearest = score;
      pressure = { kind: 'hazard', x, y, sourceTick: snapshot.tick,
        sourceId: trap.id || null };
    }
  }
  if (pressure) return pressure;
  if (selectedDeck?.id && selectedDeck.id === snapshot.intent?.targetPlatformId &&
      finite(selectedDeck.x, selectedDeck.y, selectedDeck.width, selectedDeck.height) &&
      selectedDeck.width > 0 && selectedDeck.height > 0) {
    const x = Math.max(selectedDeck.x,
      Math.min(selectedDeck.x + selectedDeck.width, actor.x));
    const y = selectedDeck.y + selectedDeck.height;
    if (within(x, y, 220000, 165000))
      return { kind: 'landing', x, y, sourceTick: snapshot.tick,
        sourceId: selectedDeck.id };
  }
  return { kind: 'climber', x: actor.x, y: actor.y,
    sourceTick: snapshot.tick, sourceId: null };
}
