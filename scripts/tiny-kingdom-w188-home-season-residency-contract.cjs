'use strict';
// W188 test-first: actual production functions, not simulated economic events.
// This deliberately RED-fails on W187 because the original WebGL house and
// dirty-cell keys contain climateKey and cannot retain immutable town geometry.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const original=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(match=>match[1].includes('function homeClusterGroups('));
assert(original,'real game script must exist');
new vm.Script(original[1]);
const identity=html.match(/const HOME_STATIC_GEOMETRY_KEY_VERSION='([a-z0-9-]+)';/);
assert(identity,'RED: season-invariant house identity is missing');
const marker=identity[0];
// The original G188 constant was correctly version-bumped when W217 roofs
// changed geometry. Reject missing identity, not legitimate art revisions.
const fragment=(a,b)=>{
 const start=html.indexOf(a),end=html.indexOf(b,start);
 assert(start>=0&&end>start,'Missing authentic production block '+a);
 return html.slice(start,end);
};
const groups=fragment('function homeClusterGroups(fullHomes,climateKey){',
 '// Prefer reclaiming the GPU allocation');
const takeStale=fragment('function takeStaleHomeClusterForGrowth(',
 '// W179 Phase 1');
const buildLot=fragment('function renderCachedHomeLot(',
 '// W78: real new cottages');
const context=vm.createContext({
 HOME_CLUSTER_EDGE:16,HOME_CLUSTER_FLOAT_BUDGET:4600000,
 city:[[4,4,0],[6,5,1],[20,4,2]],
 homeClusterCache:new Map(),homeClusterCachedFloats:300,
 homeClusterReservedFloats:500,homeClusterReusedGpuHandles:0
});
vm.runInContext(marker+'\n'+groups+'\n'+takeStale,context,{timeout:2000});
const run=code=>vm.runInContext(code,context,{timeout:2000});
const seasons=['spring','summer','autumn','winter'];
const originals=seasons.map(s=>run('homeClusterGroups(new Set([0,2]),'+JSON.stringify(s)+')'));
const keys=o=>o.map(e=>e.key).join(';');
for(const result of originals){
 assert.equal(keys(result),keys(originals[0]),
  'the same real occupied houses must reuse the same GPU partitions through every season');
 assert(result.every(entry=>entry.key.startsWith(identity[1]+'|')));
 assert.equal(result.reduce((n,e)=>n+e.homes.length,0),3,
  'never hide an authoritative house for performance');
}
const winter=originals[3];
context.homeClusterCache.set(winter[0].key,{
 key:winter[0].key,cell:winter[0].cell,mesh:new Float32Array(300),
 buffer:{original:1},capacityFloats:500,homes:winter[0].homes.length
});
run('city.push([8,6,3])');
const withNewHome=run('homeClusterGroups(new Set([0,2]),"spring")');
assert.notEqual(withNewHome[0].key,winter[0].key,
 'genuine construction must invalidate the changed physical cell');
assert.equal(withNewHome[1].key,winter[1].key,
 'unchanged neighboring houses must not be rebuilt');
context.newGroup=withNewHome[0];
const recovered=run('takeStaleHomeClusterForGrowth(newGroup,"spring",320)');
assert.equal(recovered.buffer.original,1,
 'construction may recycle the obsolete same-cell GPU buffer across seasons');
assert.equal(context.homeClusterCache.size,0);
assert.equal(run('homeClusterReusedGpuHandles'),1);
assert.equal(run('homeClusterCachedFloats'),0);
assert.equal(run('homeClusterReservedFloats'),0);

// Exercise the actual original per-home mesh cache function across all four
// seasons with a deterministic, materially tagged triangle source. No mocked
// authoritative citizens, jobs, receipts or clock are required.
const lot={
 gpuAvailable:true,currentMaterial:7,data:[],
 houseGeometryCache:new Map(),houseGeometryCachedFloats:0,
 houseGeometryBuilds:0,houseGeometryReuses:0,houseGeometryEvictions:0,
 HOUSE_GEOMETRY_CACHE_FLOAT_BUDGET:4000,HOUSE_GEOMETRY_CACHE_MAX_ENTRIES:10,
 villageVisualLod:{compactHomes:0,detailedHomes:0},
 houseCountersSnapshot:()=>({}),houseCountersDelta:()=>({}),
 applyHouseCountersDelta:()=>{},
 medievalStreetMorphology:()=>{},renderLivedBurgageSideMateriality:()=>{},
 // W188 models cache preservation, not W258 art: separately source-executed.
 grainwardOriginalTallStorey:()=>{},
 grainwardInhabitedLot:()=>{},inhabitedStreetFootway:()=>{},
 grainwardMasonryFacing:()=>{},cottageDetails:()=>{}
};
lot.compactHouse=(x,z,k)=>{
 for(let i=0;i<30;i++)lot.data.push(i%10===9?7:x*.1+z*.01+k+i*.001);
};
lot.house=lot.compactHouse;
lot.appendCivicCachedVertices=vertices=>{for(const value of vertices)lot.data.push(value)};
const lotContext=vm.createContext(lot);
vm.runInContext(marker+'\n'+buildLot,lotContext,{timeout:2000});
const meshFrames=[];
for(const season of seasons){
 lot.data=[];
 vm.runInContext('renderCachedHomeLot(4,4,0,0,true,'+JSON.stringify(season)+')',
  lotContext,{timeout:2000});
 meshFrames.push(lot.data.slice());
}
// The first fresh source is a JS Number array; WebGL and the retained
// resident mesh both store Float32 vertices. Compare their ACTUAL uploaded
// Float32 representation rather than falsely requiring double precision.
const canonical=Array.from(new Float32Array(meshFrames[0]));
for(const frame of meshFrames){
 assert.deepEqual(Array.from(new Float32Array(frame)),canonical,
  'original uploaded WebGL vertex/material tags must remain bit-identical');
 assert.equal(frame.length,30,'no hidden original vertices');
}
assert.equal(lot.houseGeometryBuilds,1,'only the first season generates original house mesh');
assert.equal(lot.houseGeometryReuses,3,'subsequent real seasons reuse one original mesh');
assert.equal(lot.houseGeometryCachedFloats,30);
lot.data=[];
vm.runInContext('renderCachedHomeLot(8,4,0,1,true,"spring")',lotContext);
assert.equal(lot.houseGeometryBuilds,2,'genuinely new physical house needs new mesh');
assert(lot.houseGeometryCachedFloats<=lot.HOUSE_GEOMETRY_CACHE_FLOAT_BUDGET);
assert.match(html,/seasonInvariantGeometry:true/);
assert.match(html,/throw Error\('W76 dropped a real inhabited cottage'\)/);
console.log('W188 source PASS: original GL home meshes and dirty GPU cells persist across 4 seasons; construction invalidates only true changed cell, exact vertex/material tags, finite cache, zero hidden homes. Live FPS and A/B NOT PROVEN.');
