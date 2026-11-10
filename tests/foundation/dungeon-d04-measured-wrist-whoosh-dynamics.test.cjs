'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=(name)=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/'+name)).href);

const snapshot=tick=>({run:1,floor:1,tick,events:[],units:[{
 id:'vanguard',kind:'vanguard',faction:'party',x:2,z:2,
 hp:30,maxHp:30,action:tick===10?'idle':'attack',actionTick:tick
}]});
function fixture({reducedMotion=false,speed=4.5}={}){
 const heard=[],ctx={state:'running'};
 const visuals={
  emit(){return !reducedMotion},advance(){},reset(){},dispose(){},
  hasLiveCue(){return true},hasDrawableCue(){return true},
  hasAuthenticatedSwingPose(){return true},
  hasAuthenticatedSwingAction(){return true},
  measuredSwingSpeed(){return speed}
 };
 const audio={
  enable(){return true},emit(cue){heard.push(cue);return true},
  disable(){},flush(){},cleanup(){},dispose(){}
 };
 return {heard,ctx,visuals,audio};
}
async function trial(options={}){
 const {createPhysicalCombatFeedback}=await source('physical-combat-feedback.js');
 const f=fixture(options);
 const director=createPhysicalCombatFeedback({
  ctx:f.ctx,visualAdapter:f.visuals,audioAdapter:f.audio,
  reducedMotion:options.reducedMotion===true,requirePresentedFrame:true
 });
 assert.equal(director.enableAudioFromGesture(),true);
 director.acceptSnapshot(snapshot(10));
 director.acceptSnapshot(snapshot(11));
 director.advance(.016,.016);
 assert.equal(director.acknowledgePresentedFrame(1,.001),1);
 director.dispose();
 return f.heard[0];
}
test('a genuinely submitted and pose-authenticated drawn swing transports its measured hand speed only as foley metadata',async()=>{
 const sound=await trial({speed:4.5});
 assert.equal(sound.audio,'whoosh');
 assert.equal(sound.detail?.measuredHandMetersPerSecond,4.5);
 assert.equal(sound.kind,'swing');
 assert.equal(sound.proof,'authority-attempt-not-hit');
 assert.equal(sound.targetId,null,'a measured wrist never invents contact');
});
test('reduced-motion sound-only swing does not invent a blade measurement',async()=>{
 const sound=await trial({reducedMotion:true,speed:4.5});
 assert.equal(sound.audio,'whoosh');
 assert.equal(sound.detail?.measuredHandMetersPerSecond,undefined);
});
test('invalid or absent renderer speed never authorizes a synthetic physical value',async()=>{
 for(const speed of [NaN,Infinity,-3,null,0]){
  const sound=await trial({speed});
  assert.equal(sound.detail?.measuredHandMetersPerSecond,undefined);
 }
});
test('original procedural whoosh attenuates slower witnessed hand motion but never exceeds existing peak',async()=>{
 const {createOriginalCombatFoley}=await source('original-combat-foley.js');
 function fixtureAudio(){
  const gains=[];
  const param=()=>({value:0,ramps:[],setValueAtTime(v){this.value=v},
   exponentialRampToValueAtTime(v){this.ramps.push(v)}});
  const node=()=>({gain:param(),frequency:param(),Q:{value:0},
   connect(){},disconnect(){},start(){},stop(){}});
  const ctx={state:'running',currentTime:0,destination:node(),
   createGain(){const g=node();gains.push(g);return g},
   createBiquadFilter:node,createOscillator:node,createBufferSource:node,
   createBuffer(channels,length,rate){return {length,sampleRate:rate,
    duration:length/rate,getChannelData:()=>new Float32Array(length)}}};
  return {ctx,gains};
 }
 const seen=[];
 for(const speed of [1,3,8,null,Number.POSITIVE_INFINITY]){
  const f=fixtureAudio(),engine=createOriginalCombatFoley(f.ctx);
  assert.equal(engine.enable(),true);
  const cue={id:'1:1:11:swing:vanguard:-',sceneKey:'1:1',tick:11,
   kind:'swing',visual:'trail',audio:'whoosh',proof:'authority-attempt-not-hit',
   actorId:'vanguard',targetId:null,priority:2,
   detail:speed===null?null:{measuredHandMetersPerSecond:speed}};
  assert.equal(engine.emit(cue),true);
  seen.push(f.gains[1].gain.ramps[0]);
  engine.dispose();
 }
 assert.ok(seen[0]<seen[1]&&seen[1]<seen[2],
  'a faster REAL wrist passage earns a modestly stronger air sound');
 assert.ok(seen[2]<=seen[3]+1e-10,'measurement may not exceed original envelope peak');
 assert.equal(seen[4],seen[3],'invalid metadata retains original sound recipe');
});
