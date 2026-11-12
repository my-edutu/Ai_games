/**
 * Truth-locked injury and final-blow choreography for the existing autonomous
 * DungeonRuntime. Visual state is derived only from consecutive public
 * snapshots. No rendering, wall-clock clocks, RNG, or authority mutations.
 *
 * A damaged actor flinches; a genuinely defeated actor collapses and clears.
 * This deliberately does NOT imply a particular attacker caused the damage.
 */
export const DAMAGE_BEAT_DURATION = .55;
export const DEATH_BEAT_DURATION = .92;
const clip=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
const ease=x=>{const t=clip(x,0,1);return t*t*(3-2*t)};
const neutral=()=>({x:0,y:0,z:0,pitch:0,roll:0});
const finiteHp=u=>u&&typeof u.id==='string'&&u.id.length>0&&u.id.length<=128&&
 Number.isInteger(u.hp)&&Number.isInteger(u.maxHp)&&u.hp>=0&&u.maxHp>0&&u.hp<=u.maxHp;
/**
 * Attribute a visual incoming lane only when exactly one opposite-faction
 * same-tick action explicitly targets the injured unit through a legal,
 * unobstructed cardinal lane. This DOES NOT prove damage causation: hazards
 * and simultaneous hits can still apply authoritative damage independently.
 * Ambiguous/missing actors intentionally retain neutral hit choreography.
 */
function matchedIncomingLane(snapshot,victim){
 if(!Array.isArray(snapshot?.map)||!Array.isArray(snapshot?.units))return null;
 const candidates=snapshot.units.filter(source=>{
  if(!source||source.faction===victim.faction||source.hp<=0||
    source.targetId!==victim.id||source.actionTick!==snapshot.tick||
    !['attack','cast'].includes(source.action)||
    !Number.isInteger(source.x)||!Number.isInteger(source.z)||
    !Number.isInteger(victim.x)||!Number.isInteger(victim.z))return false;
  const dx=victim.x-source.x,dz=victim.z-source.z,range=Math.abs(dx)+Math.abs(dz);
  const limit=source.kind==='ranger'?4:['mystic','cultist'].includes(source.kind)?3:1;
  if(range<1||range>limit||(dx!==0&&dz!==0))return false;
  const stepX=Math.sign(dx),stepZ=Math.sign(dz);
  for(let k=1;k<range;k++)if(snapshot.map[source.z+k*stepZ]?.[source.x+k*stepX]!=='.')return false;
  return true;
 });
 if(candidates.length!==1)return null;
 const source=candidates[0];
 return Object.freeze({dx:victim.x-source.x,dz:victim.z-source.z,sourceId:source.id});
}
/**
 * The authentic live-snapshot HP drop is immediate (including HUD and replay),
 * but the source-skinned melee swing takes a short, visible wind-up before
 * its blade reaches the opponent. Reconcile ONLY a witnessed non-fatal injury
 * with a single explicitly targeted, legal adjacent real melee attack. This
 * never asserts that the attacker caused the HP loss: a simultaneous hazard
 * may still have dealt it. Ambiguous/ranged/fatal damage is never delayed.
 *
 * 215ms matches the existing opt-in true-impact audio presentation clock.
 * Slow software WebGL advances this delay in capped RENDERED frames, not wall
 * time, so the spectator does not miss contact during a long raster stall.
 */
export const VERIFIED_MELEE_CONTACT_DELAY=.215;
/**
 * Protect original windup and a physically witnessed 215ms blade contact
 * under sparse RAF; source skeleton, real HP spall, injury and original sound
 * share this bounded presentation clock without changing authority or saves.
 */
export function planVisibleMeleeContactStep(frameSeconds,visibleAge=0){
 if(!Number.isFinite(frameSeconds)||frameSeconds<=0)return 0;
 const age=Number.isFinite(visibleAge)?Math.max(0,Math.min(5,visibleAge)):0;
 // Authentic browser trace 87131b55: native wrist/spine reaches .155rad,
 // but sparse deliveries skip the rest of the source-skinned follow-through.
 // Keep the genuine .215s sword/audio landmark; deliver connected recoil and
 // planting across more than one slow render without extending the original
 // .62s animation envelope. Normal 60Hz cadence is unchanged.
 const remaining=.62-age;
 const limit=age<.05-1e-8?.05-age:age<VERIFIED_MELEE_CONTACT_DELAY-1e-8?
  VERIFIED_MELEE_CONTACT_DELAY-age:remaining>1e-8?
  Math.min(.105,remaining):.35;
 return Math.min(.35,frameSeconds,limit);
}
export function planVerifiedMeleeImpactDelay(beat,snapshot,{reducedMotion=false}={}){
 if(reducedMotion||beat?.fatal===true||
    !Number.isSafeInteger(snapshot?.tick)||!Array.isArray(snapshot?.units)||
    !Array.isArray(snapshot?.map)||!beat?.incoming||
    !Number.isInteger(beat.x)||!Number.isInteger(beat.z)||
    !Number.isInteger(beat.incoming.dx)||!Number.isInteger(beat.incoming.dz)||
    typeof beat.id!=='string'||beat.id.length<1||beat.id.length>128||
    typeof beat.incoming.sourceId!=='string')return 0;
 const source=snapshot.units.find(u=>u?.id===beat.incoming.sourceId);
 if(!source||source.hp<=0||source.faction===beat.faction||
    !['vanguard','revenant','warden'].includes(source.kind)||
    source.action!=='attack'||source.actionTick!==snapshot.tick||
    source.targetId!==beat.id||
    !Number.isInteger(source.x)||!Number.isInteger(source.z)||
    snapshot.map[source.z]?.[source.x]!=='.'||
    snapshot.map[beat.z]?.[beat.x]!=='.')return 0;
 const dx=beat.x-source.x,dz=beat.z-source.z;
 if(Math.abs(dx)+Math.abs(dz)!==1||
    dx!==beat.incoming.dx||dz!==beat.incoming.dz)return 0;
 return VERIFIED_MELEE_CONTACT_DELAY;
}

