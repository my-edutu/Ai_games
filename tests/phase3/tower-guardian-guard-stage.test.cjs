'use strict';
// Real Three.js geometry and authoritative-only observation contracts.
// This is NOT normal-speed video criticism or a LOOKS/FEELS/PLAYS vote.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,
  'public/infinite-tower-climb/visuals/guardian-guard-stage.mjs'),'utf8');
const threeUrl=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const loaded=Promise.all([import('data:text/javascript;base64,'+
  Buffer.from(src).toString('base64')),import(threeUrl)]);
const state=(remaining,overrides={})=>Object.freeze({
  runToken:'source-run',floor:8,tick:500,lifecycle:'running',
  player:{health:5},...overrides
});
const enemy=(remaining,overrides={})=>Object.freeze({
  id:'f8:guardian',kind:'guardian',active:true,
  health:3,maxHealth:8,telegraph:false,guardTicksRemaining:remaining,...overrides
});
test('a living wounded source guardian physically stages four interlocked battens',async t=>{
  const [api,THREE]=await loaded;
  const stage=api.createObservedGuardianGuardStage(THREE);
  t.after(()=>stage.dispose());
  const model=new THREE.Group();
  model.position.set(3,11,-6);model.rotation.y=.65;model.scale.setScalar(.62);
  const snapshot=state(22),guard=enemy(22),before=JSON.stringify([snapshot,guard]);
  const initial=stage.update(snapshot,model,guard,{quality:'low'});
  assert.equal(initial.remaining,22);
  assert.equal(stage.group.visible,true);
  const mesh=stage.group.getObjectByName('SourceGuardMetalBattens');
  assert.ok(mesh?.isInstancedMesh&&mesh.count===4);
  assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,false);
  assert.deepEqual(stage.group.position.toArray(),model.position.toArray());
  const left=new THREE.Matrix4(),right=new THREE.Matrix4();
  mesh.getMatrixAt(0,left);mesh.getMatrixAt(1,right);
  assert.ok(left.elements[12]<0 && right.elements[12]>0);
  stage.update(state(1,{tick:521}),model,enemy(1),{quality:'low'});
  const opened=new THREE.Matrix4();mesh.getMatrixAt(0,opened);
  assert.ok(opened.elements[12]<left.elements[12],
    'source expiry unfolds an actual metal battens silhouette');
  assert.equal(JSON.stringify([snapshot,guard]),before,'renderer cannot change source truth');
  assert.equal(stage.diagnostics().extraDraws,1);
});
test('source guard expiry, charge, death, new floor and stale transport remove the defense',async t=>{
  const [api,THREE]=await loaded;
  const stage=api.createObservedGuardianGuardStage(THREE);t.after(()=>stage.dispose());
  const model=new THREE.Group();
  const live=state(6);
  stage.update(live,model,enemy(6));assert.equal(stage.group.visible,true);
  for(const value of [enemy(0),enemy(6,{telegraph:true}),
    enemy(6,{active:false}),enemy(6,{health:6})]){
    assert.equal(stage.update(live,model,value),null);
    assert.equal(stage.group.visible,false);
  }
  assert.equal(stage.update(state(6,{lifecycle:'result'}),model,enemy(6)),null);
  assert.equal(stage.update(live,model,enemy(6),{stale:true}),null);
  assert.equal(stage.update(live,null,enemy(6)),null);
  assert.equal(stage.diagnostics().extraDraws,0);
});
