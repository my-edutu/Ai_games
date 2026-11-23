'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const cameraModule = import(pathToFileURL(path.resolve(__dirname,'../../public/snake-stream/camera.mjs')).href);
const makeShot = (x,z,changes={}) => ({
  mode:'follow',runToken:'public-run',head:{x,z},target:{x,y:.4,z},
  offset:{x:1.5,y:6.5,z:7},aspect:16/9,reducedMotion:false,
  discontinuity:false,gpuPressure:true,width:28,height:16,...changes,
});

test('true 36-degree perspective crops public serpent before the old square and teleport thresholds; the camera must cut now',async()=>{
  const {createPresentationCameraAnchor}=await cameraModule;
  const a=createPresentationCameraAnchor();a.resolve(makeShot(0,0));
  const head={x:1.3,z:2.95};
  assert.ok(head.x < 3 && head.z < 3 && Math.hypot(head.x,head.z)<3.25,
    'not a square-window exit or teleport');
  const change=a.resolve(makeShot(head.x,head.z));
  assert.equal(change.reset,true,'actual screen cropping must end stale view even within world-axis hold');
});

test('portal with stale editorial target cuts ONCE to the real public head and does not cut repeatedly',async()=>{
  const {createPresentationCameraAnchor}=await cameraModule;
  const a=createPresentationCameraAnchor();a.resolve(makeShot(0,0));
  const discontinuous=makeShot(25,6,{discontinuity:true,target:{x:0,y:.4,z:0}});
  const cut=a.resolve(discontinuous);
  assert.equal(cut.reset,true);
  assert.equal(cut.snap,true);
  assert.equal(cut.target.x,25);
  assert.equal(cut.target.z,6);
  assert.equal(a.resolve(discontinuous).reset,false,'same real portal event must not repeatedly invalidate original world');
});
