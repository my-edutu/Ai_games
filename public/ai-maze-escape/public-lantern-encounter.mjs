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


// A TWO-CELL OPEN PUBLIC CORRIDOR permits a real shared Pip/Thornback
// performance before the actors touch adjacent tiles. A local warning can
// still light Pip's lantern across a sealed turn; it cannot authorize a
// face-to-face camera, projected beam, movement route or invented passage.
// Return the number of confirmed open cardinal links (1 or 2), or zero.
export function publicGuardianOpenSightline(snapshot, guardianCell) {
  if (!publicLanternWarning(snapshot, guardianCell)) return 0;
  const width = snapshot.width, hero = snapshot.currentCell;
  const dx = guardianCell % width - hero % width;
  const dy = Math.floor(guardianCell / width) - Math.floor(hero / width);
  const distance = Math.abs(dx) + Math.abs(dy);
  if (distance < 1 || distance > 2 || (dx !== 0 && dy !== 0)) return 0;
  const step = dx ? Math.sign(dx) : Math.sign(dy) * width;
  let current = hero;
  for (let i = 0; i < distance; i++) {
    const next = current + step;
    if (!snapshot.visibleCells.includes(next)) return 0;
    const from = snapshot.cells.find(cell => cell.cell === current && !cell.blocked);
    const to = snapshot.cells.find(cell => cell.cell === next && !cell.blocked);
    if (!from || !to || !Array.isArray(from.neighbors) || !Array.isArray(to.neighbors)
      || !from.neighbors.includes(next) || !to.neighbors.includes(current)
      || snapshot.doors.some(door => !door.open && ((door.a === current && door.b === next)
        || (door.b === current && door.a === next)))) return 0;
    current = next;
  }
  return distance;
}

// A documented, TWO-LINK open Pip–Thornback court should be lit by Pip's
// ACTUAL hand-held point lantern, not only by a HUD danger chip. One-link
// encounters retain their original nearby light and one-link-only visible cone.
// This adjusts no route, knowledge or collision: two confirmed reciprocal
// cardinal PUBLIC edges, both unlocked, are mandatory. There is deliberately
// NO projected beam across two cells (a separate strict contract).
export function publicGuardianLanternReach(snapshot, guardianCell, cellSize, baseReach=4) {
  const safeBase=Number.isFinite(baseReach)&&baseReach>0?baseReach:4;
  if(!(Number.isFinite(cellSize)&&cellSize>0))return safeBase;
  return publicGuardianOpenSightline(snapshot,guardianCell)===2
    ?Math.max(safeBase,cellSize*2.9):safeBase;
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

/**
 * A real autonomous inspection may light a CURRENT, PUBLIC pressure machine
 * only through reciprocal unlocked corridors. Two-edge diagonal surveys bend
 * at a currently visible intermediate tile, never through an unseen wall.
 * This is source-observation presentation, NOT movement, AI sight or attack.
 */
export function publicPressureSurveySightline(snapshot, pressureCell) {
  const width=snapshot?.width,height=snapshot?.height,current=snapshot?.currentCell;
  if(snapshot?.intent?.mode!=='inspecting-hazard'||snapshot.lifecycle!=='running'
    ||snapshot.result||!Number.isSafeInteger(width)||width<2
    ||!Number.isSafeInteger(height)||height<2
    ||!Number.isSafeInteger(current)||current<0||current>=width*height
    ||!Number.isSafeInteger(pressureCell)||pressureCell<0||pressureCell>=width*height
    ||pressureCell===current||!Array.isArray(snapshot.cells)
    ||!Array.isArray(snapshot.visibleCells)||!Array.isArray(snapshot.doors))return null;
  const visible=new Set(snapshot.visibleCells);
  if(!visible.has(current)||!visible.has(pressureCell))return null;
  const known=new Map(snapshot.cells.filter(c=>visible.has(c?.cell)
    &&Number.isSafeInteger(c.cell)).map(c=>[c.cell,c]));
  const from=known.get(current),pressure=known.get(pressureCell);
  if(!from||from.blocked||pressure?.blocked||pressure?.trap!==true)return null;
  const direct=(a,b)=>{
    if(!a||!b||a.blocked||b.blocked||!Array.isArray(a.neighbors)
      ||!Array.isArray(b.neighbors)||!a.neighbors.includes(b.cell)
      ||!b.neighbors.includes(a.cell))return false;
    const steps=Math.abs(a.cell%width-b.cell%width)
      +Math.abs(Math.floor(a.cell/width)-Math.floor(b.cell/width));
    return steps===1&&!snapshot.doors.some(d=>!d?.open
      &&((d.a===a.cell&&d.b===b.cell)||(d.b===a.cell&&d.a===b.cell)));
  };
  if(direct(from,pressure))return {links:1,midCell:null};
  const dx=Math.abs(current%width-pressureCell%width);
  const dy=Math.abs(Math.floor(current/width)-Math.floor(pressureCell/width));
  if(dx!==1||dy!==1||!Array.isArray(from.neighbors))return null;
  for(const id of [...new Set(from.neighbors)].sort((a,b)=>a-b)){
    const mid=known.get(id);
    if(mid&&mid.trap!==true&&direct(from,mid)&&direct(mid,pressure))
      return {links:2,midCell:id};
  }
  return null;
}

/**
 * Share a real autonomous pressure-inspection performance between Pip and
 * the known jaws. Only the 390-class Follow portrait has room for this new
 * survey shot; tight 320px, landscape and reduced-motion optics stay intact.
 * Revalidate the genuine currently visible reciprocal unlocked corridor:
 * a stale survey flag must never allow a hidden or sealed camera reveal.
 */
export function publicPressureInspectionTakesFocus(
  snapshot, pressureCell, sightline, trap, cellSize, aspect,
  mode='follow', guardian=false, opening=false, pickup=false, reduced=false
) {
  if (mode!=='follow' || guardian || opening || pickup || reduced
    || !(Number.isFinite(aspect)&&aspect>=.45&&aspect<.60)
    || !(Number.isFinite(cellSize)&&cellSize>0)
    || !Number.isSafeInteger(pressureCell) || trap?.cell!==pressureCell
    || !(Number.isFinite(trap?.distance)&&trap.distance>=cellSize
      &&trap.distance<=cellSize*1.65)
    || !(Number.isFinite(trap?.weight)&&trap.weight>=.30)
    || !sightline || (sightline.links!==1&&sightline.links!==2))return false;
  const actual=publicPressureSurveySightline(snapshot,pressureCell);
  return !!actual && actual.links===sightline.links && actual.midCell===sightline.midCell;
}
