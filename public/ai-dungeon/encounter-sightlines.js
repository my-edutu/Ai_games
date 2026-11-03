/**
 * Small, deterministic, render-only list of camera cutaway targets.
 * During a live Warden engagement, walls and decorative cladding must clear
 * the boss sightline as well as the three heroes. No simulation state changes.
 */
export function planEncounterSightlines(state,focus,encounter=false){
 const size=Array.isArray(state?.map)&&state.map.length>0&&state.map.length<=64?state.map.length:19;
 const origin=(size-1)/2,units=Array.isArray(state?.units)?state.units:[];
 const subjects=[];
 const valid=u=>u&&u.hp>0&&Number.isFinite(u.x)&&Number.isFinite(u.z)&&u.x>=0&&u.z>=0&&u.x<size&&u.z<size;
 // Retain camera sightlines to the ACTUAL deceased party throughout a true
 // intermission wipe. Previously zero living heroes caused the foreground
 // masonry and boss arena ornament to obscure all fallen 3D bodies.
 const party=units.filter(u=>u?.faction==='party');
 if(state?.phase==='intermission'&&party.length>0&&party.every(u=>
   u.hp===0&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&
   u.x>=0&&u.z>=0&&u.x<size&&u.z<size)){
  return party.slice(0,4).map(u=>({x:u.x-origin,z:u.z-origin}));
 }
 // Four living heroes are the hard bound; camera work never scales with mob count.
 for(const u of units){
  if(u?.faction!=='party'||!valid(u))continue;
  subjects.push({x:u.x-origin,z:u.z-origin});
  if(subjects.length===4)break;
 }
 // Keep this fifth, high-priority ray only during an actual boss encounter.
 if(encounter&&subjects.length){
  const warden=units.find(u=>u?.kind==='warden'&&valid(u));
  if(warden)subjects.push({x:warden.x-origin,z:warden.z-origin});
 }
 // A genuine attacked enemy is a cinematic subject, not scenery. During
 // current same-row/column, wall-clear contact, reveal the actual enemy's
 // anatomy and the attack lane. Never synthesize an action or alter the grid.
 if(subjects.length>0&&subjects.length<5){
  const target=units.find(enemy=>enemy?.faction==='enemy'&&valid(enemy)&&
   typeof enemy.id==='string'&&enemy.id.length>0&&enemy.id.length<=128&&
   units.some(hero=>{
    if(hero?.faction!=='party'||!valid(hero)||!['attack','cast'].includes(hero.action)||
     hero.targetId!==enemy.id||!Number.isSafeInteger(hero.actionTick)||
     !Number.isSafeInteger(state?.tick)||hero.actionTick>state.tick||
     state.tick-hero.actionTick>3)return false;
    const steps=Math.abs(hero.x-enemy.x)+Math.abs(hero.z-enemy.z);
    if(steps<1||steps>4||(hero.x!==enemy.x&&hero.z!==enemy.z))return false;
    const dx=Math.sign(enemy.x-hero.x),dz=Math.sign(enemy.z-hero.z);
    for(let k=1;k<steps;k++)if(state.map[hero.z+dz*k]?.[hero.x+dx*k]!=='.')return false;
    return true;
   }));
  if(target&&!subjects.some(p=>p.x===target.x-origin&&p.z===target.z-origin))
   subjects.push({x:target.x-origin,z:target.z-origin});
 }
 if(!subjects.length)subjects.push(Number.isFinite(focus?.x)&&Number.isFinite(focus?.z)?{x:focus.x,z:focus.z}:{x:0,z:0});
 return subjects;
}
/**
 * Bring the nearest REAL hostile into the same physical camera-to-party cutaway
 * during a genuine hostile shot. The old spectator only cut a ray to enemies
 * *after* an attack action had fired, leaving the opening confrontation hidden
 * behind Gothic stonework. This bounded scene-only supplement reveals the
 * approaching attacker early enough to read its silhouette and warning.
 *
 * A hostile must be alive, within three legal cells of a living protagonist,
 * and on an unblocked floor corridor (straight or a one-turn L). This cannot
 * alter AI target selection, attack legality, line of fire or combat outcomes.
 */
export function planCombatSightlineExtension(state,base,mode){
 const existing=Array.isArray(base)?base.filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z)).slice(0,5):[];
 if(!['skirmish-approach','contact','breach-warning','oathguard-cover'].includes(mode)||
    existing.length>=5||!Array.isArray(state?.map)||!Array.isArray(state?.units))return existing;
 const size=state.map.length,origin=(size-1)/2;
 if(!Number.isInteger(size)||size<3||size>64)return existing;
 const valid=u=>u&&u.hp>0&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&
  u.x>=0&&u.z>=0&&u.x<size&&u.z<size&&state.map[u.z]?.[u.x]==='.';
 const heroes=state.units.filter(u=>u?.faction==='party'&&valid(u)).slice(0,4);
 if(!heroes.length)return existing;
 const clear=(x,z)=>state.map[z]?.[x]==='.';
 // Exactly one bend is permitted: never expose a distant hidden room through
 // solid masonry. Rendering alone cannot make a new tactical path legal.
 const lane=(a,b)=>{
  const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
  let straight=true;
  if(a.x===b.x||a.z===b.z){
   for(let x=a.x+dx,z=a.z+dz;x!==b.x||z!==b.z;x+=dx,z+=dz)if(!clear(x,z))straight=false;
   return straight;
  }
  const via=(firstX)=>{
   let x=a.x,z=a.z;
   while((firstX?x!==b.x:z!==b.z)){
    if(firstX)x+=dx;else z+=dz;
    if(!clear(x,z))return false;
   }
   while((firstX?z!==b.z:x!==b.x)){
    if(firstX)z+=dz;else x+=dx;
    if(!clear(x,z))return false;
   }
   return true;
  };
  return via(true)||via(false);
 };
 const candidates=state.units.filter(u=>u?.faction==='enemy'&&u.kind!=='warden'&&valid(u)).map(enemy=>{
  let nearest=Infinity;
  for(const hero of heroes){
   const d=Math.abs(hero.x-enemy.x)+Math.abs(hero.z-enemy.z);
   if(d>=1&&d<=3&&d<nearest&&lane(hero,enemy))nearest=d;
  }
  return {enemy,nearest};
 }).filter(({enemy,nearest})=>nearest<=3&&
  !existing.some(p=>p.x===enemy.x-origin&&p.z===enemy.z-origin))
  .sort((a,b)=>a.nearest-b.nearest||String(a.enemy.id).localeCompare(String(b.enemy.id)));
 if(!candidates.length)return existing;
 const nearest=candidates[0].enemy;
 return [...existing,{x:nearest.x-origin,z:nearest.z-origin}];
}

