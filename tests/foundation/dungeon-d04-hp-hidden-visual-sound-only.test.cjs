'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

function snapshot(tick,hp,action='idle'){
 return {run:1,floor:1,tick,phase:'exploring',events:[],map:[],
  units:[{id:'victim',kind:'vanguard',faction:'party',
   x:2,z:2,hp,maxHp:30,action,actionTick:tick}]};
}
async function scenario({beforeHp=30,afterHp=21,afterAction='hurt',
 drawable=false,live=true,renderSeconds=.016,muted=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 const originalSound=[],staged=[];
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,
  visualAdapter:{
   emit(cue){staged.push(cue);return true},
   advance(){},reset(){},dispose(){},
   hasLiveCue(){return live},hasDrawableCue(){return drawable}
  },
  audioAdapter:{
   enable(){return true},emit(cue){originalSound.push(cue);return true},
   cleanup(){},flush(){},disable(){},dispose(){}
  }
 });
 try{
  assert.equal(controller.enableAudioFromGesture(),true);
  if(muted)controller.muteAudio();
  controller.acceptSnapshot(snapshot(10,beforeHp));
  controller.acceptSnapshot(snapshot(11,afterHp,afterAction));
  controller.advance(.016,.016);
  const admitted=controller.acknowledgePresentedFrame(1,renderSeconds);
  const duplicate=controller.acknowledgePresentedFrame(1,renderSeconds);
  return {admitted,duplicate,staged,originalSound,
   stats:controller.stats()};
 }finally{controller.dispose()}
}

test('adjacent true HP loss may sound after a real frame when retained injury is alive but not drawable',async()=>{
 const r=await scenario();
 assert.deepEqual(r.staged.map(c=>c.kind),['damage']);
 assert.equal(r.staged[0].proof,'observed-hp-drop');
 assert.equal(r.admitted,1,'a valid HP loss should not wait for unrelated sprite visibility');
 assert.equal(r.duplicate,0,'a repeated frame receipt must not replay impact audio');
 assert.deepEqual(r.originalSound.map(c=>c.kind),['damage']);
 assert.ok(r.stats.recentDeliveryReceipts.some(x=>
  x.kind==='damage'&&x.frameId===1&&x.decision==='delivered'));
});
test('a hidden guard gesture is not exempted as HP-confirmed injury',async()=>{
 const r=await scenario({afterHp:30,afterAction:'guard'});
 assert.equal(r.admitted,0);
 assert.deepEqual(r.originalSound,[]);
 assert.ok(r.staged.some(c=>c.kind==='guard'));
});
test('no actual HP delta means no injury and no invented impact source',async()=>{
 const r=await scenario({afterHp:30,afterAction:'hurt'});
 assert.deepEqual(r.staged,[]);
 assert.equal(r.admitted,0);
 assert.deepEqual(r.originalSound,[]);
});
test('a late submission cannot replay even HP-confirmed sound-only injury',async()=>{
 const r=await scenario({renderSeconds:.44});
 assert.equal(r.admitted,0);
 assert.deepEqual(r.originalSound,[]);
 assert.ok(r.stats.recentDeliveryReceipts.some(x=>
  x.kind==='damage'&&x.decision==='stale-frame'));
});
test('an expired retained injury cannot authorize a detached sound',async()=>{
 const r=await scenario({live:false});
 assert.equal(r.admitted,0);
 assert.deepEqual(r.originalSound,[]);
 assert.ok(r.stats.recentDeliveryReceipts.some(x=>
  x.kind==='damage'&&x.decision==='expired-visual'));
});
test('mute must block hidden-injury foley even with genuine HP loss and frame',async()=>{
 const r=await scenario({muted:true});
 assert.equal(r.admitted,0);
 assert.deepEqual(r.originalSound,[]);
});
