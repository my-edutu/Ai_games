'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=n=>{const p=[];for(let z=0;p.length<n;z++)for(let x=0;x<28&&p.length<n;x++)p.push({x:(z%2?27-x:x)-13.5,z:z-7.5});return p;};
const options={detail:'high',reducedMotion:true,runToken:'t4-bounded-upload',time:1,direction:{x:1,z:0}};
const setup=async()=>{const [THREE,{createSerpent}]=await Promise.all([import('three'),import('../../public/snake-stream/serpent.mjs')]);return createSerpent(THREE);};
test('T4 native 44+ body first GPU storage is bounded without removing any high-detail triangles',async()=>{
 const s=await setup();try{
  assert.equal(s.stats().bufferBytes,589824,'initial storage must cover 512 rings, not 8192');
  s.update([path(44)],options);
  const t=s.stats(),g=s.group.getObjectByName('Continuous sculpted serpent body').geometry;
  assert.equal(t.bodyCapacityRings,512);assert.equal(t.bodyReallocations,0);
  assert.ok(t.bodyRings>=300);assert.equal(g.drawRange.count,t.bodyTriangles*3);
  assert.equal(g.getAttribute('position').count,512*21);
 }finally{s.dispose();}
});
test('T4 real 260-body high-detail expansion replaces/disposes GPU geometry, retaining portal/restart',async()=>{
 const s=await setup();try{
  s.update([path(44)],options);
  const mesh=s.group.getObjectByName('Continuous sculpted serpent body'),old=mesh.geometry;
  let retired=0;old.addEventListener('dispose',()=>retired++);
  s.update([path(260)],options);
  const t=s.stats();assert.equal(t.bodyCapacityRings,2048);assert.equal(t.bufferBytes,2359296);
  assert.equal(t.bodyReallocations,2);assert.equal(retired,1);
  assert.notEqual(mesh.geometry,old);assert.ok(t.bodyRings>1800);
  assert.equal(mesh.geometry.drawRange.count,t.bodyTriangles*3);
  const a=path(44),b=path(48).map(p=>({x:p.x+28,z:p.z+30}));
  const frozen=JSON.stringify([a,b]);s.update([a,b],options);
  assert.equal(s.stats().paths,2);assert.ok(s.stats().bodyTriangles*3<s.stats().bodyRings*120);
  s.update([],{...options,runToken:'recovery'});assert.equal(mesh.geometry.drawRange.count,0);
  s.update([a],{...options,runToken:'restart'});assert.equal(s.stats().paths,1);
  assert.equal(JSON.stringify([a,b]),frozen);assert.equal(s.stats().geometries>0,true);
 }finally{s.dispose();assert.equal(s.stats().geometries,0);}
});
