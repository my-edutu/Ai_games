'use strict';
// Unit fixtures prove the gate, NOT a real 20-minute runtime or instantaneous cleanup.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditD04SampledSceneCleanup}=require('../browser/dungeon-d04-scene-transition-soak-audit.cjs');
const sample=(scene,atMs,overrides={})=>{
 const [run,floor]=scene.split(':').map(Number);
 return {scene,run,floor,atMs,pending:0,awaitingPresentation:0,
  awaitingAudioFrame:0,liveVoices:0,vfxActive:0,...overrides};
};
test('a long-running simulation that never changes scene cannot falsely pass scene cleanup',()=>{
 const audit=auditD04SampledSceneCleanup([sample('1:1',0),sample('1:1',5000)]);
 assert.equal(audit.classification,'NO_SAMPLED_SCENE_CHANGE');
 assert.equal(audit.transitionCount,0);
 assert.equal(audit.cleanupSampleCount,0);
});
test('an authentic sampled floor boundary with all read-only queues clear is narrow cleanup evidence',()=>{
 const audit=auditD04SampledSceneCleanup([
  sample('1:1',0,{vfxActive:6,liveVoices:2}),
  sample('1:2',5100),sample('1:2',10200)]);
 assert.equal(audit.classification,'SAMPLED_SCENE_CHANGE_WITH_EMPTY_RESOURCES');
 assert.equal(audit.transitionCount,1);
 assert.equal(audit.cleanupSampleCount,1);
 assert.deepEqual(audit.boundaries[0],{
  atMs:5100,from:'1:1',to:'1:2',cleanAtSample:true});
 assert.equal(audit.instantaneousCleanupVerified,false);
 assert.equal(audit.contactSynchronized,false);
});
test('new scene with potentially genuine effects must not be incorrectly called a stale leak or a cleanup pass',()=>{
 const audit=auditD04SampledSceneCleanup([
  sample('1:1',0),sample('1:2',5000,{vfxActive:2,pending:1,liveVoices:1})]);
 assert.equal(audit.classification,'SCENE_CLEANUP_NOT_SAMPLED');
 assert.equal(audit.transitionCount,1);
 assert.equal(audit.cleanupSampleCount,0);
 assert.equal(audit.boundaries[0].cleanAtSample,false);
});
test('another clean boundary can qualify despite a previous busy transition; no unobserved cleanup is invented',()=>{
 const audit=auditD04SampledSceneCleanup([
  sample('1:1',0),sample('1:2',5000,{vfxActive:3}),sample('1:3',11000)]);
 assert.equal(audit.transitionCount,2);
 assert.equal(audit.cleanupSampleCount,1);
 assert.equal(audit.classification,'SAMPLED_SCENE_CHANGE_WITH_EMPTY_RESOURCES');
});
test('inconsistent run/floor identity, missing counters or nonmonotonic timestamps fail closed',()=>{
 for(const invalid of [sample('1:2',5000,{floor:5}),
  sample('1:2',5000,{awaitingAudioFrame:null}),sample('1:2',0),
  sample('broken',5000)]){
  const audit=auditD04SampledSceneCleanup([sample('1:1',0),invalid]);
  assert.equal(audit.classification,'UNTRUSTED_SCENE_SAMPLES');
  assert.equal(audit.cleanupSampleCount,0);
 }
});
