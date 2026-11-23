'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
function sourceShelf() {
  assert.ok(src.includes('export function createStaticViewCacheShelf('), 'source must implement bounded source-keyed world-view cache reuse');
  const foundation = src.slice(src.indexOf('export function canReuseStaticWorldCache('), src.indexOf('export function partitionWorldRenderLayers('));
  const shelf = src.slice(src.indexOf('export function createStaticViewCacheShelf('), src.indexOf('export function createSceneRenderer('));
  return new Function((foundation + shelf).replaceAll('export function ', 'function ') + '\nreturn createStaticViewCacheShelf;')();
}
function target(width=751,height=415) {
  return {width,height,disposed:0,dispose(){this.disposed++},texture:{},depthTexture:{}};
}
test('RED: preserve TWO complete authentic HDR+depth still views, ONLY on exact world/camera/CSS/raster match', () => {
  const shelf = sourceShelf()({maxPixels:500000});
  const a=target();
  assert.equal(shelf.park({target:a,key:'world-A|camera-overview',cssLayout:'1920x1080'}),true);
  assert.equal(shelf.take({key:'world-A|camera-detail',cssLayout:'1920x1080',width:751,height:415}),null,'never render old view for new camera');
  assert.equal(shelf.take({key:'world-A|camera-overview',cssLayout:'390x844',width:751,height:415}),null,'never reuse desktop photograph for phone');
  assert.equal(shelf.take({key:'world-A|camera-overview',cssLayout:'1920x1080',width:850,height:470}),null,'never upsample lower original HDR/depth raster');
  assert.equal(shelf.take({key:'world-A|camera-overview',cssLayout:'1920x1080',width:751,height:415}),a);
  assert.equal(a.disposed,0);
  const b=target();
  assert.equal(shelf.park({target:b,key:'world-A|camera-detail',cssLayout:'1920x1080'}),true);
  assert.equal(shelf.take({key:'world-A|camera-detail',cssLayout:'1920x1080',width:751,height:415}),b);
  assert.equal(shelf.park({target:a,key:'world-A|camera-overview',cssLayout:'1920x1080'}),true);
  assert.equal(shelf.take({key:'world-A|camera-overview',cssLayout:'1920x1080',width:751,height:415}),a);
  assert.equal(a.disposed,0);
  assert.equal(b.disposed,0);
  assert.equal(shelf.stats().hits,3);
});
test('RED: bounded photo shelf evicts old GPU attachments once and cleans on revision, resize and disposal', () => {
  const shelf = sourceShelf()({maxPixels:500000});
  const original=target(), second=target(), oversized=target(1024,768);
  assert.equal(shelf.park({target:original,key:'A',cssLayout:'1920x1080'}),true);
  assert.equal(shelf.park({target:oversized,key:'HD',cssLayout:'1920x1080'}),false,'never retain a second large framebuffer beyond bounded budget');
  assert.equal(oversized.disposed,0,'owner keeps the original render target on rejected admission');
  assert.equal(shelf.park({target:second,key:'B',cssLayout:'1920x1080'}),true);
  assert.equal(original.disposed,1,'eviction frees complete old HDR and depth');
  shelf.clear();
  shelf.clear();
  assert.equal(second.disposed,1,'world/viewport change cannot retain old photograph');
  assert.equal(shelf.take({key:'B',cssLayout:'1920x1080',width:751,height:415}),null);
  assert.equal(shelf.stats().retained,0);
});
test('RED: production swaps photographed scenes rather than redrawing static world or losing live entities',()=>{
  sourceShelf();
  assert.match(src,/cachedWorldShelf\.take\(/,'reuse parked valid image');
  assert.match(src,/cachedWorldShelf\.park\(/,'retain old photographic view during replacement');
  assert.match(src,/cachedWorldShelf\.clear\(/,'invalidate parked view with original world/CSS change');
  assert.match(src,/cachedWorldShelf\.dispose\(/,'dispose on renderer shutdown');
  assert.match(src,/cacheMaterial\.uniforms\.cachedDepth\.value\s*=\s*staticTarget\.depthTexture/);
  assert.match(src,/liveCacheQuad\.visible = true/);
  assert.match(src,/renderer\.render\(scene, camera\)/);
  assert.match(src,/frameGate\.canDraw\(\)/);
  assert.match(src,/shouldAdmitFullSceneCache\(/);
  assert.match(src,/shouldPromoteStableShotCache\(/);
  assert.match(src,/shouldPrimeColdFullSceneCache\(/);
});