/** Signed, physically oriented flinch across the actual animated body. */
export function resolveImpactSide(incoming,yaw=0){
 if(!incoming||!Number.isInteger(incoming.dx)||!Number.isInteger(incoming.dz)||
  Math.abs(incoming.dx)+Math.abs(incoming.dz)<1||
  Math.abs(incoming.dx)+Math.abs(incoming.dz)>4||!Number.isFinite(yaw))return 0;
 const lateral=incoming.dx*Math.cos(yaw)-incoming.dz*Math.sin(yaw);
 return Math.abs(lateral)<.20?0:Math.sign(lateral);
}
export function planAuthorityDamageBeats(previous,next){
 if(!previous||!next||!Array.isArray(previous.units)||!Array.isArray(next.units)||
   !Number.isSafeInteger(previous.tick)||!Number.isSafeInteger(next.tick)||
   next.tick<=previous.tick||next.tick-previous.tick>5||
   next.run!==previous.run||next.floor!==previous.floor)return [];
 const old=new Map(previous.units.filter(finiteHp).map(u=>[u.id,u]));
 const events=[];
 for(const unit of next.units.slice(0,64)){
  if(!finiteHp(unit))continue;
  const before=old.get(unit.id);
  if(!before||before.kind!==unit.kind||before.faction!==unit.faction||before.hp<=unit.hp)continue;
  const damage=before.hp-unit.hp;
  const incoming=matchedIncomingLane(next,unit);
  events.push(Object.freeze({id:unit.id,kind:unit.kind,faction:unit.faction,
   damage,maxHp:unit.maxHp,fatal:unit.hp===0,x:unit.x,z:unit.z,
   ...(incoming?{incoming}:{})}));
 }
 events.sort((a,b)=>Number(b.fatal)-Number(a.fatal)||
  b.damage/b.maxHp-a.damage/a.maxHp||a.id.localeCompare(b.id,'en'));
 return Object.freeze(events.slice(0,18));
}
/** Bounded physical response. Never moves a gameplay cell or changes a hit. */
export function planDamageReaction(kind,damage,maxHp,age,fatal=false,reducedMotion=false,impactSide=0){
 if(!Number.isFinite(damage)||damage<=0||!Number.isFinite(maxHp)||maxHp<=0||
   !Number.isFinite(age)||age<0||age>=DEATH_BEAT_DURATION||reducedMotion)return neutral();
 const strength=clip(.44+damage/maxHp*2.6,.44,1.0)*(kind==='warden'?.68:1);
 const rise=ease(age/.105),release=1-ease((age-.105)/.285);
 const impact=rise*release*strength;
 const direction=impactSide===-1||impactSide===1?impactSide:(kind==='cultist'||kind==='warden'?-1:1);
 if(fatal){
  const fall=ease((age-.12)/.62);
  return {x:0,y:-.26*fall-.022*impact,z:.13*fall+.08*impact,
   pitch:1.30*fall+.17*impact,roll:direction*.10*fall};
 }
 if(age>=DAMAGE_BEAT_DURATION)return neutral();
 return {x:0,y:-.026*impact,z:.11*impact,pitch:.20*impact,roll:direction*.10*impact};
}
/**
 * Keep an actual defeated party as a quiet static 3D aftermath throughout its
 * authoritative intermission. The pose also remains legible with reduced
 * motion. No game HP, AI or collision is changed by this visual-only function.
 */
export function planDefeatTableauPose(unit,phase){
 if(phase!=='intermission'||unit?.faction!=='party'||unit.hp!==0)return neutral();
 const lean=unit.kind==='ranger'?-.12:unit.kind==='mystic'?.12:0;
 return Object.freeze({x:0,y:-.26,z:.13,pitch:1.29,roll:lean});
}
/**
 * Direct a short camera hold only when a real HP loss coincides with an
 * explicit, same-tick authority targetId and valid cardinal attack lane.
 * A plausible attacker is never inferred from proximity alone.
 */
