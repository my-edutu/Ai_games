/**
 * Truth-locked, scene-only cinematic grammar for the autonomous expedition.
 *
 * The camera reacts to what the authoritative game actually does: travel,
 * aligned attacks, a nearby living boss, and exact Warden strike warnings.
 * No private AI state, no fabricated contact, no randomness, no wall time.
 * A closer contact shot gives the existing skeletal characters more screen
 * presence; real danger pulls back to reveal the dangerous floor and an exit
 * lane. All lengths below are scene-space metres, never gameplay positions.
 */
const clip=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const valid=(u,n)=>u&&Number.isInteger(u.x)&&Number.isInteger(u.z)&&u.x>=0&&u.z>=0&&u.x<n&&u.z<n&&Number.isFinite(u.hp);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const mean=(a,b)=>({x:(a.x+b.x)/2,z:(a.z+b.z)/2});
const round=n=>Number(n.toFixed(3));
/**
 * Stage a real duel across the screen rather than stacking a giant foreground
 * Warden over three distant heroes. The fixed 3/4 camera placed boss and party
 * on the same depth axis in exact-head Chromium frames (artifact 13090029701).
 * A bounded side-quarter shot separates living combatants in screen space.
 * Keep a minor forward component so armor depth and weapon arcs remain visible.
 */
