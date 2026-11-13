#!/usr/bin/env node
'use strict';
// W303 Phase 1: source-executed connected real grain-district reconstruction.
// This is a source/geometry safety floor, NOT moving A/B or hardware FPS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/i)?.[1];
assert(game,'real original game script missing');
new vm.Script(game,{filename:'tiny-kingdom-authentic-game.js'});
const part=(a,b)=>{
 const i=game.indexOf(a),j=game.indexOf(b,i+a.length);
 assert(i>=0&&j>i,'missing original district source '+a);
 return game.slice(i,j);
};
const courtSource=part('function fieldThreshingOpenAisleProfile(',
 '\\nfunction farmstead(');
const court={
 Math,Number,data:[],FARM_MARKET_STREET_ORIGIN:[29,-7.6],
 FIELD_TO_GRANARY_GATE:[21.7,-2.45],
 MATERIAL:{STONE:1,WOOD:2,ROOF:3,PLASTER:4},
 terrain:(x,z)=>.01*x+.006*z,walkable:()=>true,
 rgb:value=>typeof value==='number'?[.5,.43,.34]:value,
 materialScope:(_,f)=>f(),
 upwardRoadQuad:()=>{for(let i=0;i<60;i++)court.data.push(0)},
 quad:()=>{for(let i=0;i<60;i++)court.data.push(0)},
 tri:()=>{for(let i=0;i<30;i++)court.data.push(0)},
 box:()=>{for(let i=0;i<360;i++)court.data.push(0)},
 limbSegment:()=>{for(let i=0;i<240;i++)court.data.push(0)}
};
vm.createContext(court);
vm.runInContext(courtSource+
 '\\nthis.courtPlan=fieldThreshingOpenAisleProfile;'+
 '\\nthis.courtBuild=grainwardFieldThreshingCourt;',court);
const p=court.courtPlan(16.4,20.2),a=court.courtBuild();
assert(p.openAisleMetres>=1.8,'do not roof over actual farmer work corridor');
assert.equal(a.posts,6,'all original structural load posts retained');
assert.equal(a.flagstones,30,'real terrain-following court remains complete');
assert.equal(a.roofPanels,18,'both existing roof wings and open centre retained');
assert.equal(a.slattedCourses,14,'original real ventilation slats retained');
assert.equal(a.wattleSideBays,4,'replace open scaffolding with four physical wattle bays');
assert.equal(a.stoneWallFootings,4,'grounded stone foundation per bay');
assert.equal(a.openToSky,true,'honest original worksite remains in daylight');
assert(a.triangles>200&&a.triangles<=850,'bounded original static civic VBO');
assert.equal(a.extraBuffers,0);
assert.equal(a.changesNavigation,false);
assert.equal(a.changesAuthority,false);
assert(court.data.every(Number.isFinite),'finite original worksite geometry');

const fruitSource=part('function originalOrchardFruit(',
 '\\nfunction orchardTrees(');
let triangles=0;
const fruit={Math,data:[],tri:(a,b,c)=>{triangles++;
 for(const v of [a,b,c]){
  assert(Array.isArray(v)&&v.length===3);
  assert(v.every(Number.isFinite));
 }}};
vm.createContext(fruit);vm.runInContext(fruitSource+
 '\\nthis.fruit=originalOrchardFruit;',fruit);
assert.equal(fruit.fruit(-28,2,6,.105,[.9,.7,.3]),8);
assert.equal(triangles,8,'8 real 3D faces per tiny orchard fruit');
const orchard=part('function orchardTrees(', '\\n// W127E:');
assert(orchard.includes('originalOrchardFruit('),
 'all physically existing orchard fruit now use the bounded solid 3D mesh');
assert(!orchard.includes('ellipsoid(fx,'),
 'old 48-triangle per 10cm sphere must not remain');
assert.match(orchard,/orchardVisualStats\.fruit\+\+/,
 'original 45 spring fruit objects still counted');
const originalGranary=part('function granaryArchitecture(', 
 '\\n// W02 connected food economy:');
assert.match(originalGranary,/MATERIAL\.PLASTER[\s\S]*?box\(x,y\+2\.43,z,w\+\.18,\.80,d\+\.14/,
 'original raised granary upper storey must be limewashed full 3D mass');
assert.match(originalGranary,/audit\.upperGrainWindows\+\+/,
 'upper grain loft has honest recessed glazed openings, not timber box');
assert.match(originalGranary,/audit\.realDoorUnblocked=walkable/,
 'true field-to-loaded-courier doorway preserved');
assert(!/people\.push\(|state\.food\s*[+\-]=|city\.push\(|Math\.random\(/.test(
 courtSource+fruitSource+orchard+originalGranary),
 'presentation must not invent citizens, crops, goods or randomness');
console.log('W303 SOURCE PASS: authentic six-post sheltered threshing court, four new stone-and-wattle bays, every original grain fruit, original raised limewashed granary, uninterrupted nav/supply contracts. Running LOOK/FEEL/PLAY, real FPS and long-soak NOT PROVEN.');
