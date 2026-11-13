'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/foreground-sightline-plan.js'))).toString('base64'));
function warning(){
 const runtime=DungeonRuntime.create('gauntlet-corpus-v1-0');
 for(let i=0;i<200;i++){const snapshot=runtime.step();if(snapshot.bossWarning?.cells?.length)return snapshot;}
 throw Error('Real authority did not warn');
}
test('original Warden warning physical geometry clears ONLY verified authoritative danger rays',async()=>{
 const {planWardenWarningSightlinePoints,planForegroundWarningClearance}=await load();
 const snapshot=warning();const original=JSON.stringify(snapshot.bossWarning);
 const points=planWardenWarningSightlinePoints(snapshot.bossWarning,snapshot.map.length);
 assert.equal(points.length,snapshot.bossWarning.cells.length);
 assert.ok(points.length>12&&points.length<=32);
 assert.ok(points.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 const p=points[0],camera=Object.freeze({x:p.x+5,y:4,z:p.z+1});
 const opaque=Object.freeze([p.x+2.45,.15,p.z+.35,p.x+2.8,3,p.z+.6]);
 const behind=Object.freeze([p.x-2.5,.15,p.z-.6,p.x-2.2,3,p.z-.3]);
 assert.equal(planForegroundWarningClearance(opaque,points,camera),true,
  'front arch must recede for actual Warden warning tiles');
 assert.equal(planForegroundWarningClearance(behind,[p],camera),false,
  'a prop behind the warning is not a camera obstacle');
 assert.equal(planForegroundWarningClearance(opaque,[],camera),false);
 assert.equal(planForegroundWarningClearance(opaque,Array(33).fill(p),camera),false,
  'unbounded fabricated hazard arrays fail closed');
 assert.equal(planForegroundWarningClearance(opaque,points,{x:NaN,y:2,z:0}),false);
 assert.equal(JSON.stringify(snapshot.bossWarning),original,'no simulation state mutation');
});
test('a source Three.js foreground arch retreats and restores without altering the encounter',async()=>{
 const THREE=await import('three');
 const {planWardenWarningSightlinePoints,planForegroundWarningClearance}=await load();
 const recession=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/foreground-recession.js'))).toString('base64'));
 const s=warning(),points=planWardenWarningSightlinePoints(s.bossWarning,s.map.length),p=points[0];
 const camera=new THREE.PerspectiveCamera(55,.6,.05,100);camera.position.set(p.x+5,4,p.z+1);
 const group=new THREE.Group();const arch=new THREE.Mesh(new THREE.BoxGeometry(.35,2.85,.25),new THREE.MeshStandardMaterial());
 arch.position.set(p.x+2.6,1.5,p.z+.48);group.add(arch);group.updateMatrixWorld(true);
 const aabb=new THREE.Box3().setFromObject(group),box=[aabb.min.x,aabb.min.y,aabb.min.z,aabb.max.x,aabb.max.y,aabb.max.z];
 assert.equal(planForegroundWarningClearance(box,points,camera.position),true);
 const initialY=group.position.y;
 recession.applyForegroundRecession(group,true,.05,true,box);
 assert.equal(group.visible,false,'reduced motion hides blocking setpiece without flash');
 assert.ok(group.position.y<initialY);
 recession.applyForegroundRecession(group,false,.05,true,box);
 assert.equal(group.visible,true);assert.equal(group.position.y,initialY);
 assert.equal(s.bossWarning.cells.length,points.length);
});
