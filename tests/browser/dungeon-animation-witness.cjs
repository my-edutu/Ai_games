'use strict';
/** Select only real public-authority attack frames that the native one-action arbiter may own.
 * A simultaneous positive HP-loss beat owns Hit_A above an attack label.
 * Evidence selection cannot alter a snapshot, actor or combat.
 */
function isUninterruptedMeleeWitness(before,after,actor,facing){
 if(!Array.isArray(before?.units)||!Array.isArray(after?.units)||!actor||
  !['vanguard','revenant','warden'].includes(actor.kind)||actor.action!=='attack'||
  !Number.isFinite(actor.hp)||actor.hp<=0||
  !Number.isSafeInteger(actor.actionTick)||
  typeof actor.targetId!=='string'||!actor.targetId.trim()||actor.targetId.length>96||
  facing?.targetId!==actor.targetId||facing?.distance!==1||
  !Number.isFinite(facing?.yaw))return false;
 const prior=before.units.find(u=>u?.id===actor.id&&u?.kind===actor.kind);
 if(!prior||!Number.isFinite(prior.hp)||prior.hp<=0||
  actor.hp<prior.hp||prior.action==='hurt'||
  prior.actionTick===actor.actionTick)return false;
 return after.units.some(u=>u===actor||
  (u.id===actor.id&&u.kind===actor.kind&&u.actionTick===actor.actionTick&&u.hp===actor.hp));
}
function isUninjuredIdleRecovery(attack,idle,actorId){
 const fighter=attack?.units?.find(u=>u?.id===actorId);
 const next=idle?.units?.find(u=>u?.id===actorId);
 return Boolean(fighter&&next&&fighter.kind===next.kind&&fighter.hp>0&&
  next.hp===fighter.hp&&fighter.action==='attack'&&next.action==='idle'&&
  idle.run===attack.run&&idle.floor===attack.floor&&
  Number.isSafeInteger(attack.tick)&&idle.tick===attack.tick+1&&
  next.actionTick===idle.tick);
}
/**
 * A live source-rig witness must be atomic: the licensed one-shot may legally
 * complete between two Playwright calls. Require the SAME real actor, tick,
 * original clip and original skinned bind audit in one browser sample.
 */
function isExactNativeClipWitness(sample,{id,kind,action,sourceTick,clipName}={}){
 const binding=sample?.binding,actor=sample?.actor,rig=sample?.rig;
 return Boolean(typeof id==='string'&&id.length>0&&
  Number.isSafeInteger(sourceTick)&&sourceTick>=0&&
  binding?.id===id&&binding.kind===kind&&binding.action===action&&
  binding.sourceTick===sourceTick&&binding.clipName===clipName&&
  actor?.id===id&&actor.kind===kind&&actor.sourceMeshCount>0&&
  typeof actor.sourceHandName==='string'&&actor.sourceHandName.length>0&&
  rig?.summary?.invalidMatrixCount===0&&
  rig.summary.invalidQuaternionCount===0&&
  rig.summary.disconnectedSegments===0&&rig.summary.bindReferenceComplete===true);
}
/** Select a real Ranger release with no simultaneous HP-loss reaction. */
function isUninterruptedRangedWitness(before,after,actor){
 if(actor?.kind!=='ranger'||actor.action!=='attack'||
  !Number.isFinite(actor.hp)||actor.hp<=0||
  !Number.isSafeInteger(actor.actionTick)||!Array.isArray(after?.units))return false;
 const prior=before?.units?.find(u=>u?.id===actor.id&&u.kind==='ranger');
 return Boolean(prior&&Number.isFinite(prior.hp)&&prior.hp>0&&
  actor.hp>=prior.hp&&prior.action!=='hurt'&&
  prior.actionTick!==actor.actionTick&&
  after.units.some(u=>u.id===actor.id&&u.kind==='ranger'&&
   u.actionTick===actor.actionTick&&u.hp===actor.hp));
}
module.exports={isUninterruptedMeleeWitness,isUninjuredIdleRecovery,
 isExactNativeClipWitness,isUninterruptedRangedWitness};
