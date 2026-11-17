// One shared, bounded public visual beat: long enough to read Thornback's
// connected load/rebound/stagger on a phone; never an authoritative AI timer.
export const PUBLIC_GUARDIAN_COUNTER_SECONDS = 2.0;

/**
 * The one honest lantern-counter outcome for game-first presentation. It is
 * earned by a consecutive, same-run PUBLIC before -> after witness of one
 * IDENTIFIED visible guardian. A first-seen parried enemy, a skipped tick,
 * unseen old/new cell, stale run or terminal result cannot claim a hit.
 * Neither private engine state nor this return value influences the AI.
 */
export function publicGuardianCounterMoment(before, after) {
  if (!before || !after || before.runToken !== after.runToken
    || before.lifecycle !== 'running' || after.lifecycle !== 'running'
    || before.result || after.result
    || !Number.isSafeInteger(before.tick) || after.tick !== before.tick + 1
    || !Array.isArray(before.visibleCells) || !Array.isArray(after.visibleCells)
    || !Array.isArray(before.threats) || !Array.isArray(after.threats)) return null;
  for (const threat of after.threats) {
    if (typeof threat?.id !== 'string' || !threat.id
      || !Number.isSafeInteger(threat.cell) || threat.lanternParried !== true
      || !after.visibleCells.includes(threat.cell)) continue;
    const previous = before.threats.find(known => known?.id === threat.id
      && known.lanternParried !== true
      && Number.isSafeInteger(known.cell)
      && before.visibleCells.includes(known.cell));
    if (previous) return {runToken:after.runToken,id:threat.id,
      fromCell:previous.cell,cell:threat.cell,tick:after.tick};
  }
  return null;
}

/** An earned on-screen beat cannot survive a private/hidden/replaced threat. */
export function publicGuardianCounterHeld(moment, snapshot, visualTime) {
  return !!moment && snapshot?.lifecycle === 'running' && !snapshot.result
    && moment.runToken === snapshot.runToken
    && Number.isFinite(visualTime) && visualTime < moment.until
    && Array.isArray(snapshot.visibleCells) && snapshot.visibleCells.includes(moment.cell)
    && Array.isArray(snapshot.threats)
    && snapshot.threats.some(t=>t?.id===moment.id
      && t.cell===moment.cell && t.lanternParried===true);
}

/**
 * A physical hit, Follow-camera two-body lens and rooted stage share the
 * exact finite witnessed counter interval with the HUD. A counter is NEVER
 * a permanent focus flag: if the published guardian leaves the witnessed
 * retreat cell, the encounter is over even before the animation clock ends.
 * The caller also requires a current public visible cell and a running game.
 */
export function publicGuardianCounterStageActive(since, witnessedCell, liveCell, parried, visualTime) {
  const age=visualTime-since;
  return parried===true && Number.isFinite(since) && Number.isFinite(visualTime)
    && Number.isSafeInteger(witnessedCell) && witnessedCell>=0
    && liveCell===witnessedCell && age>=0
    && age<PUBLIC_GUARDIAN_COUNTER_SECONDS;
}
