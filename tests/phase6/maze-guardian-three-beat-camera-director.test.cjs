'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=()=>import('../../public/ai-maze-escape/guardian-duel-camera.mjs');

test('witnessed guardian performs one early, stable, nonreversing three-quarter camera',async()=>{
  const {publicGuardianDuelCameraElevation:elev,publicGuardianDuelShoulderOrbit:orbit}=await load();
  const aspect=390/844,strength=.85,originalOrbit=.71;
  const resting=elev(aspect,strength,0),warning=elev(aspect,strength,.20);
  const brace=elev(aspect,strength,.49),release=elev(aspect,strength,.92);
  assert.equal(resting,21,'resting camera remains the authoritative reference');
  assert.ok(warning<resting&&warning>brace,'real warning earns the reveal');
  assert.equal(brace,release,'pitch must not keep moving through brace/release');
  assert.ok(brace>=16.2&&brace<=21,'raise above physical foreground but preserve full-body framing');
  const correction=orbit(aspect,strength,.49,originalOrbit);
  assert.ok(correction<0&&Math.abs(correction)<=.52,'never cross or reverse guardian axis');
  assert.ok(orbit(aspect,strength,.20,originalOrbit)<0,'warning actually settles yaw');
  assert.equal(correction,orbit(aspect,strength,.92,originalOrbit),'no additional yaw through true shell release');
  assert.ok(originalOrbit+correction>.20,'preserve the previously proven native lens depth contract');
});
test('public eligibility, manual/reduced/landscape guards keep unrelated game cameras untouched',async()=>{
  const {publicGuardianDuelCameraElevation:elev,publicGuardianDuelShoulderOrbit:orbit}=await load();
  for(const a of [320/740,390/844]){
    assert.equal(elev(a,.85,.9,true),21);
    assert.equal(orbit(a,.85,.9,.6,true),0);
    assert.equal(elev(a,.70,.9),21);
    assert.equal(orbit(a,.70,.9,.6),0);
    assert.equal(elev(a,.85,NaN),21);
    assert.equal(orbit(a,.85,NaN,.6),0);
  }
  assert.equal(elev(844/390,.9,.9),21);
  assert.equal(orbit(1280/900,.9,.9,.6),0);
  assert.equal(orbit(390/844,.85,.9,0),0);
});
test('scene integrates ONLY public encounter camera, preserves native physical fitter',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(scene,/publicGuardianDuelCameraElevation\(/);
  assert.match(scene,/publicGuardianDuelShoulderOrbit\(/);
  assert.match(scene,/const warningSeat=clamp\(\(closestThreat\.encounterBeat-\.04\)\/\.33,0,1\)/);
  assert.match(scene,/\.65\*warningEase\+\.53\*shellRelease/);
  assert.match(scene,/targetHeight = publicPortraitGuardianHalfHeight\(/);
  assert.match(scene,/publicGuardianPhysicalCloseupHalfHeight\(/);
  assert.match(scene,/cameraMode==='follow' && !settings\.reducedMotion/);
});
