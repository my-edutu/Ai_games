'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

function snapshot(tick,action='idle',hp=30,forceKind=null){
 const kind=forceKind??(action==='hurt'?'revenant':'vanguard');
 return {run:1,floor:1,tick,phase:'exploring',events:[],map:[],
  units:[{id:'source',kind,faction:kind==='revenant'?'enemy':'party',
   x:2,z:2,hp,maxHp:30,action,actionTick:tick}]};
}
async function attempt(kind){
 const {createPhysicalCombatFeedback}=await load();
 const retained=new Set(),retired=[],sounded=[];
 const visuals={
  emit(c){retained.add(c.id);return true},advance(){},reset(){retained.clear()},
  dispose(){},hasLiveCue:id=>retained.has(id),
  hasDrawableCue:id=>retained.has(id),
  hasAuthenticatedSwingPose:()=>false,
  hasAuthenticatedBodyPose:()=>false,
  retireStaleCue(id,reason){retired.push({id,reason});return retained.delete(id)?1:0}
 };
 const feedback=createPhysicalCombatFeedback({requirePresentedFrame:true,
  visualAdapter:visuals,audioAdapter:{
   enable:()=>true,emit(c){sounded.push(c.kind);return true},
   cleanup(){},flush(){},disable(){},dispose(){}}
 });
 try{
  assert.equal(feedback.enableAudioFromGesture(),true);
  feedback.acceptSnapshot(snapshot(10,'idle',30,kind==='hurt'?'revenant':null));
  feedback.acceptSnapshot(snapshot(11,kind));
  feedback.advance(.016,.016);
  assert.ok(retained.size>0,'genuine public transition must stage a visual');
  const previous=[...retained];
  const delivered=feedback.acknowledgePresentedFrame(1,.014);
  return {delivered,retired,sounded,remaining:[...retained],
   previous,receipts:feedback.stats().recentDeliveryReceipts};
 }finally{feedback.dispose()}
}
for(const [kind,decision] of [['attack','revoked-drawn-swing-pose'],
 ['guard','revoked-drawn-body-pose']]){
 test('revoked drawn '+kind+' clears its own GPU cue after receipt, without foley',async()=>{
  const out=await attempt(kind);
  assert.equal(out.delivered,0);
  assert.deepEqual(out.sounded,[]);
  assert.ok(out.receipts.some(r=>r.decision===decision));
  assert.deepEqual(out.remaining,[],
   'a post-render revocation cannot leave old transient art in the next frame');
  assert.deepEqual(out.retired.map(x=>x.reason),[decision]);
  assert.deepEqual(out.retired.map(x=>x.id),out.previous);
 });
}
test('confirmed independent HP loss retains its impact even without a source pose',async()=>{
 const out=await attempt('hurt');
 assert.equal(out.delivered,1,'actual HP loss is independent of a source pose');
 assert.deepEqual(out.sounded,['damage']);
 assert.deepEqual(out.retired,[]);
 assert.equal(out.remaining.length,out.previous.length);
});
