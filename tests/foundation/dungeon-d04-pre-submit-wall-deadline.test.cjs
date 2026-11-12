'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const snapshot=(tick,hp)=>({run:1,floor:1,tick,events:[],
 units:[{id:'victim',kind:'vanguard',faction:'party',x:2,z:2,
 hp,maxHp:30,action:hp<30?'hurt':'idle',actionTick:tick}]});

async function run({clock,elapsedBeforeAck=0,renderSeconds=.015,muted=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 let now=100;
 const played=[],retired=[],created=[];
 const visualAdapter={
  emit(cue){created.push(cue);return true},advance(){},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  retireStaleCue(id,reason){retired.push({id,reason});return true},
  reset(){},dispose(){}
 };
 const audioAdapter={
  enable(){return true},emit(cue){played.push(cue);return true},
  cleanup(){},flush(){},disable(){},dispose(){}
 };
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:clock===undefined?()=>now:clock,
  visualAdapter,audioAdapter
 });
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snapshot(10,30));
  d.acceptSnapshot(snapshot(11,20));
  d.advance(.016,.016);
  assert.equal(created.length,1,'verified HP impact reaches a genuine render opportunity');
  assert.equal(played.length,0,'no original sound before actual submission');
  if(muted)d.muteAudio();
  now+=elapsedBeforeAck;
  const delivered=d.acknowledgePresentedFrame(1,renderSeconds);
  return {delivered,played,retired,created,stats:d.stats()};
 }finally{d.dispose()}
}

test('late main-thread work between D04 advance and WebGL submit cannot authorize stale original impact',async()=>{
 const r=await run({elapsedBeforeAck:.7,renderSeconds:.018});
 assert.equal(r.delivered,0,'a real 700ms observation-to-submit delay exceeds the unchanged 400ms bound');
 assert.equal(r.played.length,0,'submitted WebGL alone cannot justify an old impact');
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'stale-frame');
 assert.deepEqual(r.retired.map(x=>x.reason),['stale-frame'],
  'retire the stale injury fragment so a subsequent rendered frame cannot show ghost impact');
});

test('fresh HP-confirmed impact remains audible at a timely genuine submission',async()=>{
 const r=await run({elapsedBeforeAck:.20,renderSeconds:.025});
 assert.equal(r.delivered,1);
 assert.deepEqual(r.played.map(x=>x.kind),['damage']);
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'delivered');
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).sampleSynchronized,false);
});

test('a real clock below the deadline does not double-charge the same renderer interval',async()=>{
 const r=await run({elapsedBeforeAck:.35,renderSeconds:.18});
 assert.equal(r.delivered,1,'elapsed wall time already includes real WebGL submission; do not sum it twice');
 assert.equal(r.played.length,1);
});

test('missing trusted wall clock keeps the existing raw-frame deadline',async()=>{
 const r=await run({clock:()=>NaN,renderSeconds:.39});
 assert.equal(r.delivered,0,'raw frame interval plus submit still exceeds 400ms');
 assert.equal(r.played.length,0);
 assert.equal(r.stats.recentDeliveryReceipts.at(-1).decision,'stale-frame');
});

test('mute still prevents delayed audio independent of genuine HP evidence',async()=>{
 const r=await run({elapsedBeforeAck:.03,muted:true});
 assert.equal(r.delivered,0);
 assert.deepEqual(r.played,[]);
});
