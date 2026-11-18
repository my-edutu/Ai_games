'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

// Exact original source-GLB Action #44174412381 / 390px + desktop:
// Walking_A displayed frame intervals 4.0332s and 4.6832s, and the actual
// legal 0.44m actor travel was documented in the original real-travel receipts.
// This tests crossfade ownership *only*, not a foot plant, real-time GPU fps,
// skin clearance, synthetic root travel or unrestricted mixer stepping.
test('RED: genuine 4-second source-rig walking frames advance whole-skeleton fade without inventing foot distance',async()=>{
 const {planImportedLivingSourceStep:step,
  planImportedWalkingMixerFrameDelta:mixer,
  planImportedWalkingBlendRate:rate}=await load();
 const base={mode:'move',sourceTime:.16,sourceDuration:1.0416666666666667,
  effectiveSpeed:1.25,frameDelta:.05,walkingClip:true,
  groundedMoving:true,groundedTravel:.44,visible:true,
  reducedMotion:false,teleport:false};
 for(const [name,seconds] of [['mobile',4.033200000000008],['desktop',4.683199999999999]]){
  const sample={...base,frameInterval:seconds};
  const sourceStep=step(sample);
  assert.equal(sourceStep,.28,name+' genuine imported animation remains limited by real travelled distance');
  const fadeStep=mixer({...sample,sourceStep});
  assert.equal(fadeStep,.09,name+' a confirmed 440mm native source step earns at most 90ms crossfade');
  assert.ok(Math.abs(rate({...sample,sourceStep})*fadeStep-sourceStep)<1e-9,
   name+' 41 original skin joints must still advance only the legally witnessed 280ms clip segment');
 }
});

test('very sparse fade rejects stationary, invalid, unwitnessed, hidden or disrupted source walks',async()=>{
 const {planImportedWalkingMixerFrameDelta:mixer}=await load();
 const base={mode:'move',sourceTime:.16,sourceDuration:1.0416666666666667,
  effectiveSpeed:1.25,frameDelta:.05,frameInterval:4.0332,
  sourceStep:.28,walkingClip:true,groundedMoving:true,
  groundedTravel:.44,visible:true,reducedMotion:false,teleport:false};
 for(const patch of [
  {mode:'hurt'},{mode:'cast'},{mode:'defeat'},{walkingClip:false},
  {groundedMoving:false},{groundedTravel:0},{groundedTravel:.05},
  {sourceStep:0},{sourceStep:.05},{groundedTravel:.8},
  {frameInterval:2.1},{frameInterval:5.1},{frameInterval:NaN},
  {visible:false},{teleport:true},{reducedMotion:true},
  {sourceTime:NaN},{sourceDuration:0},{effectiveSpeed:0}
 ])assert.equal(mixer({...base,...patch}),.05,
  'no additional source fade from untrusted native gait: '+JSON.stringify(patch));
});


// Exact native ORIGINAL CC0 source receipt, Actions #44194705323,
// artifacts dungeon-full-body-original-sole-hand-desktop.json, tick 6:
// legal root moved 0.4400000000000004m in 1.983300000000007s,
// previous source clip Idle -> Walking_A, real fade planner returned .23s.
// This is one recorded interval and real travel, not combined samples.
// RED-first expected .09s whole ORIGINAL skeleton fade; source distance
// clock, loaded shoe, attachments and gameplay are NOT modified here.
test('RED-first: genuine 1.9833-second, 440mm original desktop root travel accelerates the entire 41-joint source fade',async()=>{
 const {planImportedRealTravelCrossfade:fade,
  planImportedLivingSourceStep:step}=await load();
 const frame={mode:'move',previousMode:'idle',sourceClipName:'Walking_A',
  ownerLocomotion:true,groundedMoving:true,
  groundedTravel:.4400000000000004,frameInterval:1.983300000000007,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false};
 assert.equal(fade(frame),.09,
  'actual licensed GLB movement must not leave the whole rig on 230ms Idle crossfade');
 const source=step({mode:'move',walkingClip:true,sourceDuration:1.0416666666666667,
  effectiveSpeed:1.25,sourceTime:.16,frameInterval:frame.frameInterval,
  groundedTravel:frame.groundedTravel,groundedMoving:true,teleport:false,
  reducedMotion:false,visible:true,frameDelta:.05});
 assert.equal(source,.28,
  'real rooted distance, never accelerated mixer-fade time, owns original walking knees and soles');
 for(const patch of [{alive:false},{visible:false},{teleport:true},
  {interrupted:true},{reducedMotion:true},{ownerLocomotion:false},
  {groundedMoving:false},{groundedTravel:0},{groundedTravel:.02},
  {groundedTravel:.6},{frameInterval:3.1},{previousMode:'attack'},
  {sourceClipName:'Idle'}, {frameInterval:NaN}]){
  assert.equal(fade({...frame,...patch}),.23,
   'must preserve old fade when unqualified: '+JSON.stringify(patch));
 }
});


