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
