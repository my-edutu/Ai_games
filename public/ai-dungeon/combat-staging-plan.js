/**
 * Read-only, per-snapshot contact staging for real autonomous RPG actors.
 *
 * Several agents can legally share one authoritative grid cell (including
 * the initial three-hero spawn). Rendering them at the exact centre hides
 * their anatomy, weapons and reactions. Separate only their *visual* poses
 * within the same cell. This NEVER modifies navigation, target legality,
 * attacks, collision, saves, replay, or the authoritative positions.
 */
export const MAX_STAGE_OFFSET=.44;
const MAX_ACTORS=18;
const isGrid=n=>Number.isInteger(n)&&n>=0&&n<=63;
const aliveInFrame=(u,s)=>u.hp>0||(u.hp===0&&u.action==='hurt'&&u.actionTick===s.tick);


/**
 * M1 battle blocking: read-only projected silhouettes in real cross-cell
 * skirmishes. Previous true-contact pair staging does not resolve an entire
 * party engaging multiple opponents in a tight corridor. All actors and
 * forged impacts keep the same legal coordinates and shared stagePoint.
 */
const ENSEMBLE_LIMIT=.434;
function ensemblePairs(s,positions,view){
 if(s?.bossWarning||!Number.isFinite(view?.x)||!Number.isFinite(view?.z))return [];
 const n=s.map?.length;if(!Number.isInteger(n)||n<3||n>64)return [];
 const boss=s.units.find(u=>u?.kind==='warden'&&u.hp>0);
 const us=s.units.filter(u=>u?.hp>0&&u.kind!=='warden'&&positions[u.id]&&
  s.map[u.z]?.[u.x]==='.').sort((a,b)=>a.id.localeCompare(b.id,'en'));
 const pairs=[],half=(n-1)/2;
 for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++){
  const a=us[i],b=us[j],distance=Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  if(distance<1||distance>2||(a.faction!=='party'&&b.faction!=='party'))continue;
  // Boss warnings and true close-range Warden choreography have precedence.
  if(boss&&[a,b].some(u=>Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=5))continue;
  const vx=view.x-((a.x+b.x)/2-half),vz=view.z-((a.z+b.z)/2-half);
  const len=Math.hypot(vx,vz);if(len<.8)continue;
  const depth=Math.abs((b.x-a.x)*vx/len+(b.z-a.z)*vz/len);
  if(depth>1.18)continue;
  pairs.push({a,b,rx:vz/len,rz:-vx/len,fx:vx/len,fz:vz/len,
   target:a.faction===b.faction?.71:.85});
 }
 return pairs;
}
function silhouetteDeficit(positions,p){
 const a=positions[p.a.id],b=positions[p.b.id];
 const dx=b.x-a.x,dz=b.z-a.z;
 const lateral=dx*p.rx+dz*p.rz,depth=Math.abs(dx*p.fx+dz*p.fz);
 return {lateral,deficit:depth>=.94?0:
  Math.max(0,p.target-Math.abs(lateral))*(1-Math.min(.45,depth*.35))};
}
function ensemblePoint(u,p,dx,dz){
 const radius=Math.hypot(dx,dz),factor=radius>ENSEMBLE_LIMIT?ENSEMBLE_LIMIT/radius:1;
 dx=Number((dx*factor).toFixed(4));dz=Number((dz*factor).toFixed(4));
 return Object.freeze({x:u.x+dx,z:u.z+dz,dx,dz,crowded:true});
}
/** Rendering diagnostic; a geometric overlap estimate, NOT an art score. */
export function inspectBattlefieldCrowding(s,positions,view){
 const pairs=ensemblePairs(s,positions,view);let overlaps=0,deficit=0;
 for(const pair of pairs){const v=silhouetteDeficit(positions,pair);
  if(v.deficit>.08){overlaps++;deficit+=v.deficit;}}
 return Object.freeze({comparedPairs:pairs.length,overlaps,
  summedDeficit:Number(deficit.toFixed(3))});
}
function relieveBattlefieldCrowding(s,placed,view){
 const pairs=ensemblePairs(s,placed,view);
 // Three bounded camera-oriented settlement passes, no elapsed time or RNG.
 for(let pass=0;pass<3;pass++)for(const pair of pairs){
  const old=silhouetteDeficit(placed,pair);if(old.deficit<.065)continue;
  const a=placed[pair.a.id],b=placed[pair.b.id];
  const sign=Math.abs(old.lateral)>.001?Math.sign(old.lateral):1;
  const motion=Math.min(.175,old.deficit*.51);
  const pa=ensemblePoint(pair.a,a,a.dx-pair.rx*sign*motion,a.dz-pair.rz*sign*motion);
  const pb=ensemblePoint(pair.b,b,b.dx+pair.rx*sign*motion,b.dz+pair.rz*sign*motion);
  const trial={...placed,[pair.a.id]:pa,[pair.b.id]:pb};
  if(silhouetteDeficit(trial,pair).deficit+.008<old.deficit){
   placed[pair.a.id]=pa;placed[pair.b.id]=pb;
  }
 }
 return placed;
}

