/**
 * Original Gothic nave chapters from genuine walkable map cells.
 * Never invents a corridor, room, enemy, danger or collision tile.
 */
const motifs=Object.freeze(['OSSUARY','FORGE','ASTRAL','SCRIPTORIUM']);
const hash=(x,z,s)=>{let v=Math.imul(x+73,374761393)^Math.imul(z+19,668265263)^Math.imul(s+41,1274126177);v=Math.imul(v^(v>>>13),1274126177);return(v^(v>>>16))>>>0;};
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const immutable=a=>Object.freeze(a.map(entry=>Object.freeze(entry)));
export function planChapterNaves(map,exit,floor,encounterUnits=[]){
 const empty=Object.freeze({rooms:Object.freeze([]),reliefs:Object.freeze([]),rosettes:Object.freeze([])});
 if(!Array.isArray(map)||map.length<9||map.length>64||
    !Number.isInteger(floor)||floor<1||!Number.isInteger(exit?.x)||!Number.isInteger(exit?.z))return empty;
 const n=map.length;
 if(!map.every(row=>typeof row==='string'&&row.length===n&&/^[.#]+$/.test(row))||map[exit.z]?.[exit.x]!=='.')return empty;
 const open=(x,z)=>map[z]?.[x]==='.';
 const candidates=[];
 for(let z=2;z<n-2;z++)for(let x=2;x<n-2;x++){
  // Keep chapter arches and rosettes OUTSIDE the authored Warden Court.
  // The court's real 7x7 walkable fighting lane plus its masonry perimeter
  // belongs to the living boss, allied silhouettes and genuine telegraphs.
  if(!open(x,z)||Math.max(Math.abs(x-exit.x),Math.abs(z-exit.z))<=4)continue;
  let count=0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(open(x+dx,z+dz))count++;
  if(count===9)candidates.push({x,z,distance:dist({x,z},exit),grain:hash(x,z,floor)});
 }
 candidates.sort((a,b)=>a.distance-b.distance||a.grain-b.grain||a.z-b.z||a.x-b.x);
 // Locate real chapter battles first. Previously three handsome Gothic naves
 // were often assembled over EMPTY rooms while the actual spawned cultists
 // fought elsewhere. Prefer genuine living, non-Warden enemies occupying
 // legal walkable 3x3 courts. This is presentation-only: real units, floor,
 // movement, save/replay and collision remain entirely authoritative.
 const chosen=[];
 const threats=Array.isArray(encounterUnits)?encounterUnits.slice(0,24).filter(u=>
  u&&typeof u.id==='string'&&u.id.length<=128&&u.faction==='enemy'&&
  u.kind!=='warden'&&Number.isInteger(u.hp)&&u.hp>0&&
  Number.isInteger(u.x)&&Number.isInteger(u.z)&&open(u.x,u.z)&&
  dist(u,exit)>=5&&dist(u,{x:1,z:1})>=5):[];
 const chapterFights=[];
 for(const candidate of candidates){
  if(candidate.distance<5||dist(candidate,{x:1,z:1})<5)continue;
  const near=threats.map(u=>({u,steps:Math.max(Math.abs(u.x-candidate.x),
   Math.abs(u.z-candidate.z))})).filter(entry=>entry.steps<=1)
   .sort((a,b)=>a.steps-b.steps||a.u.id.localeCompare(b.u.id,'en'))[0];
  if(near)chapterFights.push({...candidate,sourceThreatId:near.u.id,
   sourceThreatSteps:near.steps});
 }
 chapterFights.sort((a,b)=>a.sourceThreatSteps-b.sourceThreatSteps||
  dist(a,{x:1,z:1})-dist(b,{x:1,z:1})||
  a.grain-b.grain||a.z-b.z||a.x-b.x);
 for(const court of chapterFights){
  if(chosen.length>=3)break;
  if(chosen.every(room=>Math.hypot(room.x-court.x,room.z-court.z)>=5))
   chosen.push(court);
 }
 // No live ordinary foe? Keep the original deterministic architectural tour.
 // Even without a living ordinary foe, retain genuine remote architecture,
 // never a duplicate chapter rosette inside the genuine Warden sightline.
 if(candidates.length&&!chosen.length)chosen.push(candidates[0]);
 const remote=candidates.slice().sort((a,b)=>b.distance-a.distance||
  a.grain-b.grain||a.z-b.z||a.x-b.x);
 for(const candidate of remote){
  if(chosen.length>=3)break;
  if(chosen.every(room=>Math.hypot(room.x-candidate.x,room.z-candidate.z)>=5))
   chosen.push(candidate);
 }
 const center=(n-1)/2,rooms=[],reliefs=[],rosettes=[],used=new Set();
 for(let i=0;i<chosen.length;i++){
  const room=chosen[i];
  rooms.push({x:room.x-center,z:room.z-center,gridX:room.x,gridZ:room.z,
   kind:motifs[(floor-1+i)%4],chapterSource:room.sourceThreatId?'living-foe':'walkable-topology',
   ...(room.sourceThreatId?{sourceThreatId:room.sourceThreatId}:{})});
  for(let j=0;j<16;j++){
   const theta=(j+(room.grain%7)*.032)*2*Math.PI/16;
   rosettes.push({x:room.x-center+Math.cos(theta)*.59,z:room.z-center+Math.sin(theta)*.59,yaw:theta,room:i});
  }
  const faces=[];
  for(let z=Math.max(1,room.z-4);z<=Math.min(n-2,room.z+4);z++)
   for(let x=Math.max(1,room.x-4);x<=Math.min(n-2,room.x+4);x++){
    if(map[z][x]!=='#'||Math.max(Math.abs(x-exit.x),Math.abs(z-exit.z))<=4)continue;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
     if(!open(x+dx,z+dz))continue;
     const key=x+':'+z+':'+dx+':'+dz;
     if(used.has(key))continue;
     const distance=Math.hypot(x+dx-room.x,z+dz-room.z);
     if(distance>4.4)continue;
     faces.push({x:x-center+dx*.515,z:z-center+dz*.515,yaw:Math.atan2(dx,dz),
      gridX:x,gridZ:z,faceX:dx,faceZ:dz,distance,
      grain:hash(x+dx,z+dz,floor+i),key,room:i});
    }
   }
  faces.sort((a,b)=>a.distance-b.distance||a.grain-b.grain);
  for(const face of faces.slice(0,8)){
   used.add(face.key);
   const {key,...entry}=face;reliefs.push(entry);
  }
 }
 return Object.freeze({rooms:immutable(rooms),reliefs:immutable(reliefs),rosettes:immutable(rosettes)});
}
export function planChapterTension(snapshot){
 const boss=snapshot?.units?.find(u=>u.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
 if(!boss)return Object.freeze({phase:'NONE',warning:false,light:.045});
 const warning=Array.isArray(snapshot.bossWarning?.cells)&&snapshot.bossWarning.cells.length>0&&
  Number.isSafeInteger(snapshot.bossWarning.attackTick)&&Number.isSafeInteger(snapshot.tick)&&
  snapshot.bossWarning.attackTick>=snapshot.tick&&snapshot.bossWarning.attackTick<=snapshot.tick+3;
 const phase=['SENTINEL','RUPTURE','ECLIPSE'].includes(snapshot.bossPhase)?snapshot.bossPhase:'SENTINEL';
 return Object.freeze({phase,warning,light:warning?.42:phase==='ECLIPSE'?.26:phase==='RUPTURE'?.16:.085});
}

/**
 * Live chapter scene beat derived only from authentic source units and
 * positive HP decreases on the SAME authoritative run and floor.
 * This never creates a move, attack, injury, trigger or navigable cell.
 */
export function planChapterEncounterBeat(snapshot,previous,rooms){
 const empty=Object.freeze({rooms:Object.freeze([]),focusRoom:-1,contestedRooms:0,authenticWounds:0,authorityChanged:false});
 if(!Array.isArray(snapshot?.units)||!Array.isArray(rooms)||rooms.length>3||
  !Number.isSafeInteger(snapshot.run)||!Number.isSafeInteger(snapshot.floor))return empty;
 const same=previous?.run===snapshot.run&&previous?.floor===snapshot.floor;
 const previousHP=new Map(same?(previous.units||[]).filter(u=>
  typeof u?.id==='string'&&Number.isFinite(u.hp)).map(u=>[u.id,u.hp]):[]);
 const units=snapshot.units.filter(u=>u&&typeof u.id==='string'&&
  Number.isInteger(u.x)&&Number.isInteger(u.z)&&Number.isFinite(u.hp)&&
  (u.faction==='party'||u.faction==='enemy'));
 const wounded=units.filter(u=>previousHP.has(u.id)&&previousHP.get(u.id)>u.hp);
 let focusRoom=-1,contestedRooms=0,authenticWounds=0;
 const stages=rooms.map((room,i)=>{
  if(!Number.isInteger(room?.gridX)||!Number.isInteger(room?.gridZ))
   return Object.freeze({index:i,phase:'QUIET',party:0,enemies:0,wounds:0,intensity:0});
  const near=u=>Math.max(Math.abs(u.x-room.gridX),Math.abs(u.z-room.gridZ))<=2;
  const allies=units.filter(u=>u.faction==='party'&&u.hp>0&&near(u));
  const hostiles=units.filter(u=>u.faction==='enemy'&&u.hp>0&&near(u));
  const party=allies.length,enemies=hostiles.length;
  const wounds=wounded.filter(near).length;
  const contested=party>0&&enemies>0;
  // Track only actual living bodies in this very court. A dramatic practical
  // must light their midpoint, never a decorative chamber with no combat.
  // This is NOT a claim that these actors attacked or that damage occurred.
  let pairing=null;
  for(const hero of allies)for(const foe of hostiles){
   const steps=dist(hero,foe);
   const candidate={heroId:hero.id,enemyId:foe.id,steps,
    gridX:(hero.x+foe.x)/2,gridZ:(hero.z+foe.z)/2};
   if(!pairing||steps<pairing.steps||
    steps===pairing.steps&&(hero.id+'|'+foe.id)<(pairing.heroId+'|'+pairing.enemyId))
    pairing=candidate;
  }
  if(contested){contestedRooms++;if(focusRoom<0)focusRoom=i;}
  authenticWounds+=wounds;
  return Object.freeze({index:i,phase:contested?'CONTESTED':enemies?'THREATENED':party?'EXPEDITION':'QUIET',
   party,enemies,wounds,intensity:contested?1:enemies?.45:party?.22:0,
   livePair:pairing?Object.freeze(pairing):null});
 });
 return Object.freeze({rooms:Object.freeze(stages),focusRoom,contestedRooms,authenticWounds,authorityChanged:false});
}
