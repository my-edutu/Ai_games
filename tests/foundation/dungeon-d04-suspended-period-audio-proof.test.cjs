'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const snapshot=(tick,{action='idle',hp=30}={})=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp,maxHp:30,action,actionTick:tick
 }]
});
function context(withEvents=true){
 const listeners=new Set();
 const ctx={
  state:'running',
  change(next){this.state=next;for(const cb of [...listeners])cb()},
  listenerCount(){return listeners.size}
 };
 if(withEvents){
  ctx.addEventListener=(name,cb)=>{if(name==='statechange')listeners.add(cb)};
  ctx.removeEventListener=(name,cb)=>{if(name==='statechange')listeners.delete(cb)};
 }
 return ctx;
}
function fixture(ctx){
 const sounds=[],visuals=[],flushed=[];
 return {
  sounds,visuals,flushed,
  directorOptions:{
   ctx,requirePresentedFrame:true,
   visualAdapter:{
    emit(cue){visuals.push(cue);return true},
    hasLiveCue(){return true},hasDrawableCue(){return true},
    advance(){},reset(){},dispose(){}
   },
   audioAdapter:{
    enable(){return ctx.state==='running'},
    emit(cue){if(ctx.state!=='running')return false;
     sounds.push(cue);return true},
    flush(){flushed.push('flush')},
    disable(){},cleanup(){},dispose(){}
   }
  }
 };
}
function draw(d,frame){
 d.advance(.016,.016);
 return d.acknowledgePresentedFrame(frame,0);
}

test('sword attempted during suspended WebAudio never sounds after resume',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=context(),f=fixture(ctx);
 const d=createPhysicalCombatFeedback(f.directorOptions);
 d.acceptSnapshot(snapshot(10));
 assert.equal(d.enableAudioFromGesture(),true);
 ctx.change('suspended');
 d.acceptSnapshot(snapshot(11,{action:'attack'}));
 ctx.change('running');
 assert.equal(draw(d,'resumed-sword'),0);
 assert.equal(f.sounds.length,0);
 assert.deepEqual(f.visuals.map(c=>c.kind),['swing'],
  'combat art remains independent of browser audio availability');
 d.acceptSnapshot(snapshot(12,{action:'attack'}));
 assert.equal(draw(d,'fresh-sword'),1);
 assert.deepEqual(f.sounds.map(c=>c.tick),[12]);
 assert.equal(ctx.listenerCount(),1);
 d.dispose();
 assert.equal(ctx.listenerCount(),0);
});

test('audio-unavailable sword staged before receipt cannot become a resume sound',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=context(),f=fixture(ctx);
 const d=createPhysicalCombatFeedback(f.directorOptions);
 d.acceptSnapshot(snapshot(10));d.enableAudioFromGesture();
 ctx.change('interrupted');
 d.acceptSnapshot(snapshot(11,{action:'attack'}));
 d.advance(.016,.016);
 assert.equal(d.stats().awaitingPresentation,0,
  'an unavailable audio context cannot authorize staged sound');
 ctx.change('running');
 assert.equal(d.acknowledgePresentedFrame('old-frame',0),0);
 assert.equal(f.sounds.length,0);
 assert.equal(f.visuals.length,1);
 d.dispose();
});

test('context without statechange event API still rejects a suspended-period attempt',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=context(false),f=fixture(ctx);
 const d=createPhysicalCombatFeedback(f.directorOptions);
 d.acceptSnapshot(snapshot(10));d.enableAudioFromGesture();
 ctx.change('suspended');
 d.acceptSnapshot(snapshot(11,{action:'attack'}));
 ctx.change('running');
 assert.equal(draw(d,'no-listener-resumed'),0);
 assert.equal(f.sounds.length,0);
 assert.equal(d.stats().audioInterruptions,1,
  'snapshot ingest polls a non-observable AudioContext');
 d.acceptSnapshot(snapshot(12,{action:'attack'}));
 assert.equal(draw(d,'no-listener-fresh'),1);
 d.dispose();
});

test('HP-confirmed injury during suspend retains truthful visuals but not delayed audio',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=context(),f=fixture(ctx);
 const d=createPhysicalCombatFeedback(f.directorOptions);
 d.acceptSnapshot(snapshot(10));d.enableAudioFromGesture();
 ctx.change('suspended');
 d.acceptSnapshot(snapshot(11,{hp:24,action:'hurt'}));
 ctx.change('running');
 assert.equal(draw(d,'suspended-injury'),0);
 const injury=f.visuals.find(c=>c.kind==='damage');
 assert.ok(injury,'real HP loss still produces damage art');
 assert.equal(injury.actorId,null,'never invent an attacker');
 assert.equal(f.sounds.length,0);
 d.acceptSnapshot(snapshot(12,{hp:18,action:'hurt'}));
 assert.equal(draw(d,'new-injury'),1);
 assert.equal(f.sounds[0].kind,'damage');
 assert.equal(f.sounds[0].actorId,null);
 d.dispose();
});
