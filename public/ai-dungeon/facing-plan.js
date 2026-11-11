/**
 * Presentation-only facing for snapshots produced by the authoritative dungeon.
 * Attack aim is deliberately conservative: only nearest, actually aligned and
 * unobstructed opponents. Healing and radial spells have no invented target.
 * The values turn visible Three.js roots, never game coordinates or AI rules.
 */
const finitePoint=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z);
const occupied=(map,p)=>Array.isArray(map)&&typeof map[p.z]==='string'&&map[p.z][p.x]==='.';
function clearAxis(map,a,b){
 if(a.x!==b.x&&a.z!==b.z)return false;
 const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
 const distance=Math.abs(b.x-a.x)+Math.abs(b.z-a.z);
 for(let i=1;i<distance;i++){
  if(map[a.z+dz*i]?.[a.x+dx*i]!=='.')return false;
 }
 return true;
}
export function planCombatFacing(unit,units,map){
 if(!finitePoint(unit)||!Array.isArray(units)||!occupied(map,unit))return null;
 const isAttack=unit.action==='attack',isBolt=unit.kind==='cultist'&&unit.action==='cast';
 if(!isAttack&&!isBolt)return null;
 const range=unit.kind==='ranger'?4:unit.kind==='mystic'||isBolt?3:1;
 // Attackers can aim at the foe just killed on this same authoritative tick.
 // Older corpses, invisible diagonal bolts and out-of-range foes are excluded.
 const opponents=units.filter(other=>other&&other.id!==unit.id&&other.faction!==unit.faction&&finitePoint(other)&&
  (other.hp>0||(other.hp===0&&other.action==='hurt'&&other.actionTick===unit.actionTick)))
 .sort((a,b)=>(Math.abs(a.x-unit.x)+Math.abs(a.z-unit.z))-(Math.abs(b.x-unit.x)+Math.abs(b.z-unit.z))||
  String(a.id).localeCompare(String(b.id),'en'));
 // The real target ID forbids staging a hit on a different enemy.
 const target=typeof unit.targetId==='string'?opponents.find(u=>u.id===unit.targetId):opponents[0];
 if(!target||!occupied(map,target))return null;
 const distance=Math.abs(target.x-unit.x)+Math.abs(target.z-unit.z);
 if(distance<1||distance>range||!clearAxis(map,unit,target))return null;
 return {targetId:target.id,yaw:Math.atan2(unit.x-target.x,unit.z-target.z),distance};
}
export function planMovementFacing(x,z,targetX,targetZ){
 if(![x,z,targetX,targetZ].every(Number.isFinite))return null;
 const dx=targetX-x,dz=targetZ-z;
 if(Math.hypot(dx,dz)<.07)return null;
 // Existing authored models and procedural rigs use negative Z as forward.
 return Math.atan2(-dx,-dz);
}
/**
 * Real licensed Walking_A feet may still travel 28–85mm AFTER the generic
 * 70mm destination-heading dead zone has returned null. Original WebGL
 * consecutive-frame film observed northbound shoes moving while their entire
 * source rig kept the previous east-facing yaw (desktop -0.992rad, 390px
 * -0.850rad). Continue only the lawful visual walk turn from the actual
 * displayed root displacement, not from an invented step or target.
 *
 * The caller retains combat-facing priority and the standard bounded yaw
 * interpolation. This never changes the authoritative coordinate, source
 * keyframe, clip, pelvis, foot joint or camera. Invalid/idle/hidden/teleport/
 * death/reduced-motion frames must not pick a heading here.
 */
export function planOriginalSourceWalkNearArrivalFacing({
 sourceRig=false,sourceClipName='',mode='idle',groundedMoving=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 hasCombatFacing=false,previousX=NaN,previousZ=NaN,
 currentX=NaN,currentZ=NaN,targetX=NaN,targetZ=NaN
}={}){
 if(sourceRig!==true||mode!=='move'||groundedMoving!==true||
  alive!==true||visible!==true||teleport||reducedMotion||hasCombatFacing||
  typeof sourceClipName!=='string'||
  !/^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(sourceClipName))return null;
 if(![previousX,previousZ,currentX,currentZ,targetX,targetZ].every(Number.isFinite))return null;
 const remaining=Math.hypot(targetX-currentX,targetZ-currentZ);
 // Outside the small dead zone the existing destination-facing planner owns
 // heading. At or inside it, require a real, finite, nonteleporting source step.
 if(remaining>=.07)return null;
 const dx=currentX-previousX,dz=currentZ-previousZ;
 const travel=Math.hypot(dx,dz);
 if(travel<.012||travel>.24)return null;
 const previousRemaining=Math.hypot(targetX-previousX,targetZ-previousZ);
 // The source-root must actually be closing on the same legal destination.
 // A newly diverted, stationary or overshooting rig cannot inherit stale yaw.
 if(previousRemaining+.001<remaining)return null;
 return Math.atan2(-dx,-dz);
}

