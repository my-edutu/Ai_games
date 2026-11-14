'use strict';
// W315 source-executed, TEST-FIRST contract for the physical farm -> market
// -> inhabited-home civic VBO dependency. A new remote true cottage must not
// trigger 12 A* route searches or rebuild the unchanged freight market street.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'running original game script required');
new Function(script);
const first=script.indexOf('function civicStreetNearLot(');
const last=script.indexOf('let civicGrowthRefreshes=0;',first);
assert.ok(first>0&&last>first,'production civic render/dependency source exists');
const city=Array.from({length:12},(_,i)=>[i*2-11,8,i%3]);
const people=Array.from({length:12},(_,i)=>({name:'founder'+i}));
let routeCalls=0;
const env={city,people,gpuAvailable:true,
 FARM_MARKET_STREET_ORIGIN:[18,1],FARM_MARKET_STREET_DESTINATION:[0,5],
 MARKET_HOME_STREET_ORIGIN:[0,5],HIGHSTREET_LANES:[[[0,5],[6,5]]],
 civicRoadMemo:{checks:0,topology:null,signature:null,recomputations:0,
  unchangedGrowths:0,changedDependencies:0,freightPoints:0,
  householdPoints:0,adjacentNewHomes:0,remoteGrowthSkips:0,
  priorLots:null,founderHomes:null,roadPaths:null},
 citizenHomeIndex:p=>people.indexOf(p),
 citizenHomeDestination:p=>[6,5],
 routeBetween:(ax,az,bx,bz)=>{routeCalls++;return [[ax,az],[4,5],[bx,bz]]}};
vm.runInNewContext(script.slice(first,last),env,{timeout:1000});
const key=()=>vm.runInNewContext('liveCivicTopologyKey("spring","day")',env,{timeout:1000});
const firstKey=key(),initialSearches=routeCalls;
assert.ok(initialSearches>=2,'initial original freight and household routes planned');
assert.equal(key(),firstKey);
assert.equal(routeCalls,initialSearches,'stable town has no route replanning');
city.push([72,72,2]); // true built home, far from ALL existing roads
assert.equal(key(),firstKey,'remote genuine home must not alter actual civic road mesh');
assert.equal(routeCalls,initialSearches,
 'remote-only construction must skip all navigation rerouting and civic rebuild');
assert.equal(env.civicRoadMemo.remoteGrowthSkips,1,
 'audit must count actual remote-construction render dependency skips');
city.push([4,5,1]); // genuine construction in the market access lane
const changed=key();
assert.notEqual(changed,firstKey,'near-route home must invalidate real civic road VBO');
assert.ok(routeCalls>initialSearches,'actual route-dependent construction is replanned');
const atNear=routeCalls;
city[13]=[72,72,2]; // same-count relocation, must not silently keep civic cache
assert.equal(key(),firstKey,'relocated genuine near-route obstacle invalidates');
assert.ok(routeCalls>atNear,'relocation must examine routes rather than append-skip');
city[0][0]+=1; // founding house moved by save/restore
const changedFounder=key();
assert.notEqual(changedFounder,firstKey,'founder relocation invalidates civic layout');
assert.ok(env.civicRoadMemo.changedDependencies>=3);
assert.equal(env.civicRoadMemo.remoteGrowthSkips,1);
assert.equal(env.civicRoadMemo.checks,6);
const audit=vm.runInNewContext('getCivicRoadDirtyAudit()',env,{timeout:500});
assert.equal(audit.remoteGrowthSkips,1);
assert.equal(audit.cityLots,14,'real original home count remains visible');
assert.equal(audit.certifiedHomeLots,14);
assert.equal(audit.certifiedRoadPaths,3);
assert.ok(!('priorLots' in audit)&&!('roadPaths' in audit),
 'the read-only public audit must not duplicate the entire live home/road graph');
assert.ok(html.includes('getCivicRoadDirtyAudit'),
 'audit exposed to live game for scene-aware profiling');
console.log('W315 contract PASS: original remote growth skips authoritative route searches; near growth, relocation and founding layout still invalidate, no actor/home elision. No hardware/FPS claim.');
