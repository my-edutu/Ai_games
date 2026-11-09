'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const unit=(kind,action,actionTick,targetId=null)=>({
 id:'hero',kind,faction:'party',x:2,z:2,hp:30,maxHp:30,action,actionTick,targetId
});
const enemy=()=>({id:'enemy',kind:'revenant',faction:'enemy',x:3,z:2,
 hp:30,maxHp:30,action:'idle',actionTick:10});
const snapshot=(tick,kind,action,actionTick,targetId=null)=>({
 tick,run:1,floor:1,units:[unit(kind,action,actionTick,targetId),enemy()],events:[]
});
async function harness({gated=true,kind='vanguard',targetId=null,reducedMotion=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 const visual=[],audio=[];let drawable=false;
 const director=createPhysicalCombatFeedback({
  requirePresentedFrame:gated,reducedMotion,
  resolveContact:()=>targetId?{targetId,distance:1}:null,
  visualAdapter:{
   emit(cue){visual.push(cue);return true},
   advance(){},hasLiveCue(){return true},hasDrawableCue(){return drawable},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){audio.push(cue);return true},
   disable(){},flush(){},cleanup(){},dispose(){}
  }
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10,kind,'idle',10));
 director.acceptSnapshot(snapshot(11,kind,
  kind==='mystic'?'cast':'attack',11,targetId));
 return {director,visual,audio,setDrawable(value){drawable=value}};
}

test('D04 gated sword stages before 120ms: sound waits for actual drawable submitted hand',async()=>{
 const h=await harness();
 h.director.advance(.016,.016);
 assert.deepEqual(h.visual.map(c=>c.kind),['swing'],
  'no fixed 120ms delay may cause the renderer to miss the real early wrist passage');
 assert.equal(h.audio.length,0,'no sound before a submitted frame');
 assert.equal(h.director.acknowledgePresentedFrame('hidden',.002),0);
 assert.equal(h.audio.length,0,'hidden nonmoving hand never certifies a whoosh');
 assert.equal(h.director.stats().awaitingPresentation,1);
 h.setDrawable(true);
 h.director.advance(.016,.016);
 assert.equal(h.director.acknowledgePresentedFrame('moving',.002),1);
 assert.deepEqual(h.audio.map(c=>c.audio),['whoosh']);
 assert.equal(h.director.acknowledgePresentedFrame('moving',.002),0);
 assert.equal(h.director.stats().awaitingPresentation,0);
 const receipt=h.director.stats().recentDeliveryReceipts.at(-1);
 assert.equal(receipt.intendedDelayMs,120,'original policy delay stays inspectable');
 assert.equal(receipt.scheduledDelayMs,0,'telemetry must reveal first-draw override');
 h.director.dispose();
});

test('unmodified non-gated director retains the original planned swing delay',async()=>{
 const h=await harness({gated:false});
 h.director.advance(.016,.016);
 assert.equal(h.visual.length,0);
 h.director.advance(.05,.05);h.director.advance(.05,.05);
 assert.equal(h.visual.length,0);
 h.director.advance(.05,.05);
 assert.deepEqual(h.visual.map(c=>c.kind),['swing']);
 assert.deepEqual(h.audio.map(c=>c.audio),['whoosh']);
 h.director.dispose();
});

test('ranged and spell release delays are not erased by the D04 melee-only gate',async()=>{
 for(const [kind,expected] of [['ranger','ranged-release'],['mystic','spell-release']]){
  const h=await harness({gated:true,kind,targetId:'enemy'});
  h.director.advance(.016,.016);
  assert.equal(h.visual.length,0,kind+' remains delayed');
  for(let i=0;i<3;i++)h.director.advance(.05,.05);
  assert.equal(h.visual.length,0,kind+' stays delayed through 166ms');
  for(let i=0;i<3;i++)h.director.advance(.05,.05);
  assert.deepEqual(h.visual.map(c=>c.kind),[expected]);
  h.director.dispose();
 }
});

test('mute and scene restart cancel early sword cues without leaking foley',async()=>{
 const muted=await harness();
 muted.director.advance(.016,.016);
 assert.equal(muted.director.stats().awaitingPresentation,1);
 muted.director.muteAudio();
 muted.setDrawable(true);
 assert.equal(muted.director.acknowledgePresentedFrame('after-mute',.003),0);
 assert.equal(muted.audio.length,0);
 assert.equal(muted.director.stats().awaitingPresentation,0);
 muted.director.dispose();
 const restarted=await harness();
 restarted.director.advance(.016,.016);
 restarted.director.acceptSnapshot({...snapshot(1,'vanguard','idle',1),run:2});
 restarted.setDrawable(true);
 restarted.director.acknowledgePresentedFrame('after-restart',.002);
 assert.equal(restarted.audio.length,0);
 assert.equal(restarted.director.stats().awaitingPresentation,0);
 restarted.director.dispose();
});

test('reduced-motion simulated adapter remains consent-gated even for an early staged swing',async()=>{
 const h=await harness({gated:true,reducedMotion:true});
 h.director.advance(.016,.016);
 assert.deepEqual(h.visual.map(c=>c.kind),['swing']);
 assert.equal(h.audio.length,0);
 h.director.acknowledgePresentedFrame('hidden-reduced',.002);
 assert.equal(h.audio.length,0);
 h.director.muteAudio();
 assert.equal(h.director.stats().audioOptedIn,false);
 h.director.dispose();
});
