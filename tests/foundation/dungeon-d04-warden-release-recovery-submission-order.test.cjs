'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const boss=(tick,extra={})=>({
 id:'warden',kind:'warden',faction:'enemy',x:6,z:6,hp:75,maxHp:90,
 action:'idle',actionTick:tick,...extra
});
const shot=(tick,extra={})=>({
 tick,run:1,floor:1,map:Array(19).fill('.'.repeat(19)),
 units:[boss(tick-1)],events:[],...extra
});
const opened=()=>shot(11,{
 units:[boss(11,{action:'cast',recoveryUntilTick:12})],
 events:[{tick:11,kind:'opening',text:'boss exposed'}],
 guardianWard:false,bossRecovery:{remaining:2}
});
async function scene({gated=true,reducedMotion=false}={}){
 const {createPhysicalCombatFeedback}=await load();
 const visual=[],audio=[];
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:gated,reducedMotion,
  visualAdapter:{
   emit(cue){visual.push(cue);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){audio.push(cue);return true},
   disable(){},flush(){},cleanup(){},dispose(){}
  }
 });
 assert.equal(controller.enableAudioFromGesture(),true);
 controller.acceptSnapshot(shot(10));
 controller.acceptSnapshot(opened());
 return {controller,visual,audio};
}
test('D04 submitted Warden release and same-tick recovery stage in causal order',async()=>{
 const s=await scene();
 assert.deepEqual(s.visual,[],'never render a future tick in acceptSnapshot');
 assert.deepEqual(s.audio,[],'no sound before actual render submission');
 s.controller.advance(.016,.016);
 assert.deepEqual(s.visual.map(c=>c.kind),['warden-release','opening'],
  'release must not appear 230ms after its already-active recovery opening');
 assert.deepEqual(s.audio,[],'no audio until the acknowledged WebGL frame');
 assert.equal(s.controller.acknowledgePresentedFrame('warden-cast',.004),2);
 assert.deepEqual(s.audio.map(c=>c.audio),['warden-release','recovery']);
 assert.equal(s.controller.acknowledgePresentedFrame('warden-cast',.004),0);
 const receipts=s.controller.stats().recentDeliveryReceipts;
 assert.deepEqual(receipts.map(r=>[r.kind,r.intendedDelayMs,r.scheduledDelayMs]),
  [['warden-release',230,0],['opening',0,0]],
  'the original 230ms envelope remains auditable while D04 stages at first draw');
 s.controller.dispose();
});
test('D04 non-submission adapter preserves its legacy 230ms Warden timing',async()=>{
 const s=await scene({gated:false});
 assert.deepEqual(s.visual.map(c=>c.kind),['opening']);
 assert.deepEqual(s.audio.map(c=>c.audio),['recovery']);
 for(let i=0;i<4;i++)s.controller.advance(.05,.05);
 assert.equal(s.visual.some(c=>c.kind==='warden-release'),false);
 s.controller.advance(.05,.05);
 assert.deepEqual(s.visual.map(c=>c.kind),['opening','warden-release']);
 s.controller.dispose();
});
test('D04 reduced-motion Warden release and recovery still require frame and consent',async()=>{
 const s=await scene({reducedMotion:true});
 s.controller.advance(.016,.016);
 assert.deepEqual(s.visual.map(c=>c.kind),['warden-release','opening']);
 assert.equal(s.audio.length,0);
 s.controller.muteAudio();
 assert.equal(s.controller.acknowledgePresentedFrame('muted',.004),0);
 assert.equal(s.audio.length,0);
 s.controller.dispose();
});
test('D04 long-frame stall drops due Warden action instead of replaying late audio',async()=>{
 const s=await scene();
 s.controller.advance(.016,.016);
 s.controller.advance(.5,.5);
 assert.equal(s.controller.acknowledgePresentedFrame('late',.006),0);
 assert.equal(s.audio.length,0);
 assert.ok(s.controller.stats().staleAudioDropped>=2);
 s.controller.dispose();
});
test('D04 scene change clears submitted-frame Warden release and opening',async()=>{
 const s=await scene();
 s.controller.advance(.016,.016);
 s.controller.acceptSnapshot({...shot(1),run:2});
 assert.equal(s.controller.acknowledgePresentedFrame('other-run',.004),0);
 assert.equal(s.audio.length,0);
 assert.equal(s.controller.stats().awaitingPresentation,0);
 s.controller.dispose();
});
