'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-dungeon/original-combat-foley.js')).href);
function audioFixture(rate=48000){
 const sources=[],buffers=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},connect(){},
  disconnect(){},start(t){this.startedAt=t},stop(t){this.stoppedAt=t}});
 const ctx={state:'running',currentTime:0,sampleRate:rate,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBuffer(channels,length,sampleRate){
   const samples=new Float32Array(length);
   const buffer={numberOfChannels:channels,length,duration:length/sampleRate,
    getChannelData:()=>samples};
   buffers.push({buffer,samples});return buffer;
  },
  createBufferSource(){const source=node();sources.push(source);return source}
 };
 return {ctx,sources,buffers};
}
const cue=audio=>({id:'authority-event',kind:audio,audio,priority:8,severity:.8});
test('long Warden and defeat noise beds loop until genuine recipe envelopes finish',async()=>{
 const {createOriginalCombatFoley}=await load();
 for(const [name,duration] of [['warden-release',.58],['boss-warning-final',.50],
  ['fatal-impact',.43],['defeat',.60],['spell-release',.34]]){
  const f=audioFixture(),s=createOriginalCombatFoley(f.ctx);
  assert.equal(s.emit(cue(name)),false,'no audio before explicit gesture');
  assert.equal(s.enable(),true);assert.equal(s.emit(cue(name)),true,name);
  assert.equal(f.sources.length,1,'one noise source per foley voice');
  assert.equal(f.sources[0].loop,true,name+' must survive the noise buffer boundary');
  assert.ok(f.buffers[0].buffer.duration<duration,name+' exceeds original mono buffer');
  f.ctx.currentTime=.30;s.cleanup();
  assert.equal(s.stats().activeVoices,1,'long cue remains active after 280ms');
  f.ctx.currentTime=duration+.06;s.cleanup();
  assert.equal(s.stats().activeVoices,0,'cue releases after existing stopAt');
  s.dispose();
 }
});
test('one deterministic locally seeded mono noise texture has quiet loop seam and bounded length',async()=>{
 const {createOriginalCombatFoley,ORIGINAL_COMBAT_MAX_NOISE_SAMPLES}=await load();
 for(const rate of [8000,48000,96000]){
  const a=audioFixture(rate),b=audioFixture(rate);
  const x=createOriginalCombatFoley(a.ctx),y=createOriginalCombatFoley(b.ctx);
  assert.equal(x.enable(),true);assert.equal(y.enable(),true);
  assert.equal(a.buffers.length,1);assert.equal(b.buffers.length,1);
  const {buffer,samples}=a.buffers[0];
  assert.equal(buffer.numberOfChannels,1);
  assert.ok(buffer.length<=ORIGINAL_COMBAT_MAX_NOISE_SAMPLES);
  assert.equal(samples[0],0);assert.equal(samples.at(-1),0);
  assert.ok(samples.some(n=>Math.abs(n)>.01),'noise is not all silence');
  assert.ok(samples.every(Number.isFinite));
  assert.deepEqual(samples,b.buffers[0].samples);
  assert.equal(x.stats().externalSamples,0);
  x.dispose();y.dispose();
 }
});
test('looping adds neither voices nor noise buffers; mute cleans up without automatic restart',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES}=await load();
 const f=audioFixture(),s=createOriginalCombatFoley(f.ctx);
 assert.equal(s.enable(),true);
 for(const name of ['whoosh','draw','ranged-release','spell-release',
  'cast-dry','utility','impact','fatal-impact']){
  assert.equal(s.emit(cue(name)),true,name);
 }
 assert.equal(s.stats().activeVoices,MAX_ORIGINAL_COMBAT_VOICES);
 assert.equal(f.buffers.length,1);
 assert.ok(f.sources.every(source=>source.loop===true));
 s.disable();
 assert.equal(s.stats().activeVoices,0);
 assert.equal(s.emit(cue('warden-release')),false);
 s.dispose();assert.equal(s.stats().disposed,true);
});
