/**
 * Frame-rate-independent, authority-following motion for the real autonomous
 * dungeon party. This is PRESENTATION ONLY: the grid, collision, AI, damage,
 * seeded state and replay remain owned by DungeonRuntime.
 *
 * Our former per-frame .lerp(.17) made low-FPS spectators watch frozen/sliding
 * actors while the real game continued. This bounded physical step and contact
 * cadence keep the 3D body and its footfall tied to the same public grid move.
 */
const finite = value => Number.isFinite(value);
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
export const STRIDE_METRES = 0.53;
export const MAX_VISUAL_STEP_METRES = 0.54;

export function planExpeditionStep(x,z,targetX,targetZ,frameSeconds,{reducedMotion=false}={}){
 if(![x,z,targetX,targetZ].every(finite))
  return {x:finite(x)?x:0,z:finite(z)?z:0,travel:0,leanPitch:0,teleport:true,moving:false};
 const dx=targetX-x,dz=targetZ-z,distance=Math.hypot(dx,dz);
 if(distance<.002)return {x:targetX,z:targetZ,travel:0,leanPitch:0,teleport:false,moving:false};
 // A floor swap, restore, camera seek or missing poll is not walking.
 // Never trail imaginary footfalls across disconnected rooms.
 if(reducedMotion||distance>2.8)
  return {x:targetX,z:targetZ,travel:0,leanPitch:0,teleport:true,moving:false};
 const dt=clamp(finite(frameSeconds)?frameSeconds:0,0,.30);
 if(dt===0)return {x,z,travel:0,leanPitch:0,teleport:false,moving:false};
 // Time-constant smoothing instead of a refresh-rate-dependent magic factor.
 // A cap prevents a multi-second SwiftShader pause from becoming a skating lunge.
 const fraction=1-Math.exp(-dt/.105);
 const travel=Math.min(distance,distance*fraction,Math.max(.12,Math.min(MAX_VISUAL_STEP_METRES,dt*3.5)));
 const nextX=distance-travel<.003?targetX:x+dx*travel/distance;
 const nextZ=distance-travel<.003?targetZ:z+dz*travel/distance;
 const advanced=Math.hypot(nextX-x,nextZ-z);
 const speed=advanced/Math.max(.016,dt);
 return {x:nextX,z:nextZ,travel:advanced,leanPitch:clamp(speed*.017,0,.09),
  teleport:false,moving:advanced>.003};
}

/**
 * Only render movement can plant a footprint. Idle, death, teleports and
 * reduced-motion states do not manufacture locomotion evidence or audio.
 */
export function advanceExpeditionFootfall(accumulator=0,travel=0,{alive=true,reducedMotion=false,teleport=false}={}){
 const previous=finite(accumulator)?clamp(accumulator,0,STRIDE_METRES):0;
 if(!alive||reducedMotion||teleport||!finite(travel)||travel<=0)
  return {accumulator:0,plant:false};
 const total=previous+clamp(travel,0,MAX_VISUAL_STEP_METRES);
 return {accumulator:total>=STRIDE_METRES?total-STRIDE_METRES:total,
  plant:total>=STRIDE_METRES};
}

/**
 * Role-distinct, distance-planted motion for imported CC0 rigs AND the
 * procedural fallback. Playback responds only to real render displacement of
 * authoritative grid actors, never to stale 'move' labels, wall-clock time or
 * invented combat. The existing footstep stamp/audio owns the same stride.
 */
const GAIT_MASS=Object.freeze({
 vanguard:Object.freeze({tempo:.89,bob:.82,lean:1.16}),
 ranger:Object.freeze({tempo:1.16,bob:.73,lean:.81}),
 mystic:Object.freeze({tempo:.93,bob:.65,lean:.78}),
 revenant:Object.freeze({tempo:.86,bob:.71,lean:1.11}),
 cultist:Object.freeze({tempo:1.07,bob:.72,lean:.91}),
 warden:Object.freeze({tempo:.74,bob:.46,lean:1.30})
});
const INTERRUPTS=new Set(['attack','cast','hurt','guard']);
export function planGroundedAnimation(kind,action,travelMeters,frameSeconds,
 footAccumulator=0,footstepIndex=0,previousWeight=0,
 {alive=true,teleport=false,reducedMotion=false}={}){
 const profile=GAIT_MASS[kind]??GAIT_MASS.vanguard;
 const selected=['idle','move','attack','cast','hurt','guard'].includes(action)?action:'idle';
 const interrupted=INTERRUPTS.has(selected);
 const dt=finite(frameSeconds)?clamp(frameSeconds,0,.30):0;
 const travel=finite(travelMeters)?travelMeters:0;
 const moving=Boolean(alive&&!teleport&&!reducedMotion&&!interrupted&&
  dt>0&&travel>.003&&travel<=MAX_VISUAL_STEP_METRES);
 const prior=finite(previousWeight)?clamp(previousWeight,0,1):0;
 const weight=reducedMotion||!alive||teleport?0:
  moving?Math.min(1,prior+.32):Math.max(0,prior-.19);
 const speed=moving?clamp(travel/Math.max(.016,dt),0,5):0;
 const clipAction=!alive?'idle':interrupted?selected:moving?'move':'idle';
 const clipSpeed=moving?clamp(speed/2.3*profile.tempo,.60,1.35):1;
 const step=finite(footAccumulator)?clamp(footAccumulator,0,STRIDE_METRES):0;
 const parity=Number.isSafeInteger(footstepIndex)&&footstepIndex>=0?footstepIndex%2:0;
 const footPhase=(parity+step/STRIDE_METRES)/2;
 const swing=Math.sin(2*Math.PI*footPhase),plant=1-Math.cos(4*Math.PI*footPhase);
 const bodyLift=moving?-.012*profile.bob*weight*plant:0;
 const bodyPitch=moving?clamp(speed*.014*profile.lean,0,.061):0;
 const bodyRoll=moving ? .022*profile.bob*weight*swing : 0;
 return Object.freeze({clipAction,clipSpeed,footPhase,bodyLift,bodyPitch,bodyRoll,
  weight,moving,speed});
}