/**
 * Settle truly displayed skinned bodies INSIDE their legal walkable tile.
 * Camera-oriented combat tableaux previously shifted fighters by up to .44m,
 * visibly burying a human-scale chest, sword or boot in adjacent solid stone.
 * Cosmetic only; stagePoint uses these identical positions for physical FX.
 */
export function settleStoneSafeCombatStances(snapshot,placed){
 if(!snapshot||!Array.isArray(snapshot.map)||!Array.isArray(snapshot.units))return placed;
 const next=Object.create(null),map=snapshot.map;
 for(const u of snapshot.units.slice(0,MAX_ACTORS)){
  const pose=placed[u?.id];if(!pose||!isGrid(u.x)||!isGrid(u.z)||map[u.z]?.[u.x]!=='.')continue;
  const padding=u.kind==='warden'?.40:u.kind==='vanguard'?.31:.26;
  const clearance=.5-padding;
  let dx=pose.dx,dz=pose.dz;
  if(map[u.z]?.[u.x+1]==='#')dx=Math.min(dx,clearance);
  if(map[u.z]?.[u.x-1]==='#')dx=Math.max(dx,-clearance);
  if(map[u.z+1]?.[u.x]==='#')dz=Math.min(dz,clearance);
  if(map[u.z-1]?.[u.x]==='#')dz=Math.max(dz,-clearance);
  const sx=Math.sign(dx),sz=Math.sign(dz);
  if(sx&&sz&&map[u.z+sz]?.[u.x+sx]==='#'&&Math.abs(dx)>.24&&Math.abs(dz)>.24){
   const limit=u.kind==='warden'?.20:.24;
   dx=sx*Math.min(Math.abs(dx),limit);
   dz=sz*Math.min(Math.abs(dz),limit);
  }
  dx=Number(dx.toFixed(4));dz=Number(dz.toFixed(4));
  next[u.id]=Object.freeze({x:u.x+dx,z:u.z+dz,dx,dz,crowded:pose.crowded,
   stoneSafe:Math.abs(dx-pose.dx)>.0001||Math.abs(dz-pose.dz)>.0001});
 }
 return next;
}

