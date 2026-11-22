'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');

test('source-backed 3D cache reporting identifies both retained scenery views and GPU resource budget without counting them as frames',()=>{
  const stats=source.slice(source.indexOf('  function stats() {'),source.indexOf('  function resetTiming() {'));
  assert.match(stats,/viewShelf:\s*cachedWorldShelf\.stats\(\)/,
    'new genuine HDR/depth view must expose retained pixels, hits and evictions for real Chromium verification');
  assert.doesNotMatch(stats,/frameCount\s*\+\s*cachedWorldShelf|submitted\s*\+\s*cachedWorldShelf/,
    'a returned photograph never counts as an independently submitted full renderer frame');
  const dispose=source.slice(source.indexOf('  function dispose() {'),source.indexOf('  return { draw, stats, resetTiming, dispose };'));
  assert.match(dispose,/cachedWorldShelf\.dispose\(\)/,'all GPU allocations must be released');
});