/**
 * Original imported Walking_A remains the owner of the shoes while its last
 * 5-12mm of REAL rendered root travel completes. On a low-frame-rate viewport
 * the legal last step can end before the bounded 8.5rad/s visual root yaw has
 * reached the witnessed travel heading. The older planner then drops heading,
 * leaving the skinned character sideways on its own newly reached tile.
 *
 * Carry ONLY an already witnessed near-arrival source-walk heading, for at
 * most 240ms and only while the same original Walking_A is moving or genuinely
 * outgoing under an Idle crossfade. No source clip, bone, gameplay step, target,
 * collision, camera or authoritative yaw is invented. Injury, combat, lost
 * source rig, teleport, new destination and reduced motion reset immediately.
 */
const EMPTY_SOURCE_WALK_FINISH=Object.freeze({heading:null,memory:null});
export function advanceOriginalSourceWalkTurnRelease(previous=null,{
 sourceRig=false,sourceClipName='',sourceWalkExit=false,mode='idle',
 groundedMoving=false,alive=false,visible=false,teleport=false,
 reducedMotion=false,hasCombatFacing=false,
 previousX=NaN,previousZ=NaN,
 currentX=NaN,currentZ=NaN,targetX=NaN,targetZ=NaN,
 observedWalkYaw=null,rootYaw=NaN,frameInterval=NaN
}={}){
 if(sourceRig!==true||alive!==true||visible!==true||teleport||
  reducedMotion||hasCombatFacing||!['move','idle'].includes(mode)||
  ![currentX,currentZ,targetX,targetZ,rootYaw,frameInterval].every(Number.isFinite)||
  frameInterval<=0||frameInterval>.25||
  Math.hypot(targetX-currentX,targetZ-currentZ)>.07)return EMPTY_SOURCE_WALK_FINISH;
 const remaining=Math.hypot(targetX-currentX,targetZ-currentZ);
 const walkingSource=typeof sourceClipName==='string'&&
  /^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(sourceClipName);
 const angle=Number.isFinite(observedWalkYaw)?
  Math.atan2(Math.sin(observedWalkYaw),Math.cos(observedWalkYaw)):null;
 if(mode==='move'&&groundedMoving===true&&walkingSource&&angle!==null){
  if(Math.abs(shortestYawDelta(rootYaw,angle))<.08)return EMPTY_SOURCE_WALK_FINISH;
  // Actual mobile original Walking_A can witness a true 45mm final step
  // while still 35mm from the same destination. Seed the 240ms yaw release
  // HERE, before the last <12mm micro-step loses a fresh heading. The
  // subsequent release remains confined to <=9mm or a lawful outgoing clip.
  return {heading:angle,memory:{yaw:angle,targetX,targetZ,age:0}};
 }
 if(remaining>.009)return EMPTY_SOURCE_WALK_FINISH;
 const memoryValid=previous&&[previous.yaw,previous.targetX,previous.targetZ,previous.age].
  every(Number.isFinite)&&previous.age>=0&&previous.age<=.24&&
  Math.hypot(previous.targetX-targetX,previous.targetZ-targetZ)<.003;
 if(!memoryValid)return EMPTY_SOURCE_WALK_FINISH;
 // Continue within a real, very small final walk frame. Never manufacture
 // locomotion on a halted or stale authoritative actor.
 // The original 390px Walking_A source still moved 5.1mm on the last legal
 // rendered frame, but the generic >=12mm moving threshold had cleared.
 // The earlier REAL source heading, not a false animation/action label, may
 // finish rotating only when a same-target 3-9mm step is independently
 // witnessed, closes the actual destination gap and agrees with that heading.
 const microDx=currentX-previousX,microDz=currentZ-previousZ;
 const microTravel=Math.hypot(microDx,microDz);
 const priorRemaining=Math.hypot(targetX-previousX,targetZ-previousZ);
 const witnessedMicrostep=mode==='move'&&groundedMoving===false&&walkingSource&&
  [previousX,previousZ].every(Number.isFinite)&&
  microTravel>=.003&&microTravel<=.009&&priorRemaining<=.02&&
  priorRemaining>=remaining+.0025&&
  Math.abs(shortestYawDelta(previous.yaw,Math.atan2(-microDx,-microDz)))<=.18;
 const tinyStep=mode==='move'&&groundedMoving===true&&walkingSource||
  witnessedMicrostep;
 // Original outgoing Walking_A is explicitly retained by updateActor;
 // a generic Idle clip by itself, with no outgoing source action, cannot
 // license continued root rotation or a phantom turn.
 const outgoing=mode==='idle'&&groundedMoving===false&&
  sourceWalkExit===true&&(sourceClipName==='Idle'||walkingSource);
 if(!tinyStep&&!outgoing)return EMPTY_SOURCE_WALK_FINISH;
 const age=previous.age+Math.min(.09,frameInterval);
 if(age>.24||Math.abs(shortestYawDelta(rootYaw,previous.yaw))<.08)
  return EMPTY_SOURCE_WALK_FINISH;
 return {heading:previous.yaw,memory:{yaw:previous.yaw,targetX,targetZ,age}};
}

