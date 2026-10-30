'use strict';
const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {EscapeRuntime,DEFAULT_ESCAPE_ROOM_CONFIG,parseEscapeRoomConfig,buildEscapeRenderSnapshot}=require('../../dist/games/ai-escape-room/src/index.js');
let THREE;
const fixtures=new Map();

before(async()=>{
  THREE=await import('three');
  for(const puzzleDepth of [11,12]){
    const config=parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,theme:'cipher-vault',difficulty:20,puzzleDepth,objectCount:48,decoyCount:5,hazardCount:2,maxTicks:2400,noProgressTicks:360,intermissionTicks:24});
    const runtime=EscapeRuntime.create({config,seed:'gauntlet-vault-reference-v1',runId:'dynamic-batch-budget',policy:'autonomous'});
    const initial=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),runtime.drainEvents());
    let ready,result;
    while(runtime.state.lifecycle==='running'){
      const step=runtime.step(),frame=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events);
      if(frame.progress.permille===1000&&frame.scene!=='result')ready=frame;
      if(frame.scene==='result')result=frame;
    }
    assert.equal(runtime.state.result.reason,'escape');
    const step=runtime.step(),intermission=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events);
    fixtures.set(puzzleDepth,{initial,ready,result,intermission});
  }
});

function setup(){
  const context=vm.createContext({window:{THREE},console,cancelAnimationFrame(){},removeEventListener(){}});
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','room3d.js']){
    vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../public/ai-escape-room',file),'utf8'),context,{filename:file});
  }
  const Room=context.window.EscapeRoom3D;
  const materials=Object.fromEntries(['dark','metal','brass','cyan','accent','success','danger','wood','paper','ink','stone','glass'].map(name=>[name,new THREE.MeshStandardMaterial({name,transparent:name==='glass',opacity:name==='glass'?.27:1})]));
  function create(state,unbatched=false){
    const room=Object.create(Room.prototype);
    Object.assign(room,{state,geo:new Map(),materials,dynamicRoot:new THREE.Group(),objectWorld:new Map(),staticPropCount:0,mode:'room',reducedMotion:true,scene:new THREE.Scene(),effectBursts:[],frameRequest:0,canvas:{removeEventListener(){}},resizeObserver:{disconnect(){}},archivist:{dispose(){}},renderer:{dispose(){},forceContextLoss(){}}});
    room.scene.add(room.dynamicRoot);
    // The reference executes the existing builders without the new consolidation.
    if(unbatched)room.batchStableObjects=()=>{};
    room.rebuildDynamic();
    return room;
  }
  return {Room,create,materials};
}

function renderStats(root){
  const materials={};let submissions=0,triangles=0;
  root.traverseVisible(node=>{
    if(!node.isMesh)return;
    assert.ok(!Array.isArray(node.material));
    if(!node.material.visible)return;
    const count=(node.geometry.index?.count??node.geometry.attributes.position.count)/3*(node.isInstancedMesh?node.count:1);
    const passes=node.material.transparent&&node.material.side===THREE.DoubleSide&&!node.material.forceSinglePass?2:1;
    submissions+=passes;triangles+=count*passes;
    materials[node.material.name]=(materials[node.material.name]||0)+count;
  });
  return {submissions,triangles,materials};
}

function stableMeshes(room){
  const meshes=[];
  for(const group of room.dynamicRoot.children){
    if(!group.userData.objectId||group.userData.exitHinge||group.userData.mechanismKind==='final-vault')continue;
    const root=group.userData.staticRoot||group;
    root.traverse(node=>{if(node.isMesh&&!node.isInstancedMesh&&!Array.isArray(node.material)&&!node.material.transparent)meshes.push(node);});
  }
  return meshes;
}

