'use strict';
// W265 test-first behavior contract: grown lots invalidate the fixed civic
// freight-road cache even after the first twelve founder houses stay unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=src.indexOf('function liveCivicTopologyKey(climate,light){');
const end=src.indexOf('let civicGrowthRefreshes=0;',begin);
assert(begin>=0&&end>begin,'W265 retained civic topology helper missing');
const expression=src.slice(begin,end);
const city=Array.from({length:12},(_,i)=>[i*2-11,8,i%3]);
const context={city,gpuAvailable:true};
vm.runInNewContext(expression,context,{timeout:500});
const key=(climate='spring',light='day')=>
 vm.runInNewContext('liveCivicTopologyKey('+JSON.stringify(climate)+','+
  JSON.stringify(light)+')',context,{timeout:500});
const founding=key();
assert.equal(key(),founding);
city.push([29,-7.5,2]);
const grown=key();
assert.notEqual(grown,founding,'13th real house must invalidate freight-road VBO');
city[12]=[22,6,1];
assert.notEqual(key(),grown,'same-count changed obstacle must invalidate the road');
city[12]=[29,-7.5,2];
assert.equal(key(),grown,'same world topology must retain civic VBO');
assert.notEqual(key('winter'),grown,'seasonal civic variants must be distinct');
context.gpuAvailable=false;
assert.notEqual(key(),grown,'software and GPU content cannot share wrong geometry');
assert.match(src,/if\(civicActiveKey!==liveTopology\)\{/);
assert.match(src,/try\{updateResidentCivicDistrict\(nextTerrainKey,daylightStage\);\}/);
assert.match(src,/finally\{data=originalFrame;currentMaterial=originalMaterial;\}/);
assert.match(src,/freightBoundary:\{\.\.\.farmStreetWeaveStats\}/);
assert.match(src,/roadside:\{\.\.\.roadsideMicroterrainStats\}/);
assert.match(src,/if\(stats\.freightBoundary\)farmStreetWeaveStats=/);
assert.match(src,/if\(stats\.roadside\)roadsideMicroterrainStats=/);
assert(!src.includes("':lots:'+city.slice(0,12).map("),
 'cannot accidentally reuse old founder-only neighborhood key');
console.log('W265 authoritative Day-120 topology / independent civic VBO contract PASS');