export function planDuelCameraOffset(hero,foe,height=8.2,radius=6.2){
 if(!valid(hero,64)||!valid(foe,64))return null;
 const dx=foe.x-hero.x,dz=foe.z-hero.z;
 const length=Math.hypot(dx,dz);
 if(length<.75)return null;
 const sideX=dz/length,sideZ=-dx/length;
 const sideSign=sideX+sideZ>=0?1:-1;
 const norm=Math.hypot(.91,.18);
 const viewX=(sideX*sideSign*.91+dx/length*.18)/norm;
 const viewZ=(sideZ*sideSign*.91+dz/length*.18)/norm;
 const h=clip(height,4.5,15),r=clip(radius,3.8,10.8);
 return Object.freeze([round(viewX*r),round(h),round(viewZ*r)]);
}
export function planCinematicShot(s,encounter=null,{width=1440,height=832,focusedHeroId='vanguard'}={}){
 const n=Array.isArray(s?.map)?s.map.length:0;
 if(n<3||n>64||!Array.isArray(s?.units))return null;
 const heroes=s.units.filter(u=>u.faction==='party'&&u.hp>0&&valid(u,n)).slice(0,4);
 if(!heroes.length)return null;
 const focus=heroes.find(u=>u.id===focusedHeroId)||heroes[0];
 const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0&&valid(u,n)).slice(0,64);
 const boss=enemies.find(u=>u.kind==='warden');
 const closeBoss=boss?heroes.slice().sort((a,b)=>distance(a,boss)-distance(b,boss)||a.id.localeCompare(b.id))[0]:null;
 const warning=!!boss&&s.bossWarning&&Number.isSafeInteger(s.bossWarning.attackTick)&&
  s.bossWarning.attackTick>=s.tick&&s.bossWarning.attackTick<=s.tick+3&&
  Array.isArray(s.bossWarning.cells)&&s.bossWarning.cells.length>0;
 // A verified final blow keeps an authentic dead enemy in frame only while
 // its public snapshot still holds the corpse; it is never a fabricated duel.
 const fallenFoe=encounter?.mode==='final-blow'?
  s.units.find(u=>u.id===encounter.targetId&&u.faction==='enemy'&&u.hp===0&&valid(u,n)):null;
 const realContact=(encounter?.mode==='contact'||Boolean(fallenFoe))&&
  typeof encounter.actorId==='string'&&typeof encounter.targetId==='string'&&
  heroes.some(h=>h.id===encounter.actorId)&&
  (enemies.some(u=>u.id===encounter.targetId)||Boolean(fallenFoe))&&
  Number.isFinite(encounter.x)&&Number.isFinite(encounter.z);
 let mode='journey',position={x:focus.x,z:focus.z},offsets=[5.0,8.2,5.65],lookY=.48,subjects=[focus.id];
 if(warning){
  // A telegraph is strategically more important than a close-up hit.
  // The center remains between the real boss and the closest living hero.
  mode='warden-warning';position=mean(boss,closeBoss);
  offsets=planDuelCameraOffset(closeBoss,boss,11.0,9.15)||[6.3,11.2,6.55];lookY=.25;subjects=[boss.id,closeBoss.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=5&&
  (!realContact||encounter.targetId!==boss.id)){
  // A remote ranger/cultist contact is genuine, but it must not cut away from
  // a Warden physically confronting the frontline. Preserve the actual
  // threatening boss and nearest living defender as the scene's subjects.
  mode='warden-approach';position=mean(closeBoss,boss);
  offsets=planDuelCameraOffset(closeBoss,boss,8.65,7.8)||[4.4,7.45,5.0];
  lookY=.70;subjects=[closeBoss.id,boss.id];
 }else if(realContact){
  const foe=enemies.find(u=>u.id===encounter.targetId)||fallenFoe;
  const hero=heroes.find(u=>u.id===encounter.actorId);
  mode=foe?.kind==='warden'?'warden-contact':'contact';
  position=mean(hero,foe);
  offsets=planDuelCameraOffset(hero,foe,foe?.kind==='warden'?8.15:6.6,foe?.kind==='warden'?7.25:5.85)||[4.6,7.35,5.05];
  lookY=foe?.kind==='warden'?.76:.91;subjects=[hero.id,foe.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=6){
  mode='warden-approach';position=mean(closeBoss,boss);
  offsets=planDuelCameraOffset(closeBoss,boss,8.65,7.8)||[4.4,7.45,5.0];lookY=.70;subjects=[closeBoss.id,boss.id];
 }else if(s.phase==='intermission'){
  mode='descent';offsets=[4.6,7.0,5.25];lookY=.68;
 }else if(enemies.length){
  const foe=enemies.slice().sort((a,b)=>distance(a,focus)-distance(b,focus)||a.id.localeCompare(b.id))[0];
  if(distance(foe,focus)<=3){
   mode='skirmish-approach';position=mean(focus,foe);
   offsets=planDuelCameraOffset(focus,foe,7.25,6.65)||[4.35,7.05,4.75];lookY=.67;subjects=[focus.id,foe.id];
  }
 }
 // Framing is biased toward readable actor height, but gently widens for
 // diverging living party members and portrait mobile. Never let one distant
 // autonomous pathfinding agent zoom the entire stage into miniature scale.
 const spread=Math.max(0,...heroes.map(u=>Math.hypot(u.x-position.x,u.z-position.z)));
 const margin=clip((spread-1.7)*.125,0,1.15);
 const aspect=clip(Number.isFinite(width)&&Number.isFinite(height)&&height>0?width/height:1.73,.35,3);
 const portrait=aspect<.85?.18:0;
 const zoom=clip(1+margin+portrait,.86,2.3);
 return Object.freeze({
  mode,x:round(position.x),z:round(position.z),lookY,
  offsets:Object.freeze(offsets.map(v=>round(v*zoom))),
  subjects:Object.freeze(subjects),spread:round(spread),
  warning:!!warning,remainingTurns:warning?s.bossWarning.attackTick-s.tick:null
 });
}

/**
 * Scene-only optical direction. The shot specifies WHICH real heroes, enemies
 * and warning cells matter. The physical lens keeps them at human scale.
 * A companion taking a distant path may leave frame, but must not shrink a
 * genuine duel into a miniature; the party remains visible in the HUD.
 * True Warden danger deliberately pulls back to expose a legal escape lane.
 * No private simulation reads, RNG, hidden outcome or new light/draw pass.
 */
const DIRECTOR_LENS=Object.freeze({
 journey:          Object.freeze({radius:5.65,height:6.65,fov:43,aim:.69,follow:5.2,key:1.03}),
 'skirmish-approach':Object.freeze({radius:5.45,height:6.25,fov:43,aim:.78,follow:6.0,key:1.08}),
 contact:          Object.freeze({radius:4.95,height:5.85,fov:41,aim:.91,follow:7.5,key:1.14}),
 'warden-contact': Object.freeze({radius:6.55,height:7.65,fov:44,aim:.85,follow:7.5,key:1.12}),
 'warden-approach':Object.freeze({radius:7.35,height:8.35,fov:44,aim:.77,follow:6.2,key:1.09}),
 'warden-warning': Object.freeze({radius:9.05,height:10.55,fov:51,aim:.35,follow:10.0,key:.92}),
 descent:          Object.freeze({radius:5.4,height:6.45,fov:45,aim:.65,follow:4.8,key:.91})
});
export function planReadableExpeditionLens(shot,{width=1440,height=832,reducedMotion=false}={}){
 if(!shot||!Object.hasOwn(DIRECTOR_LENS,shot.mode)||!Array.isArray(shot.offsets)||
    shot.offsets.length!==3||!shot.offsets.every(Number.isFinite))return null;
 const policy=DIRECTOR_LENS[shot.mode];
 const horizontal=Math.hypot(shot.offsets[0],shot.offsets[2]);
 if(horizontal<.05)return null;
 const aspect=Number.isFinite(width)&&Number.isFinite(height)&&height>0?width/height:1.73;
 const portrait=aspect<.88,warning=shot.mode==='warden-warning';
 const stretch=portrait?(warning?1.24:1.10):1;
 const radius=policy.radius*stretch;
 const y=policy.height*(portrait?(warning?1.17:1.07):1);
 const offsets=Object.freeze([
  round(shot.offsets[0]/horizontal*radius),
  round(y),
  round(shot.offsets[2]/horizontal*radius)
 ]);
 return Object.freeze({
  mode:shot.mode,offsets,
  fov:policy.fov+(portrait?(warning?6:4):0),
  lookY:policy.aim,
  following:reducedMotion?1:policy.follow,
  keyScale:policy.key,
  portrait,dangerPriority:warning,
  primarySubject:Array.isArray(shot.subjects)?shot.subjects[0]??null:null
 });
}

const STILL=Object.freeze({lift:0,pitch:0,armRaise:0,charge:0});
/** A true imminent Warden warning charges the real rig; no warning, no pose. */
export function planWardenCharge(warning,tick,reducedMotion=false){
 if(reducedMotion||!Number.isSafeInteger(tick)||!Number.isSafeInteger(warning?.attackTick))return STILL;
 const remaining=warning.attackTick-tick;
 if(remaining<0||remaining>3||!Array.isArray(warning.cells)||!warning.cells.length)return STILL;
 const charge=clip(.27+(3-remaining)*.22,.27,.93);
 return Object.freeze({lift:round(.042*charge),pitch:round(-.105*charge),
  armRaise:round(-.62*charge),charge:round(charge)});
}


/**
 * Actual-camera-space Warden subject fitting. After the physical camera has
 * reached its map boundary, the true skinned boss, frontline hero and live
 * danger tiles may otherwise fall outside a cinematic close-up. Their real
 * camera-space coordinates (not simulated/projected opponents) determine a
 * bounded emergency field of view. No game state, AI, damage, pose or camera
 * transform is modified here; a caller must measure genuine rendered actors.
 *
 * This does not promise visibility when a wall occludes a subject or the
 * required view is wider than the cap. Those remain explicit diagnostics.
 */
export function planCriticalSubjectFit(cameraPoints,aspect,preferredFov=44){
 const base=Number.isFinite(preferredFov)?clip(preferredFov,35,82):44;
 const ratio=Number.isFinite(aspect)&&aspect>=.35&&aspect<=3?aspect:null;
 const maximum=ratio&&ratio<.88?82:76;
 let needed=base,unframeable=false,measured=0;
 if(!ratio||!Array.isArray(cameraPoints))return Object.freeze({fov:base,capped:false,unframeable:false,subjects:0});
 for(const point of cameraPoints.slice(0,40)){
  if(!point||![point.x,point.y,point.z].every(Number.isFinite))continue;
  measured++;
  const depth=-point.z;
  if(depth<=.2){unframeable=true;needed=maximum+1;continue;}
  // 82% horizontal and vertical safe zones preserve room for health/status
  // overlays and imperfect real animated body/head bounds.
  const vertical=Math.atan2(Math.abs(point.y),depth*.82);
  const horizontal=Math.atan2(Math.abs(point.x),depth*ratio*.82);
  needed=Math.max(needed,Math.max(vertical,horizontal)*360/Math.PI);
 }
 const capped=needed>maximum+.05;
 return Object.freeze({fov:round(clip(needed,base,maximum)),capped,unframeable,subjects:measured});
}
