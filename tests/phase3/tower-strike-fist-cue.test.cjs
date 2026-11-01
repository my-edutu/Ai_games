'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const match=source.match(/^function positionStrikeCue\(arc, rig, camera\) \{[\s\S]*?^\}/m);
assert.ok(match,'actual shipped scene must contain fist cue helper');
const positionStrikeCue=vm.runInNewContext(match[0]+'\npositionStrikeCue');
let cast;
async function loadCast(){
  if(!cast){
    const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
    const raw=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/characters.mjs'),'utf8');
    const adjusted=raw.replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/,"from '"+threeURL+"'");
    assert.notEqual(raw,adjusted);
    cast=Promise.all([import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)]);
  }
  return cast;
}
test('actual Three skinned climber keeps strike mark on authored wrist across motion and roots',async t=>{
  const [api,THREE]=await loadCast();
  const model=api.createClimber();
  const arc=new THREE.Mesh(new THREE.TorusGeometry(.56,.038,6,20,Math.PI*.75),new THREE.MeshBasicMaterial());
  t.after(()=>{model.dispose();arc.geometry.dispose();arc.material.dispose();});
  const camera=new THREE.PerspectiveCamera(42,1.6,.2,1200);
  const elbow=model.group.getObjectByName('1-elbow');
  assert.ok(elbow?.isBone,'use real articulated right arm');
  const standing={state:'standing',vx:0,vy:0,facing:1,health:5,attacking:true};
  const cases=[
    {state:standing,time:.1,x:8,y:11,z:-4,yaw:.3,scale:1},
    {state:{...standing,state:'airborne',vx:4300,vy:6000},time:.2,x:-3,y:20,z:5,yaw:-.9,scale:.85},
    {state:{...standing,vx:-2500,attacking:false},time:.5,x:2,y:24,z:8,yaw:1.1,scale:1.15},
  ];
  for(const c of cases){
    model.group.position.set(c.x,c.y,c.z);
    model.group.rotation.set(0,c.yaw,0);
    model.group.scale.setScalar(c.scale);
    model.animate(c.state,1/60,c.time,{reducedMotion:true});
    camera.rotation.set(.1,c.yaw/2,0);
    const rootBefore=[...model.group.position,...model.group.quaternion,...model.group.scale];
    const wrist=new THREE.Vector3(0,-.39,.015);
    elbow.updateWorldMatrix(true,false);elbow.localToWorld(wrist);
    arc.visible=true;
    assert.equal(positionStrikeCue(arc,model.group,camera),true);
    assert.ok(arc.position.distanceTo(wrist)<1e-7,'mark must track actual wrist in world coordinates');
    assert.ok(arc.quaternion.angleTo(camera.quaternion)<1e-7,'small cue must remain legible');
    assert.deepEqual([...model.group.position,...model.group.quaternion,...model.group.scale],rootBefore,'presentation may not modify root');
    assert.ok(arc.position.distanceTo(model.group.position)>.3,'not a floating root-relative glyph');
  }
});
test('missing joint hides cosmetic marker rather than inventing a hit',async()=>{
  const [,THREE]=await loadCast();
  const arc={visible:true,position:new THREE.Vector3(),quaternion:new THREE.Quaternion()};
  assert.equal(positionStrikeCue(arc,new THREE.Group(),new THREE.PerspectiveCamera()),false);
  assert.equal(arc.visible,false);
});
test('scene uses a bounded, depth-tested wrist mark and not the old large detached slash',()=>{
  assert.match(source,/new THREE\.TorusGeometry\(\.56,\s*\.038,\s*6,\s*20,\s*Math\.PI \* \.75\)/);
  assert.match(source,/positionStrikeCue\(attackArc, climber\.group, camera\)/);
  assert.match(source,/attackArc\.visible = !!p\.attacking && p\.health > 0/);
  assert.doesNotMatch(source,/attackArc\.position\.copy\(climber\.group\.position\)/);
});
