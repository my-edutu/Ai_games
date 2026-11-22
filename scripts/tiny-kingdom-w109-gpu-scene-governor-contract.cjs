'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
// W109: test-first contract; old W108 source has no scene-keyed GPU raster
// policy and fails this test. A passing contract is never hardware-FPS proof.
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/);
assert.ok(script,'Complete playable inline JS must exist');
new vm.Script(script[1],{filename:'tiny-kingdom-playable.js'});
const start=html.indexOf('function planHardwareRenderScale(');
const end=html.indexOf('\n}\nfunction hardwareGpuSceneKey',start);
assert.ok(start>0&&end>start,'Missing durable same-scene GPU policy');
const policy=Function(
 'const HARDWARE_GPU_WINDOW=24,HARDWARE_SCALE_DESKTOP_MIN=.82,HARDWARE_SCALE_PHONE_MIN=.84;'+
 html.slice(start,end+2)+';return planHardwareRenderScale;')();
assert.equal(policy(Array(23).fill(90),1,false).decision,
 'insufficient-same-scene-gpu-samples');
assert.equal(policy(Array(24).fill(40),1,false).scale,.95);
assert.equal(policy(Array(24).fill(50),.82,false).scale,.82);
assert.equal(policy(Array(24).fill(50),.84,true).scale,.84);
assert.equal(policy(Array(24).fill(10),.82,false).scale,.85);
assert.equal(policy(Array(24).fill(19),.91,false).scale,.91);
assert.throws(()=>policy([NaN,...Array(23).fill(20)],.9,false),
 /Invalid GPU timer sample/);
assert.match(html,/gpuTimerPending\.push\(\{query,scene:hardwareGpuSceneKey\(\)\}\)/);
assert.match(html,/pending\.scene===hardwareGpuSceneKey\(\)/);
assert.match(html,/updateHardwareResolution\(pending\.scene,ms,canvas\.clientWidth<=480\)/);
assert.match(html,/qualityOverride!==null\)return;/);
assert.match(html,/automated\?\.65:hardwareAutoScale/);
assert.match(html,/getHardwareResolutionAudit,getSimulationFrameDelta/);
assert.match(html,/getHardwareResolutionAudit\(\)[\s\S]*noGpuQueryMeansNoQualityGuess:true/);
console.log('W109 7 pure-policy cases + full V8 syntax + GPU-scene/phone/override integration PASS');
