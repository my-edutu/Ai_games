'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const url=f=>'data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,f),'utf8')).toString('base64');
async function load(){
 const source=fs.readFileSync(path.join(root,'soundstage.js'),'utf8')
  .replace("'/dungeon/soundstage-plan.js'","'"+url('soundstage-plan.js')+"'")
  .replace("'/dungeon/impact-choreography-plan.js'","'"+url('impact-choreography-plan.js')+"'")
  .replace("'/dungeon/facing-plan.js'","'"+url('facing-plan.js')+"'")
  .replace("'/dungeon/material-foley.js'","'"+url('material-foley.js')+"'");
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
function fixture(){
 const gains=[],mergers=[],destinations=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},
  setTargetAtTime(){},cancelScheduledValues(){}});
 const node=()=>({links:[],calls:[],
  connect(...args){this.calls.push(args);this.links.push(args[0])},
  disconnect(other){if(other)this.links=this.links.filter(n=>n!==other);else this.links=[]}});
 const ctx={currentTime:0,state:'running',sampleRate:48000,destination:node(),
  createGain(){const gain={...node(),gain:param()};gains.push(gain);return gain},
  createOscillator(){return {...node(),frequency:param(),start(){},stop(){}}},
  createChannelMerger(channels){assert.equal(channels,2);const m=node();mergers.push(m);return m},
  createMediaStreamDestination(){
   const d=node(),track={stopped:0,stop(){this.stopped++}};
   d.stream={getAudioTracks(){return [track]}};d.track=track;
   destinations.push(d);return d;
  }};
 return {ctx,gains,mergers,destinations};
}
test('D04 one-track real capture separates original mix and combat FX, retires all taps on mute',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains,mergers,destinations}=fixture();
 const stage=createDungeonSoundstage(ctx,{suppressCombat:true});
 try{
  assert.equal(stage.captureStream(),null,'no capture before consent');
  assert.equal(stage.enable(),true);
  const stream=stage.captureStream();
  assert.equal(stream.getAudioTracks().length,1);
  assert.equal(stage.captureStream(),stream,'capture must reuse graph');
  assert.equal(mergers.length,1);
  assert.equal(gains.length,7,'one capture-only gain, no extra oscillator voice');
  assert.ok(gains[0].calls.some(([n,out,input])=>n===mergers[0]&&out===0&&input===0),
   'left channel captures the original mix');
  assert.ok(gains[3].links.includes(gains[6]),'right stem comes only from physical combat bus');
  assert.equal(gains[2].links.includes(gains[6]),false,'no ambient/rewards in right stem');
  assert.ok(gains[6].calls.some(([n,out,input])=>n===mergers[0]&&out===0&&input===1),
   'right channel is original FX only');
  assert.ok(Math.abs(gains[6].gain.value-.1275)<1e-9,'diagnostic stem uses original output scaling');
  assert.ok(gains[0].links.includes(ctx.destination),'live speaker bus stays unchanged');
  assert.ok(gains[3].links.includes(gains[2]),'combat still reaches original mix exactly once');
  assert.equal(stage.stats().voices,0,'no capture-created synth voice');
  stage.disable();
  assert.equal(destinations[0].track.stopped,1,'mute stops capture track');
  assert.equal(gains[0].links.includes(mergers[0]),false,'old left tap disconnected');
  assert.equal(gains[3].links.includes(gains[6]),false,'old right tap disconnected');
  assert.equal(gains[6].links.length,0,'FX stem gain released');
  assert.equal(mergers[0].links.length,0,'stereo merger released');
  assert.equal(stage.captureStream(),null,'mute forbids capture');
  assert.equal(stage.enable(),true);
  assert.notEqual(stage.captureStream(),stream,'fresh consent receives new capture');
  assert.equal(mergers.length,2);
 }finally{stage.dispose()}
 assert.equal(destinations[1].track.stopped,1,'dispose stops final track');
 assert.equal(mergers[1].links.length,0);
});
test('legacy default retains single-master original capture without a D04 stereo tap',async()=>{
 const {createDungeonSoundstage}=await load();
 const {ctx,gains,mergers,destinations}=fixture();
 const stage=createDungeonSoundstage(ctx);
 try{
  assert.equal(stage.enable(),true);
  const stream=stage.captureStream();
  assert.equal(stream,destinations[0].stream);
  assert.equal(mergers.length,0,'legacy capture topology is unchanged');
  assert.equal(gains.length,5,'legacy requires no extra FX gain');
  assert.ok(gains[0].links.includes(destinations[0]));
 }finally{stage.dispose()}
 assert.equal(destinations[0].track.stopped,1);
});
