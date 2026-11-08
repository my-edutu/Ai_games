'use strict';
// W148: contract for exact terrain-height reuse inside the *original* static
// geometry renderer, never as authoritative game-state or navigation change.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=source.indexOf('function highlandRidgeRelief(');
const end=source.indexOf('// Continuous grass vertex colours',begin);
assert(begin>0&&end>begin,'Real valley terrain source was not found');
assert(source.includes('const frameStaticStart=performance.now();staticTerrainMemoActive=staticTerrainMemoOverride!==false;'),
 'Original static geometry must explicitly enable the bounded cache');
assert(source.includes('staticTerrainMemoActive=false;const frameDynamicStart=performance.now();'),
 'Original dynamic actors/jobs must never inherit static sampling');
assert(source.includes('getStaticTerrainMemoAudit,setStaticTerrainMemoEnabledForTesting,getLandscapeCacheStats:'),
 'An actual-running-game probe and source-level A/B switch are required');
const core=source.slice(begin,end);
const sample=new Function('let lastFrozenFrameKey=null,presentationEpoch=0;'+core+
 'return {rawTerrain,terrain,stats:getStaticTerrainMemoAudit,'+
 'enable:setStaticTerrainMemoEnabledForTesting,'+
 'setActive:v=>staticTerrainMemoActive=v,epoch:()=>presentationEpoch};')();
const coordinates=[];
for(let i=0;i<4096;i++)coordinates.push([(i%97)*.3-11.2,(i%211)*.41-22.7]);
for(const [x,z] of coordinates){
 assert(Object.is(sample.terrain(x,z),sample.rawTerrain(x,z)),
  'Unscoped terrain must remain bitwise original at '+x+','+z);
}
sample.setActive(true);
for(const [x,z] of coordinates)assert(Object.is(sample.terrain(x,z),sample.rawTerrain(x,z)));
for(const [x,z] of coordinates)assert(Object.is(sample.terrain(x,z),sample.rawTerrain(x,z)));
assert(sample.stats().hits>=coordinates.length,
 'Exact repeated static samples must be retained');
for(let i=0;i<35000;i++)assert(Object.is(
 sample.terrain(1000+i*.1,-2500+i*.31),
 sample.rawTerrain(1000+i*.1,-2500+i*.31)));
assert(sample.stats().size<=32768,'Terrain cache memory must remain bounded');
assert(sample.stats().clears>=1,'Stale capacity must be cleared before growth');
const epoch=sample.epoch();
assert.equal(sample.enable(false),false);
assert.equal(sample.epoch(),epoch+1,'Presentation must invalidate after A/B toggle');
assert.equal(sample.stats().enabled,false);
sample.setActive(sample.stats().enabled);
for(const [x,z] of coordinates)assert(Object.is(sample.terrain(x,z),sample.rawTerrain(x,z)));
sample.enable(null);
sample.setActive(false);
for(const [x,z] of [[-0,0],[0,-0],[40,45],[-45,49],[NaN,3],[Infinity,2]]){
 assert(Object.is(sample.terrain(x,z),sample.rawTerrain(x,z)),
  'Unscoped / nonfinite terrain must retain original behavior');
}
assert.equal(sample.stats().active,false);
assert.equal(sample.stats().changesNavigation,false);
assert.equal(sample.stats().changesAuthority,false);
assert.throws(()=>sample.enable('on'),/Invalid W148/);
const body=source.slice(source.indexOf('<script>')+8,source.lastIndexOf('</script>'));
new Function(body); // full original playable JavaScript parser safety floor
console.log('W148 terrain residency contract: PASS (original height parity, bounded growth, original dynamic path, A/B toggle, full inline syntax).');
