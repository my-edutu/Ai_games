'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

function unit(kind,action,tick,hp=30){
 return {id:kind,kind,faction:kind==='warden'?'enemy':'party',x:2,z:2,
  hp,maxHp:30,action,actionTick:tick,
  ...(kind==='warden'?{recoveryUntilTick:12}:{})};
}
function snapshot(tick,scenario,after=false){
 const kind=scenario==='warden'?'warden':scenario==='utility'?'mystic':'vanguard';
 const u=unit(kind,!after?'idle':
  scenario==='guard'?'guard':scenario==='damage'?'hurt':'cast',
  after?11:10,scenario==='damage'&&after?20:30);
 return {run:1,floor:1,tick,phase:'exploring',units:[u],map:[],
  guardianWard:false,
  ...(scenario==='warden'&&after?{bossRecovery:{remaining:2}}:{}),
  events:after&&scenario==='warden'?[{tick:11,kind:'opening',text:'untrusted'}]:
   after&&scenario==='utility'?[{tick:11,kind:'healing',text:'untrusted'}]:[]};
}
async function trial(scenario,{draw=false,witness=false,probe=true}={}){
 const {createPhysicalCombatFeedback}=await load();
 const sounded=[],drawn=[],queries=[];
 const visuals={emit(c){drawn.push(c);return draw},advance(){},reset(){},dispose(){},
  hasLiveCue(){return draw},hasDrawableCue(){return draw}};
 if(probe)visuals.hasAuthenticatedBodyPose=c=>{
  queries.push(c.kind);return witness;
 };
 const feedback=createPhysicalCombatFeedback({requirePresentedFrame:true,
  visualAdapter:visuals,
  audioAdapter:{enable(){return true},emit(c){sounded.push(c);return true},
   disable(){},flush(){},cleanup(){},dispose(){}}});
 assert.equal(feedback.enableAudioFromGesture(),true);
 feedback.acceptSnapshot(snapshot(10,scenario));
 feedback.acceptSnapshot(snapshot(11,scenario,true));
 feedback.advance(.016,.016);
 feedback.acknowledgePresentedFrame(1,.016);
 const result={sounded,drawn,queries,stats:feedback.stats()};
 feedback.dispose();return result;
}

test('undrawn Warden cast and recovery without a live body cannot sound as physical release',async()=>{
 const r=await trial('warden',{draw:false,witness:false});
 assert.deepEqual(r.drawn.map(c=>c.kind),['warden-release','opening']);
 assert.deepEqual(r.sounded,[]);
 assert.deepEqual(r.queries,['warden-release','opening']);
 assert.equal(r.stats.recentDeliveryReceipts.filter(x=>x.decision==='unverified-body-pose').length,2);
});
test('real but visually preempted Warden cast and recovery retain distinct authored sound',async()=>{
 const r=await trial('warden',{witness:true});
 assert.deepEqual(r.sounded.map(c=>c.kind),['warden-release','opening']);
 assert.deepEqual(r.queries,['warden-release','opening']);
 assert.ok(r.sounded.every(c=>c.actorId==='warden'));
});
test('undrawn old guard and utility gestures cannot generate a disconnected body sound',async()=>{
 for(const scenario of ['guard','utility']){
  const r=await trial(scenario,{witness:false});
  assert.equal(r.sounded.length,0,scenario);
  assert.equal(r.queries.length,1,scenario);
  assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'unverified-body-pose');
 }
});
test('sound-only guarded/utility gesture remains possible for a real emitter when its ring is preempted',async()=>{
 for(const scenario of ['guard','utility']){
  const r=await trial(scenario,{witness:true});
  assert.equal(r.sounded.length,1,scenario);
  assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'delivered');
 }
});
test('missing witness adapter fails closed for undrawn body cues but not for drawn cue',async()=>{
 const noProbe=await trial('guard',{probe:false});
 assert.deepEqual(noProbe.sounded,[]);
 assert.equal(noProbe.stats.recentDeliveryReceipts.at(-1).decision,'unverified-body-pose');
 const drawn=await trial('guard',{probe:false,draw:true});
 assert.equal(drawn.sounded.length,1);
 assert.deepEqual(drawn.queries,[]);
});
test('unattributed true HP loss is still audible without any body-pose witness or injury art',async()=>{
 const r=await trial('damage',{probe:false});
 assert.deepEqual(r.sounded.map(c=>c.kind),['damage']);
 assert.equal(r.sounded[0].actorId,null);
 assert.deepEqual(r.queries,[]);
});
