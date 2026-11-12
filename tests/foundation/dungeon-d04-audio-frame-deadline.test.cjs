'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon/physical-combat-feedback.js')).href);
const unit=(hp,action='hurt',actionTick=11)=>({id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,hp,maxHp:30,action,actionTick});
const snap=(tick,hp,action='hurt')=>({run:1,floor:1,tick,units:[unit(hp,action,tick)],events:[]});
function fakeFeedback(createPhysicalCombatFeedback,clock=()=>0){
 const played=[],rendered=[];
 const controller=createPhysicalCombatFeedback({requirePresentedFrame:true,clock,
  visualAdapter:{emit(cue){rendered.push(cue);return true},advance(){},reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(cue){played.push(cue);return true},flush(){},disable(){},cleanup(){},dispose(){}}});
 assert.equal(controller.enableAudioFromGesture(),true);
 return {controller,played,rendered};
}
test('D04: a 720ms real frame stalls audio even when simulation dt is capped to 50ms',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 const {controller,played}=fakeFeedback(createPhysicalCombatFeedback,()=>clock);
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 assert.equal(controller.stats().pending,1,
  'D04 stages even an immediate HP injury in the first measured frame');
 assert.equal(controller.stats().awaitingPresentation,0);
 clock+=.72; // This stall happens AFTER observation, not before it.
 controller.advance(.05,.72);
 assert.equal(controller.acknowledgePresentedFrame('true-webgl-1'),0);
 assert.equal(played.length,0);
 assert.ok(controller.stats().expiredQueuedCues>=1,
  'unpresented injury must expire before admission after a 720ms stall');
 controller.dispose();
});
test('D04: a slow actual WebGL render blocks even a fresh damage cue from audible late delivery',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const {controller,played}=fakeFeedback(createPhysicalCombatFeedback);
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 controller.advance(.016,.016);
 assert.equal(controller.acknowledgePresentedFrame('webgl-render-blocked',.62),0);
 assert.equal(played.length,0);
 controller.dispose();
});
test('D04: pending sword whooshes do not survive a real frame gap and play after the arm finishes',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 const {controller,played,rendered}=fakeFeedback(createPhysicalCombatFeedback,()=>clock);
 controller.acceptSnapshot(snap(10,30,'idle'));
 controller.acceptSnapshot(snap(11,30,'attack'));
 assert.equal(controller.stats().pending,1);
 clock+=.75; // A gesture queued BEFORE the gap cannot replay later.
 controller.advance(.05,.75);
 controller.advance(.05,.016);
 controller.advance(.05,.016);
 controller.acknowledgePresentedFrame('fresh-frame');
 assert.equal(played.length,0,'stale whoosh must not sound after movement');
 assert.equal(rendered.length,0,'do not draw stale gesture after a long frame gap');
 controller.dispose();
});
test('D04: valid timely rendered damage still emits once, while muted/restarted scenes stay silent',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const {controller,played}=fakeFeedback(createPhysicalCombatFeedback);
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 controller.advance(.016,.016);
 assert.equal(controller.acknowledgePresentedFrame('valid-webgl',.02),1);
 assert.equal(controller.acknowledgePresentedFrame('valid-webgl',.02),0);
 assert.equal(played.length,1);
 controller.acceptSnapshot({...snap(0,30),run:2});
 controller.muteAudio();controller.acknowledgePresentedFrame('after-mute',.02);
 assert.equal(played.length,1);
 controller.dispose();
});


test('D04 verified melee HP loss is staged on the first 240ms real frame, not five capped animation frames',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 const rendered=[],played=[];
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>clock,
  deriveDamageBeats:()=>[{id:'vanguard',incoming:true}],
  verifiedMeleeDelay:()=>.215,
  visualAdapter:{emit(cue){rendered.push(cue);return true},
   advance(){},hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(cue){played.push(cue);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}
 });
 assert.equal(controller.enableAudioFromGesture(),true);
 controller.acceptSnapshot(snap(10,30));
 controller.acceptSnapshot(snap(11,21));
 assert.equal(controller.stats().pending,1);
 assert.equal(rendered.length,0,'no injury effect before an actual render opportunity');
 clock=.24;
 controller.advance(.05,.24);
 assert.deepEqual(rendered.map(c=>c.kind),['damage'],
  'the observed 240ms frame has passed the real 215ms presentation delay');
 assert.equal(played.length,0,'sound remains gated on actual WebGL submission');
 clock=.26;
 assert.equal(controller.acknowledgePresentedFrame(1,.02),1);
 assert.equal(played.length,1);
 const receipt=controller.stats().recentDeliveryReceipts.at(-1);
 assert.equal(receipt.scheduledDelayMs,215);
 assert.equal(receipt.decision,'delivered');
 assert.equal(receipt.observationToSubmissionMs,260);
 controller.dispose();
});

test('D04 gated verified melee waits through a real 190ms interval and stages at 230ms without breaking 400ms deadline',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 // An actual HP decrease and verified incoming evidence authorize this delay.
 const visual=[],audio=[];
 const timed=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>clock,
  deriveDamageBeats:()=>[{id:'vanguard',incoming:true}],
  verifiedMeleeDelay:()=>.215,
  visualAdapter:{emit(cue){visual.push(cue);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(cue){audio.push(cue);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}
 });
 timed.enableAudioFromGesture();
 timed.acceptSnapshot(snap(10,30));timed.acceptSnapshot(snap(11,21));
 clock=.19;timed.advance(.05,.19);
 assert.equal(visual.length,0);
 clock=.23;timed.advance(.04,.04);
 assert.equal(visual.length,1);
 assert.equal(audio.length,0);
 clock=.25;
 assert.equal(timed.acknowledgePresentedFrame(2,.02),1);
 assert.equal(audio.length,1);
 timed.dispose();
});
