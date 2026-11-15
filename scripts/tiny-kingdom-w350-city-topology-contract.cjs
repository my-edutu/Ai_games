'use strict';
// W350: red-first exact live topology reuse for A* and populated-house visuals.
// Same authoritative lots produce byte-identical signatures across the old
// algorithms and the retained one. Construction and SAME-COUNT restores are
// mandatory invalidations. These tests do NOT claim hardware FPS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function src(name){
 const begin=html.indexOf('function '+name+'(');
 const end=html.indexOf('\nfunction ',begin+20);
 assert.ok(begin>=0&&end>begin,'missing genuine '+name);
 return html.slice(begin,end);
}
for(const [label,pattern] of [
 ['construction',/city\.push\(construction\.site\);invalidateHomeNavigationIndex\(\)/],
 ['start',/city\.splice\(12\);invalidateHomeNavigationIndex\(\)/],
 ['restore',/city\.splice\(0,city\.length,\.\.\.q\.city\);invalidateHomeNavigationIndex\(\)/]
])assert.match(html,pattern,label+' requires real topology invalidation');
const topology=src('originalCityTopologySignatures');
const invalidate=src('invalidateOriginalCityTopologySignatures');
const home=src('homePartitionLiveSignature');
const navInvalidate=src('invalidateHomeNavigationIndex');
const navEnsure=src('ensureNavNodeGrid');
assert.match(home,/originalCityTopologySignatures\(\)\.homes/);
assert.match(navEnsure,/originalCityTopologySignatures\(\)\.nav/);
assert.match(navInvalidate,/invalidateOriginalCityTopologySignatures\(\)/);
assert.doesNotMatch(topology,/Math\.random|state\s*[.=]|people\.(?:push|splice)|city\.(?:push|splice)/);
const context={Uint8Array,Map};
vm.createContext(context);
const setup=`
 let city=[[0,0,0],[3,4,1],[6,7,2]];
 let homeNavigationBuckets=new Map(),homeNavigationLength=3;
 let navNodeGrid=new Uint8Array(100),navNodeGridTopology=null;
 let navNodeGridOccupied=0,navNodeGridInvalidations=0;
 let homePartitionTopologyScans=0,heading=0;
 const HOME_STATIC_GEOMETRY_KEY_VERSION="w350-original";
 function invalidateNavSegmentMemo(){}
 function currentHomeDetailAnchor(){return {mode:"inspection",x:5,z:6,
   heading,viewRadius:14,horizontalTan:.82};}
`;
const ops=`
 this.ops={
  nav:()=>originalCityTopologySignatures().nav,
  houses:()=>originalCityTopologySignatures().homes,
  view:()=>homePartitionLiveSignature(),
  probe:()=>ensureNavNodeGrid(),
  build:()=>originalCityTopologySignatures.builds||0,
  reuse:()=>originalCityTopologySignatures.reuses||0,
  invalidations:()=>originalCityTopologySignatures.invalidations||0,
  grid:()=>Array.from(navNodeGrid),
  fill:v=>navNodeGrid.fill(v),
  add:lot=>{city.push(lot);invalidateHomeNavigationIndex()},
  restore:lots=>{city.splice(0,city.length,...lots);invalidateHomeNavigationIndex()},
  turn:value=>{heading=value},
  key:()=>navNodeGridTopology
 };
`;
vm.runInContext(setup+[topology,invalidate,home,navInvalidate,navEnsure].join('\n')+ops,
 context,{timeout:5000});
const op=context.ops;
assert.equal(op.nav(),'0,0,0;3,4,1;6,7,2');
assert.equal(op.houses(),'0:0:0:0;1:3:4:1;2:6:7:2');
const view0=op.view();
assert.match(view0,/0:0:0:0;1:3:4:1;2:6:7:2$/);
for(let i=0;i<512;i++)op.probe();
assert.equal(op.build(),1,'512 genuine A* cell reads must share one topology');
assert.ok(op.reuse()>512,'hot path must not rejoin every house each time');
op.fill(2);op.add([8,9,3]);op.probe();
assert.equal(op.key(),'0,0,0;3,4,1;6,7,2;8,9,3');
assert.equal(op.build(),2);
assert.ok(op.grid().every(x=>x===0),'new real house invalidates walkability');
op.restore([[0,0,0],[3,4,1],[6,7,9],[8,9,3]]);op.probe();
assert.equal(op.key(),'0,0,0;3,4,1;6,7,9;8,9,3');
assert.equal(op.build(),3,'same-count restored town gets its own exact key');
op.turn(1.3);
assert.notEqual(op.view(),view0,'different actual observer heading must replan view');
assert.equal(op.build(),3,'camera movement cannot rebuild world topology');
assert.ok(op.invalidations()>=2);
console.log('W350 original farm-market-home topology caching PASS: 512 reused route probes, exact live growth and same-count restore, no authority change; physical FPS NOT MEASURED');