function worldAttributes(meshes){
  const byMaterial=new Map();
  for(const mesh of meshes){
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    if(!byMaterial.has(mesh.material.name))byMaterial.set(mesh.material.name,{position:[],normal:[],uv:[]});
    const target=byMaterial.get(mesh.material.name);
    for(const key of ['position','normal','uv']){
      const values=geometry.getAttribute(key).array;
      for(let i=0;i<values.length;i++)target[key].push(values[i]);
    }
    geometry.dispose();
  }
  return byMaterial;
}

function closeArray(actual,expected,label){
  assert.equal(actual.length,expected.length,label+' length');
  let maxError=0;
  for(let i=0;i<expected.length;i++)maxError=Math.max(maxError,Math.abs(actual[i]-expected[i]));
  assert.ok(maxError<2e-6,`${label}: maximum coordinate error ${maxError}`);
}

test('real eleven and twelve puzzle rooms reserve draw-call headroom for scenery, actor, hazards and effects',()=>{
  const {create}=setup();
  for(const depth of [11,12]){
    const room=create(fixtures.get(depth).result);
    room.animateMechanisms(16,0);
    const stats=renderStats(room.dynamicRoot);
    assert.equal(room.dynamicStats.visibleMechanisms,depth);
    // Keep ninety of the existing 190 total submissions for the other scene passes.
    assert.ok(stats.submissions<100,`${depth} puzzles submit ${stats.submissions} dynamic color passes`);
  }
});

test('shared submissions preserve every stable world-space position, normal, UV and material',()=>{
  const {create}=setup();
  for(const state of [fixtures.get(12).initial,fixtures.get(12).ready,fixtures.get(12).result]){
    const immutableBefore=JSON.stringify(state),reference=create(state,true),room=create(state);
    reference.animateMechanisms(16,0);room.animateMechanisms(16,0);
    reference.dynamicRoot.updateMatrixWorld(true);room.dynamicRoot.updateMatrixWorld(true);
    const root=room.dynamicRoot.children.find(group=>group.userData.sharedStaticBatch);
    assert.ok(root,'stable objects have shared render submissions');
    const expected=worldAttributes(stableMeshes(reference)),actual=worldAttributes(root.children);
    assert.deepEqual([...actual.keys()],[...expected.keys()]);
    for(const [material,attributes] of expected)for(const key of ['position','normal','uv'])closeArray(actual.get(material)[key],attributes[key],material+' '+key);
    const before=renderStats(reference.dynamicRoot),after=renderStats(room.dynamicRoot);
    assert.equal(after.triangles,before.triangles,'the complete rendered triangle count is unchanged');
    assert.deepEqual(after.materials,before.materials,'no surfaces move between material families');
    assert.equal(JSON.stringify(state),immutableBefore,'the public snapshot remains immutable');
  }
});

test('inspection retains the original complete object bounds and picking uses the retained meshes',()=>{
  const {create}=setup(),state=fixtures.get(12).result,reference=create(state,true),room=create(state);
  reference.animateMechanisms(16,0);room.animateMechanisms(16,0);
  for(const original of reference.dynamicRoot.children){
    if(!original.userData.objectId)continue;
    const current=room.dynamicRoot.children.find(group=>group.userData.objectId===original.userData.objectId);
    const a=new THREE.Box3().setFromObject(original),b=new THREE.Box3().setFromObject(current);
    closeArray([...b.min.toArray(),...b.max.toArray()],[...a.min.toArray(),...a.max.toArray()],original.userData.objectId+' bounds');
  }
  assert.equal(room.interactive.length,reference.interactive.length,'the original interaction geometry is retained');
  const clue=state.objects.find(object=>object.kind==='clue');
  const picking=create({...state,objects:[clue]});
  picking.dynamicRoot.updateMatrixWorld(true);
  const group=picking.dynamicRoot.children.find(object=>object.userData.objectId===clue.id);
  const focus=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
  picking.camera=new THREE.PerspectiveCamera(46,1,.08,42);
  picking.camera.position.copy(focus).add(new THREE.Vector3(0,1,1));picking.camera.lookAt(focus);picking.camera.updateMatrixWorld(true);
  picking.canvas.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:1000});
  picking.pointer=new THREE.Vector2();picking.raycaster=new THREE.Raycaster();
  let selected;picking.inspect=id=>{selected=id;};
  picking.pick({clientX:500,clientY:500});
  assert.equal(selected,clue.id,'an actual camera ray still selects the object');
});

