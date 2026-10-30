'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const THREE = require('three');

function create(three = THREE) {
  const window = { THREE: three };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../public/ai-escape-room/archivist3d.js'), 'utf8'), { window, console });
  return window.EscapeArchivist.create();
}
function snapshot(extra = {}) {
  return Object.freeze({runToken:'run-a', tick:1, scene:'normal', avatar:Object.freeze({mode:'observing'}), ai:Object.freeze({action:'inspect'}), events:Object.freeze([]), progress:Object.freeze({permille:0}), ...extra});
}

test('confirmed success stages the Archivist by the opened exit instead of an unrelated remaining clue', () => {
  const actor=create();actor.setReducedMotion(true);
  const state=snapshot({scene:'intermission',avatar:Object.freeze({mode:'celebrating'}),progress:Object.freeze({permille:1000})});
  const before=JSON.stringify(state);
  actor.update(16,100,state,new THREE.Vector3(5.82,3.7,-5.23));
  assert.ok(Math.abs(actor.group.position.x)<1,'success staging is centered at the exit');
  assert.ok(actor.group.position.z<=-4.8,'success staging reaches the vault threshold');
  assert.equal(actor.diagnostics().state,'celebrating');
  assert.equal(JSON.stringify(state),before);actor.dispose();
});

test('archivist remains inside the physical room for extreme focus positions and does not mutate snapshots', () => {
  const actor = create();
  const state = snapshot();
  const before = JSON.stringify(state);
  for (const focus of [new THREE.Vector3(-100,50,-100), new THREE.Vector3(100,-50,100), new THREE.Vector3(0,.9,.85)]) {
    for (let i=0;i<600;i++) actor.update(16,i*16,state,focus);
    const p=actor.group.position;
    assert.ok(p.x>=-5.4 && p.x<=5.4, 'x clearance');
    assert.ok(p.z>=-5.7 && p.z<=2.6, 'z clearance');
    assert.ok(p.y>=1.3 && p.y<=3.9, 'vertical clearance');
  }
  assert.equal(JSON.stringify(state),before);
  actor.dispose();
});

test('solve animation consumes each event once and new runs reset event identity', () => {
  const actor=create();
  const solved=snapshot({events:Object.freeze([Object.freeze({seq:2,type:'puzzle-solved'})])});
  actor.update(16,100,solved,null);
  assert.equal(actor.diagnostics().state,'solving');
  actor.update(16,4000,solved,null);
  assert.notEqual(actor.diagnostics().state,'solving');
  actor.update(16,4016,snapshot({runToken:'run-b',events:Object.freeze([Object.freeze({seq:1,type:'puzzle-solved'})])}),null);
  assert.equal(actor.diagnostics().state,'solving');
  actor.dispose();
});

test('reduced-motion removes idle oscillation while preserving semantic pose and world location', () => {
  const actor=create();
  actor.setReducedMotion(true);
  const state=snapshot();
  actor.update(16,100,state,null);
  actor.group.updateMatrixWorld(true);
  const matrices=[];
  actor.group.traverse(object=>matrices.push(object.matrixWorld.toArray()));
  actor.update(16,1200,state,null);
  actor.group.updateMatrixWorld(true);
  const later=[];
  actor.group.traverse(object=>later.push(object.matrixWorld.toArray()));
  assert.deepEqual(later,matrices);
  assert.equal(actor.diagnostics().reducedMotion,true);
  actor.dispose();
});

test('resource count stays bounded across state changes and dispose is idempotent', () => {
  const actor=create();
  const first=actor.diagnostics();
  for(let i=0;i<100;i++) actor.update(16,i*16,snapshot({scene:i%2?'danger':'normal',runToken:'run-'+i}),null);
  const last=actor.diagnostics();
  assert.equal(last.meshCount,first.meshCount);
  assert.equal(last.geometryCount,first.geometryCount);
  assert.ok(last.meshCount<=90,`mesh budget ${last.meshCount}`);
  assert.ok(last.triangles<=35000,`triangle budget ${last.triangles}`);
  let released=0;
  const seen=new Set();
  actor.group.traverse(object=>{if(object.geometry&&!seen.has(object.geometry)){seen.add(object.geometry);object.geometry.addEventListener('dispose',()=>released++);}});
  actor.dispose();
  actor.dispose();
  assert.equal(released,seen.size);
  assert.equal(actor.diagnostics().disposed,true);
});

test('character stays within its color-pass submission budget', () => {
  const actor=create();
  let submissions=0;
  actor.group.traverseVisible(object=>{
    if(!object.isMesh)return;
    const materials=Array.isArray(object.material)
      ?object.geometry.groups.filter(group=>group.count>0).map(group=>object.material[group.materialIndex])
      :[object.material];
    for(const material of materials) {
      if(!material?.visible)continue;
      submissions+=material.transparent&&material.side===THREE.DoubleSide&&!material.forceSinglePass?2:1;
    }
  });
  // Preserve headroom in the room's 190-call gate, including the glow's two passes.
  assert.ok(submissions<=42,`character color-pass budget: ${submissions} submissions`);
  actor.dispose();
});

test('dispose releases owned instance buffers and all resources once without releasing foreign attachments', () => {
  const owned=new Map(),constructors=new Map();
  const resourceTypes=[THREE.BufferGeometry,THREE.Material,THREE.Texture,THREE.InstancedMesh];
  const trackedThree=new Proxy({...THREE},{get(target,key){
    const value=target[key];
    if(typeof value!=='function'||!resourceTypes.some(Base=>value===Base||value.prototype instanceof Base))return value;
    if(!constructors.has(value))constructors.set(value,new Proxy(value,{construct(Type,args){
      const resource=Reflect.construct(Type,args);
      owned.set(resource,0);
      resource.addEventListener('dispose',()=>owned.set(resource,owned.get(resource)+1));
      return resource;
    }}));
    return constructors.get(value);
  }});
  const actor=create(trackedThree),scene=new THREE.Scene();
  scene.add(actor.group);
  const foreignTexture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
  const foreignGeometry=new THREE.BoxGeometry();
  const foreignMaterial=new THREE.MeshStandardMaterial({map:foreignTexture});
  const foreignInstance=new THREE.InstancedMesh(foreignGeometry,foreignMaterial,1);
  let foreignDisposals=0;
  for(const resource of[foreignTexture,foreignGeometry,foreignMaterial,foreignInstance])resource.addEventListener('dispose',()=>foreignDisposals++);
  actor.group.add(foreignInstance);

  actor.dispose();
  actor.dispose();
  assert.equal(actor.group.parent,null);
  assert.ok([...owned.keys()].some(resource=>resource.isInstancedMesh),'the owned instance allocation is observed');
  for(const[resource,count]of owned)assert.equal(count,1,`${resource.type||resource.constructor.name} is released once`);
  assert.equal(foreignDisposals,0,'callers retain ownership of resources they attach');

  for(const resource of[foreignInstance,foreignGeometry,foreignMaterial,foreignTexture])resource.dispose();
});
