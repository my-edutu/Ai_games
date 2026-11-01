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
  events.push(Object.freeze({id:unit.id,kind:unit.kind,faction:unit.faction,
   damage,maxHp:unit.maxHp,fatal:unit.hp===0,x:unit.x,z:unit.z}));
 }
 events.sort((a,b)=>Number(b.fatal)-Number(a.fatal)||
  b.damage/b.maxHp-a.damage/a.maxHp||a.id.localeCompare(b.id,'en'));
 return Object.freeze(events.slice(0,18));
}
/** Bounded physical response. Never moves a gameplay cell or changes a hit. */
export function planDamageReaction(kind,damage,maxHp,age,fatal=false,reducedMotion=false){
 if(!Number.isFinite(damage)||damage<=0||!Number.isFinite(maxHp)||maxHp<=0||
   !Number.isFinite(age)||age<0||age>=DEATH_BEAT_DURATION||reducedMotion)return neutral();
 const strength=clip(.44+damage/maxHp*2.6,.44,1.0)*(kind==='warden'?.68:1);
 const rise=ease(age/.105),release=1-ease((age-.105)/.285);
 const impact=rise*release*strength;
 const direction=kind==='cultist'||kind==='warden'?-1:1;
 if(fatal){
  const fall=ease((age-.12)/.62);
  return {x:0,y:-.26*fall-.022*impact,z:.13*fall+.08*impact,
   pitch:1.30*fall+.17*impact,roll:direction*.10*fall};
 }
 if(age>=DAMAGE_BEAT_DURATION)return neutral();
 return {x:0,y:-.026*impact,z:.11*impact,pitch:.20*impact,roll:direction*.10*impact};
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