// Source-cadence receipt from genuine 390px CC0 Walking_A #44263430159:
// source RAF patch tick 2, frames 28->29, BOTH source clip weights 1,
// 0.35000000000000053s shown, lawful 0.1552315424295374m root travel,
// original Walking_A 1.0416666269302368s, source 0.79053356->0.94308028.
// It establishes the original travelled cadence ONLY. The test's idle->walk
// entry is an explicitly constructed transition fixture, not a claimed
// source screenshot; no ground contact, extra step or hit is synthesized.
test('RED: genuinely travelled 350ms source gait completes a bounded whole-rig blend without accelerating original clip distance',async()=>{
 const {planImportedLivingSourceStep:step,
  planImportedWalkingMixerFrameDelta:mixer,
  planImportedWalkingBlendRate:rate,
  planImportedRealTravelCrossfade:fade}=await load();
 const frame={mode:'move',walkingClip:true,sourceClipName:'Walking_A',
  previousMode:'idle',ownerLocomotion:true,alive:true,
  visible:true,teleport:false,reducedMotion:false,interrupted:false,
  sourceDuration:1.0416666269302368,sourceTime:.7905335633173898,
  effectiveSpeed:1,frameDelta:.05,
  frameInterval:.35000000000000053,groundedMoving:true,
  groundedTravel:.1552315424295374};
 const originalStep=step(frame);
 assert.ok(originalStep>.10&&originalStep<.20,
  'the original walking source must remain paced by 155mm witnessed travel');
 assert.equal(mixer({...frame,sourceStep:originalStep}),.09,
  'original mixer already grants at most 90ms per 350ms display frame; source clip remains distance paced');
 assert.ok(Math.abs(rate({...frame,sourceStep:originalStep})*.09-originalStep)<1e-9,
  'no source knee/ankle cycle speed-up when only crossfade clock changes');
 assert.equal(fade(frame),.12,'original Idle -> Walking_A owns a bounded 120ms fade');
 for(const patch of [
  {mode:'hurt'},{walkingClip:false},{groundedMoving:false},
  {frameInterval:2.5},{frameInterval:NaN},
  {teleport:true},{reducedMotion:true},{visible:false},
  {sourceDuration:0},{effectiveSpeed:0}
 ]){
  const untrusted={...frame,...patch};
  assert.equal(mixer({...untrusted,sourceStep:originalStep}),.05,
   'invalid or unwitnessed cadence cannot speed original fade clock: '+JSON.stringify(patch));
 }
 for(const patch of [{mode:'hurt'},{previousMode:'attack'},
  {ownerLocomotion:false},{interrupted:true},{alive:false},
  {groundedMoving:false},{groundedTravel:0},{groundedTravel:.004},
  {frameInterval:.8},{teleport:true},{reducedMotion:true},
  {visible:false}]){
  assert.equal(fade({...frame,...patch}),.23,
   'invalid authored transition retains source prior fade: '+JSON.stringify(patch));
 }
});
