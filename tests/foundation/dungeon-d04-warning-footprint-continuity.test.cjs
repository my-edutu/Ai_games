'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=name=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon',name)).href);

const originalCells=()=>Array.from({length:24},(_,i)=>({x:2+(i%8),z:2+Math.floor(i/8)}));
const warden=()=>({id:'warden',kind:'warden',faction:'enemy',hp:50,maxHp:60,
 x:6,z:6,action:'idle',actionTick:8});
const scene=(tick,cells=originalCells())=>({run:1,floor:1,tick,
 units:[warden()],events:[],bossWarning:cells===null?null:{
  warning:true,shape:'NOVA',attackTick:14,turnsUntilImpact:14-tick,cells}
});
function changedUnmarkedCells(cue){
 const sampled=new Set(cue.detail.cells.map(p=>p.x+':'+p.z));
 const cells=originalCells();
 const i=cells.findIndex(p=>!sampled.has(p.x+':'+p.z));
 assert.ok(i>=0,'fixture must include an unsampled real danger cell');
 cells[i]={x:13,z:13};
 assert.ok(cue.detail.cells.every(p=>cells.some(c=>c.x===p.x&&c.z===p.z)),
  'all eight visible markers intentionally remain in public footprint');
 return cells;
}
async function witnessedCue(){
 const {planPhysicalFeedback}=await load('physical-feedback-plan.js');
 const cues=planPhysicalFeedback(scene(10,null),scene(11));
 assert.equal(cues.length,1);
 assert.equal(cues[0].visual,'warning');
 return cues[0];
}
test('D04 compares the COMPLETE witnessed Warden footprint, not just eight painted cells',async()=>{
 const {isLiveWardenWarning}=await load('warden-warning-lifecycle.js');
 const cue=await witnessedCue();
 assert.ok(typeof cue.detail.footprintKey==='string'&&cue.detail.footprintKey.length>0);
 assert.equal(isLiveWardenWarning(cue,scene(12)),true);
 assert.equal(isLiveWardenWarning(cue,scene(12,changedUnmarkedCells(cue))),false,
  'changing an unsampled danger cell revokes the original body-local tell');
 assert.equal(isLiveWardenWarning(cue,scene(12,[...originalCells()].reverse())),true,
  'public cell ordering is not physical hazard identity');
 assert.equal(isLiveWardenWarning(cue,scene(12,[...originalCells(),originalCells()[0]])),true,
  'duplicate coordinates do not create a new footprint');
});
test('D04 owner-specific warning with missing or falsified full-footprint proof fails closed',async()=>{
 const {isLiveWardenWarning}=await load('warden-warning-lifecycle.js');
 const cue=await witnessedCue();
 const {footprintKey,...rest}=cue.detail;
 assert.equal(isLiveWardenWarning({...cue,detail:rest},scene(12)),false);
 assert.equal(isLiveWardenWarning({...cue,detail:{...cue.detail,footprintKey:'forged'}},scene(12)),false);
});
test('D04 cannot play an unsubmitted warning after only unsampled danger cells change',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const cues=[],visuals={
  emit:()=>true,advance(){},hasLiveCue:()=>true,hasDrawableCue:()=>true,
  reset(){},dispose(){},stats:()=>({reservedInstances:102,drawCalls:7})
 };
 const audio={enable:()=>true,emit:c=>{cues.push(c);return true},
  disable(){},flush(){},cleanup(){},dispose(){}};
 const d=createPhysicalCombatFeedback({
  visualAdapter:visuals,audioAdapter:audio,requirePresentedFrame:true});
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(scene(10,null));
  d.acceptSnapshot(scene(11));
  d.advance(.016,.016);
  assert.equal(d.stats().awaitingPresentation,1);
  const cue=await witnessedCue();
  d.acceptSnapshot(scene(12,changedUnmarkedCells(cue)));
  assert.equal(d.acknowledgePresentedFrame(1,.003),0);
  assert.equal(cues.length,0,'never sound a revoked visual warning');
  assert.equal(d.stats().recentDeliveryReceipts.at(-1)?.decision,'retired-warning');
  assert.equal(d.stats().limits.maxAudioAwaitingFrame,32);
 }finally{d.dispose()}
});
