'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = process.env.SNAKE_SOURCE_DIR || path.resolve(__dirname, '../..');
const camera = import(pathToFileURL(path.join(root, 'public/snake-stream/camera.mjs')).href);
function shot(x,z,other={}) {
  return { mode:'detail', runToken:'run-public', head:Object.freeze({x,z}),
    target:{x,y:.4,z}, offset:{x:3.2,y:1.1,z:2.5},
    reducedMotion:true, aspect:1.5, discontinuity:false, ...other };
}
test('T3: a stable reduced-motion camera does not invalidate the entire world on every real head update',async()=>{
  const {createPresentationCameraAnchor}=await camera;
  const anchor=createPresentationCameraAnchor(),initial=anchor.resolve(shot(0,0));
  assert.equal(initial.reset,true);
  for(let t=1;t<=120;t++){
    const next=anchor.resolve(shot(.08*Math.sin(t/11),.11*Math.cos(t/7)));
    assert.equal(next.reset,false);
    assert.equal(next.snap,true);
    assert.deepEqual(next.target,initial.target);
  }
  assert.equal(anchor.resolve(shot(1.3,0)).reset,true);
});
test('T3: portal, restart, viewpoint, portrait and preference changes are truthful single cuts',async()=>{
  const {createPresentationCameraAnchor}=await camera;
  const a=createPresentationCameraAnchor();a.resolve(shot(0,0));
  for(const change of [
    {head:{x:27,z:4},discontinuity:true},
    {runToken:'new-run'}, {mode:'follow'}, {aspect:.47}, {reducedMotion:false}
  ]) {
    const next=a.resolve(shot(0,0,change));
    assert.equal(next.reset,true); assert.equal(next.snap,true);
    assert.equal(a.resolve(shot(0,0,change)).reset,false);
  }
});
test('T4: GPU pressure comes only from completed-fence evidence and preserves full rendering',async()=>{
  const {createPresentationCameraAnchor,observedCameraGpuPressure,shouldCutUnderGpuPressure}=await camera;
  const severe={supported:true,failed:false,lastObservedLatencyMs:210,skipped:64};
  assert.equal(observedCameraGpuPressure(severe),true);
  for(const change of [{lastObservedLatencyMs:80},{skipped:8},{supported:false},{failed:true}])
    assert.equal(observedCameraGpuPressure({...severe,...change}),false);
  const calm=createPresentationCameraAnchor(),busy=createPresentationCameraAnchor();
  calm.resolve(shot(0,0,{reducedMotion:false}));
  busy.resolve(shot(0,0,{reducedMotion:false,gpuPressure:true}));
  assert.equal(calm.resolve(shot(.81,0,{reducedMotion:false})).reset,true);
  assert.equal(busy.resolve(shot(.81,0,{reducedMotion:false,gpuPressure:true})).reset,false);
  assert.equal(busy.resolve(shot(1.06,0,{reducedMotion:false,gpuPressure:true})).reset,true);
  assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:{reset:true,snap:false},queue:severe}),true);
  const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  for(const expression of [/observedCameraGpuPressure\(gpuQueue\)/,/gpuPressure:\s*severeCameraPressure/,/world\.updateStaticCameraVisibility\(camera\)/,/renderPresentation\(\)/,/frameGate\.submitted\(\)/])
    assert.match(renderer,expression);
});
