import { observedImmediateTrap } from './scene-hierarchy.mjs';
import { observedUnlockedGuardianCap } from './guardian-passage.mjs';
import { guardianGateAnchorX } from './coordinates.mjs';
// A source-owned, non-authoritative subject for the tower's EXISTING fill light.
// An active guardian is a combat subject, a charged trap is a danger subject,
// and the real selected deck is an arrival subject. This never predicts a hit,
// invents a destination, changes authority or adds a gameplay light source.
const finite = (...values) => values.every(Number.isFinite);
export function observedActionStage(snapshot, selectedDeck = null) {
  const actor = snapshot?.player;
  if (snapshot?.stale || snapshot?.lifecycle !== 'running' || !actor || actor.health <= 0 ||
      !Number.isSafeInteger(snapshot.tick) || !Number.isSafeInteger(snapshot.floor) ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      !finite(actor.x, actor.y, snapshot.chunkBaseY, snapshot.worldWidth) ||
      snapshot.worldWidth <= 0) return null;
  const within = (x, y, dx, dy) => finite(x, y) &&
    Math.abs(x - actor.x) <= dx && Math.abs(y - actor.y) <= dy;
  const combatIntent = ['engaging-enemy', 'bracing-telegraph',
    'evading-telegraph', 'evading-projectile'].includes(snapshot.intent?.mode);
  // A genuine close-contact shutter owns the urgent fill-light subject,
  // even when a guardian is simultaneously fighting nearby. This reuses the
  // existing light and danger machinery, not a fabricated attack or extra draw.
  const contact = observedImmediateTrap(snapshot);
  if (contact) return { kind: 'hazard', x: contact.x, y: contact.y,
    sourceTick: snapshot.tick, sourceId: contact.id };
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
  // After the REAL zero-health guardian has unlocked its exact cap, hand the
  // existing shadow-free light to the physical bronze doorway. This joins the
  // falling armor, broken power conduit and traversable exit in one readable
  // 3D cause/effect scene, rather than inventing a reward or UI label.
  // A live attacking enemy or an urgent physical hazard retains priority.
  const earned = observedUnlockedGuardianCap(snapshot);
  if (earned) {
    const x = guardianGateAnchorX(snapshot, earned.cap);
    const y = earned.cap.y + earned.cap.height + 20000;
    if (within(x, y, 220000, 140000)) return {
      kind: 'earned-gate', x, y, sourceTick: snapshot.tick,
      sourceId: earned.cap.id,
    };
  }
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

// A protected crossfire camera nudge can bring a REAL striking shutter into
// the same 3D frame as the living climber and guardian. Both bodies must remain
// legible at their full skinned height, along with an already-visible landing.
// This pure acceptance rule owns no camera, simulation or outcome authority.
export function guardedCrossfireAimGain({
  aspect, actorBefore, actorAfter, guardianBefore, guardianAfter,
  hazardBefore, hazardAfter, landingBefore = null, landingAfter = null,
  actorCoreClear = false, guardianCoreClear = false,
  hazardCoreClear = false, landingCoreClear = true,
}) {
  const point = (value, width) => Array.isArray(value) &&
    value.length === width && value.every(Number.isFinite) &&
    value[2] >= -1 && value[2] <= 1;
  if (!Number.isFinite(aspect) || aspect <= 0 ||
    !actorCoreClear || !guardianCoreClear || !hazardCoreClear ||
    !landingCoreClear || !point(actorBefore,4) || !point(actorAfter,4) ||
    !point(guardianBefore,4) || !point(guardianAfter,4) ||
    !point(hazardBefore,3) || !point(hazardAfter,3) ||
    (!!landingBefore !== !!landingAfter) ||
    (landingBefore && (!point(landingBefore,3) || !point(landingAfter,3)))) return 0;
  const body = (sample, xLimit, yLimit) => Math.max(0,
    Math.abs(sample[0]) / xLimit - 1,
    (Math.abs(sample[1]) + Math.abs(sample[3])) / yLimit - 1);
  const actorBeforeError = body(actorBefore, aspect < .85 ? .78 : .83, .78);
  const actorAfterError = body(actorAfter, aspect < .85 ? .78 : .83, .78);
  const guardianBeforeError = body(guardianBefore, aspect < .85 ? .81 : .87, .81);
  const guardianAfterError = body(guardianAfter, aspect < .85 ? .81 : .87, .81);
  // Do not sacrifice a clipped hero/guardian to chase another spectacle.
  if (actorBeforeError > .08 || guardianBeforeError > .08 ||
      actorAfterError > Math.max(.01, actorBeforeError + .008) ||
      guardianAfterError > Math.max(.01, guardianBeforeError + .008)) return 0;
  const pressure = sample => Math.max(0,
    Math.abs(sample[0]) / .67 - 1, Math.abs(sample[1]) / .73 - 1);
  const start = pressure(hazardBefore), end = pressure(hazardAfter);
  if (start <= .035 || end > start - .012) return 0;
  if (landingBefore) {
    const routePressure = sample => Math.max(0,
      Math.abs(sample[0]) / .86 - 1, Math.abs(sample[1]) / .82 - 1);
    const startRoute = routePressure(landingBefore);
    const endRoute = routePressure(landingAfter);
    if (endRoute > Math.max(.012, startRoute + .006)) return 0;
  }
  return Math.min(.7, start - end);
}
