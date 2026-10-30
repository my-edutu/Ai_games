'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const THREE=require('three');
function setup(){const browser={THREE};for(const file of ['scenery3d.js','mechanisms3d.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../public/ai-escape-room',file),'utf8'),{window:browser});const materials={};for(const name of ['dark','metal','brass','cyan','accent','success','danger','wood','paper','ink','stone','glass'])materials[name]=new THREE.MeshStandardMaterial({color:0x888888});return{api:browser.EscapeMechanisms,scenery:browser.EscapeScenery,ctx:{materials}};}
function object(kind,solved=false){return Object.freeze({id:'public-object',mechanismKind:kind,inspected:true,solved,placement:Object.freeze({variant:3,surface:'left-wall',slot:2})});}

test('every mechanism has a distinct physical artifact and isolated articulation',()=>{const {api,ctx}=setup();assert.equal(api.supported.length,8);for(const kind of api.supported){const state=object(kind);const before=JSON.stringify(state);const group=api.build(kind,state,ctx);assert.ok(group.userData.staticRoot?.isGroup,kind+' static root');assert.equal(group.userData.preserveArticulation,true);assert.ok(group.userData.animatedParts.length>0,kind+' moving parts');assert.ok(group.userData.animatedParts.length<=3,kind+' animation bound');assert.equal(JSON.stringify(state),before);assert.ok(new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).length()>.6,kind+' physical dimensions');}});

test('all solved poses mechanically differ from closed poses and finish immediately in reduced motion',()=>{const {api,ctx}=setup();for(const kind of api.supported){const closed=api.build(kind,object(kind,false),ctx),opened=api.build(kind,object(kind,true),ctx);const signature=g=>g.userData.animatedParts.map(p=>({position:p.position.toArray(),rotation:p.rotation.toArray(),scale:p.scale.toArray()}));api.animate(closed,16,0,true);api.animate(opened,16,0,true);assert.notDeepEqual(signature(opened),signature(closed),kind+' solved physical change');opened.userData.motion.progress=0;api.animate(opened,16,200,true);assert.equal(opened.userData.motion.progress,1);}});

test('copied presentation motion interpolates to authoritative solved state without changing object data',()=>{const {api,ctx}=setup();const model=object('final-vault',true),group=api.build('final-vault',model,ctx);group.userData.motion.progress=0;api.animate(group,16,16,false);assert.ok(group.userData.motion.progress>0&&group.userData.motion.progress<1);for(let i=0;i<120;i++)api.animate(group,16,i*16,false);assert.ok(group.userData.motion.progress>.999);assert.equal(model.solved,true);});

test('public clue, tool, and decoy geometry accepts absent optional placement safely',()=>{const {api,ctx}=setup();for(const fn of ['makeClue','makeTool','makeDecoy']){const group=api[fn](Object.freeze({id:'public-item',inspected:false,solved:false}),ctx);assert.ok(group.isGroup);assert.ok(group.children.length>0);}});

test('vault pinions counter-rotate at the drive ratio and remain deterministic across presentation clocks',()=>{
  const {api,ctx}=setup(),state=object('final-vault'),before=JSON.stringify(state),first=api.build('final-vault',state,ctx),second=api.build('final-vault',state,ctx);
  assert.ok(first.userData.parts.gearInstances?.isInstancedMesh,'the drive has bounded moving pinions');
  const angle=(mesh,index)=>{const matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);return Math.atan2(matrix.elements[1],matrix.elements[0]);};
  const wrap=value=>Math.atan2(Math.sin(value),Math.cos(value)),closed=Array.from({length:first.userData.parts.gearInstances.count},(_,i)=>angle(first.userData.parts.gearInstances,i));
  for(const progress of [0,.2,.5,.8,1]){
    for(const [group,clock] of [[first,32],[second,987654]]){group.userData.motion.progress=progress;api.animate(group,0,clock,false);}
    const parts=first.userData.parts;assert.equal(parts.boltInstances.count,8);
    for(let i=0;i<parts.gearInstances.count;i++)assert.ok(Math.abs(wrap(angle(parts.gearInstances,i)-closed[i]+parts.wheel.rotation.z*2))<1e-6,'a pinion stays meshed with the central drive');
    assert.deepEqual(Array.from(parts.gearInstances.instanceMatrix.array),Array.from(second.userData.parts.gearInstances.instanceMatrix.array));
    assert.deepEqual(Array.from(parts.linkInstances.instanceMatrix.array),Array.from(second.userData.parts.linkInstances.instanceMatrix.array));
  }
  assert.equal(JSON.stringify(state),before);
});

