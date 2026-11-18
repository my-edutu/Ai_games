'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectD04AdmittedHpContactForRecording:select}=
 require('../browser/dungeon-d04-contact-window.cjs');
const receipt=(kind='damage-fatal',overrides={})=>({
 cueId:'1:1:38:'+kind+':-:oathbound-1-0',
 kind,scene:'1:1',tick:38,decision:'delivered',audio:true,visual:true,
 visualDrawableAtSubmission:true,frameId:83,observationToSubmissionMs:65,
 observedClockMs:1000,submittedClockMs:1065,...overrides
});
const start=(kind='damage-fatal',overrides={})=>({
 cueId:'1:1:38:'+kind+':-:oathbound-1-0',
 kind,sceneKey:'1:1',tick:38,
 audio:kind==='damage-fatal'?'fatal-impact':'impact',
 verifiedCanonicalCue:true,startedSources:2,scheduledContextMs:1025,...overrides
});
const selectOne=(r,s)=>select({receipts:[r],sourceStarts:[s],firstFrameId:82,lastFrameId:83});
test('timely genuinely drawable fatal HP loss retains the original fatal-impact recording window',()=>{
 assert.deepEqual(selectOne(receipt(),start()),{
  cueId:'1:1:38:damage-fatal:-:oathbound-1-0',
  kind:'damage-fatal',scene:'1:1',tick:38,frameId:83,ageMs:65
 });
});
test('fatal-impact and ordinary impact cannot impersonate each other',()=>{
 assert.equal(selectOne(receipt(),start('damage-fatal',{audio:'impact'})),null);
 assert.equal(selectOne(receipt('damage'),start('damage',{audio:'fatal-impact'})),null);
});
test('nonfatal real injury still matches only its normal impact',()=>{
 assert.equal(selectOne(receipt('damage'),start('damage'))?.kind,'damage');
});
test('fatal recording cannot borrow stale, hidden, unrelated or unsubmitted HP receipt',()=>{
 assert.equal(selectOne(receipt('damage-fatal',{observationToSubmissionMs:401,
  submittedClockMs:1401}),start()),null);
 assert.equal(selectOne(receipt('damage-fatal',{visualDrawableAtSubmission:false}),start()),null);
 assert.equal(selectOne(receipt(),start('damage-fatal',{
  cueId:'1:1:38:damage-fatal:-:other-victim'})),null);
 assert.equal(selectOne(receipt('damage-fatal',{frameId:82}),start()),null);
});