export function planCombatStage(snapshot,viewPosition=null){
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
 // The boss owns a genuine large animated silhouette. A lone hero in the
 // adjacent two tiles stands one short step back INSIDE the same legal cell;
 // weapon contact still uses these actual visible staged coordinates. This
 // is optical separation, never authority movement, dodge or attack reach.
 const warden=snapshot.units.find(u=>u?.kind==='warden'&&u.hp>0&&
  isGrid(u.x)&&isGrid(u.z)&&snapshot.map[u.z]?.[u.x]==='.');
 // The true post-shockwave recovery is an earned opportunity, and the
 // physically large boss should cede space to the last real defender. A
 // controlled recoil stays INSIDE its authoritative cell, preserving hitboxes
 // and the shared combat/VFX staging coordinates; imminent warnings never
 // displace the boss relative to its dangerous floor marker.
 const exposed=Boolean(warden&&!snapshot.guardianWard&&!snapshot.bossWarning&&
  Number.isSafeInteger(snapshot.bossRecovery?.remaining)&&
  snapshot.bossRecovery.remaining>=1&&snapshot.bossRecovery.remaining<=6);
 const nearest=exposed?snapshot.units.filter(u=>u?.faction==='party'&&u.hp>0&&
  isGrid(u.x)&&isGrid(u.z)&&snapshot.map[u.z]?.[u.x]==='.')
  .sort((a,b)=>(Math.abs(a.x-warden.x)+Math.abs(a.z-warden.z))-
    (Math.abs(b.x-warden.x)+Math.abs(b.z-warden.z))||a.id.localeCompare(b.id,'en'))[0]:null;
 for(const group of buckets.values()){
  group.sort((a,b)=>Number(a.faction!=='party')-Number(b.faction!=='party')||
   a.id.localeCompare(b.id,'en'));
  // Four or more real co-located bodies now occupy a wider, still legal
  // camera-stable visual ensemble; no movement, damage or targeting changes.
  const n=group.length,radius=n<2?0:n===2?.265:n===3?.275:
   Math.min(MAX_STAGE_OFFSET-.015,.31+Math.min(n,10)*.012);
  // A real camera sees several heroes at exactly one public grid coordinate
  // as one toy-like clump. Spread up to three real co-located figures in a
  // small *screen-horizontal* tableau without changing the authoritative tile.
  // This shares one frozen snapshot/camera with the physical blade director.
  const centre=group[0],half=(snapshot.map.length-1)/2;
  const vx=Number.isFinite(viewPosition?.x)?viewPosition.x-(centre.x-half):NaN;
  const vz=Number.isFinite(viewPosition?.z)?viewPosition.z-(centre.z-half):NaN;
  const vLength=Math.hypot(vx,vz),cameraLine=n>=2&&
   Number.isFinite(vLength)&&vLength>.5;
  const screenRight=cameraLine?{x:vz/vLength,z:-vx/vLength}:null;
  for(let i=0;i<n;i++){
   // Keep the old stable circle for no camera, big crowds, and offscreen
   // staging. Neither clock time nor world occupancy affects the result.
   const theta=n<2?0:(2*Math.PI*i/n)-Math.PI/2;
   let dx=Number((Math.cos(theta)*radius).toFixed(4));
   let dz=Number((Math.sin(theta)*radius).toFixed(4));
   if(cameraLine&&n<=3){
    const lateral=(i-(n-1)/2)*(n===3?.405:.60);
    // A slight depth step prevents literal coincident feet at the middle.
    const depth=n===3&&i===1?-.085:.035;
    dx=Number((screenRight.x*lateral+(vx/vLength)*depth).toFixed(4));
    dz=Number((screenRight.z*lateral+(vz/vLength)*depth).toFixed(4));
   }else if(cameraLine){
    // The real four-to-six-body melee scrum needs a legible FRONTLINE,
    // not a round pile of helmets: real party bodies occupy the nearer
    // row while opposing enemies sit behind, with each still within its
    // own legal authority tile. Both skinned weapons and true HP effects
    // consume these exact same staged world coordinates.
    const tableaux={
     4:[[-.38,.18],[.38,.18],[-.38,-.18],[.38,-.18]],
     5:[[-.37,.19],[0,.40],[.37,.19],[-.37,-.19],[.37,-.19]],
     6:[[-.39,.15],[0,.39],[.39,.15],[-.39,-.15],[0,-.39],[.39,-.15]]
    };
    const lane=tableaux[n]?.[i];
    const lateral=lane?lane[0]:Math.cos(theta)*radius;
    const depth=lane?lane[1]:Math.sin(theta)*radius;
    dx=Number((screenRight.x*lateral+(vx/vLength)*depth).toFixed(4));
    dz=Number((screenRight.z*lateral+(vz/vLength)*depth).toFixed(4));
   }
   const u=group[i];
   if(n===1&&u.id===warden?.id&&nearest){
    const backX=warden.x-nearest.x,backZ=warden.z-nearest.z;
    const tiles=Math.abs(backX)+Math.abs(backZ);
    if(tiles>=1&&tiles<=2){
     const norm=Math.hypot(backX,backZ);
     dx=Number((backX/norm*.38).toFixed(4));
     dz=Number((backZ/norm*.38).toFixed(4));
    }
   }
   if(n===1&&u.faction==='party'&&warden&&u.id!==warden.id){
    const awayX=u.x-warden.x,awayZ=u.z-warden.z;
    const steps=Math.abs(awayX)+Math.abs(awayZ);
    if(steps>=1&&steps<=2){
     const length=Math.hypot(awayX,awayZ);
     const margin=u.kind==='vanguard'?.31:.27;
     // A real camera-facing, screen-horizontal one-foot stance separates the
     // near defender's armor from the huge Warden shoulder. Never leave the
     // same grid cell or change damage reach. Both combat and VFX share this.
     const cameraDistance=Math.hypot(vx,vz);
     const right=cameraDistance>.5&&Number.isFinite(cameraDistance)?{x:vz/cameraDistance,z:-vx/cameraDistance}:null;
     const side=right&&right.x*awayX+right.z*awayZ>=0?1:-1;
     let shiftX=awayX/length*margin+(right?.x??0)*.16*side;
     let shiftZ=awayZ/length*margin+(right?.z??0)*.16*side;
     const magnitude=Math.hypot(shiftX,shiftZ);
     if(magnitude>MAX_STAGE_OFFSET){const factor=MAX_STAGE_OFFSET/magnitude;shiftX*=factor;shiftZ*=factor;}
     dx=Number(shiftX.toFixed(4));
     dz=Number(shiftZ.toFixed(4));
    }
   }
   placed[u.id]=Object.freeze({x:u.x+dx,z:u.z+dz,dx,dz,crowded:n>1});
  }
 }
 // An adjacent legal cell is NOT necessarily a visually separate character:
 // from the actual quarter-view camera, a diagonal encounter can project two
 // distinct heroes/enemies onto the same narrow silhouette. Make a modest,
 // reversible, camera-horizontal lane for only REAL adjacent opposite-faction
 // opponents; never alter their physical cells, contact targets or turn order.
 // A living Warden has a separately authored warning/duel composition and is
 // deliberately excluded from this general skirmish staging.
 if(!snapshot.bossWarning&&Number.isFinite(viewPosition?.x)&&Number.isFinite(viewPosition?.z)){
  const living=snapshot.units.slice(0,MAX_ACTORS)
   .filter(u=>u&&placed[u.id]&&u.hp>0&&u.kind!=='warden');
  const allies=living.filter(u=>u.faction==='party').sort((a,b)=>a.id.localeCompare(b.id,'en'));
  const foes=living.filter(u=>u.faction==='enemy').sort((a,b)=>a.id.localeCompare(b.id,'en'));
  const half=(snapshot.map.length-1)/2;
  const pairs=[];
  for(const hero of allies)for(const foe of foes){
   // The authority's ordinary melee lane is cardinal, never diagonal:
   // nearby diagonal silhouettes are not fabricated weapon contact.
   const cells=Math.abs(hero.x-foe.x)+Math.abs(hero.z-foe.z);
   if(cells!==1)continue;
   // A living Warden takes precedence ONLY in its real local arena.
   // An unopened boss elsewhere on the floor must not suppress ordinary
   // corridor skirmishes, or this visual improvement would never activate.
   if(warden&&[hero,foe].some(u=>
    Math.abs(u.x-warden.x)+Math.abs(u.z-warden.z)<=5))continue;
   const cx=(hero.x+foe.x)/2-half,cz=(hero.z+foe.z)/2-half;
   const vx=viewPosition.x-cx,vz=viewPosition.z-cz,length=Math.hypot(vx,vz);
   if(length<=.75)continue;
   pairs.push({hero,foe,rx:vz/length,rz:-vx/length});
  }
  const reposition=(u,side,rx,rz,amount)=>{
   const previous=placed[u.id];
   let dx=previous.dx+rx*side*amount,dz=previous.dz+rz*side*amount;
   // Radial as well as per-axis clamping keeps the skinned feet inside the
   // same legally occupied tile with a small clearance from its boundaries.
   const radial=Math.hypot(dx,dz),factor=radial>.435?.435/radial:1;
   dx=Number((dx*factor).toFixed(4));dz=Number((dz*factor).toFixed(4));
   placed[u.id]=Object.freeze({
    x:u.x+dx,z:u.z+dz,dx,dz,crowded:true
   });
  };
  // Two tiny bounded passes settle a camera-screen collision without a
  // per-frame allocator, stateful interpolation or a made-up gameplay move.
  for(let pass=0;pass<2;pass++)for(const {hero,foe,rx,rz} of pairs){
   const a=placed[hero.id],b=placed[foe.id];
   const projected=(b.x-a.x)*rx+(b.z-a.z)*rz;
   if(Math.abs(projected)>=.58)continue;
   const sign=Math.abs(projected)>.0001?Math.sign(projected):
    hero.id.localeCompare(foe.id,'en')<0?1:-1;
   const nudge=Math.min(.23,(.58-Math.abs(projected))*.48);
   reposition(hero,-sign,rx,rz,nudge);
   reposition(foe,sign,rx,rz,nudge);
  }
 }
 return settleStoneSafeCombatStances(snapshot,relieveBattlefieldCrowding(snapshot,placed,viewPosition));
}
export function stagePoint(positions,unit){
 if(!unit||!Number.isFinite(unit.x)||!Number.isFinite(unit.z))return null;
 return positions?.[unit.id]??{x:unit.x,z:unit.z,dx:0,dz:0,crowded:false};
}
