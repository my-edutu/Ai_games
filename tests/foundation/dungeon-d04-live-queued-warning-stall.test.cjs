'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

const boss={id:'warden',kind:'warden',faction:'enemy',hp:70,maxHp:70,
 x:6,z:6,action:'idle',actionTick:9};
const cells=[{x:3,z:3},{x:4,z:3}];
function snapshot(tick,warning=true,overrides={}){
 return {run:1,floor:1,tick,events:[],units:[{...boss}],
  bossWarning:warning?{warning:true,attackTick:14,shape:'NOVA',
   turnsUntilImpact:14-tick,cells}:null,...overrides};
}
function setup(createPhysicalCombatFeedback){
 let now=100;
 const visual=[],sounds=[];
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>now,
  visualAdapter:{
   emit(cue){visual.push(cue);return true},
   advance(){},hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){sounds.push(cue);return true},
   cleanup(){},flush(){},disable(){},dispose(){}
  }
 });
 assert.equal(controller.enableAudioFromGesture(),true);
 controller.acceptSnapshot(snapshot(10,false));
 controller.acceptSnapshot(snapshot(11));
 assert.equal(controller.stats().pending,1);
 return {controller,visual,sounds,setClock:value=>{now=value}};
}

test('live authority-confirmed Warden cells first observed before a slow frame remain visible WITHOUT delayed foley',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const h=setup(createPhysicalCombatFeedback);
 h.setClock(100.8);
 h.controller.advance(.05,.8);
 assert.equal(h.visual.length,1,'the still-live warning must be admitted as visual-only after the stall');
 assert.equal(h.visual[0].visual,'warning');
 assert.equal(h.controller.stats().lateLiveWarningVisuals,1);
 assert.equal(h.controller.stats().awaitingPresentation,0);
 assert.equal(h.sounds.length,0);
 assert.equal(h.controller.acknowledgePresentedFrame(1,.008),0);
 assert.equal(h.sounds.length,0,'elapsed warning MUST NOT become an audible late warning');
 const receipt=h.controller.stats().recentDeliveryReceipts.at(-1);
 assert.equal(receipt.decision,'live-warning-visual-only-after-stall');
 assert.equal(receipt.audio,false);
 h.controller.dispose();
});

test('revoked/changed/unowned Warden warnings cannot be revived after a long frame',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const changes=[
  snapshot(12,false),
  snapshot(12,true,{bossWarning:{...snapshot(12).bossWarning,cells:[{x:5,z:5}]}}),
  snapshot(12,true,{units:[{...boss,hp:0}]}),
  snapshot(12,true,{bossWarning:{...snapshot(12).bossWarning,attackTick:15}})
 ];
 for(const changed of changes){
  const h=setup(createPhysicalCombatFeedback);
  h.controller.acceptSnapshot(changed);
  h.setClock(100.8);h.controller.advance(.05,.8);
  // A NEW tick-12 warning with a new full footprint may legitimately paint;
  // only the retired tick-11 warning must never be resurrected.
  assert.equal(h.visual.some(c=>c.tick===11),false,
   'revoked original warning must not be repainted after stall');
  assert.equal(h.sounds.length,0);
  assert.equal(h.controller.acknowledgePresentedFrame(1,.01),0);
  h.controller.dispose();
 }
});

test('unknown frame interval cannot promote a pending Warden warning to a visual receipt',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const h=setup(createPhysicalCombatFeedback);
 h.setClock(100.8);h.controller.advance(.05,NaN);
 assert.equal(h.visual.length,0);
 assert.equal(h.sounds.length,0);
 assert.equal(h.controller.stats().lateLiveWarningVisuals,0);
 h.controller.dispose();
});

test('actual HP injury is still discarded after 800ms, never revived as a late impact',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let now=100;const visual=[],sounds=[];
 const c=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>now,
  visualAdapter:{emit:c=>{visual.push(c);return true},advance(){},reset(){},dispose(){}},
  audioAdapter:{enable:()=>true,emit:c=>{sounds.push(c);return true},
   cleanup(){},flush(){},disable(){},dispose(){}}
 });
 c.enableAudioFromGesture();
 const old={run:1,floor:1,tick:10,events:[],units:[
  {id:'hero',kind:'vanguard',faction:'party',hp:30,maxHp:30,x:2,z:2,action:'idle',actionTick:9}]};
 c.acceptSnapshot(old);
 c.acceptSnapshot({...old,tick:11,units:[{...old.units[0],hp:20,action:'hurt',actionTick:11}]});
 now=100.8;c.advance(.05,.8);
 assert.equal(visual.length,0);
 assert.equal(sounds.length,0);
 assert.ok(c.stats().expiredQueuedCues>=1);
 assert.equal(c.acknowledgePresentedFrame(1,.01),0);
 c.dispose();
});
