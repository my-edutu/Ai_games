/**
 * Read-only, per-snapshot contact staging for real autonomous RPG actors.
 *
 * Several agents can legally share one authoritative grid cell (including
 * the initial three-hero spawn). Rendering them at the exact centre hides
 * their anatomy, weapons and reactions. Separate only their *visual* poses
 * within the same cell. This NEVER modifies navigation, target legality,
 * attacks, collision, saves, replay, or the authoritative positions.
 */
export const MAX_STAGE_OFFSET=.275;
const MAX_ACTORS=18;
const isGrid=n=>Number.isInteger(n)&&n>=0&&n<=63;
const aliveInFrame=(u,s)=>u.hp>0||(u.hp===0&&u.action==='hurt'&&u.actionTick===s.tick);

export function planCombatStage(snapshot){
 const placed=Object.create(null);
 if(!Array.isArray(snapshot?.map)||!Array.isArray(snapshot?.units))return placed;
 const buckets=new Map();
 for(const u of snapshot.units.slice(0,MAX_ACTORS)){
  if(!u||typeof u.id!=='string'||!u.id||u.id.length>128||
    !isGrid(u.x)||!isGrid(u.z)||!Number.isSafeInteger(u.hp)||
    snapshot.map[u.z]?.[u.x]!=='.'||!aliveInFrame(u,snapshot))continue;
  const key=u.x+','+u.z;
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push(u);
 }
 for(const group of buckets.values()){
  group.sort((a,b)=>Number(a.faction!=='party')-Number(b.faction!=='party')||
   a.id.localeCompare(b.id,'en'));
  const n=group.length,radius=n<2?0:Math.min(MAX_STAGE_OFFSET,n===2?.265:.275);
  for(let i=0;i<n;i++){
   // Deterministic circular poses; no Math.random, wall time, or per-frame
   // simulation. Every offset fits inside its own tile's footprint.
   const theta=n<2?0:(2*Math.PI*i/n)-Math.PI/2;
   const dx=Number((Math.cos(theta)*radius).toFixed(4));
   const dz=Number((Math.sin(theta)*radius).toFixed(4));
   const u=group[i];
   placed[u.id]=Object.freeze({x:u.x+dx,z:u.z+dz,dx,dz,crowded:n>1});
  }
 }
 return placed;
}
export function stagePoint(positions,unit){
 if(!unit||!Number.isFinite(unit.x)||!Number.isFinite(unit.z))return null;
 return positions?.[unit.id]??{x:unit.x,z:unit.z,dx:0,dz:0,crowded:false};
}
