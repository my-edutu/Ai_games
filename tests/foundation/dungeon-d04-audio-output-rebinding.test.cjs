'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-combat-feedback.js')).href);

function device(name){
 const events=[],listeners=new Set();
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=type=>({
  type,gain:param(),frequency:param(),Q:{value:0},
  connect(target){events.push(['connect',type,target?.type??target?.name??'destination'])},
  disconnect(){events.push(['disconnect',type])},
  start(){events.push(['start',type])},
  stop(){events.push(['stop',type])}
 });
 const ctx={name,state:'running',currentTime:0,events,destination:node('destination'),
  addEventListener(type,cb){if(type==='statechange')listeners.add(cb)},
  removeEventListener(type,cb){if(type==='statechange')listeners.delete(cb)},
  listenerCount(){return listeners.size},
  createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),
  createOscillator:()=>node('oscillator'),createBufferSource:()=>node('source'),
  createBuffer(channels,length,rate){
   return {length,sampleRate:rate,duration:length/rate,
    getChannelData:()=>new Float32Array(length)};
  }
 };
 ctx.started=()=>events.filter(e=>e[0]==='start'&&e[1]==='source').length;
 ctx.stopped=()=>events.filter(e=>e[0]==='stop'&&e[1]==='source').length;
 return ctx;
}
const snapshot=(tick)=>({run:1,floor:1,tick,events:[],units:[{
 id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,hp:30,maxHp:30,
 action:tick===10?'idle':'attack',actionTick:tick
}]});
function spectator(ctx,storage=null){
 const memory=new Map();
 return importDirector(ctx,storage??{
  getItem(key){return memory.get(key)??null},
  setItem(key,value){memory.set(key,String(value))}
 });
}
async function importDirector(ctx,storage){
 const {createPhysicalCombatFeedback}=await load();
 return createPhysicalCombatFeedback({ctx,storage,requirePresentedFrame:true,
  visualAdapter:{emit(){return true},hasLiveCue(){return true},
   hasDrawableCue(){return true},advance(){},reset(){},dispose(){}}
 });
}
function submit(d,id){
 d.advance(.016,.016);
 return d.acknowledgePresentedFrame(id,0);
}

test('replaced AudioContext releases old voices and requires a fresh gesture for new engine',async()=>{
 const old=device('old'),replacement=device('replacement'),d=await spectator(old);
 d.acceptSnapshot(snapshot(10));
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(snapshot(11));
 assert.equal(submit(d,1),1);
 assert.equal(old.started(),1);
 d.acceptSnapshot(snapshot(12));
 d.advance(.016,.016);
 assert.equal(d.stats().awaitingPresentation,1);
 assert.equal(d.attachAudioContext(replacement),true);
 assert.equal(d.stats().audioOptedIn,false,'old gesture cannot silently enable a new engine');
 assert.equal(d.stats().awaitingPresentation,0);
 assert.ok(old.stopped()>=1,'old sound source must be retired');
 assert.equal(d.preferredMuted(),false,'automatic device recovery must not save a false user mute');
 assert.equal(d.acknowledgePresentedFrame(2,0),0);
 assert.equal(replacement.started(),0);
 assert.equal(d.enableAudioFromGesture(),true);
 d.acceptSnapshot(snapshot(13));
 assert.equal(submit(d,3),1);
 assert.equal(replacement.started(),1,'new foley MUST use the actual replacement device');
 assert.equal(old.started(),1,'no new cue can leak onto the former device');
 d.dispose();
});

test('reattaching identical device and FX output preserves consent and sound delivery',async()=>{
 const ctx=device('same'),output={name:'combat-fx'},d=await spectator(ctx);
 assert.equal(d.attachAudioContext(ctx,{output}),true);
 assert.equal(d.enableAudioFromGesture(),true);
 assert.equal(d.attachAudioContext(ctx,{output}),true);
 assert.equal(d.stats().audioOptedIn,true,'idempotent attach must not force a second gesture');
 d.acceptSnapshot(snapshot(10));d.acceptSnapshot(snapshot(11));
 assert.equal(submit(d,1),1);
 assert.equal(ctx.started(),1);
 d.dispose();
});

test('changing only combat FX bus rebinds foley and does not keep its old output',async()=>{
 const ctx=device('same-context'),oldOutput={name:'old-fx'},newOutput={name:'new-fx'};
 const d=await spectator(ctx);
 assert.equal(d.attachAudioContext(ctx,{output:oldOutput}),true);
 d.enableAudioFromGesture();
 d.acceptSnapshot(snapshot(10));d.acceptSnapshot(snapshot(11));
 assert.equal(submit(d,1),1);
 assert.equal(ctx.events.some(e=>e[0]==='connect'&&e[2]==='old-fx'),true);
 assert.equal(d.attachAudioContext(ctx,{output:newOutput}),true);
 assert.equal(d.stats().audioOptedIn,false);
 d.acceptSnapshot(snapshot(12));
 assert.equal(submit(d,2),0,'no sound without another gesture');
 d.enableAudioFromGesture();
 d.acceptSnapshot(snapshot(13));
 assert.equal(submit(d,3),1);
 assert.equal(ctx.events.some(e=>e[0]==='connect'&&e[2]==='new-fx'),true);
 d.dispose();
});

test('manual mute remains a manual mute across device recovery',async()=>{
 const old=device('old'),replacement=device('replacement'),d=await spectator(old);
 d.enableAudioFromGesture();d.muteAudio();
 assert.equal(d.preferredMuted(),true);
 assert.equal(d.attachAudioContext(replacement),true);
 assert.equal(d.preferredMuted(),true);
 assert.equal(d.stats().audioOptedIn,false);
 d.acceptSnapshot(snapshot(10));d.acceptSnapshot(snapshot(11));
 assert.equal(submit(d,1),0);
 assert.equal(replacement.started(),0);
 d.dispose();
});

test('repeated device recovery retains exactly one current state listener',async()=>{
 const a=device('a'),b=device('b'),c=device('c'),d=await spectator(a);
 assert.equal(a.listenerCount(),1);
 d.enableAudioFromGesture();
 assert.equal(d.attachAudioContext(b),true);
 assert.equal(a.listenerCount(),0);
 assert.equal(b.listenerCount(),1);
 assert.equal(d.attachAudioContext(b),true);
 assert.equal(b.listenerCount(),1);
 assert.equal(d.attachAudioContext(c),true);
 assert.equal(b.listenerCount(),0);
 assert.equal(c.listenerCount(),1);
 d.dispose();
 assert.equal(c.listenerCount(),0);
});

test('external audio adapters fail closed on unknown new AudioContext',async()=>{
 const {createPhysicalCombatFeedback}=await load();
 const a=device('a'),b=device('b');
 const audio={enable(){return true},emit(){return true},disable(){},flush(){},dispose(){}};
 const d=createPhysicalCombatFeedback({ctx:a,audioAdapter:audio,requirePresentedFrame:true});
 assert.equal(d.enableAudioFromGesture(),true);
 assert.equal(d.attachAudioContext(b),false,'injected adapter has no device-rebind contract');
 assert.equal(d.stats().injectedContextMismatch,true);
 assert.equal(d.stats().audioOptedIn,false);
 assert.equal(d.enableAudioFromGesture(),false,'cannot play through an unverified output');
 assert.equal(d.attachAudioContext(a),true,'restore original known device');
 assert.equal(d.enableAudioFromGesture(),true);
 d.dispose();
 assert.equal(a.listenerCount(),0);
});
