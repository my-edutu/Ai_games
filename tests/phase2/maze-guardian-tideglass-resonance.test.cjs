'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const helper=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
test('observed earned physical lantern counter moves Pip-to-Thornback Tideglass floor without invented wins',async()=>{
  const {publicGuardianEarnedResonance:step}=await import(helper);
  const state={wave:9,glow:9,radius:9};
  for(const v of [undefined,null,NaN,-.01,1.01,Infinity]){
    assert.equal(step(v,0,false,state),state,'reuse same physical stage state');
    assert.deepEqual(state,{wave:0,glow:0,radius:0},'unearned/first-seen/new-run parry must be quiet');
  }
  for(const d of [-1,3,1.2,NaN]){
    step(.4,d,false,state);
    assert.deepEqual(state,{wave:0,glow:0,radius:0},'only real 1–2 open-edge court applies');
  }
  step(.08,2,false,state);
  assert.deepEqual(state,{wave:0,glow:0,radius:0},'opposite court end must not fire before source actor');
  step(.38,0,false,state);
  const first=state.glow;
  assert.equal(state.wave,1);
  assert.ok(first>.5&&state.radius>.3&&state.radius<1.01,
    'counter must visibly move the real physical stage rather than only a caption');
  step(.38,2,false,state);
  assert.ok(state.glow>0&&state.glow<first,'floor response travels from Pip to true retreat');
  step(1,0,false,state);
  assert.equal(state.wave,1);
  assert.equal(state.glow,0,'no repeated flash at completed parry');
  step(.5,0,true,state);
  assert.deepEqual(state,{wave:1,glow:0,radius:0},'reduced motion holds accurate non-flashing outcome');
});
test('real live stage receives the same witnessed actor clock and reuses existing GPU primitives',()=>{
  const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
  const world=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
  assert.match(scene,/guardianCounterPhase:witnessedCounter\s*\?\s*earnedCounterActor\.counterPhase\s*:\s*undefined/);
  assert.match(world,/publicGuardianEarnedResonance\(\s*onLane&&earnedParry\?guardianCounterPhase:undefined/);
  assert.match(world,/before && before\.lanternParried!==true/,
    'a direct Three.js consumer must witness same-run false-to-true, not an already parried first view');
  assert.match(world,/observedEarnedCounter\.start=t/,
    'a single shared world fallback cannot create per-cell phantom victory clocks');
  assert.match(world,/mesh\(signal,ring,inlay/);
  assert.match(world,/resonanceState:\{wave:0,glow:0,radius:0\}/);
  assert.doesNotMatch(world,/signal\.counterStart|signal\.counterRunToken/,
    'a rebuilt disclosed court must never invent its own independent victory clock');
});


test('Pass440 complete genuinely earned Tideglass court impulse survives the physical collapse beat, not a synthetic hit',async()=>{
  const {publicGuardianEarnedResonance:step}=await import(helper);
  const live={wave:0,glow:0,radius:0};
  step(.82,0,false,live);
  const pipLate={...live};
  step(.82,2,false,live);
  const guardianLate={...live};
  assert.equal(pipLate.wave,1);
  assert.equal(guardianLate.wave,1);
  assert.ok(pipLate.glow>.40 && guardianLate.glow>.75,
    'true late parry remains clearly staged for both physical characters');
  assert.ok(guardianLate.glow>pipLate.glow,
    'progressively disclosed energy has reached the guardian by the recoil beat');
  assert.ok(guardianLate.radius>.34 && pipLate.radius>guardianLate.radius,
    'the same pooled floor pulse grows along already-public corridor cells');
  step(1,0,false,live);
  assert.deepEqual(live,{wave:1,glow:0,radius:0},
    'finished real parry cannot restart the scene or leave a false luminous strike');
  step(.82,2,true,live);
  assert.deepEqual(live,{wave:1,glow:0,radius:0},
    'reduced motion has a truthful settled stage, never an animated flash');
  const world=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
  assert.match(world,/signal\.counterRipple\.scale\.setScalar\(resonance\.radius\*1\.75\)/);
  assert.match(world,/signal\.counterRipple\.visible=onLane && resonance\.glow>\.08/);
  assert.match(world,/onLane&&earnedParry\?guardianCounterPhase:undefined/);
  assert.doesNotMatch(world,/new THREE\.TorusGeometry\(.*counter|signal\.counterStart/i,
    'counter presentation reuses the existing ring and one shared witness clock');
});
