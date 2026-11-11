/**
 * Diegetic visual hierarchy for the REAL autonomous Warden confrontation.
 * Twenty-three genuine hazard cells must outrank the court's decorative cyan
 * orbits, relief and conduits. This never changes geometry, authority, hit
 * locations, camera/collision, light safety, audio or RNG. In particular the
 * existing carved authoritative warning floor is never dimmed or removed.
 */
const priority=(mode,courtRingOpacity,ritualGlyphOpacity,ritualConduitOpacity,ritualReliefOpacity,shieldOpacity,threatCells=0)=>
 Object.freeze({mode,courtRingOpacity,ritualGlyphOpacity,ritualConduitOpacity,
  ritualReliefOpacity,shieldOpacity,threatCells});
export function planWardenCourtPriority(s){
 const boss=Array.isArray(s?.units)?s.units.find(u=>u?.kind==='warden'):null;
 if(!boss)return priority('inactive',.62,.70,.56,.46,.24);
 if(!(Number.isFinite(boss.hp)&&boss.hp>0))return priority('vanquished',.12,.22,.15,.18,.08);
 const n=Array.isArray(s?.map)?s.map.length:0;
 const warning=s?.bossWarning,cells=warning?.cells;
 const trueWarning=Number.isSafeInteger(s.tick)&&Number.isSafeInteger(warning?.attackTick)&&
  warning.attackTick>=s.tick&&warning.attackTick<=s.tick+3&&n>=5&&n<=64&&
  Array.isArray(cells)&&cells.length>0&&cells.length<=48&&cells.every(c=>
   Number.isInteger(c?.x)&&Number.isInteger(c?.z)&&c.x>=0&&c.z>=0&&c.x<n&&c.z<n);
 if(trueWarning)return priority('warning',.095,.26,.22,.30,.10,cells.length);
 if(boss.action==='cast'&&boss.actionTick===s?.tick)return priority('release',.16,.38,.32,.42,.13);
 if(s.guardianWard!==true&&Number.isInteger(s?.bossRecovery?.remaining)&&s.bossRecovery.remaining>0)
  return priority('counter',.19,.40,.32,.43,.17);
 if(s?.guardianWard===true)return priority('sealed',.56,.67,.52,.46,.24);
 return priority('approach',.60,.70,.56,.46,.24);
}
