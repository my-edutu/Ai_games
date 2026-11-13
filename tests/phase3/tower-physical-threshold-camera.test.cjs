'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const helper = import('../../public/infinite-tower-climb/visuals/physical-threshold-shot.mjs');
test('an already drawn real hero earns a smooth original-door correction in both viewports',async()=>{
  const { sourceDoorwayFrameGain:rank, sourceDoorwayFrameSteps:steps }=await helper;
  const hero=[-.17,.02,.45,.16], door=[1.18,.08,.5,.15];
  const betterHero=[-.26,.02,.45,.16], betterDoor=[.92,.08,.5,.15];
  for(const aspect of [960/600,390/844]){
    assert.ok(rank(hero,door,betterHero,betterDoor,true,true)>.1);
    const correction=steps(1/25,aspect);
    assert.ok(correction.gazeMetres>0&&correction.gazeMetres<.65);
    assert.ok(correction.orbitRadians>0&&correction.orbitRadians<=.035);
  }
});
test('wrong-way glance, cropped body, solid-core ray, offscreen or invalid projection veto',async()=>{
  const {sourceDoorwayFrameGain:rank}=await helper;
  const hero=[-.1,0,.5,.17], door=[1.25,.1,.5,.14];
  const fixed=[.85,.1,.5,.14];
  assert.equal(rank(hero,door,hero,[1.3,.1,.5,.14],true,true),0);
  assert.equal(rank(hero,door,[.85,.1,.5,.17],fixed,true,true),0);
  assert.equal(rank(hero,door,hero,fixed,false,true),0);
  assert.equal(rank(hero,door,hero,fixed,true,false),0);
  assert.equal(rank(hero,[.2,.1,.5,.14],hero,[.2,.1,.5,.14],true,true),0);
  assert.equal(rank(hero,door,hero,[Infinity,.1,.5,.14],true,true),0);
  assert.equal(rank(hero,door,hero,[.9,.1,4,.14],true,true),0);
});
test('unbounded delta, invalid portrait and broken input cannot produce a new frame plan',async()=>{
  const {sourceDoorwayFrameSteps:steps}=await helper;
  for(const dt of [-1,0,Infinity,1,NaN])
    assert.equal(steps(dt,390/844),null);
  for(const aspect of [NaN,Infinity,0,.2,3])
    assert.equal(steps(1/25,aspect),null);
});
test('the production 3D camera checks the actual GPU-retained original arch and the drawn body after other camera directors',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/world\.retainedFilmHandoff\?\.\(snapshot\)/);
  assert.match(scene,/sourceDoorwayFrameSteps\(cameraDt,camera\.aspect\)/);
  assert.match(scene,/sourceDoorwayFrameGain\(/);
  assert.match(scene,/physicalThresholdFrameGain/);
  assert.match(scene,/physicalThresholdFrameSourceBound = !!thresholdSteps/);
  assert.match(scene,/physicalThresholdCamera: \{sourceBound: physicalThresholdFrameSourceBound/);
  assert.doesNotMatch(scene,/physicalThresholdCamera: \{sourceBound: !!coldArchLens/);
  // Frame-scoped cold-door corrections end in a nested source guard. The
  // sightline pass must receive the FINAL submitted camera, not the earlier
  // source-world or warmup lens. Closing guards are not extra camera stages.
  const reveal=scene.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints);');
  const finalLook=scene.lastIndexOf('camera.lookAt(lookAt);',reveal);
  const finalMatrices=scene.lastIndexOf('camera.updateMatrixWorld(true);',reveal);
  assert.ok(reveal>0 && finalLook>0 && finalMatrices>finalLook,
    'submit the corrected lens before the real world sightline pass');
  assert.match(scene.slice(finalMatrices+'camera.updateMatrixWorld(true);'.length,reveal),
    /^\\s*}\\s*}\\s*$/,
    'no intervening camera/world stage may override the corrected shot');
  assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y)\s*=/);
});
