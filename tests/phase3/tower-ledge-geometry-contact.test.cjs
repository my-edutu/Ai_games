'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const cast=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/characters.mjs'),'utf8');
function shippedFunction(source,name,signature){
  const match=source.match(new RegExp('^function '+name+'\\('+signature+'\\) \\{[\\s\\S]*?^\\}','m'));
  assert.ok(match,'actual shipped source must contain '+name);
  return vm.runInNewContext(match[0]+'\n'+name);
}
const ledgeContactPoint=shippedFunction(scene,'ledgeContactPoint','snapshot, platform');
const solveLedgeReach=shippedFunction(cast,'solveLedgeReach','shoulder, tip');
const player={x:120000,y:200000,halfHeight:14000,halfWidth:9000,facing:1,vy:6000,health:5,state:'airborne',attacking:false};
const deck={id:'real-platform',x:123000,y:206000,width:40000,height:0};
test('only a rising live climber near a real platform receives a ledge point',()=>{
  const target=ledgeContactPoint({player},deck);
  assert.deepEqual([target.x,target.y],[125850,206000]);
  for(const override of [{state:'standing'},{vy:-1},{health:0},{attacking:true}]){
    assert.equal(ledgeContactPoint({player:{...player,...override}},deck),null);
  }
  assert.equal(ledgeContactPoint({player},{...deck,x:300000}),null);
  assert.equal(ledgeContactPoint({player},{...deck,y:280000}),null);
  assert.equal(ledgeContactPoint({player},{...deck,width:0}),null);
  assert.equal(ledgeContactPoint({player},{...deck,x:NaN}),null);
});
test('contact follows tick-adjusted deck coordinates, not a fabricated fixed ledge',()=>{
  const before=ledgeContactPoint({player},deck);
  const after=ledgeContactPoint({player},{...deck,x:127000,y:207000});
  assert.ok(after && before && after.x!==before.x && after.y!==before.y);
  assert.equal(player.x,120000);
  assert.equal(deck.y,206000);
});
test('analytic two-link solution preserves actual arm and fingertip lengths',()=>{
  const shoulder={x:.66,y:1.79,z:0},tip={x:.56,y:2.33,z:.22};
  const solved=solveLedgeReach(shoulder,tip);
  assert.ok(solved);
  assert.ok(Math.abs(Math.hypot(solved.elbow.x-shoulder.x,solved.elbow.y-shoulder.y,solved.elbow.z-shoulder.z)-.38)<1e-8);
  assert.ok(Math.abs(Math.hypot(solved.elbow.x-tip.x,solved.elbow.y-tip.y,solved.elbow.z-tip.z)-Math.hypot(.802,.108))<1e-8);
  assert.equal(solveLedgeReach(shoulder,{x:5,y:5,z:5}),null);
  assert.equal(solveLedgeReach(shoulder,{x:.66,y:.2,z:0}),null);
});
test('real scene passes source-truth deck top into character bones without new authority',()=>{
  assert.match(scene,/const ledgeContact = ledgeContactPoint\(snapshot, targetPlatform\)/);
  // G37 hoists the same real platform point so both the rig and contact
  // diagnostic read exactly one immutable target; test the mapping and its use.
  assert.match(scene,/const ledgeTarget = ledgeContact \? pointFor\(ledgeContact\.x, ledgeContact\.y,/);
  assert.match(scene,/\n\s+ledgeTarget,\n/);
  assert.match(cast,/body\.worldToLocal\(ledgeWorld\)/);
  assert.match(cast,/arm\.lower\.quaternion\.setFromUnitVectors\(fingertipRest,ledgeAim\)/);
});
test('real Three rig fingertip aligns with deck target without root movement',async t=>{
  const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, "from '"+threeURL+"'");
  assert.notEqual(adjusted,cast);
  const [api,THREE]=await Promise.all([import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64')),import(threeURL)]);
  const rig=api.createClimber();t.after(()=>rig.dispose());
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);
  rig.group.updateMatrixWorld(true);
  const destination=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const rootBefore=[...rig.group.position,...rig.group.quaternion,...rig.group.scale];
  const air={state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false,ledgeTarget:{x:destination.x,y:destination.y,z:destination.z}};
  rig.animate(air,1/60,1.0,{reducedMotion:true});
  const rightElbow=rig.group.getObjectByName('1-elbow');
  assert.ok(rightElbow?.isBone);
  rightElbow.updateWorldMatrix(true,false);
  const fingertip=rightElbow.localToWorld(new THREE.Vector3(0,-.802,.108));
  assert.ok(fingertip.distanceTo(destination)<1e-5,'fingertip aligns with actual platform target');
  assert.deepEqual([...rig.group.position,...rig.group.quaternion,...rig.group.scale],rootBefore,'root authority unchanged');
  rig.animate({...air,ledgeTarget:null},1/60,1.2,{reducedMotion:true});
  rightElbow.updateWorldMatrix(true,false);
  const released=rightElbow.localToWorld(new THREE.Vector3(0,-.802,.108));
  assert.ok(released.distanceTo(destination)>.01,'no phantom grip after target disappears');
});
