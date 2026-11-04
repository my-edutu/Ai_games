// A cross-biome action hierarchy for the real Tower. This is an observation
// only: it cannot choose a route, change a collider, predict an impact or
// invent a guardian fight. The same source fact quiets decorative architecture
// and weather before an important silhouette becomes hard to read on mobile.
const QUIET = Object.freeze({ kind: 'ascent', focus: 0 });
const TERMINAL = Object.freeze({ kind: 'terminal', focus: .86 });
const GUARDIAN = Object.freeze({ kind: 'guardian', focus: 1 });
const DANGER = Object.freeze({ kind: 'hazard', focus: .82 });
const CROSSFIRE = Object.freeze({ kind: 'crossfire', focus: 1 });
const finite = (...values) => values.every(Number.isFinite);
const combatModes = new Set([
  'engaging-enemy', 'bracing-telegraph',
  'evading-telegraph', 'evading-projectile',
]);

// The closest live shutter must not disappear underneath a larger boss cue.
// Only a present, physically near source obstacle (or the last six observed
// charge ticks while the pilot is evading it) can interrupt combat staging.
// Never invent impact, score risk, collision, or change autonomous steering.
export function observedImmediateTrap(source) {
  const actor = source?.player;
  if (source?.stale || source?.lifecycle !== 'running' ||
      typeof source.runToken !== 'string' || !source.runToken ||
      !Number.isSafeInteger(source.tick) || source.tick < 0 ||
      !Number.isSafeInteger(source.floor) || source.floor < 0 ||
      !actor || actor.health <= 0 ||
      !finite(actor.x, actor.y, actor.halfWidth, actor.halfHeight) ||
      actor.halfWidth <= 0 || actor.halfHeight <= 0) return null;
  const evasive = /^((oracle-)?evading-hazard)$/.test(source.intent?.mode ?? '');
  let closest = null, distance = Infinity;
  for (const hazard of source.hazards || []) {
    if (!hazard || !finite(hazard.x, hazard.y, hazard.width, hazard.height) ||
        hazard.width <= 0 || hazard.height <= 0) continue;
    const charging = evasive && Number.isSafeInteger(hazard.chargeTicksRemaining) &&
      hazard.chargeTicksRemaining >= 1 && hazard.chargeTicksRemaining <= 6;
    if (hazard.active !== true && !charging) continue;
    const x = hazard.x + hazard.width / 2, y = hazard.y + hazard.height / 2;
    const dx = Math.abs(actor.x - x), dy = Math.abs(actor.y - y);
    if (dx > actor.halfWidth + hazard.width / 2 + 9000 ||
        dy > actor.halfHeight + hazard.height / 2 + 12000) continue;
    const score = dx + dy;
    if (score < distance) { closest = { id: hazard.id || null, x, y }; distance = score; }
  }
  return closest;
}

export function observedSceneHierarchy(source) {
  const actor = source?.player;
  if (!actor || source?.stale || typeof source.runToken !== 'string' ||
      !source.runToken || !Number.isSafeInteger(source.floor) ||
      source.floor < 0 || !Number.isSafeInteger(source.tick) ||
      source.tick < 0 || !finite(actor.x, actor.y, actor.health)) return QUIET;
  if (source.lifecycle === 'result' || source.lifecycle === 'intermission')
    return source.result && typeof source.result.kind === 'string'
      ? TERMINAL : QUIET;
  if (source.lifecycle !== 'running' || actor.health <= 0) return QUIET;
  const mode = typeof source.intent?.mode === 'string'
    ? source.intent.mode.replace(/^oracle-/, '') : '';
  const combat = combatModes.has(mode) || actor.attacking === true;
  const contact = observedImmediateTrap(source);
  for (const enemy of source.enemies || []) {
    if (enemy?.kind !== 'guardian' || enemy.active !== true ||
        !finite(enemy.x, enemy.y, enemy.health, enemy.maxHealth) ||
        enemy.health <= 0 || enemy.maxHealth <= 0 ||
        Math.abs(enemy.x - actor.x) > 135000 ||
        Math.abs(enemy.y - actor.y) > 65000) continue;
    // No generic guardian suppression from a far-away, untouched boss.
    if (enemy.telegraph === true || enemy.guardTicksRemaining > 0 ||
        enemy.health < enemy.maxHealth || combat) return contact ? CROSSFIRE : GUARDIAN;
  }
  for (const h of source.hazards || []) {
    if (!h || !finite(h.x, h.y, h.width, h.height) ||
        h.width <= 0 || h.height <= 0) continue;
    const charge = Number.isSafeInteger(h.chargeTicksRemaining) &&
      h.chargeTicksRemaining >= 1 && h.chargeTicksRemaining <= 12 &&
      mode === 'evading-hazard';
    if (!h.active && !charge) continue;
    const x = h.x + h.width * .5, y = h.y + h.height * .5;
    if (Math.abs(x - actor.x) <= 110000 &&
        Math.abs(y - actor.y) <= 90000) return DANGER;
  }
  return QUIET;
}
