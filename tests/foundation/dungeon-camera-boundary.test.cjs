'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath=path.resolve(__dirname,'../../public/ai-dungeon/camera-boundary-plan.js');
async function policy(){
 const source=fs.readFileSync(modulePath,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}

test('dungeon camera keeps the established cinematic framing in the central rooms',async()=>{
 const {planBoundaryCamera}=await policy();
 const shot=planBoundaryCamera({x:0,z:0},19,[5.45,9.05,6.2]);
 assert.deepEqual(shot.position,{x:5.45,y:9.05,z:6.2});
 assert.deepEqual(shot.turn,{x:0,z:0});
 assert.deepEqual(shot.look,{x:0,z:0});
});
test('positive east/south edge pulls a real camera inward instead of behind the dungeon void',async()=>{
 const {planBoundaryCamera}=await policy();
 const shot=planBoundaryCamera({x:8,z:8},19,[5.45,9.05,6.2]);
 assert.ok(shot.position.x<shot.look.x,'east-edge camera must face inward');
 assert.ok(shot.position.z<shot.look.z,'south-edge camera must face inward');
 assert.deepEqual(shot.turn,{x:1,z:1});
 assert.equal(shot.position.y,9.05);
 assert.ok(Math.abs(shot.position.x)<=8.35+1e-9);
 assert.ok(Math.abs(shot.position.z)<=8.35+1e-9);
});
test('negative edges and near-boundary interpolation remain inside playable map without discontinuous flipping',async()=>{
 const {planBoundaryCamera}=await policy();
 const view={x:-8,z:-8};
 const left=planBoundaryCamera(view,19,[5.45,9.05,6.2]);
 assert.ok(left.position.x>view.x&&left.position.z>view.z,'negative-edge shot must look in from interior');
 let previous=null;
 for(let x=0;x<=9;x+=.25){
  const p=planBoundaryCamera({x,z:1},19,[5.45,9.05,6.2]);
  assert.ok(p.position.x>=-8.35-1e-9&&p.position.x<=8.35+1e-9,'no off-map rig');
  assert.ok(p.position.z>=-8.35-1e-9&&p.position.z<=8.35+1e-9,'no off-map rig');
  if(previous!==null)assert.ok(Math.abs(p.position.x-previous)<1.3,'rig should orbit smoothly across one-quarter tile');
  previous=p.position.x;
 }
});
test('actual side-quarter camera offsets point inward from either world boundary, never into empty black space',async()=>{
 const {planBoundaryCamera}=await policy();
 for(const [x,z,dx,dz] of [[8,0,-5,2],[-8,0,-5,2],[0,8,2,-5],[0,-8,2,-5],[8,-8,-5,-5]]){
  const shot=planBoundaryCamera({x,z},19,[dx,8.65,dz]);
  assert.ok(Math.abs(shot.position.x)<=8.35+1e-9);
  assert.ok(Math.abs(shot.position.z)<=8.35+1e-9);
  if(x===8&&dx<0)assert.ok(shot.position.x<x,'negative camera x already views inside east boundary');
  if(x===-8&&dx<0)assert.ok(shot.position.x>x,'negative x at west boundary must turn back toward interior');
  if(z===8&&dz<0)assert.ok(shot.position.z<z,'negative z already views inside south boundary');
  if(z===-8&&dz<0)assert.ok(shot.position.z>z,'negative z at north boundary must turn back toward interior');
 }
});
test('presentation camera planner handles map size, mobile zoom and bad data with finite bounded output',async()=>{
 const {planBoundaryCamera}=await policy();
 const shallow=planBoundaryCamera({x:6,z:5},13,[9,10,10]);
 assert.ok(Math.abs(shallow.position.x)<=5.35+1e-9);
 assert.ok(Math.abs(shallow.position.z)<=5.35+1e-9);
 const safe=planBoundaryCamera({x:NaN,z:Infinity},19,[Infinity,-12,NaN]);
 assert.ok(Object.values(safe.position).every(Number.isFinite));
 assert.ok(safe.position.y>=3);
 const target={x:7,z:8},offsets=[5,9,5],before=JSON.stringify([target,offsets]);
 planBoundaryCamera(target,19,offsets);
 assert.equal(JSON.stringify([target,offsets]),before,'view planner must not mutate its authority inputs');
});
