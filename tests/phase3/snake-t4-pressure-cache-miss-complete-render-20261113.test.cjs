'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const cameraSrc = readFileSync(path.resolve(__dirname,'../../public/snake-stream/camera.mjs'),'utf8');
const rendererSrc = readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
const cameraModule = () => import('data:text/javascript;charset=utf-8,' + encodeURIComponent(cameraSrc.replace(
  "import { sculptRuinedGateway } from './world.mjs';",'const sculptRuinedGateway=()=>({});')));
const severe = { supported:true, failed:false, lastObservedLatencyMs:1800, skipped:677 };
const fine = { supported:true, failed:false, lastObservedLatencyMs:22, skipped:0 };

test('measured complete GPU fence starvation chooses one truthful full-scene draw on a cache miss',async()=>{
  const {shouldRenderFullSceneOnCacheMiss} = await cameraModule();
  assert.equal(shouldRenderFullSceneOnCacheMiss({queue:severe,cacheHit:false}),true);
  assert.equal(shouldRenderFullSceneOnCacheMiss({queue:severe,cacheHit:true}),false);
  assert.equal(shouldRenderFullSceneOnCacheMiss({queue:severe,cacheHit:true,shadowDirty:true}),true);
});

test('healthy, unsupported and failed GPU fence evidence cannot change normal cache presentation',async()=>{
  const {shouldRenderFullSceneOnCacheMiss} = await cameraModule();
  for (const queue of [fine,null,{},
    {supported:false,failed:false,lastObservedLatencyMs:6000,skipped:5000},
    {supported:true,failed:true,lastObservedLatencyMs:6000,skipped:5000},
    {supported:true,failed:false,lastObservedLatencyMs:NaN,skipped:5000},
    {supported:true,failed:false,lastObservedLatencyMs:1000,skipped:15}]) {
    assert.equal(shouldRenderFullSceneOnCacheMiss({queue,cacheHit:false}),false);
  }
});

test('real renderer bypasses offscreen rebuild BEFORE target allocation under proven pressure while preserving certified caches',()=>{
  assert.match(rendererSrc,/function renderPresentation\(\)/);
  assert.match(rendererSrc,/const cacheHit = [\s\S]*?key === staticKey/);
  const decision = rendererSrc.indexOf('shouldRenderFullSceneOnCacheMiss({ queue: currentGpuQueue, cacheHit');
  const creation = rendererSrc.indexOf('new THREE.WebGLRenderTarget(',rendererSrc.indexOf('function renderPresentation('));
  assert.ok(decision > 0 && decision < creation, 'GPU pressure cache miss must avoid allocating HDR/depth buffers');
  assert.match(rendererSrc,/shouldRenderFullSceneOnCacheMiss\(\{\s*queue: currentGpuQueue, cacheHit,\s*shadowDirty: renderer\.shadowMap\.needsUpdate\s*\}\)/);
  assert.match(rendererSrc.slice(decision,creation),/pressureDirectFrames\+\+;[\s\S]*?renderer\.render\(scene, camera\);[\s\S]*?return;/);
  assert.doesNotMatch(rendererSrc.slice(decision,creation),/invalidateStaticCache\(\);/, 'a pressure cache MISS must preserve any valid previous HDR cache');
  assert.match(rendererSrc,/currentGpuQueue = gpuQueue;/);
  assert.match(rendererSrc,/pressureDirectFrames/);
  assert.match(rendererSrc,/renderPresentation\(\);/);
});

test('cache-hits and healthy GPUs retain the original complete static HDR/depth then live serpent/water draw, without the redundant encoded-display pass',()=>{
  assert.match(rendererSrc,/renderer\.setRenderTarget\(staticTarget\);[\s\S]*?renderer\.render\(scene, camera\);/);
  assert.match(rendererSrc,/camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?liveCacheQuad\.visible = true;[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(rendererSrc,/cacheMaterial\.uniforms\.cachedColor\.value = staticTarget\.texture;/);
  assert.match(rendererSrc,/cacheMaterial\.uniforms\.cachedDepth\.value = staticTarget\.depthTexture;/);
  assert.doesNotMatch(rendererSrc,/renderer\.render\(cacheScene, cacheCamera\)|\bdisplayTarget\b/);
  assert.match(rendererSrc,/frameGate\.submitted\(\);/);
  assert.doesNotMatch(rendererSrc,/frameGate\.submitted\(\s*\d+/);
});
