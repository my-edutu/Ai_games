'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const modulePromise=import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/encounter-lighting.mjs')).href);

test('original 3D stage lighting reacts only to genuine public pressure/guardian events',async()=>{
  const {publicEncounterLighting:targets,NORMAL_MAZE_LIGHTING:normal}=await modulePromise;
  assert.deepEqual(targets(),normal);
  assert.deepEqual(targets({guardianStrength:1,guardianBeat:0}),normal,
    'proximity without a witnessed warning cannot invent a guardian event');
  const brace=targets({guardianStrength:1,guardianBeat:.6});
  assert.ok(brace.sun<normal.sun && brace.sky<normal.sky && brace.rim>normal.rim,
    'the genuine Guardian brace gains atmospheric separation, not a HUD alarm');
  assert.ok(brace.lantern>normal.lantern,'Pip physically lights the publicly braced guardian');
  const pressure=targets({pressureStrength:1,pressureProgress:.8});
  assert.ok(pressure.lantern>normal.lantern && pressure.rim>normal.rim,
    'moving, published pressure jaws receive a legible existing-light response');
  assert.ok(targets({pressureStrength:1,pressureProgress:1}).lantern>
    targets({pressureStrength:1,pressureProgress:0}).lantern,
    'the authentic physical shutter position, not invented danger, directs the light');
  const inputs={guardianStrength:1,guardianBeat:.6,pressureStrength:.4,pressureProgress:.3};
  assert.deepEqual(targets(inputs),targets(inputs),'same public witness replays deterministically');
  assert.deepEqual(targets({...inputs,privateMaze:{traps:[0],guardians:[1]}}),targets(inputs),
    'extra private fields never change the presented light rig');
  assert.deepEqual(targets({...inputs,terminal:true}),normal);
  assert.deepEqual(targets({...inputs,reducedMotion:true}),normal);
  assert.deepEqual(targets({guardianStrength:Infinity,guardianBeat:NaN,
    pressureStrength:-Infinity,pressureProgress:NaN}),normal);
});

test('same four pooled Three lights ease without pulse, overshoot or extra resources',async()=>{
  const {publicEncounterLighting:targets,easePublicEncounterLighting:ease,
    NORMAL_MAZE_LIGHTING:normal}=await modulePromise;
  const target=targets({guardianStrength:.9,guardianBeat:.8,pressureStrength:.4});
  const first=ease(normal,target,.016);
  for(const key of Object.keys(normal)) {
    assert.ok(Number.isFinite(first[key]));
    assert.ok(first[key]>=Math.min(normal[key],target[key])
      &&first[key]<=Math.max(normal[key],target[key]),'no overshooting native scene brightness');
  }
  let value=normal;
  for(let i=0;i<240;i++)value=ease(value,target,.016);
  for(const key of Object.keys(normal))assert.ok(Math.abs(value[key]-target[key])<.00001);
  const returned=ease(value,normal,.8);
  assert.ok(returned.sun>value.sun && returned.rim<value.rim,
    'published encounter withdrawal restores the original lighting');
  assert.equal(Object.keys(returned).length,4,'no additional lights or stateful resources');
  assert.deepEqual(ease(normal,target,0),normal);
});
