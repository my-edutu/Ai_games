'use strict';
// Actual Three.js instanced guardian geometry and current camera rays;
// safety contract only, NOT perceptual/voting acceptance.
const {test}=require('node:test'), assert=require('node:assert/strict');
const THREE=require('three'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const loaded=Promise.all(['guardian-circuit.mjs','coordinates.mjs'].map(
 f=>import(pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals',f)).href)));
const source=()=>({
 lifecycle:'running',runToken:'same-original-live-guardian',floor:8,tick:440,
 worldWidth:480000,chunkBaseY:2880000,
 player:{x:200000,y:3230000,halfWidth:9000,halfHeight:14000,health:4},
 platforms:[{id:'f8:cap',x:115000,y:3200000,width:249600,height:12000}],
 enemies:[{id:'f8:guardian',kind:'guardian',active:true,x:180000,y:3240000,
  halfHeight:18000,health:1,maxHealth:8}]
});
function testRay(stage,frame,coords){
 const rails=stage.group.getObjectByName('GuardianLockTwinBronzeRails');
 const matrix=new THREE.Matrix4();rails.getMatrixAt(29,matrix);
 const point=new THREE.Vector3().setFromMatrixPosition(matrix);
 const mapped=coords.pointFor(frame.player.x,frame.player.y-frame.player.halfHeight,
   frame.chunkBaseY,frame.worldWidth,25);
 const feet=new THREE.Vector3(mapped.x,mapped.y,mapped.z);
 const torso=feet.clone().add(new THREE.Vector3(0,frame.player.halfHeight/10000,0));
 const back=point.clone().sub(torso).normalize();
 const camera=new THREE.PerspectiveCamera(42,1.6,.1,300);
 assert.ok(point.distanceTo(torso)>2);
 camera.position.copy(point).addScaledVector(back,6);
 camera.lookAt(torso);camera.updateMatrixWorld(true);
 return {rails,feet,camera};
}
test('real gantry blocks a current body ray but original guardian HP lock bolts remain opaque',async t=>{
 const [api,coords]=await loaded,stage=api.createTowerGuardianCircuit(THREE);
 t.after(()=>stage.dispose());const frame=source(),before=JSON.stringify(frame);
 stage.update(frame,{quality:'low'});
 const {rails,feet,camera}=testRay(stage,frame,coords);
 const bolts=stage.group.getObjectByName('GuardianCapSourceLockBolts');
 const boltMaterial=bolts.material;
 const result=stage.protectHeroSightline(frame,camera,feet,{camera:'follow'});
 assert.equal(result.sourceBound,true);
 assert.ok(result.blockedRays>=1,'exact original instanced triangles must block torso');
 assert.equal(result.softened,true);
 assert.equal(rails.material.transparent,true);
 assert.ok(rails.material.opacity<=.25);
 assert.equal(rails.material.depthWrite,false);
 assert.equal(bolts.material,boltMaterial);
 assert.equal(bolts.material.opacity,1);
 assert.equal(JSON.stringify(frame),before,'no source mutation or fabricated defeat');
});
test('incorrect source, spectator view, stale or real guardian death restore solid metal',async t=>{
 const [api,coords]=await loaded,stage=api.createTowerGuardianCircuit(THREE);
 t.after(()=>stage.dispose());const frame=source();stage.update(frame);
 const {rails,feet,camera}=testRay(stage,frame,coords);
 stage.protectHeroSightline(frame,camera,feet,{camera:'follow'});
 assert.equal(rails.material.transparent,true);
 for(const options of [{camera:'overview'}, {camera:'follow',stale:true},
   {camera:'follow',reducedMotion:true}]){
  const veto=stage.protectHeroSightline(frame,camera,feet,options);
  assert.equal(veto.sourceBound,false);
  assert.equal(rails.material.transparent,false);
  assert.equal(rails.material.depthWrite,true);
  stage.protectHeroSightline(frame,camera,feet,{camera:'follow'});
 }
 assert.equal(stage.protectHeroSightline({...frame,tick:441},camera,
   feet,{camera:'follow'}).sourceBound,false);
 assert.equal(rails.material.transparent,false);
 stage.update({...frame,tick:442,enemies:[{...frame.enemies[0],active:false,health:0}]});
 assert.equal(stage.group.visible,false);
 assert.equal(rails.material.transparent,false);
});
test('four physically clear proposed camera rays restore complete gantry and no new shadow draw',async t=>{
 const [api,coords]=await loaded,stage=api.createTowerGuardianCircuit(THREE);
 t.after(()=>stage.dispose());const frame=source();stage.update(frame);
 const {rails,feet,camera}=testRay(stage,frame,coords);
 assert.equal(stage.protectHeroSightline(frame,camera,feet,{camera:'follow'}).softened,true);
 camera.position.copy(feet).add(new THREE.Vector3(0,50,0));
 camera.lookAt(feet);camera.updateMatrixWorld(true);
 let result;
 for(let i=0;i<5;i++)
   result=stage.protectHeroSightline(frame,camera,feet,{camera:'follow'});
 assert.equal(result.blockedRays,0);
 assert.equal(result.softened,false);
 assert.equal(rails.material.transparent,false);
 assert.equal(rails.count,44);
 assert.equal(stage.diagnostics().shadowCastingMeshes,0);
});
