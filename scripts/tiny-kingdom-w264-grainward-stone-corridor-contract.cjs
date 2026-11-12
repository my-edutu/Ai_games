'use strict';
// W264 original freight corridor: no tall continuous palisade across real people.
// The genuine town/navigation/authority remain untouched while the old
// decorative high fence becomes low, double-course, terrain-bound masonry.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=source.indexOf('const FARM_STREET_WEAVE_MAX_PANELS=');
const end=source.indexOf('// W128: one bounded, low-height ROAD VERGE',start);
assert(start>=0&&end>start,'Original retained granary-to-market corridor unavailable');
const impl=source.slice(start,end);
const quads=[],terrain=(x,z)=>.15*Math.sin(x*.18)*Math.cos(z*.27);
const env={Math,terrain,MATERIAL:{STONE:1,ROAD:2},data:[],
 rgb:hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255],
 roadsideEcotoneClear:()=>true,materialScope:(_m,callback)=>callback(),
 quad:(a,b,c,d,col)=>{
   for(const v of [a,b,c,d])assert(v.length===3&&v.every(Number.isFinite));
   assert(col.length===3&&col.every(Number.isFinite));
   quads.push([a,b,c,d,col]);
   for(const v of [a,b,c,a,c,d])
    env.data.push(v[0],v[1],v[2],0,1,0,...col,0);
 }};
vm.createContext(env);
vm.runInContext(impl,env);
const original=[14,-16],destination=[-12,-15];
const oldWorld=JSON.stringify([original,destination]);
const result=vm.runInContext(
 'renderFarmServiceStreetBoundary([[14,-16],[-12,-15]]);farmStreetWeaveStats',env);
assert(result.panels>=20&&result.panels<=38,'Actual road corridor disappeared');
assert.equal(result.triangles,result.panels*20,
 'New stone roadside must stay within the SAME strict geometric budget');
assert.equal(result.triangles,env.data.length/30);
assert(result.triangles<=760,'Grown town must not exceed old corridor budget');
assert.equal(result.stoneCourses,result.panels*2,'Physical stone base courses missing');
assert.equal(result.drainageGutters,result.panels,'Grounded drainage seam missing');
assert.equal(result.posts,0,'Tall wooden posts must not obstruct real workers');
assert.equal(result.wovenBands,0,'Tall continuous fence rails must be removed');
assert(result.maxHeight>0&&result.maxHeight<=.28,
 'Low roadside architectural edge must remain below workers knees');
assert.equal(quads.length,result.panels*10,'Every original road section has ten complete stone surfaces');
for(const q of quads)for(const v of q.slice(0,4)){
 const rise=v[1]-terrain(v[0],v[2]);
 assert(rise>=-.015&&rise<=.29,'Stone course left the actual terrain surface');
}
assert.equal(JSON.stringify([original,destination]),oldWorld);
assert.equal(result.authorityChanged,false);
assert.equal(result.liveRouteOnly,true);
assert(!/\b(?:people\.push|city\.push|state\.[\w$]+\s*=|Math\.random\s*\()/.test(impl),
 'Original generated road geometry must never fabricate simulation state');
assert.match(source,/renderRealRoadsideMicroterrain\(points\);\s*renderFarmServiceStreetBoundary\(points\);/);
console.log('W264 PASS exact true-road low masonry / visibility / geometry budget; actual WebGL visual verdict not implied');
