'use strict';
// W534 exact source-level RED/GREEN for the ACTUAL game's live workday
// occlusion survey. No synthesized FPS or removed real roofs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,
 '../public/tiny-kingdom/index.html'),'utf8');
const entry=source.indexOf('function foregroundSceneProjection(eye,target,roofs){');
const stop=source.indexOf('// G148: real forest',entry);
assert.ok(entry>=0&&stop>entry,'real workday projection source must exist');
const candidate=source.slice(entry,stop).trim();
const START='  // W534 PROJECTED ROOF BROADPHASE START\n';
const END='  // W534 PROJECTED ROOF BROADPHASE END\n';
assert.ok(candidate.includes(START)&&candidate.includes(END),
 'RED on old game: workday viewport still surveys off-screen roofs exactly');
const begin=candidate.indexOf(START),end=candidate.indexOf(END,begin);
assert.ok(end>begin);
const original=candidate.slice(0,begin)+candidate.slice(end+END.length);
// A and B call the same actual real-world opacity and exact clipped-corner
// implementation; the ONLY removed region is the newly inserted broadphase.
const opaque=['home','hall','belfry','granary','craft-district',
 'sanctuary-nave','market-stall','market-cart','receiving-dock',
 'receiving-hall-post','street-shop'];
const solids=['home','hall','belfry','granary','craft-district','sanctuary-nave',
 'street-shop'];
function compile(code,viewport){
 const counters={tests:0,rejected:0,exact:0};
 const context={foregroundProjectionBroadphase:counters,
  WORKDAY_OPAQUE_SCENE_KINDS:new Set(opaque),
  WORKDAY_SOLID_BUILDING_KINDS:new Set(solids),
  terrain:(x,z)=>Math.sin(x*.3+z*.11)*.25,
  physicalCameraProjection:()=>({aspect:viewport.width/viewport.height,
   tanVertical:viewport.width<=520?.96:.65})};
 vm.runInNewContext(code+'; this.project=foregroundSceneProjection;',context);
 return {project:context.project,counters};
}
const rand=(()=>{let x=7152349;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)})();
let checked=0,realisticRejected=0;
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 const reference=compile(original,viewport);
 const current=compile(candidate,viewport);
 for(let seed=0;seed<100;seed++){
  const eye=[(rand()-.5)*24,2+rand()*16,(rand()-.5)*24];
  const target=[(rand()-.5)*12,1+rand()*2,(rand()-.5)*12];
  const roofs=[];
  for(let i=0;i<65;i++){
   // Includes close, crossing, behind, market and far houses; ALL original
   // returned cover/cargo/core/behind counters must be byte-identical.
   const x=(rand()-.5)*170,z=(rand()-.5)*170;
   const half=.08+rand()*4.2,top=.5+rand()*14;
   const kind=opaque[Math.floor(rand()*opaque.length)];
   const row={kind,x,z,rx:half,rz:.08+rand()*5,top};
   if(rand()<.6)row.bottom=-.2+rand()*2;
   if(rand()<.2)row.visualBottom=rand()*1.5;
   roofs.push(row);
  }
  // Real near-eye architecture and actual close market obstacles.
  roofs.push({kind:'home',x:eye[0]+.2,z:eye[2]+.2,
   rx:2.8,rz:2.6,bottom:-.2,top:5.8});
  roofs.push({kind:'market-cart',x:target[0]-.4,z:target[2]+.1,
   rx:.8,rz:1.1,bottom:0,top:1.9});
  const a=reference.project(eye,target,roofs);
  const b=current.project(eye,target,roofs);
  assert.equal(JSON.stringify(b),JSON.stringify(a),
   'No change whatsoever allowed to original physical occlusion scoring: '+
    viewport.width+' seed '+seed);
  checked++;
 }
 realisticRejected+=current.counters.rejected;
 assert.ok(current.counters.exact>0,'real projected on-screen objects retained');
 assert.ok(current.counters.rejected>1000,
  'realistic far-outside roofs must avoid expensive 8-corner calculations');
 assert.equal(current.counters.tests,
  current.counters.rejected+current.counters.exact,
  'every eligible original roof either skips or runs full exact projection');
}
assert.match(source,/getCameraShotProximityAudit,getForegroundProjectionBroadphaseAudit/);
assert.match(source,/drawHomeClusters\(planes,staticDistrictContext\)/);
assert.match(source,/for\(let i=0;i<people\.length;i\+\+\)/);
console.log(JSON.stringify({status:'SOURCE_EQUIVALENCE_PASS',
 scenarios:checked,offscreenExactCornerSurveysAvoided:realisticRejected,
 effect:'physical-camera survey CPU broadphase only',
 frameRate:'NOT MEASURED',nativeHardwareFPS:'NOT MEASURED',
 visualExperienceMilestone:'NOT PROVEN',independentCritics:'UNAVAILABLE'}));
