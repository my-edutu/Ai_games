'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);
const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
function fixture(sampleRate){
 const buffers=[],sources=[];
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},
  connect(){},disconnect(){},start(){},stop(){}});
 const ctx={sampleRate,currentTime:0,state:'running',destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBuffer(channels,length,rate){
   const data=new Float32Array(length);
   const b={numberOfChannels:channels,length,sampleRate:rate,
    duration:length/rate,getChannelData:()=>data};
   buffers.push(b);return b;
  },
  createBufferSource(){const s=node();sources.push(s);return s}
 };
 return {ctx,buffers,sources};
}
const rms=s=>Math.sqrt(s.reduce((a,v)=>a+v*v,0)/s.length);
test('original Warden noise has the same 280ms period at 8/44.1/48/96kHz context rates',async()=>{
 const {createOriginalCombatFoley,ORIGINAL_COMBAT_NOISE_TEXTURE_RATE,
  ORIGINAL_COMBAT_NOISE_TEXTURE_SAMPLES,ORIGINAL_COMBAT_MAX_NOISE_SAMPLES}=await load();
 assert.equal(ORIGINAL_COMBAT_NOISE_TEXTURE_RATE,48000);
 assert.equal(ORIGINAL_COMBAT_NOISE_TEXTURE_SAMPLES,13440);
 let reference=null;
 for(const rate of [8000,44100,48000,96000]){
  const f=fixture(rate),engine=createOriginalCombatFoley(f.ctx);
  assert.equal(engine.enable(),true);
  assert.equal(f.buffers.length,1);
  const b=f.buffers[0],data=b.getChannelData(0);
  assert.equal(b.numberOfChannels,1);
  assert.equal(b.sampleRate,48000,'texture rate must not track the device');
  assert.equal(b.length,13440);
  assert.ok(b.length<=ORIGINAL_COMBAT_MAX_NOISE_SAMPLES);
  assert.equal(b.duration,.28);
  assert.equal(engine.stats().noiseSampleRate,48000);
  assert.equal(engine.stats().noisePeriodMs,280);
  if(reference)assert.deepEqual(data,reference,'seeded original texture is device-invariant');
  else reference=data.slice();
  engine.dispose();
 }
});
test('seam matches exactly without periodic near-silence in the long Warden tail',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES}=await load();
 const f=fixture(48000),engine=createOriginalCombatFoley(f.ctx);
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit({id:'warden-1',audio:'warden-release',priority:9,severity:.7}),true);
 const b=f.buffers[0],s=b.getChannelData(0);
 assert.equal(s[0],s[s.length-1],'prevent abrupt amplitude step at wrap');
 assert.notEqual(s[0],0,'the seam must not be intentionally muted');
 const interiorRms=rms(s.slice(1000,1048)),seamRms=rms(s.slice(-48));
 assert.ok(interiorRms>.1);
 assert.ok(seamRms>interiorRms*.65,'crossfade must not make a recurrent silence trough');
 assert.equal(f.sources[0].loop,true,'long cues continue on one retained source');
 assert.equal(f.buffers.length,1);
 assert.ok(engine.stats().activeVoices<=MAX_ORIGINAL_COMBAT_VOICES);
 engine.disable();
 assert.equal(engine.stats().activeVoices,0);
 engine.dispose();
});
test('no synthesis before opt-in, and all nodes clean up after mute',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(96000),engine=createOriginalCombatFoley(f.ctx);
 const cue={id:'spell',audio:'spell-release',priority:4,severity:.5};
 assert.equal(engine.emit(cue),false);
 assert.equal(f.buffers.length,0);
 assert.equal(engine.enable(),true);
 assert.equal(engine.emit(cue),true);
 assert.equal(f.buffers.length,1);
 engine.disable();
 assert.equal(engine.stats().activeVoices,0);
 assert.equal(engine.emit(cue),false);
 engine.dispose();
 assert.equal(engine.stats().noiseSamples,0);
});
