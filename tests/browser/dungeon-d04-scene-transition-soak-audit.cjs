'use strict';
/**
 * Read-only audit of ACTUAL sampled D04 spectator scene changes during the
 * real DungeonRuntime 20-minute soak. No mocked stream, no authority changes.
 * A five-second sampler cannot establish instantaneous floor-change teardown.
 */
const LIMIT=256;
const counters=['pending','awaitingPresentation','awaitingAudioFrame','liveVoices','vfxActive'];
function auditD04SampledSceneCleanup(samples){
 const base={transitionCount:0,cleanupSampleCount:0,boundaries:[],
  instantaneousCleanupVerified:false,contactSynchronized:false,
  limitation:'A clean first observed sample after a floor/run change does not prove instant teardown or decoded audiovisual contact.'};
 const untrusted=reason=>({...base,classification:'UNTRUSTED_SCENE_SAMPLES',reason});
 if(!Array.isArray(samples)||samples.length<2||samples.length>LIMIT)
  return untrusted('missing-or-over-budget-samples');
 let prior=null,cleanupSampleCount=0,transitionCount=0;
 const boundaries=[];
 for(const s of samples){
  if(!s||!Number.isSafeInteger(s.atMs)||s.atMs<0||
   !Number.isSafeInteger(s.run)||s.run<0||
   !Number.isSafeInteger(s.floor)||s.floor<1||
   typeof s.scene!=='string'||s.scene!==`${s.run}:${s.floor}`||
   counters.some(key=>!Number.isSafeInteger(s[key])||s[key]<0)||
   prior&&s.atMs<=prior.atMs)
   return untrusted('invalid-scene-identity-resource-counter-or-clock');
  if(prior&&s.scene!==prior.scene){
   transitionCount++;
   const cleanAtSample=counters.every(key=>s[key]===0);
   if(cleanAtSample)cleanupSampleCount++;
   if(boundaries.length<64)boundaries.push({
    atMs:s.atMs,from:prior.scene,to:s.scene,cleanAtSample});
  }
  prior=s;
 }
 return {...base,transitionCount,cleanupSampleCount,boundaries,
  classification:transitionCount===0?'NO_SAMPLED_SCENE_CHANGE':
   cleanupSampleCount===0?'SCENE_CLEANUP_NOT_SAMPLED':
    'SAMPLED_SCENE_CHANGE_WITH_EMPTY_RESOURCES'};
}
module.exports={auditD04SampledSceneCleanup};
