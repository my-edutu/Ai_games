/**
 * Pure visual witness of a REAL recorded Warden ground strike. No strike is
 * inferred from an animation, warning alone, gap in snapshots or a debug seed.
 * The public prior warning and subsequent authoritative impact event must
 * agree on shape, attack tick, run and floor before stone is visually scarred.
 */
const SHAPES=new Set(['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']);
export function planConfirmedWardenImpact(before,after){
 if(!before||!after||!Array.isArray(before.map)||!Array.isArray(before.units)||
  !Array.isArray(after.events)||!Number.isSafeInteger(before.tick)||
  !Number.isSafeInteger(after.tick)||after.tick<=before.tick||
  before.run!==after.run||before.floor!==after.floor||
  before.phase!=='exploring'||!['exploring','intermission'].includes(after.phase))return null;
 const warning=before.bossWarning;
 if(!warning||!SHAPES.has(warning.shape)||!Array.isArray(warning.cells)||
  !Number.isSafeInteger(warning.attackTick)||warning.attackTick<=before.tick||
  warning.attackTick>after.tick||
  !before.units.some(u=>u?.faction==='enemy'&&u.kind==='warden'&&u.hp>0))return null;
 const text='The Warden '+warning.shape.toLowerCase().replaceAll('_',' ')+' shockwave struck ';
 if(!after.events.some(e=>e?.tick===warning.attackTick&&
  (e.kind==='danger'||e.kind==='evade')&&typeof e.text==='string'&&
  e.text.startsWith(text)&&/^\d+ hero(?:es)?$/.test(e.text.slice(text.length))))return null;
 const map=before.map,n=map.length;
 if(n<7||n>41||map.some(row=>typeof row!=='string'||row.length!==n))return null;
 const seen=new Set(),cells=[];
 for(const c of warning.cells.slice(0,36)){
  if(!Number.isInteger(c?.x)||!Number.isInteger(c?.z)||c.x<0||c.z<0||
   c.x>=n||c.z>=n||map[c.z][c.x]!=='.')continue;
  const key=c.x+','+c.z;
  if(seen.has(key))continue;
  seen.add(key);cells.push(Object.freeze({x:c.x,z:c.z}));
 }
 if(!cells.length)return null;
 return Object.freeze({tick:warning.attackTick,run:after.run,floor:after.floor,
  shape:warning.shape,cells:Object.freeze(cells)});
}