test('vault drawbars stay attached to their fixed pivot and moving bolt through the full opening travel',()=>{
  const {api,ctx}=setup(),group=api.build('final-vault',object('final-vault'),ctx),parts=group.userData.parts;
  assert.ok(parts.linkInstances?.isInstancedMesh,'the bolt linkage has bounded articulation');
  const matrix=new THREE.Matrix4(),boltMatrix=new THREE.Matrix4(),jointMatrix=new THREE.Matrix4();
  const pivotPositions=[];
  for(const progress of [0,.25,.5,.75,1]){
    group.userData.motion.progress=progress;api.animate(group,0,0,false);
    for(let i=0;i<8;i++){
      parts.linkInstances.getMatrixAt(i,matrix);parts.boltInstances.getMatrixAt(i,boltMatrix);
      const fixedEnd=new THREE.Vector3(0,-.5,0).applyMatrix4(matrix),movingEnd=new THREE.Vector3(0,.5,0).applyMatrix4(matrix);
      const boltTail=new THREE.Vector3(0,-.08,0).applyMatrix4(boltMatrix).add(new THREE.Vector3(0,0,.05));
      if(progress===0)pivotPositions.push(fixedEnd.clone());
      assert.ok(fixedEnd.distanceTo(pivotPositions[i])<1e-6,'the anchor does not slide with the bolt');
      assert.ok(movingEnd.distanceTo(boltTail)<1e-6,'the drawbar stays on the bolt tail');
      for(const [joint,end] of [[i*2,fixedEnd],[i*2+1,movingEnd]]){parts.jointInstances.getMatrixAt(joint,jointMatrix);assert.ok(new THREE.Vector3().setFromMatrixPosition(jointMatrix).distanceTo(end)<1e-6,'the pin remains at the connection');}
    }
  }
});

test('batched vault resources stay inside the room allocation and reuse shared materials on rebuild',()=>{
  const {api,scenery,ctx}=setup(),shared=new Set(Object.values(ctx.materials)),baseline=new Map();
  for(let build=0;build<4;build++){
    const solved=build%2===1,group=api.build('final-vault',object('final-vault',solved),ctx);scenery.merge(group.userData.staticRoot);
    let draws=0,triangles=0,instances=0;group.traverse(node=>{if(!node.isMesh)return;draws++;triangles+=(node.geometry.index?.count??node.geometry.attributes.position.count)/3*(node.isInstancedMesh?node.count:1);if(node.isInstancedMesh)instances+=node.count;assert.ok(shared.has(node.material),'a rebuild uses the room-owned materials');});
    assert.ok(draws<20,'less than ten additional submissions over the prior ten-batch vault');
    assert.ok(triangles<27048,'less than 15,000 extra triangles over the prior 12,048-triangle vault');
    const size=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());assert.ok(size.x<1.43&&size.y<1.43,'the existing wall placement still encloses the vault');
    const budget={draws,triangles,instances};if(baseline.has(solved))assert.deepEqual(budget,baseline.get(solved));else baseline.set(solved,budget);
    group.traverse(node=>{if(node.isInstancedMesh)node.dispose();if(node.userData.dynamicBatch)node.geometry.dispose();});group.clear();
  }
});