export function planImpactCameraHold(snapshot,beats){
 if(!snapshot||!Array.isArray(snapshot.units)||!Array.isArray(snapshot.map)||!Array.isArray(beats))return null;
 for(const beat of beats){
  const victim=snapshot.units.find(u=>u.id===beat.id&&u.faction===beat.faction);
  if(!victim)continue;
  for(const source of snapshot.units){
   if(!source||source.hp<=0||source.faction===victim.faction||
      source.targetId!==victim.id||source.actionTick!==snapshot.tick||
      !['attack','cast'].includes(source.action))continue;
   const length=Math.abs(source.x-victim.x)+Math.abs(source.z-victim.z);
   const range=source.kind==='ranger'?4:source.kind==='mystic'||source.kind==='cultist'?3:1;
   if(length<1||length>range||(source.x!==victim.x&&source.z!==victim.z))continue;
   let clear=true;
   const dx=Math.sign(victim.x-source.x),dz=Math.sign(victim.z-source.z);
   for(let i=1;i<length;i++)if(snapshot.map[source.z+dz*i]?.[source.x+dx*i]!=='.')clear=false;
   if(!clear)continue;
   const hero=source.faction==='party'?source:victim;
   const foe=source.faction==='enemy'?source:victim;
   if(hero.hp<=0||foe.faction!=='enemy')continue;
   return Object.freeze({mode:beat.fatal?'final-blow':'contact',
    actorId:hero.id,targetId:foe.id,
    x:(hero.x+foe.x)/2,z:(hero.z+foe.z)/2});
  }
 }
 return null;
}

/**
 * A genuine positive HP change drives imported skinned bone recoil. The same
 * real event already owns VFX/audio/camera; guessed targets and 'hurt' alone
 * never create injury. Local angles are reversible, authority remains intact.
 */
const SKINNED_HIT_REST=Object.freeze({
 weight:0,spine:Object.freeze({pitch:0,roll:0}),
 shoulders:Object.freeze({left:0,right:0}),elbows:Object.freeze({left:0,right:0}),
 legs:Object.freeze({left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})})
});
const HIT_ROLES=Object.freeze(['vanguard','ranger','mystic','revenant','cultist','warden']);
export function planSkinnedHitResponse(kind,damage,maxHp,age,fatal=false,reducedMotion=false,impactSide=0){
 if(!HIT_ROLES.includes(kind)||fatal||reducedMotion||
 !Number.isFinite(damage)||damage<=0||!Number.isFinite(maxHp)||maxHp<=0||
 !Number.isFinite(age)||age<0||age>=DAMAGE_BEAT_DURATION)return SKINNED_HIT_REST;
 const onset=ease(age/.09),release=1-ease((age-.20)/.35);
 const weight=clip(.36+2.2*damage/maxHp,.36,1)*(kind==='warden'?.76:1)*onset*release;
 if(weight<=0)return SKINNED_HIT_REST;
 const caster=kind==='ranger'||kind==='mystic'||kind==='cultist';
 const side=impactSide===-1||impactSide===1?impactSide:(kind==='cultist'||kind==='revenant'||kind==='warden'?-1:1),w=weight;
 return Object.freeze({
 weight:w,spine:{pitch:(caster?.21:.28)*w,roll:.19*side*w},
 shoulders:{left:(caster?-.25:-.36)*w,right:(caster?-.39:-.30)*w},
 elbows:{left:.29*w,right:.25*w},
 legs:{left:{upper:.26*w,lower:-.23*w,foot:.09*w},
 right:{upper:-.21*w,lower:.18*w,foot:-.07*w}}
 });
}

/**
 * Real public HP-zero body collapse on imported GLB joints, entirely
 * presentation only. A fatal beat physically bends the knees and shoulders;
 * an already dead, restored party member holds a static natural pose.
 */
const FLAT_SKELETON=Object.freeze({
 weight:0,spine:{pitch:0,roll:0},shoulders:{left:0,right:0},
 elbows:{left:0,right:0},
 legs:{left:{upper:0,lower:0,foot:0},right:{upper:0,lower:0,foot:0}}
});
export function planSkinnedDefeatPose(kind,hp,age=null,fatal=false,reducedMotion=false,intermission=false){
 if(!['vanguard','ranger','mystic','revenant','cultist','warden'].includes(kind)||hp!==0)
  return FLAT_SKELETON;
 if(!fatal&&!intermission)return FLAT_SKELETON;
 if(fatal===true&&!intermission&&(!Number.isFinite(age)||age<0||age>=DEATH_BEAT_DURATION))
  return FLAT_SKELETON;
 const w=reducedMotion||intermission?1:ease((age-.085)/.65);
 if(w<=0)return FLAT_SKELETON;
 const caster=kind==='mystic'||kind==='cultist';
 return Object.freeze({
  weight:w,spine:{pitch:(kind==='warden'?.27:.21)*w,roll:(caster?-.13:.09)*w},
  shoulders:{left:(caster?-.59:-.46)*w,right:(caster?-.41:-.57)*w},
  elbows:{left:.43*w,right:.48*w},
  legs:{left:{upper:.56*w,lower:-.35*w,foot:.12*w},
   right:{upper:-.36*w,lower:.54*w,foot:-.12*w}}
 });
}
