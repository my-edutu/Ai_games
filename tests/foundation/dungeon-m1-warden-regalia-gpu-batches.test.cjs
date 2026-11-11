'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planner=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/warden-regalia-plan.js'),'utf8')).toString('base64'));

test('all original Warden pieces retain exact appearance and native mounting while sharing a bounded GPU batch per shape and finish',async()=>{
 const {planWardenRegalia,planWardenRegaliaBone,planWardenRegaliaDrawGroups}=await planner();
 const all=planWardenRegalia('warden'),initial=JSON.stringify(all);
 const groups=planWardenRegaliaDrawGroups('warden');
 assert.equal(groups.length,8,'22 nonhorn pieces should fit eight original-geometry/material batches');
 assert.ok(Object.isFrozen(groups)&&groups.every(g=>Object.isFrozen(g)&&Object.isFrozen(g.parts)));
 assert.deepEqual(groups.flatMap(g=>g.parts.map(p=>p.id)).sort(),all.filter(p=>p.shape!=='horn').map(p=>p.id).sort());
 assert.equal(new Set(groups.map(g=>g.shape+'|'+g.finish)).size,groups.length);
 assert.ok(groups.every(g=>g.parts.every(p=>p.shape===g.shape&&p.finish===g.finish&&planWardenRegaliaBone(p.id))));
 assert.equal(JSON.stringify(all),initial,'grouping must not mutate original authored appearances');
 assert.deepEqual(planWardenRegaliaDrawGroups('cultist'),[]);
 assert.equal(planWardenRegaliaDrawGroups('warden'),groups,'no per-frame plan allocations');
});

test('actual Warden skinned regalia uses retained dynamic instances and tracks genuine bone deltas after the full-body mixer',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/planWardenRegaliaDrawGroups/);
 assert.match(model,/new THREE\.InstancedMesh\(forms\[batch\.shape\],finishes\[batch\.finish\],batch\.parts\.length\)/);
 assert.match(model,/THREE\.DynamicDrawUsage/);
 assert.match(model,/actor\.wardenRegaliaInstances/);
 assert.match(model,/part\.bone\.matrixWorld/);
 assert.match(model,/part\.bindBoneInverse/);
 assert.match(model,/part\.restGroupWorld/);
 assert.match(model,/\.setMatrixAt\(part\.index,/);
 assert.match(model,/\.instanceMatrix\.needsUpdate=true/);
 assert.match(model,/syncWardenNativeRegalia\(actor\)/);
 assert.match(model,/actor\.assetGeometries/);
});

test('real THREE source sculpture preserves every original bone-space pose across a moving Warden phase without extra mesh draws',async()=>{
 const THREE=require('three');
 const {planWardenRegalia,planWardenRegaliaBone,planWardenRegaliaDrawGroups}=await planner();
 const chapter=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/warden-chapter-plan.js'),'utf8')).toString('base64'));
 const text=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const extract=(start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
 const actions=new Function('THREE','planWardenRegalia','planWardenRegaliaBone','planWardenRegaliaDrawGroups','planWardenRegaliaMotion',
  extract('function addWardenRegalia(actor){','// Class-identifying original accessories')+'\n'+
  extract('function syncWardenNativeRegalia(actor){','function stageWardenChapterRegalia(actor,reducedMotion){')+'\n'+
  extract('function stageWardenChapterRegalia(actor,reducedMotion){','/**\n * True positive-HP-loss recoil')+'\n'+
  'return {addWardenRegalia,syncWardenNativeRegalia,stageWardenChapterRegalia};')(
   THREE,planWardenRegalia,planWardenRegaliaBone,planWardenRegaliaDrawGroups,chapter.planWardenRegaliaMotion);
 const parent=new THREE.Group(),visualPivot=new THREE.Group(),assetRoot=new THREE.Group();
 parent.position.set(2.2,0,-1.8);parent.rotation.y=.3;parent.add(visualPivot,assetRoot);
 const bones={head:new THREE.Bone(),chest:new THREE.Bone(),pelvis:new THREE.Bone(),leftUpperArm:new THREE.Bone(),rightUpperArm:new THREE.Bone()};
 const offsets={head:[0,1.70,0],chest:[0,1.17,0],pelvis:[0,.62,0],leftUpperArm:[-.42,1.45,0],rightUpperArm:[.42,1.45,0]};
 for(const [key,bone] of Object.entries(bones)) {bone.position.set(...offsets[key]);assetRoot.add(bone);}
 const actor={u:{kind:'warden'},visualPivot,assetRoot,rigCranial:{bone:bones.head},
 rigMeleeBones:[{part:'spine',bone:bones.chest}],rigPelvisBone:bones.pelvis,
 rigUpperArms:[{side:'left',bone:bones.leftUpperArm},{side:'right',bone:bones.rightUpperArm}],
 assetMaterials:[],assetGeometries:[],wardenPhase:'SENTINEL',wardenExposure:{weight:0}};
 parent.updateWorldMatrix(true,true);
 actions.addWardenRegalia(actor);
 assert.equal(actor.regaliaParts,24);
 assert.equal(actor.wardenRegaliaInstances.length,8);
 assert.equal(actor.wardenRegaliaRiggedParts,24);
 const meshes=[];actor.wardenRegaliaRoot.traverse(o=>{if(o.isMesh)meshes.push(o)});
 assert.equal(meshes.length,10,'eight original batch draws and two original sculpted horns');
 const rest={};for(const [key,bone] of Object.entries(bones))rest[key]=bone.matrixWorld.clone();
 // Drive a real source rig through five different native joints, including
 // hand-to-chest and shoulder movement. The authoritative Warden phase only
 // changes the original sculpture pose; it does not create a fake new mesh.
 bones.head.rotation.z=.11;bones.chest.rotation.x=.17;bones.pelvis.rotation.y=-.12;
 bones.leftUpperArm.rotation.z=-.26;bones.rightUpperArm.rotation.z=.19;
 parent.updateWorldMatrix(true,true);
 actor.wardenPhase='RUPTURE';actor.wardenCharge={charge:.7};actor.wardenExposure={weight:.5};
 actions.stageWardenChapterRegalia(actor,false);
 actions.syncWardenNativeRegalia(actor);
 let compared=0;
 for(const batch of actor.wardenRegaliaInstances){
  for(const part of batch.parts){
   const observedLocal=new THREE.Matrix4();batch.mesh.getMatrixAt(part.index,observedLocal);
   const observedWorld=actor.wardenRegaliaRoot.matrixWorld.clone().multiply(observedLocal);
   const joint=planWardenRegaliaBone(part.id);
   const originalWorld=actor.wardenRegaliaRoot.matrixWorld.clone().multiply(part.pose.matrix);
   const expectedWorld=bones[joint].matrixWorld.clone().multiply(rest[joint].clone().invert()).multiply(originalWorld);
   for(let i=0;i<16;i++)assert.ok(Math.abs(observedWorld.elements[i]-expectedWorld.elements[i])<1e-5,
    part.id+' matrix '+i+' native bone and original phase morph should match');
   compared++;
  }
  assert.equal(batch.mesh.count,batch.parts.length);
  assert.equal(batch.mesh.instanceMatrix.usage,THREE.DynamicDrawUsage);
 }
 assert.equal(compared,22);
 for(const m of actor.assetMaterials)m.dispose();for(const g of actor.assetGeometries)g.dispose();
});