test('mechanism articulation and the full final vault keep following the opening exit',()=>{
  const {create}=setup(),frames=fixtures.get(12),reference=create(frames.initial,true),room=create(frames.initial);
  for(const value of [reference,room]){value.reducedMotion=false;value.state=frames.result;value.rebuildDynamic();}
  const final=room.dynamicRoot.children.find(group=>group.userData.objectId==='final-vault');
  const closedPosition=final.position.clone();
  for(const delta of [0,16,80,100,100]){
    reference.animateMechanisms(delta,12345);room.animateMechanisms(delta,12345);
    reference.dynamicRoot.updateMatrixWorld(true);room.dynamicRoot.updateMatrixWorld(true);
    for(const original of reference.dynamicRoot.children){
      if(!original.userData.preserveArticulation)continue;
      const current=room.dynamicRoot.children.find(group=>group.userData.objectId===original.userData.objectId);
      const before=[],after=[];
      original.traverse(node=>{if(node.isMesh)before.push(node);});current.traverse(node=>{if(node.isMesh)after.push(node);});
      assert.equal(after.length,before.length);
      for(let i=0;i<before.length;i++){
        closeArray(after[i].matrixWorld.elements,before[i].matrixWorld.elements,original.userData.objectId+' moving part');
        if(before[i].isInstancedMesh)closeArray(after[i].instanceMatrix.array,before[i].instanceMatrix.array,'vault instance matrices');
      }
    }
  }
  assert.ok(final.position.distanceTo(closedPosition)>.1,'the final vault travels with the door');
  final.traverse(node=>{if(node.isMesh)assert.equal(node.visible,true,'the moving vault is never frozen into a room batch');});
  assert.ok(room.objectWorld.get('final-vault').distanceTo(final.position)<1e-9);
  room.reducedMotion=true;room.state=frames.intermission;room.rebuildDynamic();room.animateMechanisms(16,0);
  const exit=room.dynamicRoot.children.find(group=>group.userData.exitHinge);
  assert.ok(Math.abs(exit.userData.exitHinge.rotation.y)>1,'success stays articulated through intermission');
});

test('rebuild and disposal release every shared batch and instance exactly once without disposing pooled mechanism geometry',()=>{
  const {create,materials}=setup(),frames=fixtures.get(12),room=create(frames.initial);
  const watch=resources=>{
    const counts=new Map();
    for(const resource of new Set(resources)){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}
    return counts;
  };
  const owned=()=>{
    const resources=[];
    room.dynamicRoot.traverse(node=>{if(node.userData.dynamicBatch)resources.push(node.geometry);if(node.isInstancedMesh)resources.push(node);});
    return resources;
  };
  const first=watch(owned()),palette=watch(Object.values(materials)),cache=watch(room.geo.values());
  const final=room.dynamicRoot.children.find(group=>group.userData.objectId==='final-vault');
  const pooled=watch([final.userData.parts.boltInstances.geometry]);
  room.state=frames.result;room.rebuildDynamic();
  for(const count of first.values())assert.equal(count,1,'a replaced allocation is released once');
  for(const count of [...palette.values(),...cache.values(),...pooled.values()])assert.equal(count,0,'shared data stays owned until its owner disposes it');
  const last=watch(owned());
  room.dispose();room.dispose();
  for(const count of [...first.values(),...last.values(),...palette.values(),...cache.values()])assert.equal(count,1,'room-owned resources are released once');
  for(const count of pooled.values())assert.equal(count,0,'module-owned mechanism geometry remains available for other rooms');
  assert.equal(room.dynamicRoot.parent,null);
  assert.equal(room.interactive.length,0);
  assert.equal(room.objectWorld.size,0);
});
