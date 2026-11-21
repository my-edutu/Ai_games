'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePromise=import('../../public/infinite-tower-climb/visuals/source-returned-gate-camera-release.mjs');
const source={floor:9,theme:'void',lifecycle:'running',tick:529,
  runToken:'defeated-real-guardian',player:{health:4}};
const lastGate={floor:9,tick:506,runToken:source.runToken};
const current=[12.643,3.586,50.668],target=[46.196,18.145,29.985];
test('released physical F8 gateway cannot permit 40m portrait orbit jump in one completed frame',async()=>{
 const {sourceReturnedGateCameraRelease:step}=await modulePromise;
 const before=JSON.stringify(source);
 const got=step({source,lastGate,previousCamera:current,
   previousFocus:[9,-1,23],desiredCamera:target,
   desiredFocus:[18,8,22],dt:.04});
 assert.ok(got&&got.limited);
 assert.ok(Math.hypot(...got.camera.map((v,i)=>v-current[i]))<1.7);
 assert.ok(Math.abs(got.turnRadians)<=.72*.04+1e-9);
 assert.ok(got.camera.every(Number.isFinite)&&got.focus.every(Number.isFinite));
 assert.equal(JSON.stringify(source),before,'presentation must never write authority');
});
test('same real source-run camera converges without overshoot or radial core intrusion',async()=>{
 const {sourceReturnedGateCameraRelease:step}=await modulePromise;
 let camera=current,focus=[9,-1,23],lastGap=Infinity;
 for(let frame=0;frame<140;frame++){
   const got=step({source,lastGate,previousCamera:camera,previousFocus:focus,
     desiredCamera:target,desiredFocus:[18,8,22],dt:.04});
   assert.ok(got&&got.remainingMetres<=lastGap+1e-7);
   assert.ok(Math.hypot(got.camera[0],got.camera[2])>=23.5);
   lastGap=got.remainingMetres;camera=got.camera;focus=got.focus;
 }
 assert.ok(Math.hypot(...camera.map((v,i)=>v-target[i]))<.04);
});
test('never borrows a stale, defeated, wrong-floor, cross-run or missing renderer witness',async()=>{
 const {sourceReturnedGateCameraRelease:step}=await modulePromise;
 const args={source,lastGate,previousCamera:current,previousFocus:[0,0,20],
  desiredCamera:target,desiredFocus:[2,1,20],dt:.033};
 for(const bad of [
  {...args,source:{...source,runToken:'other'}},
  {...args,source:{...source,floor:10}},
  {...args,source:{...source,lifecycle:'result'}},
  {...args,source:{...source,player:{health:0}}},
  {...args,source:{...source,tick:620}},
  {...args,lastGate:{...lastGate,tick:530}},
  {...args,previousCamera:[NaN,0,42]},
  {...args,previousCamera:[0,1,4]},
  {...args,dt:1}
 ])assert.equal(step(bad),null);
});
test('render handoff is subsequent to director, before real WebGL, and physically reversible',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
 '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const begin=scene.indexOf('// RETURNED ORIGINAL GATE CAMERA RELEASE:');
 assert.ok(begin>scene.indexOf('guardianCircuit.protectHeroSightline'));
 assert.ok(begin<scene.indexOf('renderer.render(scene, camera)'));
 assert.match(scene,/sourceReturnedGateCameraRelease\(/);
 assert.match(scene,/camera\.position\.copy\(releasePreviousCamera\)/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,releaseHero,23\.5\)/);
});
