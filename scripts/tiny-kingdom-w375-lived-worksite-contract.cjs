#!/usr/bin/env node
'use strict';
// W375 original inhabited farm-to-market vertical slice: render-only
// shape/contact/simulation boundaries. These tests are a technical safety
// floor, NEVER a look/feel/play or hardware-performance acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const beginScript=html.indexOf('<script>'),endScript=html.lastIndexOf('</script>');
assert(beginScript>0&&endScript>beginScript);
const js=html.slice(beginScript+8,endScript);
new vm.Script(js,{filename:'tiny-kingdom-w375-actual-game.js'});
function section(start,end){
 const a=js.indexOf(start),b=js.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing complete original function '+start);
 return js.slice(a,b);
}
const geometry=section('function authenticGrainHeadProfile(','function ripeningField(');
const metrics=[];
const scene={Math,Number,data:[],farmScene:{stalks:0,stalkTriangles:0,seedHeads:0},
 terrain:(x,z)=>.015*x-.004*z,
 biomeHash:i=>((Math.sin(i*53.17)*43758.5453)%1+1)%1,
 rgb:hex=>Array.isArray(hex)?hex:[((hex>>16)&255)/255,((hex>>8)&255)/255,(hex&255)/255],
 tri:(a,b,c,col)=>emit([a,b,c],col),
 quad:(a,b,c,d,col)=>{emit([a,b,c],col);emit([a,c,d],col);}
};
function emit(vertices,col){
 assert.equal(vertices.length,3);
 for(const vertex of vertices){
  assert(Array.isArray(vertex)&&vertex.length===3);
  assert(vertex.every(Number.isFinite),'nonfinite crop vertex');
  for(const n of vertex)scene.data.push(n);
  for(let k=0;k<7;k++)scene.data.push(k===3?col[0]:k===4?col[1]:k===5?col[2]:0);
 }
 metrics.push(vertices.map(v=>v.slice()));
}
vm.createContext(scene);
vm.runInContext(geometry+'\nthis.buildStalk=farmStalk;this.blade=rootedLanceolateGrainBlade;',scene);
const counts={};
for(const season of [0,1,2,3])for(const far of [false,true]){
 scene.data=[];metrics.length=0;scene.farmScene.stalks=0;
 scene.farmScene.seedHeads=0;scene.farmScene.stalkTriangles=0;
 scene.buildStalk(20.2,.5,9,season,far);
 const expected=season===3?4:far?12:20;
 const got=scene.data.length/30;
 assert.equal(got,expected,'Original 4/12/20 triangle budget');
 assert.equal(scene.farmScene.stalks,1);
 assert.equal(scene.farmScene.seedHeads,season===3?0:1);
 assert.equal(scene.farmScene.stalkTriangles,expected);
 assert(scene.data.every(Number.isFinite));
 counts[season+'-'+(far?'far':'near')]=got;
}
// The connected curved blade is truly an open physical leaf and the near
// variant has the opposite-facing underside, not duplicate same-wound quads.
metrics.length=0;
scene.blade([20,.44,.3],.23,-1,[.4,.8],[.4,.5,.3],[.3,.3,.2],true,57);
assert.equal(metrics.length,4);
const root=[20,.44,.3],tip=metrics[1][1];
assert(tip[1]<root[1],'wheat blade tip droops below planted attachment');
assert(metrics[0].some(vertex=>vertex[1]>root[1]+.04),
 'blade shoulders must rise before their drooping tips');
assert(Math.hypot(tip[0]-root[0],tip[2]-root[2])>.17);
assert.equal(JSON.stringify(metrics[1][0]),JSON.stringify(metrics[3][2]),
 'the reverse blade face must share the exact original vertices');
const prior=JSON.stringify(metrics);
metrics.length=0;
scene.blade([20,.44,.3],.23,-1,[.4,.8],[.4,.5,.3],[.3,.3,.2],true,57);
assert.equal(JSON.stringify(metrics),prior,'render shape must be deterministic');
// Soil is an anchored continuous crown with exactly the old three/four
// quads per segment. The worker can still move through every original field.
const soil=section('function farmSoil(','// W55 original inhabited grain field:');
const quads=[],soilScene={Math,Number,MATERIAL:{ROAD:1},farmScene:{rows:0},
 terrain:(x,z)=>.015*x-.004*z,
 rgb:scene.rgb,farmEarthWearTone:(col)=>col,
 materialScope:(material,cb)=>cb(),
 quad:(a,b,c,d,col)=>{assert([a,b,c,d].every(v=>v.every(Number.isFinite)));quads.push([a,b,c,d]);}};
vm.createContext(soilScene);
vm.runInContext(soil+'\nthis.paint=farmSoil;',soilScene);
soilScene.paint(16.45,24.65,-1.62,-1.13,0);
const segments=Math.ceil((24.65-16.45)/.7);
assert.equal(quads.length,segments*3+Math.ceil(segments/3));
assert.equal(soilScene.farmScene.rows,1);
// Consecutive segment edges of the first original soil swath meet exactly.
assert.deepEqual(Array.from(quads[0][3]),Array.from(quads[4][0]));
assert.deepEqual(Array.from(quads[0][2]),Array.from(quads[4][1]));
const field=section('function ripeningField(','// W64 read-only CPU witness');
const harvested={Math,Number,MATERIAL:{FOLIAGE:4},farmStalk:()=>{harvested.stems++;},
 farmSoil:()=>{harvested.rows++;},biomeHash:scene.biomeHash,
 materialScope:(material,cb)=>cb(),stems:0,rows:0};
vm.createContext(harvested);
vm.runInContext(field+'\nthis.plant=ripeningField;',harvested);
let rowsObserved=0;
harvested.plant([16.45,24.65,-1.62,3.64,11,14],0,1,false,
 ()=>rowsObserved++);
assert.equal(harvested.stems,2*11*14);
assert.equal(harvested.rows,11);
assert.equal(rowsObserved,11);
const view=section('function planCitizenCamera(','function isReadableClosedHomeShot(');
assert.match(view,/realFarmWorkSightline\(shot\.eye,citizen,hands\)/);
assert.match(view,/cameraInsideField\?65:0/);
assert.match(view,/crop\.cropWristBlockers===0/);
assert.match(view,/shot\.eyeCollision\?\.clear/);
assert.doesNotMatch(field+soil+geometry,/Math\.random\s*\(|people\.push\s*\(|state\.food\s*=/);
console.log('W375 original field geometry / real farmer camera source contracts PASS:',
 JSON.stringify({triangleCounts:counts,rows:harvested.rows,stems:harvested.stems,
 soilFaces:quads.length,authorityModified:false,
 realDesktopMobileFrames:'NOT PROVEN',referenceLookFeelPlay:'NOT PROVEN'}));
