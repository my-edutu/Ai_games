'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const snapshot=(tick,hp,{run=1,floor=1}={})=>({
 run,floor,tick,events:[],units:[{
  id:'hero',kind:'vanguard',faction:'party',x:2,z:2,
  hp,maxHp:30,action:hp<30?'hurt':'idle',actionTick:tick
 }]
});
async function harness(){
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const sounds=[],visuals=[];
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>now,
  visualAdapter:{
   emit(cue){visuals.push(cue);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){sounds.push(cue);return true},
   flush(){},cleanup(){},disable(){},dispose(){}
  }
 });
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(snapshot(10,30));
 d.acceptSnapshot(snapshot(11,20));
 return {d,sounds,visuals,setClock(value){now=value}};
}
function confirmRevocation(receipt,{decision,visual}){
 assert.ok(receipt,'every dropped authentic injury needs a terminal receipt');
 assert.equal(receipt.kind,'damage');
 assert.equal(receipt.tick,11);
 assert.equal(receipt.scene,'1:1','a change of floor must retain the OLD scene provenance');
 assert.equal(receipt.decision,decision);
 assert.equal(receipt.visual,visual);
 assert.equal(receipt.audio,false,'no old contact sound was admitted');
 assert.equal(receipt.frameId,null,'a scene reset cannot manufacture a WebGL submission');
 assert.equal(receipt.submittedClockMs,null);
 assert.equal(receipt.sampleSynchronized,false);
}

test('an HP-confirmed cue pending on floor transition has an explicit non-submission receipt',async()=>{
 const h=await harness();
 try{
  assert.equal(h.d.stats().pending,1);
  assert.equal(h.d.stats().awaitingPresentation,0);
  h.d.acceptSnapshot(snapshot(1,30,{run:2,floor:1}));
  const r=h.d.stats();
  assert.equal(r.pending,0);
  assert.equal(r.scene,'2:1');
  confirmRevocation(r.recentDeliveryReceipts.at(-1),
   {decision:'scene-transition-pending',visual:false});
  h.d.advance(.016,.016);
  assert.equal(h.d.acknowledgePresentedFrame(1,.01),0);
  assert.deepEqual(h.sounds,[],'a new scene must not play a prior wound');
 }finally{h.d.dispose()}
});

test('a staged, visually admitted HP injury revoked by floor transition is not a submitted sound',async()=>{
 const h=await harness();
 try{
  h.d.advance(.016,.016);
  assert.equal(h.d.stats().awaitingPresentation,1);
  assert.equal(h.visuals.length,1,'the actual injury had entered retained visual staging');
  h.d.acceptSnapshot(snapshot(1,30,{run:1,floor:2}));
  const r=h.d.stats();
  assert.equal(r.awaitingPresentation,0);
  assert.equal(r.scene,'1:2');
  confirmRevocation(r.recentDeliveryReceipts.at(-1),
   {decision:'scene-transition-awaiting-frame',visual:true});
  assert.equal(h.d.acknowledgePresentedFrame(1,.012),0);
  assert.deepEqual(h.sounds,[]);
  assert.ok(r.staleAudioDropped>=1,'the staged original sound was cancelled');
 }finally{h.d.dispose()}
});

test('explicit preview reset audits the unsubmitted injury and permits only a NEW observed scene',async()=>{
 const h=await harness();
 try{
  h.d.advance(.016,.016);
  h.d.reset();
  const r=h.d.stats();
  assert.equal(r.scene,null);
  assert.equal(r.awaitingPresentation,0);
  confirmRevocation(r.recentDeliveryReceipts.at(-1),
   {decision:'explicit-reset-awaiting-frame',visual:true});
  assert.equal(h.d.acknowledgePresentedFrame(1,.010),0);
  h.d.acceptSnapshot(snapshot(12,30));
  h.d.acceptSnapshot(snapshot(13,18));
  h.d.advance(.016,.016);
  h.setClock(100.04);
  assert.equal(h.d.acknowledgePresentedFrame(2,.010),1,
   'new authoritative HP loss can still receive sound after a genuinely new frame');
  assert.deepEqual(h.sounds.map(c=>c.tick),[13]);
 }finally{h.d.dispose()}
});

test('dispose preserves a bounded pending-cue revocation without reviving its foley',async()=>{
 const h=await harness();
 assert.equal(h.d.stats().pending,1);
 h.d.dispose();
 const r=h.d.stats();
 assert.equal(r.disposed,true);
 confirmRevocation(r.recentDeliveryReceipts.at(-1),
  {decision:'dispose-pending',visual:false});
 assert.equal(h.d.acknowledgePresentedFrame(1,.010),0);
 assert.deepEqual(h.sounds,[]);
 assert.ok(r.recentDeliveryReceipts.length<=r.limits.maxReceipts);
});
