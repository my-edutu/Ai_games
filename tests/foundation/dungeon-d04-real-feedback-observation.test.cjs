'use strict';
// D04 forensic classifications are NOT an assertion of combat realism or sample-sync.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {classifyAuthenticD04RenderObservation}=require('../browser/dungeon-d04-real-feedback-observation.cjs');

const u=(id,hp)=>({id,hp});
const before={run:1,floor:1,tick:3,checksum:'before',units:[u('ranger',85),u('enemy-1-0',20)]};
const after={run:1,floor:1,tick:4,checksum:'after',units:[u('ranger',85),u('enemy-1-0',12)]};
const atDamage={renderedState:{run:1,floor:1,tick:4,checksum:'after'},
 physicalFeedback:{scene:'1:1',queued:5,visualAccepted:0,framesAcknowledged:5,expiredQueuedCues:5,adapterFailures:0}};
const later={renderedState:{run:1,floor:1,tick:59,checksum:'f8136857'},
 physicalFeedback:{scene:'1:1',queued:129,visualAccepted:0,framesAcknowledged:59,expiredQueuedCues:129,
  adapterFailures:0,visuals:{active:0,spawned:0},audio:{played:0}}};

test('genuine consecutive HP loss + submitted real frames + all expired cues is a REAL feedback failure, not a pass',()=>{
 const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,latest:later});
 assert.equal(verdict.status,'ALL_CUES_EXPIRED_WITH_REAL_FRAMES');
 assert.equal(verdict.authoritativeDamage,true);
 assert.equal(verdict.damageVictims,1);
 assert.equal(verdict.sampleSynchronized,false);
 assert.equal(verdict.visualAcceptance,false);
 assert.ok(verdict.framesAcknowledged>0);
 assert.ok(verdict.expiredQueuedCues>=verdict.queued);
});
test('no actual HP loss, cross-floor pair, or mismatched rendered checksum cannot certify genuine combat',()=>{
 for(const badAfter of [
  {...after,units:before.units},
  {...after,run:2},
  {...after,floor:2},
  {...after,tick:5}
 ]){
  const verdict=classifyAuthenticD04RenderObservation({before,after:badAfter,atDamage,latest:later});
  assert.equal(verdict.status,'INVALID_AUTHORITY_PAIR');
  assert.equal(verdict.visualAcceptance,false);
 }
 assert.equal(classifyAuthenticD04RenderObservation({
  before,after,atDamage:{...atDamage,renderedState:{...atDamage.renderedState,checksum:'wrong'}},
  latest:later}).status,'INVALID_RENDERED_DAMAGE_WITNESS');
});
test('admitted D04 visuals are not mislabeled as measured contact or A/V synchronization',()=>{
 const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,
  latest:{...later,physicalFeedback:{...later.physicalFeedback,visualAccepted:2,expiredQueuedCues:127,
   visuals:{active:1,spawned:2}}}});
 assert.equal(verdict.status,'VISUAL_ADMITTED_NOT_AV_VERIFIED');
 assert.equal(verdict.visualAcceptance,true);
 assert.equal(verdict.sampleSynchronized,false);
 assert.equal(verdict.damageVictims,1);
});
test('missing and contradictory browser counters fail closed',()=>{
 for(const physicalFeedback of [
  null,
  {...later.physicalFeedback,framesAcknowledged:0,visualAccepted:3},
  {...later.physicalFeedback,queued:4,expiredQueuedCues:6},
  {...later.physicalFeedback,adapterFailures:1}
 ]){
  const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,
   latest:{...later,physicalFeedback}});
  assert.equal(verdict.visualAcceptance,false);
  assert.equal(verdict.sampleSynchronized,false);
 }
});
test('a different run, floor, or stale tick cannot borrow another encounter visual counter',()=>{
 const showingVisual={...later.physicalFeedback,visualAccepted:2,expiredQueuedCues:127};
 for(const scene of [
  {renderedState:{...later.renderedState,run:2},physicalFeedback:{...showingVisual,scene:'2:1'}},
  {renderedState:{...later.renderedState,floor:2},physicalFeedback:{...showingVisual,scene:'1:2'}},
  {renderedState:{...later.renderedState,tick:2},physicalFeedback:showingVisual},
  {renderedState:later.renderedState,physicalFeedback:{...showingVisual,scene:'2:1'}}
 ]){
  const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,latest:scene});
  assert.equal(verdict.visualAcceptance,false);
  assert.equal(verdict.status,'INVALID_LATEST_RENDERED_SCENE');
 }
 const noD04AtDamage=classifyAuthenticD04RenderObservation({
  before,after,atDamage:{...atDamage,physicalFeedback:null},
  latest:{...later,physicalFeedback:showingVisual}
 });
 assert.equal(noD04AtDamage.visualAcceptance,false);
 assert.equal(noD04AtDamage.status,'INVALID_RENDERED_DAMAGE_WITNESS');
});
test('real preview persists original media and forensic verdict BEFORE the final non-passing acceptance assertion',()=>{
 const root=path.resolve(__dirname,'../..');
 const source=fs.readFileSync(path.join(root,'tests/browser/dungeon-physical-feedback-preview.spec.cjs'),'utf8');
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/dungeon-d04-foley-identity.yml'),'utf8');
 assert.match(workflow,/dungeon-d04-real-feedback-observation\.test\.cjs/);
 assert.match(workflow,/^\s*-\s*tests\/browser\/dungeon-d04-real-feedback-observation\.cjs\s*$/m,
  'Isolated D04 CI must trigger on changes to the real-browser verdict classifier');
 assert.match(source,/classifyAuthenticD04RenderObservation/);
 const media=source.lastIndexOf('await attachD04LiveAVCapture(page,captureStarted,test.info())');
 const forensic=source.lastIndexOf("'d04-real-render-feedback-verdict.json'");
 const acceptance=source.lastIndexOf("toBe('VISUAL_ADMITTED_NOT_AV_VERIFIED')");
 assert.ok(media>0&&forensic>media&&acceptance>forensic,
  'On sparse WebGL, never abort before preserving authenticated audio/video and stale-cue evidence');
});


