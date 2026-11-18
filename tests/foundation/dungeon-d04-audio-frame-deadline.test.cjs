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


test('D04 verified melee HP loss stages at the first eligible frame while retaining its 215ms pose annotation',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 const rendered=[],played=[];
 const controller=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>clock,
  deriveDamageBeats:()=>[{id:'vanguard',kind:'vanguard',faction:'party',
   x:2,z:2,damage:9,maxHp:30,fatal:false,incoming:true}],
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
 assert.equal(receipt.intendedDelayMs,215,'the measured melee pose annotation survives for forensic review');
 assert.equal(receipt.scheduledDelayMs,0,'verified HP evidence must not wait for an optional pose annotation');
 assert.equal(receipt.decision,'delivered');
 assert.equal(receipt.observationToSubmissionMs,260);
 controller.dispose();
});

test('D04 verified melee stages on the first 190ms real frame and never duplicates visual or audio at 230ms',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let clock=0;
 // An actual HP decrease and verified incoming evidence authorize this delay.
 const visual=[],audio=[];
 const timed=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>clock,
  deriveDamageBeats:()=>[{id:'vanguard',kind:'vanguard',faction:'party',
   x:2,z:2,damage:9,maxHp:30,fatal:false,incoming:true}],
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
 assert.equal(visual.length,1,'the 190ms frame is the first earned visual opportunity');
 assert.equal(audio.length,0,'retained art is not a completed WebGL receipt');
 clock=.23;timed.advance(.04,.04);
 assert.equal(visual.length,1,'the optional 215ms annotation cannot replay already-staged injury');
 assert.equal(audio.length,0);
 clock=.25;
 assert.equal(timed.acknowledgePresentedFrame(2,.02),1);
 assert.equal(audio.length,1);
 timed.dispose();
});

test('D04 pre-render retires stale retained HP impact before WebGL without late sound',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let wall=0;const emitted=[],retired=[],played=[];
 const controller=createPhysicalCombatFeedback({requirePresentedFrame:true,clock:()=>wall,
  visualAdapter:{emit(c){emitted.push(c);return true},advance(){},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   retireStaleCue(id){retired.push(id);return true},reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(c){played.push(c);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}
 });
 controller.enableAudioFromGesture();
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 wall=.12;controller.advance(.05,.12);
 assert.equal(emitted.length,1);
 assert.equal(controller.stats().awaitingPresentation,1);
 wall=.405;assert.equal(controller.retireStaleBeforeRender(),1);
 assert.deepEqual(retired,[emitted[0].id]);
 assert.equal(controller.stats().preRenderStaleDropped,1);
 assert.equal(controller.stats().awaitingPresentation,0);
 const r=controller.stats().recentDeliveryReceipts.at(-1);
 assert.equal(r.decision,'expired-before-render');
 assert.equal(r.frameId,null);assert.equal(r.audio,false);
 assert.equal(controller.acknowledgePresentedFrame(1,.02),0);
 assert.equal(played.length,0);
 assert.equal(controller.retireStaleBeforeRender(),0);
 controller.dispose();
});

test('D04 pre-render leaves timely genuine HP receipt and original foley eligible',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let wall=0;const played=[],retired=[];
 const controller=createPhysicalCombatFeedback({requirePresentedFrame:true,clock:()=>wall,
  visualAdapter:{emit(){return true},advance(){},hasLiveCue(){return true},
   hasDrawableCue(){return true},retireStaleCue(id){retired.push(id);return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(c){played.push(c);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}
 });
 controller.enableAudioFromGesture();
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 wall=.12;controller.advance(.05,.12);
 wall=.32;assert.equal(controller.retireStaleBeforeRender(),0);
 wall=.35;assert.equal(controller.acknowledgePresentedFrame(1,.02),1);
 assert.equal(played.length,1);
 assert.deepEqual(retired,[]);
 assert.equal(controller.stats().preRenderStaleDropped,0);
 controller.dispose();
});

test('D04 muted visual-only damage expires before draw without retroactive audio',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let wall=0;const retired=[],played=[];
 const controller=createPhysicalCombatFeedback({requirePresentedFrame:true,clock:()=>wall,
  visualAdapter:{emit(){return true},advance(){},hasLiveCue(){return true},
   hasDrawableCue(){return true},retireStaleCue(id){retired.push(id);return true},
   reset(){},dispose(){}},
  audioAdapter:{enable(){return true},emit(c){played.push(c);return true},
   flush(){},disable(){},cleanup(){},dispose(){}}
 });
 controller.enableAudioFromGesture();
 controller.acceptSnapshot(snap(10,30));controller.acceptSnapshot(snap(11,21));
 wall=.1;controller.advance(.05,.1);
 controller.muteAudio();
 assert.equal(controller.stats().awaitingPresentation,1);
 wall=.5;assert.equal(controller.retireStaleBeforeRender(),1);
 assert.equal(retired.length,1);
 assert.equal(controller.acknowledgePresentedFrame(1,.01),0);
 assert.equal(played.length,0);
 assert.equal(controller.stats().audioOptedIn,false);
 controller.dispose();
});


