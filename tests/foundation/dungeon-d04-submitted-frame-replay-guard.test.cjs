'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

// No GLB, renderer, WebAudio device or recorded samples: this exercises the
// real D04 controller's frame-submission receipt contract with fake adapters.
const snapshot=(tick,run=1,floor=1,warning=false)=>({
 tick,run,floor,units:[],events:warning?[{tick,kind:'telegraph',text:'a threat'}]:[]
});
async function rig(){
 const {createPhysicalCombatFeedback}=await load();
 const sounds=[];
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:true,
  visualAdapter:{emit(){return false},advance(){},reset(){},dispose(){}},
  audioAdapter:{
   enable(){return true},emit(cue){sounds.push(cue);return true},
   disable(){},flush(){},cleanup(){},dispose(){}
  }
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(1));
 function stage(tick,run=1,floor=1){
  director.acceptSnapshot(snapshot(tick,run,floor,true));
  director.advance(.016,.016);
 }
 return {director,sounds,stage};
}
test('D04 rejects an older numeric render serial without draining new audio',async()=>{
 const {director,sounds,stage}=await rig();
 stage(2);
 assert.equal(director.acknowledgePresentedFrame(41,.004),1);
 stage(3);
 const before=director.stats();
 assert.equal(before.awaitingPresentation,1);
 assert.equal(director.acknowledgePresentedFrame(40,.004),0);
 assert.equal(director.stats().awaitingPresentation,1,
  'a recycled frame cannot certify a later authority action');
 assert.equal(director.stats().framesAcknowledged,before.framesAcknowledged);
 assert.equal(sounds.length,1);
 assert.equal(director.acknowledgePresentedFrame(42,.004),1);
 assert.equal(sounds.length,2);
 director.dispose();
});
test('D04 remembers non-adjacent string render IDs while newer cues queue',async()=>{
 const {director,sounds,stage}=await rig();
 stage(2);assert.equal(director.acknowledgePresentedFrame('draw-a',.003),1);
 stage(3);assert.equal(director.acknowledgePresentedFrame('draw-b',.003),1);
 stage(4);
 assert.equal(director.acknowledgePresentedFrame('draw-a',.003),0);
 assert.equal(director.stats().awaitingPresentation,1);
 assert.equal(director.acknowledgePresentedFrame('draw-c',.003),1);
 assert.equal(sounds.length,3);
 director.dispose();
});
test('D04 preserves serial order across mixed numeric and string frame IDs',async()=>{
 const {director,sounds,stage}=await rig();
 stage(2);assert.equal(director.acknowledgePresentedFrame(110,.003),1);
 stage(3);assert.equal(director.acknowledgePresentedFrame('capture-a',.003),1);
 stage(4);
 assert.equal(director.acknowledgePresentedFrame(109,.003),0);
 assert.equal(director.acknowledgePresentedFrame(111,.003),1);
 assert.equal(sounds.length,3);
 director.dispose();
});
test('D04 permits renderer serial reuse only after an explicit scene reset',async()=>{
 const {director,sounds,stage}=await rig();
 stage(2);assert.equal(director.acknowledgePresentedFrame(1,.003),1);
 director.reset();
 director.acceptSnapshot(snapshot(1));
 stage(2);
 assert.equal(director.acknowledgePresentedFrame(1,.003),1);
 assert.equal(sounds.length,2);
 director.dispose();
});
test('D04 replay protection remains bounded under many unique string IDs',async()=>{
 const {director,sounds,stage}=await rig();
 stage(2);assert.equal(director.acknowledgePresentedFrame('frame-0',.003),1);
 for(let i=1;i<=140;i++)director.acknowledgePresentedFrame('frame-'+i,.003);
 const report=director.stats();
 assert.ok(report.recentStringFrameIds<=64,'frame history must stay bounded');
 stage(3);
 assert.equal(director.acknowledgePresentedFrame('frame-140',.003),0);
 assert.equal(director.acknowledgePresentedFrame('frame-141',.003),1);
 assert.equal(sounds.length,2);
 director.dispose();
});

test('D04 floor transitions cannot recycle an already submitted numeric frame to sound a new cue',async()=>{
 const {director,sounds,stage}=await rig();
 try{
  stage(2);assert.equal(director.acknowledgePresentedFrame(500,.003),1);
  director.acceptSnapshot(snapshot(1,1,2)); // Automatic floor transition, NOT renderer reset.
  stage(2,1,2);
  assert.equal(director.stats().awaitingPresentation,1);
  assert.equal(director.acknowledgePresentedFrame(500,.003),0,
   'old submitted frame serial cannot certify the new floor before another draw');
  assert.equal(director.stats().awaitingPresentation,1);
  assert.equal(sounds.length,1);
  assert.equal(director.acknowledgePresentedFrame(501,.003),1);
  assert.equal(sounds.length,2);
 }finally{director.dispose()}
});

test('D04 run transitions keep bounded opaque frame-replay protection until explicit renderer reset',async()=>{
 const {director,sounds,stage}=await rig();
 try{
  stage(2);assert.equal(director.acknowledgePresentedFrame('old-run-frame',.003),1);
  director.acceptSnapshot(snapshot(1,2,1)); // New authority run, same live WebGL canvas.
  stage(2,2,1);
  assert.equal(director.acknowledgePresentedFrame('old-run-frame',.003),0);
  assert.equal(director.stats().awaitingPresentation,1);
  assert.equal(sounds.length,1);
  assert.equal(director.acknowledgePresentedFrame('new-run-frame',.003),1);
  assert.equal(sounds.length,2);
  assert.ok(director.stats().recentStringFrameIds<=64);
 }finally{director.dispose()}
});
