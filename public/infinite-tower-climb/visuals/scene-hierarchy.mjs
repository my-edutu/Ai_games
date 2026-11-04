// A cross-biome action hierarchy for the real Tower. This is an observation
// only: it cannot choose a route, change a collider, predict an impact or
// invent a guardian fight. The same source fact quiets decorative architecture
// and weather before an important silhouette becomes hard to read on mobile.
const QUIET = Object.freeze({ kind: 'ascent', focus: 0 });
const TERMINAL = Object.freeze({ kind: 'terminal', focus: .86 });
const GUARDIAN = Object.freeze({ kind: 'guardian', focus: 1 });
const DANGER = Object.freeze({ kind: 'hazard', focus: .82 });
const finite = (...values) => values.every(Number.isFinite);
const combatModes = new Set([
  'engaging-enemy', 'bracing-telegraph',
  'evading-telegraph', 'evading-projectile',
]);

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
  for (const enemy of source.enemies || []) {
    if (enemy?.kind !== 'guardian' || enemy.active !== true ||
        !finite(enemy.x, enemy.y, enemy.health, enemy.maxHealth) ||
        enemy.health <= 0 || enemy.maxHealth <= 0 ||
        Math.abs(enemy.x - actor.x) > 135000 ||
        Math.abs(enemy.y - actor.y) > 65000) continue;
    // No generic guardian suppression from a far-away, untouched boss.
    if (enemy.telegraph === true || enemy.guardTicksRemaining > 0 ||
        enemy.health < enemy.maxHealth || combat) return GUARDIAN;
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
