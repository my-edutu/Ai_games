'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-maze-escape/map-view.mjs');
const scenePath=path.join(root,'public/ai-maze-escape/scene.js');
const load=import(pathToFileURL(modulePath).href);

test('a genuinely disclosed physical organ earns a conservative larger LANDSCAPE performance stage',async()=>{
  const {publicFossilPerformanceHalfHeight:frame}=await load;
  const hero={x:0,z:0}, organ={x:1.6,z:.8};
  const oldFocus={x:0,z:0}, focus={x:.4,z:.2}, aspect=1280/900;
  const neutral=frame(aspect,5.85,0,hero,organ,focus,oldFocus);
  const near=frame(aspect,5.85,.6,hero,organ,focus,oldFocus);
  const active=frame(aspect,5.85,1,hero,organ,focus,oldFocus);
  assert.equal(neutral,5.85,'no invented close-up before an actual response');
  assert.ok(active<near && near<neutral,
    'publicly observed stronger physical acting gains readable actual 3D actor scale');
  assert.ok(active>=4.7,'the camera must not become a cropped macro');
  const screenX=(point,target)=>
    ((point.x-target.x)*18-(point.z-target.z)*15)/Math.hypot(18,15);
  for(const target of [focus,oldFocus]){
    for(const [model,reserve] of [[hero,1.18],[organ,1.5]]){
      const ndc=(Math.abs(screenX(model,target))+reserve)/(active*aspect);
      assert.ok(ndc<=.92+1e-9,
        'both actual physical model envelopes must fit at both focus endpoints');
    }
  }
});

test('no close-up can crop the acting pair or weaken portrait, hidden/invalid or reduced-stage safeguards',async()=>{
  const {publicFossilPerformanceHalfHeight:frame}=await load;
  const hero={x:0,z:0},organ={x:1,z:1},target={x:0,z:0};
  for(const aspect of [.35,390/844,1,NaN])
    assert.equal(frame(aspect,7.9,1,hero,organ,target),7.9,
      'portrait and invalid viewports keep the strictly verified camera');
  for(const attention of [0,.12,.35,-1,NaN])
    assert.equal(frame(1280/900,5.85,attention,hero,organ,target),5.85,
      'no unpublished or weak attention can invent a story beat');
  assert.equal(frame(1280/900,5.85,1,hero,{x:70,z:-30},target),5.85,
    'the real physical frame reserve must veto an unsafe stage');
  assert.equal(frame(1280/900,5.85,1,hero,{x:NaN,z:0},target),5.85,
    'an invalid or missing public model cannot create a camera shot');
  const frozen=JSON.stringify({hero,organ,target});
  frame(1280/900,5.85,.9,hero,organ,target);
  assert.equal(JSON.stringify({hero,organ,target}),frozen,
    'presentation cannot mutate authoritative public positions');
});

test('actual scene gates the fossil camera below threat, key, gate, pickup, goal and terminal truth',()=>{
  const scene=fs.readFileSync(scenePath,'utf8');
  const start=scene.indexOf('// Pass131: native images show');
  assert.ok(start>=0,'camera must be integrated into the real WebGL scene');
  const end=scene.indexOf('// At genuine disclosed close encounters',start);
  assert.ok(end>start);
  const source=scene.slice(start,end);
  for(const guard of [
    '!result','!cameraGate','!closestThreat?.strength','!nearObservedGoal',
    '!keyGateCue','!showPickup','!settings.reducedMotion','aspect>=1.1',
    'fossilCue?.strength>.35','publicFossilPerformanceHalfHeight'
  ])assert.ok(source.includes(guard),'camera must preserve '+guard);
  assert.ok(source.includes('desiredTarget.x')&&source.includes('desiredTarget.z'),
    'actual 3D model pair shares the existing camera target rather than rendering a fake photo');
  assert.ok(scene.includes('fossilPerformanceShot,'),
    'exact-source full-resolution browser screenshots retain camera activation evidence');
});
