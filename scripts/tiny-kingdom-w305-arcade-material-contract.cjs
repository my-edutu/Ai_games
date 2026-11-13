'use strict';
// W305 test-first contract: real four-stall market sheds must be coherent
// limewashed roof undersides and sawn joinery, not hovering timber tubes.
// Geometry only: never a LOOK/FEEL/PLAY or physical-FPS acceptance claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(js,'actual playable original game source');
new vm.Script(js,{filename:'w305-real-game.js'});
const start=html.indexOf('function grainwardMarketArcadePlan(){');
const end=html.indexOf('// W258 ONE authentic medieval district',start);
assert(start>0&&end>start,'original linked-market roof ownership absent');
const helper=html.slice(start,end);
const stalls=[{x:-5.4,z:2.25},{x:4.45,z:2.95},
 {x:4.30,z:8.50},{x:-5.75,z:8.70}];
const data=[],faces=[],stats={},materials={ROOF:1,WOOD:2,PLASTER:3};
const ctx={Math,data,MARKET_STALLS:stalls,marketQuarterStats:stats,
 MATERIAL:materials,rgb:n=>n,terrain:()=>.25,
 marketStallProfile:i=>({eave:[4.20,3.98,3.25,3.04][i]}),
 materialScope:(m,fn)=>{ctx.material=m;fn();},
 quad:(a,b,c,d,color)=>{
  for(const v of [a,b,c,d])assert(v.every(Number.isFinite),'nonfinite arcade vertex');
  faces.push({material:ctx.material,points:[a,b,c,d]});
  data.length+=60;
 },
 limbSegment:()=>{throw Error('W305 RED: old cylindrical timber scaffolding still rendered');}
};
vm.createContext(ctx);
vm.runInContext(helper+'\ngrainwardTradeArcade();',ctx);
assert.equal(stats.grainwardArcadeSpans,2,'both original market side arcades stay present');
assert.equal(stats.grainwardArcadeNoPosts,true,'no new posts across real workers');
assert.equal(stats.arcadeRoofUndersides,8,'four actual sheltered plaster roof bays per side');
assert.equal(stats.arcadeTimberFaces,10,'two long fascia and three restrained ties per arcade');
assert.equal(stats.arcadeScaffoldBeams,0,'bulky hanging octagonal beam scaffolds eliminated');
assert.equal(faces.filter(f=>f.material===materials.PLASTER).length,8);
assert.equal(faces.filter(f=>f.material===materials.ROOF).length,8);
assert.equal(faces.filter(f=>f.material===materials.WOOD).length,10);
assert(stats.grainwardArcadeTriangles>=40&&stats.grainwardArcadeTriangles<=80,
 'bounded full original arcades reduce real triangle workload');
for(const face of faces)
 for(const point of face.points)
  assert(point[1]>2.30,'no soffit, brace or frontage masks human-height market aisle');
assert(!/people\.push\(|city\.push\(|state\.(food|wood|gold)\s*[+\-*/]?=|Math\.random\(/.test(helper),
 'original delivery, navigation, economy and seeded replay remain authoritative');
console.log('W305 geometry PASS: two original sheltered side arcades, complete lime soffits, low-cost sawn oak joinery, open real freight aisle; actual visual A/B NOT PROVEN');
