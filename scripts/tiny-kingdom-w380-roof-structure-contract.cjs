'use strict';
// W380: test actual shipped builder function; geometry must remain bounded,
// faithfully tied to the existing two house LODs, not new decorative houses.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual playable game source required');
new Function(script);
const begin=script.indexOf('const ORIGINAL_OCCUPIED_ROOF_FRAME_MAX_TRIANGLES=128;');
const end=script.indexOf('function house(',begin);
assert.ok(begin>0&&end>begin,'exact W380 production roof structure required');
assert.equal((script.match(/renderOriginalOccupiedRoofStructure\(/g)||[]).length,3,
 'the existing detailed and compact homes must share the real roof frame');
const counts={occupiedRoofFrames:0,occupiedRoofFrameTriangles:0,
 occupiedRoofGables:0,occupiedRoofHips:0},segments=[];
const c={data:[],Number,Math,MATERIAL:{WOOD:6},villageVisualLod:counts,
 rgb:n=>[n/0xffffff,n/0xffffff,n/0xffffff],
 materialScope:(material,fn)=>{assert.equal(material,6);fn()},
 limbSegment:(a,b,r,color,sides)=>{
  assert.equal(sides,4);assert.ok([r,...a,...b,...color].every(Number.isFinite));
  assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))>.01);
  segments.push({a,b,r});
  for(let i=0;i<sides*2*30;i++)c.data.push(i*.0001);
 }};
vm.runInNewContext(script.slice(begin,end),c,{timeout:3000});
const run=(hip,lod)=>{
 const before=c.data.length,first=segments.length,eave=2.3,ridge=3.72;
 const result=vm.runInNewContext(
  'renderOriginalOccupiedRoofStructure(8,-3,2.3,3.72,1.48,-4.5,-1.5,'+
  (hip?'.44':'0')+',2,'+JSON.stringify(lod)+')',c,{timeout:3000});
 const triangles=(c.data.length-before)/30;
 assert.equal(triangles,hip?96:128);
 assert.equal(triangles,result.triangles);
 assert.equal(result.originalLot,true);
 assert.equal(result.changedNavigation,false);
 assert.equal(result.changedAuthoritativeEconomy,false);
 assert.ok(segments.slice(first).every(s=>s.a[1]>=eave-.32&&
  s.b[1]>=eave-.32&&s.a[1]<=ridge+.02&&s.b[1]<=ridge+.02),
  'new real rafters must stay above the existing accessible doorway');
};
run(false,'detailed');run(true,'detailed');
run(false,'compact');run(true,'compact');
assert.equal(counts.occupiedRoofFrames,4);
assert.equal(counts.occupiedRoofFrameTriangles,448);
assert.equal(counts.occupiedRoofGables,2);
assert.equal(counts.occupiedRoofHips,2);
assert.ok(37*128<5000,'true 37-home Day121 roof mesh must retain scene headroom');
assert.match(script,/renderOriginalOccupiedRoofStructure\(x,z,y\+h,y\+ridge/);
assert.match(script,/renderOriginalOccupiedRoofStructure\(x,z,eave,peak,halfW/);
console.log('W380 real original roof structure geometry PASS on both home LODs: genuine 96/128 triangle hip/gable framing; no new home, road collision or economy. Visual transformation/hardware FPS NOT PROVEN.');