export function shortestYawDelta(from,to){
 if(!Number.isFinite(from)||!Number.isFinite(to))return 0;
 return Math.atan2(Math.sin(to-from),Math.cos(to-from));
}
/**
 * Spend the measured *visible* interval on an already witnessed original
 * Walking_A facing correction. The generic animation frame delta is capped at
 * 50ms for all other presentation layers, but a real source GLB walk can
 * traverse most of its last tile in a slower frame. Keep its root rotation
 * attached to the same 8.5rad/s turn budget, allowing at most 75ms per frame,
 * never altering a skeleton, path, animation keyframe or authoritative move.
 * Combat target priority and interruptions revert to unchanged generic facing.
 */
export function approachOriginalSourceWalkYaw(current,desired,frameDelta,frameInterval,{
 originalWalking=false,alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false,hasCombatFacing=false
}={}){
 const ordinary=approachCharacterYaw(current,desired,frameDelta,reducedMotion);
 if(!originalWalking||!alive||!visible||teleport||reducedMotion||
  interrupted||hasCombatFacing||!Number.isFinite(frameInterval)||
  frameInterval<=0||!Number.isFinite(desired)||!Number.isFinite(current))return ordinary;
 const ordinaryDelta=Number.isFinite(frameDelta)?Math.max(0,Math.min(frameDelta,.05)):0;
 const elapsed=Math.max(ordinaryDelta,Math.min(.075,frameInterval));
 const difference=shortestYawDelta(current,desired);
 const yaw=current+Math.sign(difference)*Math.min(Math.abs(difference),8.5*elapsed);
 return Math.atan2(Math.sin(yaw),Math.cos(yaw));
}

export function approachCharacterYaw(current,desired,dt,reducedMotion=false){
 const from=Number.isFinite(current)?current:0;
 if(!Number.isFinite(desired))return Math.atan2(Math.sin(from),Math.cos(from));
 const difference=shortestYawDelta(from,desired);
 const limit=reducedMotion?Math.PI:Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0))*8.5;
 const changed=from+Math.sign(difference)*Math.min(Math.abs(difference),limit);
 return Math.atan2(Math.sin(changed),Math.cos(changed));
}

/**
 * Resolve a combat CONTACT from one immutable public authority snapshot.
 * Never infer a projectile from proximity alone: the target must be the
 * same nearest opponent eligible under the real grid, range and wall rules.
 * Ordinary mystic casts may be offensive; an authoritative healing event
 * rules those out without guessing from localized event text.
 * Radial Warden casts and ranger trap-disarms have no hostile contact.
 */
export function planVisualContact(unit,snapshot){
 if(!unit||!snapshot||!Array.isArray(snapshot.units))return null;
 if(unit.action==='attack')return planCombatFacing(unit,snapshot.units,snapshot.map);
 if(unit.action!=='cast'||(unit.kind!=='mystic'&&unit.kind!=='cultist'))return null;
 if(unit.kind==='mystic'&&unit.faction==='party'&&Number.isSafeInteger(snapshot.tick)&&
    Array.isArray(snapshot.events)&&snapshot.events.some(e=>e?.kind==='healing'&&e.tick===snapshot.tick))return null;
 // Mystic offensive casts use the authoritative 3-cell attack lane.
 // Cultist shadow-bolt casts use the planner's existing 3-cell cast lane.
 const aimed=unit.kind==='mystic'?{...unit,action:'attack'}:unit;
 return planCombatFacing(aimed,snapshot.units,snapshot.map);
}
