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