const delivered=(tick,target,kind='damage')=>({
 cueId:`1:1:${tick}:${kind}:-:${target}`,scene:'1:1',tick,kind,
 visual:true,audio:false,frameId:12,decision:'delivered',
 observedClockMs:1000,submittedClockMs:1120,observationToSubmissionMs:120
});
test('unrelated admitted visual at a later tick cannot certify the original authentic HP-loss victim',()=>{
 const result=classifyAuthenticD04RenderObservation({before,after,atDamage,
  latest:{...later,physicalFeedback:{...later.physicalFeedback,
   visualAccepted:4,expiredQueuedCues:125,recentDeliveryReceipts:[
    {cueId:'1:1:4:damage:-:enemy-1-0',scene:'1:1',tick:4,kind:'damage',
     visual:false,audio:false,frameId:null,decision:'expired-pending-before-frame'},
    delivered(9,'enemy-1-0')
   ]}}});
 assert.equal(result.authoritativeDamage,true);
 assert.equal(result.damageVictims,1);
 assert.equal(result.visualAcceptance,false);
 assert.equal(result.status,'AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED');
 assert.equal(result.sampleSynchronized,false);
});
test('same-tick unrelated injury, wrong actor identity, and stale frames never prove target-specific damage visuals',()=>{
 for(const receipt of [
  delivered(4,'ranger'),
  {...delivered(4,'enemy-1-0'),cueId:'1:1:4:damage:invented-attacker:enemy-1-0'},
  {...delivered(4,'enemy-1-0'),decision:'stale-frame'},
  {...delivered(4,'enemy-1-0'),visual:false},
  {...delivered(4,'enemy-1-0'),submittedClockMs:1600,observationToSubmissionMs:600}
 ]){
  const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,
   latest:{...later,physicalFeedback:{...later.physicalFeedback,
    visualAccepted:1,expiredQueuedCues:128,recentDeliveryReceipts:[receipt]}}});
  assert.equal(verdict.visualAcceptance,false,JSON.stringify(receipt));
 }
});
test('authentic delivered HP-loss receipt proves ONLY frame-level visual admission, not audio alignment',()=>{
 const receipt=delivered(4,'enemy-1-0');
 const verdict=classifyAuthenticD04RenderObservation({before,after,atDamage,
  latest:{...later,physicalFeedback:{...later.physicalFeedback,
   visualAccepted:1,expiredQueuedCues:128,recentDeliveryReceipts:[receipt]}}});
 assert.equal(verdict.status,'VISUAL_ADMITTED_NOT_AV_VERIFIED');
 assert.equal(verdict.visualAcceptance,true);
 assert.equal(verdict.damageVisualAdmitted,1);
 assert.equal(verdict.sampleSynchronized,false);
});
