'use strict';
// W265 test-first behavior contract: grown lots invalidate the fixed civic
// freight-road cache even after the first twelve founder houses stay unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
// W266 changed the actual renderer contract: only houses influencing a TRUE
// route or existing founder dependencies invalidate the civic scene. The old
// W265 isolated VM did not supply that new route dependency and crashed.
const begin=src.indexOf('function civicStreetDependencySignature(){');
const end=src.indexOf('let civicGrowthRefreshes=0;',begin);
assert(begin>=0&&end>begin,'W266 genuine routed civic dependency source missing');
const expression=src.slice(begin,end);
const city=Array.from({length:12},(_,i)=>[i*2-11,8,i%3]);
const people=Array.from({length:12},(_,i)=>({name:'founder'+i}));
const context={city,people,gpuAvailable:true,
 FARM_MARKET_STREET_ORIGIN:[18,1],FARM_MARKET_STREET_DESTINATION:[0,5],
 MARKET_HOME_STREET_ORIGIN:[0,5],HIGHSTREET_LANES:[[[0,5],[6,5]]],
 civicRoadMemo:{checks:0,topology:null,signature:null,recomputations:0,
   unchangedGrowths:0,changedDependencies:0,freightPoints:0,
   householdPoints:0,adjacentNewHomes:0},
 citizenHomeIndex:p=>people.indexOf(p)%city.length,
 citizenHomeDestination:p=>[6,5],
 routeBetween:(ax,az,bx,bz)=>[[ax,az],[4,5],[bx,bz]],
 civicStreetNearLot:(lot,paths)=>Math.hypot(lot[0]-4,lot[1]-5)<6};
vm.runInNewContext(expression,context,{timeout:500});
const key=(climate='spring',light='day')=>
 vm.runInNewContext('liveCivicTopologyKey('+JSON.stringify(climate)+','+
  JSON.stringify(light)+')',context,{timeout:500});
const founding=key();
assert.equal(key(),founding);
city.push([70,70,2]);
assert.equal(key(),founding,'distant real home must NOT rebuild the farm/market civic mesh');
const oldBuilds=context.civicRoadMemo.recomputations;
assert.ok(oldBuilds>=1,'initial genuine founder civic routes were inspected');
assert.equal(context.civicRoadMemo.remoteGrowthSkips,1,
 'verified distant home is still rendered independently but avoids redundant civic routing');
city[12]=[4,5,1];
const grown=key();
assert.notEqual(grown,founding,'new real home NEAR the actual route must invalidate civic VBO');
city[12]=[2,5,1];
assert.notEqual(key(),grown,'same-count relocated in-route home must invalidate');
city[12]=[4,5,1];
assert.equal(key(),grown,'identical route dependency permits cached civic buffer');
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
