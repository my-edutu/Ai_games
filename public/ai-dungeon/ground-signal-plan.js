/**
 * Cosmetic contact-language budget for the real autonomous Dungeon spectator.
 * A persistent additive ring beneath every idle actor reads as an arcade HUD
 * and competes with honest hostile telegraphs. Keep a soft grounded shadow;
 * reserve restrained circles for real cast/guard actions from public snapshots.
 * These frozen presets allocate nothing per frame and cannot affect combat.
 */
const OFF=Object.freeze({shadowVisible:false,sigilVisible:false,coronaVisible:false,sigilOpacity:0,coronaOpacity:0,spin:false});
const SHADOW=Object.freeze({shadowVisible:true,sigilVisible:false,coronaVisible:false,sigilOpacity:0,coronaOpacity:0,spin:false});
const GUARD=Object.freeze({shadowVisible:true,sigilVisible:true,coronaVisible:false,sigilOpacity:.22,coronaOpacity:0,spin:false});
const CAST=Object.freeze({shadowVisible:true,sigilVisible:true,coronaVisible:true,sigilOpacity:.23,coronaOpacity:.10,spin:true});
const CAST_STILL=Object.freeze({shadowVisible:true,sigilVisible:true,coronaVisible:false,sigilOpacity:.23,coronaOpacity:0,spin:false});
const BOSS_CAST=Object.freeze({shadowVisible:true,sigilVisible:true,coronaVisible:true,sigilOpacity:.36,coronaOpacity:.16,spin:true});
const BOSS_CAST_STILL=Object.freeze({shadowVisible:true,sigilVisible:true,coronaVisible:false,sigilOpacity:.36,coronaOpacity:0,spin:false});

export function planGroundSignal(kind,action,alive,reducedMotion=false){
 if(alive!==true)return OFF;
 if(action==='guard')return GUARD;
 if(action==='cast'){
  if(kind==='warden')return reducedMotion?BOSS_CAST_STILL:BOSS_CAST;
  return reducedMotion?CAST_STILL:CAST;
 }
 return SHADOW;
}
