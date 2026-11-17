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
