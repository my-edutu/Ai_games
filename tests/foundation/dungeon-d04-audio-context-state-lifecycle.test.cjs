'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);
const state=(tick,action='idle')=>({
 run:1,floor:1,tick,events:[],units:[{
  id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
  hp:30,maxHp:30,action,actionTick:tick
 }]
});
function audioContext(){
 const listeners=new Set();
 return {
  state:'running',
  addEventListener(type,listener){if(type==='statechange')listeners.add(listener)},
  removeEventListener(type,listener){if(type==='statechange')listeners.delete(listener)},
  change(next){this.state=next;for(const listener of [...listeners])listener()},
  listenerCount(){return listeners.size}
 };
}
function fixture(){
 const heard=[],drawn=[],disabled=[];
 return {
  heard,drawn,disabled,
  visualAdapter:{
   emit(cue){drawn.push(cue);return true},
   hasLiveCue(){return true},hasDrawableCue(){return true},
   advance(){},reset(){},dispose(){}
  },
  audioAdapter:{
   enable(){return true},emit(cue){heard.push(cue);return true},
   disable(){disabled.push('disabled')},flush(){},cleanup(){},dispose(){}
  }
 };
}
function submit(d,frameId){
 for(let i=0;i<3;i++)d.advance(.05,.05);
 return d.acknowledgePresentedFrame(frameId,0);
}

test('suspended context revokes opt-in and pending sword sound without dropping the silent art',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=audioContext(),f=fixture();
 const d=createPhysicalCombatFeedback({...f,ctx,requirePresentedFrame:true});
 assert.equal(ctx.listenerCount(),1);
 d.acceptSnapshot(state(10));
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(state(11,'attack'));
 ctx.change('suspended');
 assert.equal(d.stats().audioOptedIn,false,'browser audio suspension must revoke permission');
 assert.equal(d.stats().preferredMuted,true);
 assert.equal(d.stats().audioInterruptions,1);
 assert.equal(f.disabled.length,1,'already-scheduled sound must stop');
 ctx.change('running');
 assert.equal(d.stats().audioOptedIn,false,'resume must not grant audio permission');
 assert.equal(submit(d,'resume-frame'),0);
 assert.deepEqual(f.drawn.map(x=>x.kind),['swing']);
 assert.equal(f.heard.length,0);
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(state(12,'attack'));
 assert.equal(submit(d,'fresh-swing-frame'),1);
 assert.deepEqual(f.heard.map(x=>x.kind),['swing'],
  'only a new attempted swing after a real re-opt-in can speak');
 d.dispose();
 assert.equal(ctx.listenerCount(),0);
});
test('interrupted and closed contexts revoke exactly once; disposal removes listener',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=audioContext(),f=fixture();
 const d=createPhysicalCombatFeedback({...f,ctx,requirePresentedFrame:true});
 assert.equal(d.enableAudioFromGesture(),true);
 ctx.change('interrupted');
 ctx.change('suspended');
 assert.equal(d.stats().audioInterruptions,1);
 assert.equal(f.disabled.length,1);
 ctx.change('running');
 assert.equal(d.enableAudioFromGesture(),true);
 ctx.change('closed');
 assert.equal(d.stats().audioInterruptions,2);
 assert.equal(d.stats().audioOptedIn,false);
 d.dispose();
 assert.equal(ctx.listenerCount(),0);
});
test('late audio context attachment is observed once; missing event API degrades safely',async()=>{
 const {createPhysicalCombatFeedback}=await load(),ctx=audioContext(),f=fixture();
 const d=createPhysicalCombatFeedback({...f,requirePresentedFrame:true});
 assert.equal(d.attachAudioContext(ctx),true);
 assert.equal(d.attachAudioContext(ctx),true);
 assert.equal(ctx.listenerCount(),1,'idempotent observer attachment');
 d.enableAudioFromGesture();
 ctx.change('suspended');
 assert.equal(d.stats().audioOptedIn,false);
 d.dispose();
 assert.equal(ctx.listenerCount(),0);
 const plain={state:'running'};
 const g=createPhysicalCombatFeedback({...fixture(),ctx:plain,requirePresentedFrame:true});
 assert.equal(g.enableAudioFromGesture(),true);
 g.dispose();
});
