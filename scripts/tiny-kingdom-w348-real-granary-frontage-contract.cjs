'use strict';
// W348 test-first original farm → REAL loaded courier → granary → receiving
// market architecture: render-owned, bounded, walkable, GPU-core-resident.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const code=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(code,'live game script required');
new vm.Script(code,{filename:'real-tiny-kingdom.js'});
const from=code.indexOf('function originalGranaryLoadingFrontage(');
const until=code.indexOf('\nfunction granaryArchitecture()',from);
assert(from>=0&&until>from,'the real granary loading architecture must be present');
const body=code.slice(from,until);
assert.match(code.slice(until,code.indexOf('// W02 connected food economy',until)),
 /audit\.originalLoadingFrontage\s*=\s*originalGranaryLoadingFrontage\(x,z,y,w,d\)/,
 'only the real original granary builder may own the new frontage');
const createScene=(blocked=false)=>{
 const data=[],out={pavers:0,curbs:0,joins:0,boxes:[]}, ctx={
  data,Math,Number,FARM_MARKET_STREET_ORIGIN:[29,-7.6],
  MATERIAL:{WOOD:5,STONE:4,ROAD:3},rgb:n=>[n,n,n],
  terrain:(x,z)=>.02*x-.015*z,
  walkable:(x,z)=>!blocked||Math.abs(x-29)<.5,
  materialScope:(_m,fn)=>fn(),
  box:(x,y,z,w,h,d)=>{assert(w>0&&h>0&&d>0);out.boxes.push({x,y,z,w,h,d});data.push(...Array(360).fill(0));},
  limbSegment:(_a,_b,r)=>{assert(r>0);out.joins++;data.push(...Array(480).fill(0));},
  quad:(a,b,c,d)=>{for(const p of [a,b,c,d])assert(p.every(Number.isFinite));out.pavers++;data.push(...Array(60).fill(0));}
 };
 const result=vm.runInNewContext(body+'\noriginalGranaryLoadingFrontage(29,-5,0,4.5,3.95)',ctx,{timeout:2500});
 assert.equal(result.source,'real-granary-to-market-freight-door-frontage');
 assert.equal(result.inventedStock,0);assert.equal(result.addedActors,0);
 assert.equal(result.changesNavigation,false);assert.equal(result.changesAuthority,false);
 assert.equal(result.retainedCivicCore,true);
 assert.equal(result.triangles,data.length/30);assert(result.triangles<=400);
 assert.equal(result.postBays,2);assert.equal(result.diagonalBraces,4);
 // All timber/curb geometry lies outside the >.97m actual loading aperture.
 assert(out.boxes.filter(b=>b.h>.11).every(b=>Math.abs(b.x-29)-b.w*.5>.5),
  'no added physical timber may seal the authentic grain-store door');
 return {result,scene:out};
};
const passable=createScene(false),partial=createScene(true);
assert.equal(passable.result.pavers,35);
assert.equal(passable.result.curbStones,6);
assert(partial.result.pavers<35,'blocked terrain cannot receive false paving');
assert.equal(partial.result.curbStones,0,'no street-side solids on blocked cells');
assert.equal(partial.result.realCourierOriginPassable,true);
console.log('W348 PASS: actual granary apron and timber bays, unblocked original freight doorway, walkable terrain, bounded resident scene, zero invented economy. Gameplay film and physical FPS NOT PROVEN.');
