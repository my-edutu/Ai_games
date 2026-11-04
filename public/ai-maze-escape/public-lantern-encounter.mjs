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

// A nearby disclosed guardian can make Pip's own lantern shine even across
// a sealed or unknown turn. This is strictly LOCAL to the lamp, unlike the
// straight focus beam above: it never implies an open route or line of sight.
export function publicLanternWarning(snapshot, guardianCell) {
  const width=snapshot?.width, height=snapshot?.height, hero=snapshot?.currentCell;
  if (!Number.isSafeInteger(width) || width < 2
    || !Number.isSafeInteger(height) || height < 2
    || !Number.isSafeInteger(hero) || !Number.isSafeInteger(guardianCell)
    || hero < 0 || guardianCell < 0 || hero >= width*height
    || guardianCell >= width*height || hero === guardianCell
    || snapshot.lifecycle !== 'running' || snapshot.result) return false;
  if (!Array.isArray(snapshot.cells) || !Array.isArray(snapshot.visibleCells)
    || !Array.isArray(snapshot.threats)
    || !snapshot.visibleCells.includes(hero)
    || !snapshot.visibleCells.includes(guardianCell)
    || !snapshot.threats.some(threat => threat?.cell === guardianCell)) return false;
  const knownHero=snapshot.cells.find(cell => cell.cell === hero && !cell.blocked);
  const knownGuardian=snapshot.cells.find(cell => cell.cell === guardianCell && !cell.blocked);
  if (!knownHero || !knownGuardian) return false;
  const dx=(hero % width)-(guardianCell % width);
  const dy=Math.floor(hero / width)-Math.floor(guardianCell / width);
  return dx*dx+dy*dy <= 5; // sqrt(5) cells; zero distance already rejected
}

// Three linked, authored PERFORMANCE beats, not new authoritative AI behavior.
// 0-.24: notice; .24-.60: physically brace; .60-1: unfold shell.
// Input is elapsed VISUAL time since the FIRST nearby PUBLIC witness; hidden
// threats can never start a beat. CPU-delayed frames do not skip a real game tick.
export function publicGuardianEncounterBeat(ageSeconds, reducedMotion = false) {
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return 0;
  if (reducedMotion) return 1; // stable expressive pose, no flashing/tweening
  const t = Math.min(1, ageSeconds / 1.35);
  return t * t * (3 - 2 * t);
}
