/**
 * M1: the physical world yields the stage to a GENUINE live fight.
 * Both existing instanced atmospheres use this exact semantic priority, so
 * spectral clutter cannot hide native silhouettes or Warden ground warnings.
 * Read-only, bounded, deterministic, with no invented AI/hit/animation state.
 */
const valid=(u,map)=>u&&u.hp>0&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&
 u.x>0&&u.z>0&&u.x<map.length-1&&u.z<map.length-1&&
 map[u.z]?.[u.x]==='.';
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
function clearAttackLane(map,a,b){
 const steps=distance(a,b),dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
 if(steps<1||steps>4||(a.x!==b.x&&a.z!==b.z))return false;
 for(let i=1;i<steps;i++)if(map[a.z+dz*i]?.[a.x+dx*i]!=='.')return false;
 return true;
}
export function planCombatQuietZone(state){
 if(state?.phase!=='exploring'||!Number.isSafeInteger(state?.tick)||
  !Array.isArray(state?.map)||state.map.length<5||state.map.length>64||
  !state.map.every(row=>typeof row==='string'&&row.length===state.map.length)||
  !Array.isArray(state?.units))return null;
 const map=state.map,size=(map.length-1)/2;
 const heroes=state.units.filter(u=>u?.faction==='party'&&valid(u,map)).slice(0,4);
 const foes=state.units.filter(u=>u?.faction==='enemy'&&valid(u,map)).slice(0,32);
 if(!heroes.length||!foes.length)return null;
 const boss=foes.find(u=>u.kind==='warden');
 const warning=Boolean(boss&&state.bossWarning&&
  Number.isSafeInteger(state.bossWarning.attackTick)&&
  state.bossWarning.attackTick>=state.tick&&state.bossWarning.attackTick<=state.tick+3&&
  Array.isArray(state.bossWarning.cells)&&state.bossWarning.cells.length>0);
 const candidates=[];
 for(const hero of heroes)for(const foe of foes){
  const d=distance(hero,foe);
  if(d>6||d<1)continue;
  const isWarning=warning&&foe===boss;
  const isStrike=(hero.action==='attack'||hero.action==='cast')&&hero.targetId===foe.id&&
   Number.isSafeInteger(hero.actionTick)&&hero.actionTick<=state.tick&&
   state.tick-hero.actionTick<=3&&clearAttackLane(map,hero,foe);
  if(!isWarning&&!isStrike)continue;
  candidates.push({hero,foe,d,priority:isWarning?0:1});
 }
 candidates.sort((a,b)=>a.priority-b.priority||a.d-b.d||
  String(a.hero.id).localeCompare(String(b.hero.id))||
  String(a.foe.id).localeCompare(String(b.foe.id)));
 const pair=candidates[0];if(!pair)return null;
 return Object.freeze({
  mode:pair.priority===0?'boss-warning':'combat',
  x:(pair.hero.x+pair.foe.x)*.5-size,z:(pair.hero.z+pair.foe.z)*.5-size,
  radius:pair.priority===0?5.0:3.65,
  actorIds:Object.freeze([pair.hero.id,pair.foe.id])
 });
}
export function ambientVisibilityAt(x,z,zone){
 if(!zone||!Number.isFinite(x)||!Number.isFinite(z))return 1;
 const d=Math.hypot(x-zone.x,z-zone.z);
 const inner=zone.mode==='boss-warning'?2.75:2.15;
 if(d<=inner)return .22;
 if(d>=zone.radius)return 1;
 const t=(d-inner)/Math.max(.01,zone.radius-inner);
 // Smooth transition with no flickering threshold or random lighting.
 return .22+.78*t*t*(3-2*t);
}
