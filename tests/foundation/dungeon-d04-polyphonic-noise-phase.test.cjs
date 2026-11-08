'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-dungeon/original-combat-foley.js')).href);
function fixture(rate=48000){
 const sources=[],buffers=[];
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},connect(){},disconnect(){},
  start(t){this.startedAt=t},stop(t){this.stoppedAt=t}});
 const ctx={state:'running',currentTime:0,sampleRate:rate,destination:node(),
  createGain:node,createBiquadFilter:node,createOscillator:node,
  createBuffer(channels,length,sampleRate){
   const buffer={numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    getChannelData:()=>new Float32Array(length)};
   buffers.push(buffer);return buffer;
  },
  createBufferSource(){const n=node();n.start=function(t,offset=0){
   this.startedAt=t;this.offset=offset};
   sources.push(n);return n}
 };
 return {ctx,sources,buffers};
}
const cue=(audio,priority=5)=>({id:audio,kind:audio,audio,priority,severity:.5});
const gap=(a,b,length)=>{const d=Math.abs(a-b);return Math.min(d,length-d)};
test('eight concurrent original foley cues share one texture but not one phase',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx);
 assert.equal(engine.emit(cue('whoosh')),false,'no sound before gesture');
 assert.equal(engine.enable(),true);
 for(const name of ['whoosh','draw','ranged-release','spell-release',
  'cast-dry','utility','impact','fatal-impact'])
  assert.equal(engine.emit(cue(name)),true,name);
 assert.equal(f.buffers.length,1);
 assert.equal(f.sources.length,MAX_ORIGINAL_COMBAT_VOICES);
 assert.ok(f.sources.every(s=>s.loop===true));
 const duration=f.buffers[0].duration;
 for(let i=0;i<f.sources.length;i++){
  const a=f.sources[i].offset;
  assert.ok(Number.isFinite(a)&&a>=0&&a<duration);
  for(let j=0;j<i;j++)assert.ok(gap(a,f.sources[j].offset,duration)>=duration/16-1e-10,
   'noise sources should not produce identical coherent peaks');
 }
 assert.equal(engine.stats().activeVoices,MAX_ORIGINAL_COMBAT_VOICES);
 engine.dispose();
});
test('late cue separates from existing playback phase, not first-start offset',async()=>{
 const {createOriginalCombatFoley}=await load();
 const f=fixture(),engine=createOriginalCombatFoley(f.ctx);
 assert.equal(engine.enable(),true);assert.equal(engine.emit(cue('whoosh')),true);
 f.ctx.currentTime=.07;assert.equal(engine.emit(cue('draw')),true);
 const duration=f.buffers[0].duration;
 const oldPhase=(f.sources[0].offset+.07)%duration;
 assert.ok(Math.abs(gap(f.sources[1].offset,oldPhase,duration)-duration/2)<1e-10);
 engine.dispose();
});
test('polyphony, buffer cap, priority eviction and mute stay bounded at common sample rates',async()=>{
 const {createOriginalCombatFoley,MAX_ORIGINAL_COMBAT_VOICES,ORIGINAL_COMBAT_MAX_NOISE_SAMPLES}=await load();
 for(const rate of [8000,48000,96000]){
  const f=fixture(rate),engine=createOriginalCombatFoley(f.ctx);
  assert.equal(engine.enable(),true);
  for(const name of ['whoosh','draw','ranged-release','spell-release',
   'cast-dry','utility','impact','fatal-impact'])
   assert.equal(engine.emit(cue(name,5)),true);
  assert.equal(engine.emit(cue('evade',1)),false);
  assert.equal(f.sources.length,MAX_ORIGINAL_COMBAT_VOICES);
  f.ctx.currentTime=.07;
  assert.equal(engine.emit(cue('warden-release',9)),true);
  assert.equal(engine.stats().activeVoices,MAX_ORIGINAL_COMBAT_VOICES);
  assert.equal(f.buffers.length,1);
  assert.ok(f.buffers[0].length<=ORIGINAL_COMBAT_MAX_NOISE_SAMPLES);
  engine.disable();assert.equal(engine.stats().activeVoices,0);
  assert.equal(engine.emit(cue('whoosh')),false);
  engine.dispose();
 }
});
