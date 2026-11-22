'use strict';
// Phase 1 rendering spine. This is a source-extracted geometry correctness
// test, never an FPS, gameplay footage, or visual quality acceptance verdict.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
const marker='function clipSoftwareNearEye(';
function loadClipper(){
 const start=html.indexOf(marker);
 assert.ok(start>=0,'RED: renderer must clip physical triangles crossing camera near-eye plane');
 const end=html.indexOf('\nfunction canvasTriangleOutsideViewport',start);
 assert.ok(end>start,'clip helper must stay in the real standalone renderer');
 const code=html.slice(start,end);
 return vm.runInNewContext(code+'\nclipSoftwareNearEye',{Math});
}
test('front, behind and intersecting faces preserve real geometry and winding',()=>{
 const clip=loadClipper();
 const A=[0,0,1],B=[.6,0,1],C=[0,.5,-1];
 const oneBehind=clip(A,B,C);
 assert.equal(oneBehind.length,4,'one behind-eye corner must yield two visible faces');
 assert.ok(oneBehind.includes(A)&&oneBehind.includes(B));
 const twoBehind=clip(A,[.6,0,-1],[0,.5,-1]);
 assert.equal(twoBehind.length,3,'two behind-eye corners leave one visible face');
 assert.equal(clip(A,B,[0,.5,1]).length,3);
 assert.equal(clip([0,0,-1],[.6,0,-1],[0,.5,-1]).length,0);
 for(const polygon of [oneBehind,twoBehind]){
  for(const vertex of polygon){
   assert.equal(vertex.length,3);
   assert.ok(vertex.every(Number.isFinite),'no near-eye NaN/Infinity');
   assert.ok(vertex[2]>=.05-1e-10,'every surviving vertex is safely forward');
  }
 }
 assert.ok(oneBehind.some(v=>Math.abs(v[2]-.05)<1e-10));
});
test('clipping is used for actual emitted software world faces, not a decorative probe',()=>{
 assert.ok(html.includes('clipSoftwareNearEye('));
 const draw=html.slice(html.indexOf('drawArrays:()=>{'),
  html.indexOf('fallbackStats.draws++',html.indexOf('drawArrays:()=>{')));
 assert.match(draw,/clipSoftwareNearEye\(/);
 assert.match(draw,/softwareInvW\[count\*3\]/);
 assert.match(draw,/staticProjected\+\+/);
 assert.match(draw,/reservePainter\(count\+1\)/);
 assert.match(draw,/fallbackStats\.clippedNear/);
});
test('seeded crossing segments never silently discard full real source triangle',()=>{
 const clip=loadClipper();
 for(let seed=1;seed<=1200;seed++){
  const A=[(seed%37)*.014,(seed%17)*-.021,.05+seed*.0003],
   B=[.3+seed*.0001,-.28,.1+(seed%19)*.035],
   C=[-.3,.25,-.005-(seed%31)*.01];
  const output=clip(A,B,C);
  assert.equal(output.length,4);
  assert.ok(output.includes(A)&&output.includes(B));
  for(const p of output)assert.ok(p.every(Number.isFinite));
 }
});
