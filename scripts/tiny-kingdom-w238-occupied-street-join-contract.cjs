'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function inhabitedStreetFootway(');
const end=html.indexOf('function getInhabitedFootwayAudit(',start);
const plannerStart=html.indexOf('function planInhabitedStreetAccess(');
const plannerEnd=html.indexOf('// W174:',plannerStart);
assert(start>0&&end>start&&plannerStart>0&&plannerEnd>plannerStart,
 'original resident footway and existing collision-aware street planner must exist');
const body=html.slice(start,end);
assert.match(body,/planInhabitedStreetAccess\(/,
 'house frontage must use physical multisegment walkability planner, not untested line to road');
assert.match(body,/materialScope\(MATERIAL.ROAD/,
 'the joined doorstep must have a continuous terrain-following earth course under the stone slabs');
assert.match(body,/materialScope\(MATERIAL.STONE/,
 'individual raised, upward-facing stone slabs must visibly meet the original road');
const planner=new Function(html.slice(plannerStart,plannerEnd)+';return planInhabitedStreetAccess;')();
const open=()=>true,axisClear=(a,b)=>Math.abs(a[0]-b[0])<1e-7||Math.abs(a[1]-b[1])<1e-7;
const bend=planner([2,5,0],[[[5,0],[5,2]]],open,axisClear);
assert(bend&&bend.bends===1&&bend.path.length===4,
 'one original home must navigate an existing right-angle street connection around a blocked diagonal');
assert.equal(planner([2,5,0],[[[5,0],[5,2]]],open,()=>false),null,
 'a blocked house path cannot invent a traversable road');
function render(clear=()=>true){
 const stream=[],faces=[];
 const counters={inhabitedFootwayLots:0,inhabitedFootwaySlabs:0,
  inhabitedFootwayTriangles:0,inhabitedFootwayRejected:0,inhabitedFootwayBends:0};
 const quad=(a,b,c,d)=>{
  for(const p of [a,b,c,d])assert(p.every(Number.isFinite),
   'actual pavement vertices must be finite and terrain grounded');
  const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
  const ny=ab[2]*ac[0]-ab[0]*ac[2];
  assert(ny>1e-7,'all road and raised limestone must face the WebGL camera, not point downward');
  faces.push([a,b,c,d]);
  for(let i=0;i<60;i++)stream.push(0);
 };
 const draw=new Function('data','terrain','rgb','materialScope','MATERIAL',
   'quad','villageVisualLod','HIGHSTREET_LANES','walkable','clearSegment',
   'planInhabitedStreetAccess',body+';return inhabitedStreetFootway;')(
  stream,()=>0,n=>[n,n,n],(_mat,fn)=>fn(),{STONE:5,ROAD:3},
  quad,counters,[[[5,0],[5,2]]],open,clear,planner);
 return {count:draw(2,5,0,0),counters,faces,stream};
}
const linked=render(axisClear);
assert(linked.count>=6&&linked.count<=60,'bounded road geometry for original bending footway');
assert.equal(linked.count,linked.stream.length/30,'valid complete triangle stream');
assert.equal(linked.counters.inhabitedFootwayLots,1);
assert.equal(linked.counters.inhabitedFootwayBends,1,'auditable real bent original street access');
assert(linked.counters.inhabitedFootwaySlabs>0);
const failed=render(()=>false);
assert.equal(failed.count,0);
assert.equal(failed.counters.inhabitedFootwayRejected,1);
assert.equal(failed.stream.length,0,'unreachable house must not create fictional walkable paving');
console.log('W238 original occupied-house bending stone access and true upward terrain geometry contract PASS; browser, Day120, 390px and GPU remain separate.');
