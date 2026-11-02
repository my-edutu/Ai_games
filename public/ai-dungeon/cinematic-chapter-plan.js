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
// Bias boss counter framing toward the real surviving hero without moving an actor.
const heroLed=(hero,boss)=>({x:hero.x*.81+boss.x*.19,z:hero.z*.81+boss.z*.19});
const round=n=>Number(n.toFixed(3));
/**
 * Stage a real duel across the screen rather than stacking a giant foreground
 * Warden over three distant heroes. The fixed 3/4 camera placed boss and party
 * on the same depth axis in exact-head Chromium frames (artifact 13090029701).
 * A bounded side-quarter shot separates living combatants in screen space.
 * Most encounters retain a small enemy-forward angle for spatial depth.
 * For the real Warden counter, place the HERO on the camera-facing side so
 * the towering boss cannot hide the living defender during the opening.
 * This uses actual public grid positions only, never invented combat motion.
 */
export function planDuelCameraOffset(hero,foe,height=8.2,radius=6.2,{heroForeground=false}={}){
 if(!valid(hero,64)||!valid(foe,64))return null;
 const dx=foe.x-hero.x,dz=foe.z-hero.z;
 const length=Math.hypot(dx,dz);
 if(length<.75)return null;
 const sideX=dz/length,sideZ=-dx/length;
 const sideSign=sideX+sideZ>=0?1:-1;
 // During authentic exposed recovery, the boss is physically much larger
 // than a lone defender. Look over the HERO's near shoulder, not into the
 // Warden's back. Other encounters retain the stable flank, while imminent
 // warning uses a high, wide tactical shot rather than this close camera.
 const forward=heroForeground==='recovery'?-1.08:heroForeground===true?-.33:.18;
 const norm=Math.hypot(.91,forward);
 const viewX=(sideX*sideSign*.91+dx/length*forward)/norm;
 const viewZ=(sideZ*sideSign*.91+dz/length*forward)/norm;
 const h=clip(height,4.5,15),r=clip(radius,3.8,10.8);
 return Object.freeze([round(viewX*r),round(h),round(viewZ*r)]);
}
/** Real current-turn protective action only; a stale guard or remote companion is never cinematic cover. */
export function planOathguardPose(s){
 const n=Array.isArray(s?.map)?s.map.length:0;
 if(n<3||n>64||!Number.isSafeInteger(s?.tick)||!Array.isArray(s.units))return null;
 const guard=s.units.find(u=>u?.kind==='vanguard'&&u.faction==='party'&&u.hp>0&&
  u.action==='guard'&&u.guardTick===s.tick&&typeof u.targetId==='string'&&valid(u,n));
 const ally=guard&&s.units.find(u=>u.id===guard.targetId&&u.id!==guard.id&&
  u.faction==='party'&&u.hp>0&&valid(u,n)&&distance(u,guard)===1);
 if(!ally)return null;
 return Object.freeze({guardianId:guard.id,allyId:ally.id,
  x:round((guard.x+ally.x)/2),z:round((guard.z+ally.z)/2)});
}
export function planCinematicShot(s,encounter=null,{width=1440,height=832,focusedHeroId='vanguard'}={}){
 const n=Array.isArray(s?.map)?s.map.length:0;
 if(n<3||n>64||!Array.isArray(s?.units))return null;
 const allHeroes=s.units.filter(u=>u.faction==='party'&&valid(u,n)).slice(0,4);
 const heroes=allHeroes.filter(u=>u.hp>0);
 // The genuine total-party defeat deserves a physical 3D last stand, not an
 // empty camera while the result overlay hides the final battle.
 if(!heroes.length){
  if(s.phase!=='intermission'||!allHeroes.length||!allHeroes.every(u=>u.hp===0))return null;
  const last=allHeroes.slice().sort((a,b)=>(b.actionTick??-1)-(a.actionTick??-1)||
   a.id.localeCompare(b.id))[0];
  return Object.freeze({mode:'last-stand',x:last.x,z:last.z,lookY:.24,
   offsets:Object.freeze([4.35,5.25,4.75]),
   subjects:Object.freeze(allHeroes.map(u=>u.id)),spread:0,
   oathguard:null,warning:false,remainingTurns:null});
 }
 const focus=heroes.find(u=>u.id===focusedHeroId)||heroes[0];
 const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0&&valid(u,n)).slice(0,64);
 const boss=enemies.find(u=>u.kind==='warden');
 const closeBoss=boss?heroes.slice().sort((a,b)=>distance(a,boss)-distance(b,boss)||a.id.localeCompare(b.id))[0]:null;
 const warning=!!boss&&s.bossWarning&&Number.isSafeInteger(s.bossWarning.attackTick)&&
  s.bossWarning.attackTick>=s.tick&&s.bossWarning.attackTick<=s.tick+3&&
  Array.isArray(s.bossWarning.cells)&&s.bossWarning.cells.length>0;
 const revenantWarning=Array.isArray(s.revenantWarnings)?s.revenantWarnings.slice(0,8)
  .map(mark=>({mark,source:enemies.find(u=>u.id===mark.sourceId&&u.kind==='revenant'),
   hero:heroes.find(u=>u.id===mark.targetId)}))
  .find(e=>e.source&&e.hero&&Number.isSafeInteger(e.mark.impactTick)&&
   e.mark.impactTick>s.tick&&e.mark.impactTick<=s.tick+1&&
   e.hero.x===e.mark.x&&e.hero.z===e.mark.z):null;
 // A verified final blow keeps an authentic dead enemy in frame only while
 // its public snapshot still holds the corpse; it is never a fabricated duel.
 const fallenFoe=encounter?.mode==='final-blow'?
  s.units.find(u=>u.id===encounter.targetId&&u.faction==='enemy'&&u.hp===0&&valid(u,n)):null;
 const oathguard=planOathguardPose(s);
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
 }else if(revenantWarning&&(!boss||distance(closeBoss,boss)>5)){
  const {source,hero}=revenantWarning;
  mode='breach-warning';position=mean(source,hero);
  offsets=planDuelCameraOffset(hero,source,8.5,7.05)||[4.8,8.1,5.5];
  lookY=.45;subjects=[source.id,hero.id];
 }else if(oathguard){
  // Actual autonomous sacrifice is the story. Imminent Warden danger
  // takes priority above this close-up to preserve a legible dodge lane.
  const guard=heroes.find(u=>u.id===oathguard.guardianId),ally=heroes.find(u=>u.id===oathguard.allyId);
  mode='oathguard-cover';position=mean(guard,ally);
  offsets=planDuelCameraOffset(guard,ally,7.75,6.35)||[4.4,7.75,4.7];
  lookY=.84;subjects=[guard.id,ally.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=5&&
  Number.isInteger(s.bossRecovery?.remaining)&&s.bossRecovery.remaining>0&&
  !s.guardianWard&&(!realContact||encounter.targetId!==boss.id)){
  // The same genuinely vulnerable Warden window that governs counter damage
  // moves the physical camera down from a wide warning to a readable duel.
  mode='warden-exposed';position=heroLed(closeBoss,boss);
  offsets=planDuelCameraOffset(closeBoss,boss,8.25,7.25,{heroForeground:'recovery'})||[4.4,8.25,5.15];
  lookY=.84;subjects=[closeBoss.id,boss.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=5&&
  (!realContact||encounter.targetId!==boss.id)){
  // A remote ranger/cultist contact is genuine, but it must not cut away from
  // a Warden physically confronting the frontline. Preserve the actual
  // threatening boss and nearest living defender as the scene's subjects.
  mode='warden-approach';position=heroLed(closeBoss,boss);
  offsets=planDuelCameraOffset(closeBoss,boss,8.65,7.8,{heroForeground:true})||[4.4,7.45,5.0];
  lookY=.70;subjects=[closeBoss.id,boss.id];
 }else if(realContact){
  const foe=enemies.find(u=>u.id===encounter.targetId)||fallenFoe;
  const hero=heroes.find(u=>u.id===encounter.actorId);
  mode=foe?.kind==='warden'?'warden-contact':'contact';
  position=foe?.kind==='warden'?heroLed(hero,foe):mean(hero,foe);
  offsets=planDuelCameraOffset(hero,foe,foe?.kind==='warden'?8.15:6.6,foe?.kind==='warden'?7.25:5.85,{heroForeground:foe?.kind==='warden'&&s.bossRecovery?.remaining?'recovery':foe?.kind==='warden'})||[4.6,7.35,5.05];
  lookY=foe?.kind==='warden'?.76:.91;subjects=[hero.id,foe.id];
 }else if(boss&&closeBoss&&distance(closeBoss,boss)<=6){
  mode='warden-approach';position=heroLed(closeBoss,boss);
  offsets=planDuelCameraOffset(closeBoss,boss,8.65,7.8,{heroForeground:true})||[4.4,7.45,5.0];lookY=.70;subjects=[closeBoss.id,boss.id];
 }else if(s.phase==='intermission'){
  mode='descent';offsets=[4.6,7.0,5.25];lookY=.68;
 }else if(!enemies.length&&s.phase==='exploring'&&
  Number.isInteger(s.exit?.x)&&Number.isInteger(s.exit?.z)&&
  s.map[s.exit.z]?.[s.exit.x]==='.'&&distance(focus,s.exit)<=4){
  // Show the living expedition approaching the actual legally-cleared portal,
  // not a fabricated victory shot or a marker without spatial context.
  mode='portal-descent';position=mean(focus,s.exit);
  offsets=planDuelCameraOffset(focus,s.exit,6.8,6.25)||[4.3,6.8,4.5];
  lookY=.52;subjects=[focus.id];
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
  oathguard:oathguard?Object.freeze({guardianId:oathguard.guardianId,allyId:oathguard.allyId}):null,
  offsets:Object.freeze(offsets.map(v=>round(v*zoom))),
  subjects:Object.freeze(subjects),spread:round(spread),
  warning:!!warning||mode==='breach-warning',
  remainingTurns:warning?s.bossWarning.attackTick-s.tick:
   mode==='breach-warning'?revenantWarning.mark.impactTick-s.tick:null
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
 journey:          Object.freeze({radius:6.25,height:5.15,fov:43,aim:.72,follow:5.2,key:1.08}),
 'skirmish-approach':Object.freeze({radius:6.05,height:5.45,fov:41,aim:.81,follow:6.0,key:1.11}),
 contact:          Object.freeze({radius:5.60,height:5.12,fov:40,aim:.93,follow:7.5,key:1.16}),
 'warden-contact': Object.freeze({radius:7.20,height:6.85,fov:45,aim:.91,follow:7.5,key:1.15}),
 'oathguard-cover':Object.freeze({radius:5.7,height:6.9,fov:44,aim:.86,follow:7.4,key:1.20}),
 'warden-approach':Object.freeze({radius:7.90,height:7.10,fov:45,aim:.84,follow:6.2,key:1.11}),
 'warden-exposed':Object.freeze({radius:7.65,height:7.55,fov:48,aim:1.04,follow:7.8,key:1.23}),
 'warden-warning': Object.freeze({radius:9.05,height:10.55,fov:51,aim:.35,follow:10.0,key:.92}),
 'breach-warning': Object.freeze({radius:6.55,height:7.5,fov:46,aim:.45,follow:8.0,key:1.04}),
 descent:          Object.freeze({radius:5.4,height:6.45,fov:45,aim:.65,follow:4.8,key:.91}),
 'portal-descent': Object.freeze({radius:5.65,height:6.40,fov:43,aim:.59,follow:5.2,key:1.08}),
 'last-stand':     Object.freeze({radius:4.65,height:5.30,fov:45,aim:.24,follow:3.3,key:.76})
});
export function planReadableExpeditionLens(shot,{width=1440,height=832,reducedMotion=false}={}){
 if(!shot||!Object.hasOwn(DIRECTOR_LENS,shot.mode)||!Array.isArray(shot.offsets)||
    shot.offsets.length!==3||!shot.offsets.every(Number.isFinite))return null;
 const policy=DIRECTOR_LENS[shot.mode];
 const horizontal=Math.hypot(shot.offsets[0],shot.offsets[2]);
 if(horizontal<.05)return null;
 const aspect=Number.isFinite(width)&&Number.isFinite(height)&&height>0?width/height:1.73;
 const portrait=aspect<.88,warning=shot.mode==='warden-warning'||shot.mode==='breach-warning';
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
