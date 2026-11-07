'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const source=path.join(root,'public/ai-maze-escape/map-view.mjs');
const production=()=>import(pathToFileURL(source).href);
const vector=()=>({x:4,y:21,z:9,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}});
const approximate=(got,wanted)=>assert.ok(Math.abs(got-wanted)<1e-9,got+' != '+wanted);

test('production camera cranes over the physically verified foreground for either public gate orientation',async()=>{
  const {setPublicGateOpeningStageOffset}=await production();
  const along=vector();
  assert.equal(setPublicGateOpeningStageOffset(along,{a:77,b:94},17),true);
  assert.deepEqual({x:along.x,y:along.y,z:along.z},{x:6,y:34,z:25});
  const across=vector();
  assert.equal(setPublicGateOpeningStageOffset(across,{a:77,b:78},17),true);
  assert.deepEqual({x:across.x,y:across.y,z:across.z},{x:25,y:34,z:6});
  assert.ok(along.y>21 && across.y>21,'physical high camera, not CSS or invisible model scaling');
});

test('production camera staging rejects a fake, diagonal, or invalid disclosed gate without moving camera',async()=>{
  const {setPublicGateOpeningStageOffset}=await production();
  for(const [cue,width] of [
    [null,17],[{a:77,b:77},17],[{a:77,b:95},17],
    [{a:-1,b:94},17],[{a:77,b:94},1],[{a:77,b:94},17.3],
    [{a:77.5,b:94},17],[{a:77,b:94},NaN]
  ]){
    const target=vector(),before={x:target.x,y:target.y,z:target.z};
    assert.equal(setPublicGateOpeningStageOffset(target,cue,width),false);
    assert.deepEqual({x:target.x,y:target.y,z:target.z},before);
  }
});

test('witnessed gate-only actor/arch focus does not use scenery bias, hidden routes or mutated input',async()=>{
  const {composePublicGateOpeningFocus}=await production();
  const delta={x:4,z:-2},original=JSON.stringify(delta);
  const wide=composePublicGateOpeningFocus(delta,1280/900);
  approximate(wide.x,1.28);approximate(wide.z,-.64);
  const narrow=composePublicGateOpeningFocus(delta,390/844);
  approximate(narrow.x,1);approximate(narrow.z,-.5);
  const large=composePublicGateOpeningFocus({x:50,z:50},1.4);
  assert.ok(Math.hypot(large.x,large.z)<=1.7+1e-9);
  const tall=composePublicGateOpeningFocus({x:50,z:50},.45);
  assert.ok(Math.hypot(tall.x,tall.z)<=1.2+1e-9);
  for(const bad of [null,{x:NaN,z:0},{x:Infinity,z:0},{x:0,z:undefined}])
    assert.deepEqual(composePublicGateOpeningFocus(bad,1.4),{x:0,z:0});
  assert.deepEqual(composePublicGateOpeningFocus(delta,0),{x:0,z:0});
  assert.equal(JSON.stringify(delta),original);
});

test('physical gate crane is gated on authentic public transition, never a permanently open gate or ordinary Follow',()=>{
  assert.match(scene,/publicGateOpeningCameraCue\(previous, snapshot\)/);
  assert.match(scene,/recentPublicOpening\?\.runToken === s\.runToken/);
  assert.match(scene,/setPublicGateOpeningStageOffset\(openingGateCameraOffset, openingGateBeat, s\.width, openingGateToHero,\s*width \/ Math\.max\(1, height\)\)/,
    'the real WebGL gate crane must use its witnessed public edge AND native viewport aspect');
  assert.match(scene,/openingGateToHero = openingA && openingB/,'camera derives solely from witnessed public physical coordinates');
  assert.match(scene,/focus = openingGateBeat\s*\? composePublicGateOpeningFocus\(gateDelta, aspect\)/);
  assert.match(scene,/cameraOffset\.lerp\(openingStageView \? openingGateCameraOffset/);
  assert.match(scene,/cameraMode === 'follow' && !settings\.reducedMotion\s*\? publicOpeningMoment : null/);
  assert.match(scene,/closestThreat\?\.strength/);
});