test('D04 pre-source WebAudio preparation cannot revive a stale authentic HP injury',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 let wall=20,actualStarts=0;
 const retired=[];
 const d=createPhysicalCombatFeedback({
  requirePresentedFrame:true,clock:()=>wall,
  visualAdapter:{
   emit(){return true},advance(){},hasLiveCue(){return true},
   hasDrawableCue(){return true},
   retireStaleCue(id,reason){retired.push({id,reason});return true},
   reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},
   emit(_cue,options){
    // The genuine source preparation can block AFTER the controller's
    // pre-emit check but BEFORE original AudioScheduledSourceNode.start().
    wall+=.445;
    if(options?.beforeSourceStart?.()!==true)return false;
    actualStarts++;return true;
   },
   flush(){},cleanup(){},disable(){},dispose(){}
  }
 });
 try{
  assert.equal(d.enableAudioFromGesture(),true);
  d.acceptSnapshot(snap(10,30));
  d.acceptSnapshot(snap(11,21)); // One actual adjacent-tick HP loss.
  wall+=.02;d.advance(.016,.016);
  wall+=.02;
  assert.equal(d.acknowledgePresentedFrame(1,.01),0);
  assert.equal(actualStarts,0,'no original sound source may start after 400ms');
  const receipt=d.stats().recentDeliveryReceipts.at(-1);
  assert.equal(receipt.decision,'stale-before-source-start');
  assert.equal(receipt.audio,false);
  assert.equal(receipt.frameId,1,'do not invent a different successful frame');
  assert.deepEqual(retired.map(x=>x.reason),['stale-frame'],
   'an already-submitted old transient must not survive the next WebGL draw');
  assert.equal(d.acknowledgePresentedFrame(2,.01),0);
 }finally{d.dispose()}
});

test('original WebAudio node preparation cannot outlive the 400ms injury deadline or consume its cue identity',async()=>{
 const {createOriginalCombatFoley}=await import(pathToFileURL(path.resolve(
  __dirname,'../../public/ai-dungeon/original-combat-foley.js')).href);
 let wall=0,stalled=true,actualStarts=0,disconnects=0;
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){disconnects++},start(){actualStarts++},stop(){}});
 const ctx={state:'running',currentTime:0,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBufferSource(){
   if(stalled){wall=.55;stalled=false} // expensive native source allocation
   return node();
  },
  createBuffer(_channels,length,rate){return {
   length,sampleRate:rate,duration:length/rate,
   getChannelData:()=>new Float32Array(length)
  }}
 };
 const cue={id:'1:1:11:damage:-:vanguard',sceneKey:'1:1',
  tick:11,kind:'damage',visual:'hit',audio:'impact',
  proof:'observed-hp-drop',verified:true,actorId:null,targetId:'vanguard',
  from:null,to:{x:2,z:2},detail:{damage:9,maxHp:30,remainingHp:21},
  priority:6,severity:.3}; // 9 / 30: satisfy strict positive HP-delta causality
 const foley=createOriginalCombatFoley(ctx,{requireVerifiedContact:true});
 try{
  assert.equal(foley.enable(),true);
  assert.equal(foley.emit(cue,{beforeSourceStart:()=>wall<=.4}),false);
  assert.equal(actualStarts,0,'no native source.start() after expensive preparation');
  assert.ok(disconnects>=3,'aborted unscheduled nodes are disconnected');
  assert.equal(foley.stats().recentOriginalStarts.length,0);
  assert.equal(foley.stats().deviceFailures,0,'deadline expiry is not a device error');
  wall=.1;ctx.currentTime=.1;
  assert.equal(foley.emit(cue,{beforeSourceStart:()=>wall<=.4}),true,
   'the rejected candidate did not consume original one-shot identity');
  assert.ok(actualStarts>=1,'a fresh, explicitly timely source can still start');
  assert.equal(foley.stats().recentOriginalStarts.length,1);
  assert.equal(foley.stats().recentOriginalStarts[0].sampleSynchronized,false);
 }finally{foley.dispose()}
});
