// A visual lantern focus, NEVER a new AI action, damage, route or sight oracle.
// All the checks are restricted to currently visible, reciprocal PUBLIC cells.
export function publicLanternEncounter(snapshot, guardianCell) {
  const width = snapshot?.width, hero = snapshot?.currentCell;
  if (!Number.isSafeInteger(width) || width < 2
    || !Number.isSafeInteger(hero) || hero < 0
    || !Number.isSafeInteger(guardianCell) || guardianCell < 0
    || guardianCell === hero || snapshot.lifecycle !== 'running' || snapshot.result) return false;
  if (!Array.isArray(snapshot.cells) || !Array.isArray(snapshot.visibleCells)
    || !Array.isArray(snapshot.threats) || !Array.isArray(snapshot.doors)) return false;
  if (!snapshot.visibleCells.includes(hero) || !snapshot.visibleCells.includes(guardianCell)
    || !snapshot.threats.some(threat => threat?.cell === guardianCell)) return false;
  if (Math.abs(hero % width - guardianCell % width)
    + Math.abs(Math.floor(hero / width) - Math.floor(guardianCell / width)) !== 1) return false;
  const a = snapshot.cells.find(cell => cell.cell === hero && !cell.blocked);
  const b = snapshot.cells.find(cell => cell.cell === guardianCell && !cell.blocked);
  if (!a || !b || !Array.isArray(a.neighbors) || !Array.isArray(b.neighbors)
    || !a.neighbors.includes(guardianCell) || !b.neighbors.includes(hero)) return false;
  return !snapshot.doors.some(door => !door.open
    && ((door.a === hero && door.b === guardianCell)
      || (door.b === hero && door.a === guardianCell)));
}
