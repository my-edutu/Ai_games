'use strict';
/**
 * Session 03 original-source visible walking-to-idle ownership regression.
 * Measured source-rig desktop/mobile frames show large real interpolation
 * travel while Idle becomes dominant. A fading licensed Walking_A must retain
 * full-body support through a witnessed ROOT movement only; never change
 * action authority, synthesize steps, or certify a planted shoe.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

test('RED: original licensed gait survives the currently moving visual-root tail of a legal idle arrival',async()=>{
 const {planImportedWalkExitMovingFade:fade}=await load();
 const observed={mode:'idle',previousMode:'move',
  previousClipName:'Walking_A',nextClipName:'Idle',
  sourceInstanceSame:true,previousSourceRunning:true,
  previousSourceWeight:1,alive:true,visible:true,
  teleport:false,interrupted:false,reducedMotion:false,
  // Original source-GLB 390px rAF pair #44263430159, true 350ms
  // 155.2315424mm root motion: real gait cadence evidence only.
  // The exit transition is a labelled fixture, not an assertion that
  // that recorded pair was an actual Walk->Idle switch.
  groundedTravel:.1552315424295374,frameInterval:.35};
 assert.equal(fade(observed),.34,
  'preserve the original 41-joint walking-to-idle blend across genuine moving root');
 assert.equal(fade({...observed,frameInterval:.8,groundedTravel:.44}),.4,
  'a sparse but plausible original moving root retains its body pose');
});

test('source exit cannot invent walking through death, real stop, false rigs or accessibility',async()=>{
 const {planImportedWalkExitMovingFade:fade}=await load();
 const witnessed={mode:'idle',previousMode:'move',
  previousClipName:'Walking_A',nextClipName:'Idle',
  sourceInstanceSame:true,previousSourceRunning:true,
  previousSourceWeight:.95,alive:true,visible:true,
  teleport:false,interrupted:false,reducedMotion:false,
  groundedTravel:.1552315424295374,frameInterval:.35};
 const invalid=[
  {mode:'defeat'},{mode:'attack'},{mode:'hurt'},{mode:'cast'},
  {previousMode:'attack'},{previousClipName:'Hit_A'},
  {previousClipName:'Idle'},{nextClipName:'Walking_A'},
  {sourceInstanceSame:false},{previousSourceRunning:false},
  {previousSourceWeight:.3},{previousSourceWeight:NaN},
  {alive:false},{visible:false},{teleport:true},
  {interrupted:true},{reducedMotion:true},
  {groundedTravel:0},{groundedTravel:.002},{groundedTravel:.8},
  {frameInterval:0},{frameInterval:NaN},{frameInterval:3.1},
  {frameInterval:.01},{frameInterval:.35,groundedTravel:.9},
  {frameInterval:.35,groundedTravel:.005},
  {frameInterval:.35,groundedTravel:.1552315424295374,previousSourceWeight:1.5}
 ];
 for(const patch of invalid)
  assert.equal(fade({...witnessed,...patch}),.23,
   'untrusted walk exit cannot preserve moving-source blend '+JSON.stringify(patch));
 const renderer=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planImportedWalkExitMovingFade\(/,
  'real source mixer must consume the pure animation-only exit plan');
});


test('RED: same original source rig can carry a moving exit across a truly witnessed recent short frame',async()=>{
 const {planImportedWalkExitMovingFade:fade}=await load();
 // AFTER-source original 390px tick-2 Walking_A->Idle: the actual
 // transition-frame rendered root travelled only 2.259mm / 16.6ms.
 // Recent walk travel/elapsed memory below is a CONSTRUCTED contract
 // fixture, NOT a claim that this exact video measured its prior stamp.
 const sample={mode:'idle',previousMode:'move',
  previousClipName:'Walking_A',nextClipName:'Idle',
  sourceInstanceSame:true,previousSourceRunning:true,
  previousSourceWeight:1,alive:true,visible:true,
  teleport:false,interrupted:false,reducedMotion:false,
  groundedTravel:.0022590067817152004,frameInterval:.0166,
  recentGroundedTravel:.022,recentGroundedAge:.0332,
  recentGroundedFrameInterval:.05};
 assert.equal(fade(sample),.34,
  'retained original 41-joint fade requires prior same-clone real root travel, not action intent');
 const denied=[
  {recentGroundedTravel:0},{recentGroundedTravel:.002},
  {recentGroundedTravel:.25},{recentGroundedTravel:NaN},
  {recentGroundedAge:-.01},{recentGroundedAge:.15},
  {recentGroundedFrameInterval:0},{recentGroundedFrameInterval:NaN},
  {recentGroundedFrameInterval:.5},
  {recentGroundedTravel:.22,recentGroundedFrameInterval:.05},
  {recentGroundedTravel:.008,recentGroundedFrameInterval:.1},
  {groundedTravel:0},{groundedTravel:.02},
  {frameInterval:.15},{teleport:true},{interrupted:true},
  {reducedMotion:true},{sourceInstanceSame:false},
  {previousSourceRunning:false},{previousSourceWeight:.4},
  {alive:false},{visible:false},{mode:'hurt'},
  {previousClipName:'Idle'},{nextClipName:'Hit_A'}
 ];
 for(const patch of denied)
  assert.equal(fade({...sample,...patch}),.23,
   'no moving exit on absent, stale, implausible or unowned original root proof: '+
    JSON.stringify(patch));
});


test('RED: genuine original-source micro-arrival can retain a bounded 41-joint landing fade',async()=>{
 const {planImportedWalkExitMovingFade:fade}=await load();
 // REAL prior successful exact-source Actions #44468433107,
 // 17-tick 1440px/390px WebGL source-mixer receipts, NOT synthetic gait.
 // Both true 0.43mm and 2.59mm on-frame XZ distances belonged to
 // original live Walking_A -> Idle, original weight=1 and running=true,
 // but the single-frame >=8mm cache had no qualifying recent receipt.
 const source={
  mode:'idle',previousMode:'move',
  previousClipName:'Walking_A',nextClipName:'Idle',
  sourceInstanceSame:true,previousSourceRunning:true,
  previousSourceWeight:1,alive:true,visible:true,
  teleport:false,interrupted:false,reducedMotion:false,
  recentGroundedTravel:0,recentGroundedAge:0,
  recentGroundedFrameInterval:NaN
 };
 for(const [groundedTravel,frameInterval] of [
  [.0004268210031952435,.0166], // actual desktop tick 3
  [.0020819470293620412,.0167], // actual desktop tick 16
  [.00042949015223223,.0167], // actual 390px tick 3
  [.002592800852315502,.0166] // actual 390px tick 16
 ]){
  assert.equal(fade({...source,groundedTravel,frameInterval}),.30,
   'actual imported source movement supports a modest, not invented, soft landing');
 }
 const rejected=[
  {groundedTravel:0,frameInterval:.0167},
  {groundedTravel:.0002,frameInterval:.0167},
  {groundedTravel:.004,frameInterval:.0167},
  {groundedTravel:.002,frameInterval:.010},
  {groundedTravel:.002,frameInterval:.4},
  {groundedTravel:.002,frameInterval:.0167,recentGroundedTravel:.001},
  {groundedTravel:.002,frameInterval:.0167,recentGroundedAge:.04},
  {groundedTravel:.002,frameInterval:.0167,recentGroundedFrameInterval:.05},
  {groundedTravel:.002,frameInterval:.0167,previousSourceWeight:.5},
  {groundedTravel:.002,frameInterval:.0167,previousSourceRunning:false},
  {groundedTravel:.002,frameInterval:.0167,previousClipName:'Idle'},
  {groundedTravel:.002,frameInterval:.0167,sourceInstanceSame:false},
  {groundedTravel:.002,frameInterval:.0167,alive:false},
  {groundedTravel:.002,frameInterval:.0167,visible:false},
  {groundedTravel:.002,frameInterval:.0167,interrupted:true},
  {groundedTravel:.002,frameInterval:.0167,teleport:true},
  {groundedTravel:.002,frameInterval:.0167,reducedMotion:true}
 ];
 for(const patch of rejected)assert.equal(fade({
  ...source,groundedTravel:.002,frameInterval:.0167,...patch
 }),.23,'unwitnessed or interrupted original source cannot earn landing fade '+JSON.stringify(patch));
});
