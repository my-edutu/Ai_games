'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function functionBody(name) {
  const first=html.indexOf('function '+name+'(');
  const last=html.indexOf('\nfunction ',first+20);
  assert(first>=0&&last>first,'Missing current genuine '+name+' renderer');
  return html.slice(first,last);
}
const house=functionBody('compactHouse');
const street=functionBody('medievalStreetMorphology');
// W166: the real facade now uses the shared profile function. Extract that
// unchanged production helper instead of testing an obsolete broken scope.
const profile=functionBody('houseVisualProfile');
// W217 original compact cottages now use real hipped-roof geometry.
const roof=functionBody('isHippedHouseRoof');
assert.match(house,/box\(x,y\+jettySill,z,w\+\.28,h-jettySill,d\+\.36,plaster\)/,
 'Complete upper-room volume, not a front-only facade');
assert.doesNotMatch(street,/box\(x,y\+1\.55,front-\.06,w\*\.82,h-1\.62,\.24,plaster\)/,
 'Old false paper-thin upper room must not return');
function sample(style,variant) {
 const src=`
  const COMPACT_HOUSE_HEIGHTS=[2.08,2.94,2.47,3.16],
   COMPACT_HOUSE_PITCHES=[1.18,1.70,1.47,1.82],
   COMPACT_ROOF_PALETTES=Array.from({length:4},()=>[0x77604d,0x9b7860,0x836b57,0xa88e73]);
  let data=[],boxes=[];
  let villageVisualLod=new Proxy({compactRoofPaletteCounts:[0,0,0,0]},
    {get:(o,k)=>o[k]??0,set:(o,k,v)=>(o[k]=v,true)});
  let streetMorphologyStats={homes:0,highStreetFronts:0,upperJetties:0,
   crossGables:0,shopCanopies:0,framedUpperCasements:0,
   physicalSignboards:0,totalTriangles:0,archetypes:[0,0,0,0]};
  const MATERIAL={STONE:1,PLASTER:2,ROOF:3,WOOD:4,WINDOW_GLOW:5},
   gpuAvailable=true,terrain=()=>0,rgb=x=>[x/1e7,x/1e7,x/1e7],
   materialScope=(_material,fn)=>fn(),
   box=(x,y,z,w,h,d)=>{boxes.push({x,y,z,w,h,d});data.length+=360},
   quad=()=>{data.length+=60},tri=()=>{data.length+=30},
   cylinder=()=>{data.length+=360},cone=()=>{data.length+=300},
   limbSegment=()=>{data.length+=240},ellipsoid=()=>{data.length+=360},
   compactBurgageFrontage=()=>{},compactHouseArchetype=()=>${style},
   originalClayRoofCourses=(_x,_a,_b,_c,_d,_e,_colors,courses)=>{
    data.length+=courses*2*4*30;villageVisualLod.compactRoofCourses+=courses*2;
    villageVisualLod.compactRoofTiles+=courses*2*4
   },
   // W217 real four-plane hip roofs have the SAME bounded 24-triangle
   // course count in this isolated upper-room fixture. Full real WebGL
   // roof geometry is checked separately; do not omit live roof branch.
   originalHipRoofCourses=(_x,_a,_b,_c,_d,_e,_inset,_colors,courses,_variant,compact)=>{
    if(!compact)throw Error('W98 only inspects true original compact cottages');
    data.length+=courses*2*4*30;
    villageVisualLod.compactRoofCourses+=courses*2;
    villageVisualLod.compactRoofTiles+=courses*2*4;
   };
  ${profile}
  ${roof}
  ${house}
  ${street}
  compactHouse(3,-7,${variant});
  medievalStreetMorphology(3,-7,${variant},5,true);
  return {boxes,triangles:data.length/30,rooms:streetMorphologyStats.upperJetties};
 `;
 return new Function(src)();
}
for(let style=0;style<4;style++)for(let variant=0;variant<3;variant++){
 const v=sample(style,variant),height=[2.08,2.94,2.47,3.16][style];
 const rooms=v.boxes.filter(b=>b.y===1.55&&Math.abs(b.h-(height-1.55))<1e-8);
 assert.equal(rooms.length,height>2.5?1:0,'Upper room presence, style '+style);
 if(height>2.5){
  assert(rooms[0].d>2.45,'Real deep upper living space');
  assert(rooms[0].w>2.55,'Jettied sideways wall mass');
  assert.equal(v.rooms,1,'Actual original morphology still receives joinery');
 }
 assert(v.triangles<600,'Bounded per-cottage geometry');
}
console.log('W98 real upper-room structure across all 12 style/variant cases: PASS (isolated geometry only; not WebGL)');
