'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {stripR54ShadowStartup}=require('../helpers/snake-r54-shadow-startup-archive.cjs');
const renderer=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
const blob = historicalRendererGitBlob;
const start='      // BEGIN R54 SHADOW FIRST-PAINT\n', end='      // END R54 SHADOW FIRST-PAINT\n';
function simulate({startupRatio,initialRatio,shadowResolution=2048}){
  const a=renderer.indexOf(start),b=renderer.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'marked production block exists');
  const fragment=renderer.slice(a+start.length,b);
  const seen=[];
  const mapSize={x:shadowResolution,y:shadowResolution,set(x,y){this.x=x;this.y=y;seen.push([x,y]);}};
  const scope={startupRatio,initialRatio,sun:{shadow:{mapSize}},
    renderer:{shadowMap:{needsUpdate:false}}};
  vm.runInNewContext(fragment,scope,{timeout:1000});
  return {width:mapSize.x,height:mapSize.y,updates:seen,dirty:scope.renderer.shadowMap.needsUpdate,fragment};
}
test('R54 source is exact-reversible to published R53 without modifying the 17-submission gate',()=>{
  const previous=stripR54ShadowStartup(renderer);
  assert.equal(blob(previous),'af7b56a8bdf40090e201b4d08f86a5c318aebe0c');
  assert.equal(stripR54ShadowStartup(previous),previous);
  assert.ok(previous.includes('boundedStartupPixelRatio(width, height, initialRatio)'));
  assert.ok(renderer.includes('createGpuFrameGate(gl)'));
  assert.ok(!simulate({startupRatio:0.7,initialRatio:1}).fragment.includes('dispose('));
});
test('R54 avoids a 2048 shadow atlas on oversized first paint but never drops it below the preexisting low-tier 1024',()=>{
  const limited=simulate({startupRatio:0.705,initialRatio:1});
  assert.equal(limited.width,1024);
  assert.equal(limited.height,1024);
  assert.deepEqual(limited.updates,[[1024,1024]]);
  assert.equal(limited.dirty,true);
  const normal=simulate({startupRatio:1,initialRatio:1});
  assert.equal(normal.width,2048);
  assert.equal(normal.dirty,false);
  assert.equal(normal.updates.length,0);
  const mobile=simulate({startupRatio:1.5,initialRatio:1.5});
  assert.equal(mobile.width,2048);
  assert.equal(mobile.dirty,false);
  const alreadyLow=simulate({startupRatio:0.4,initialRatio:0.75,shadowResolution:1024});
  assert.equal(alreadyLow.width,1024);
  assert.equal(alreadyLow.dirty,false);
  assert.equal(alreadyLow.updates.length,0);
});
