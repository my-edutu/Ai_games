'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cameraModule = import('../../public/snake-stream/camera.mjs');
const source = fs.readFileSync(path.join(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
const input=(head,mode='follow')=>({mode,runToken:'public-run',head,target:{x:head.x,y:.4,z:head.z},offset:{x:7,y:9,z:9},aspect:1.7,reducedMotion:false,discontinuity:false});
const queue = (lastObservedLatencyMs=270, skipped=70) => ({supported:true,failed:false,lastObservedLatencyMs,skipped,pending:2,maxFrames:2});

test('severe completed GPU pressure cuts only a meaningful follow reframe, not each pose or overview/detail', async()=>{
 const {createPresentationCameraAnchor,shouldCutUnderGpuPressure}=await cameraModule;
 const anchor=createPresentationCameraAnchor();
 const start=anchor.resolve(input({x:1,z:1}));
 const small=anchor.resolve(input({x:2,z:1}));
 const reframe=anchor.resolve(input({x:4.3,z:1}));
 assert.equal(start.snap,true);
 assert.equal(small.reset,false);
 assert.equal(reframe.reset,true);
 assert.equal(reframe.snap,false, 'real ordinary follow reframing remains distinct from portal cuts');
 assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:reframe,queue:queue()}),true);
 assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:small,queue:queue()}),false);
 assert.equal(shouldCutUnderGpuPressure({mode:'overview',anchor:reframe,queue:queue()}),false);
 assert.equal(shouldCutUnderGpuPressure({mode:'detail',anchor:reframe,queue:queue()}),true,
  'the more frequent real detail dead-zone must not saturate a measured starved GPU');
});

test('normal hardware, startup, unsupported GPU fences, historical peak and insufficient skips do not cut',async()=>{
 const {shouldCutUnderGpuPressure}=await cameraModule;
 const changed={reset:true,snap:false};
 for(const state of [queue(25,300),queue(100,300),queue(200,12),{...queue(),failed:true}, {...queue(),supported:false}, {...queue(),lastObservedLatencyMs:NaN}, {...queue(),lastObservedLatencyMs:undefined,maxObservedLatencyMs:5000}]) {
  assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:changed,queue:state}),false,JSON.stringify(state));
 }
 assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:{reset:true,snap:true},queue:queue()}),false);
});

test('actual whole-render integration uses latest completed GPU fence without skipping full scene draws',()=>{
 assert.match(source,/lastObservedLatencyMs\s*=\s*now\(\)\s*-\s*item\.at/);
 assert.match(source,/maxObservedLatencyMs\s*=\s*Math\.max\(maxObservedLatencyMs,\s*lastObservedLatencyMs\)/);
 assert.match(source,/shouldCutUnderGpuPressure\(\{\s*mode:\s*cameraMode,\s*anchor,\s*queue:\s*frameGate\.stats\(\)\s*\}\)/);
 assert.match(source,/hardCut:\s*settings\.reducedMotion\s*\|\|\s*frameCount\s*===\s*0\s*\|\|\s*anchor\.snap\s*\|\|\s*pressureFollowCut/);
 assert.match(source,/renderer\.render\(scene, camera\)/);
 assert.match(source,/frameGate\.submitted\(\)/);
 assert.match(source,/maxFrames\s*=\s*2/);
 assert.match(source,/renderer\.shadowMap\.autoUpdate\s*=\s*false/);
});
