import { observedNearbyGuardianCrossfire } from './guardian-shot-stage.mjs';
import { observedUnlockedGuardianCap } from './guardian-passage.mjs';

// A cross-biome action hierarchy for the real Tower. This is an observation
// only: it cannot choose a route, change a collider, predict an impact or
// invent a guardian fight. The same source fact quiets decorative architecture
// and weather before an important silhouette becomes hard to read on mobile.
const QUIET = Object.freeze({ kind: 'ascent', focus: 0 });
const TERMINAL = Object.freeze({ kind: 'terminal', focus: .86 });
const GUARDIAN = Object.freeze({ kind: 'guardian', focus: 1 });
const RELEASE = Object.freeze({ kind: 'guardian-release', focus: .93 });
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
  const mode = source.intent?.mode ?? '';
  const evasive = /^((oracle-)?evading-hazard)$/.test(mode);
  // The pilot may be dodging a REAL already-fired bolt while a published
  // shutter countdown closes. Its AI intent says "evading-projectile", not
  // "evading-hazard"; withholding the physical shutter until impact leaves
  // a crucial boss+crusher beat visually and sonically unreadable.
  // Only a live approaching enemy-owned shot coincident with a living nearby
  // guardian can authorize this additional presentation path. The source
  // cannot attribute the projectile's shooter and neither do we.
  const liveCrossfire = /^((oracle-)?evading-projectile)$/.test(mode)
    ? observedNearbyGuardianCrossfire(source) : null;
  let closest = null, distance = Infinity;
  for (const hazard of source.hazards || []) {
    if (!hazard || !finite(hazard.x, hazard.y, hazard.width, hazard.height) ||
        hazard.width <= 0 || hazard.height <= 0) continue;
    const charging = (evasive || liveCrossfire) &&
      Number.isSafeInteger(hazard.chargeTicksRemaining) &&
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
  // A defeated enemy and a cap-shaped deck do not authorize a victory cue.
  // Use the SAME current-source, full-body-clearable exit contract as the
  // world gate, camera, action light and in-deck guardian passage.
  const earnedRelease = observedUnlockedGuardianCap(source);
  for (const enemy of source.enemies || []) {
    if (enemy?.kind !== 'guardian' ||
        !finite(enemy.x, enemy.y, enemy.health, enemy.maxHealth) ||
        enemy.maxHealth <= 0 ||
        Math.abs(enemy.x - actor.x) > 135000 ||
        Math.abs(enemy.y - actor.y) > 65000) continue;
    // After a REAL source-authorized guardian defeat the player still has
    // to walk through the cap exit. Missing/mismatched guardianExitX or a
    // historical dead boss cannot suppress the world as a false victory.
    // A surviving crusher retains its immediate physical warning priority.
    if (enemy.active === false && enemy.health <= 0 &&
        earnedRelease?.guardian.id === enemy.id)
      return contact ? DANGER : RELEASE;
    if (enemy.active !== true || enemy.health <= 0) continue;
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
