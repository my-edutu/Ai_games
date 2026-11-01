'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const cast=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/characters.mjs'),'utf8');
function extract(source,name,args,context={}){
  const m=source.match(new RegExp('^function '+name+'\\('+args+'\\) \\{[\\s\\S]*?^\\}','m'));
  assert.ok(m,'shipped function '+name+' must exist');
  return vm.runInNewContext(m[0]+'\n'+name,context);
}
test('actual raised fingertip measurement distinguishes real IK alignment from visual miss',async t=>{
  const THREE=require('three');
  const measure=extract(scene,'measureLedgeFingertip','climberGroup, target, platformId',{THREE});
  const url=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
  const adjusted=cast.replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/,"from '"+url+"'");
  assert.notEqual(adjusted,cast);
  const {createClimber}=await import('data:text/javascript;base64,'+Buffer.from(adjusted).toString('base64'));
  const rig=createClimber();t.after(()=>rig.dispose());
  rig.group.position.set(3,7,-4);rig.group.rotation.y=.35;rig.group.scale.setScalar(1.13);rig.group.updateMatrixWorld(true);
  const goal=rig.group.localToWorld(new THREE.Vector3(.56,2.33,.22));
  const target={x:goal.x,y:goal.y,z:goal.z};
  rig.animate({state:'airborne',vx:2300,vy:6000,facing:1,health:5,attacking:false,ledgeTarget:target},1/60,1,{reducedMotion:true});
  const seen=measure(rig.group,target,'genuine-deck');
  assert.equal(seen.platformId,'genuine-deck');
  assert.ok(seen.errorWorld<1e-5,'visible fingertip is located at deck');
  assert.equal(seen.target.length,3);assert.equal(seen.fingertip.length,3);
  assert.equal(measure(rig.group,null,'genuine-deck'),null);
  assert.ok(measure(rig.group,{...target,y:target.y+2},'genuine-deck').errorWorld>1,'a miss cannot be reported as contact');
});
test('real renderer exposes post-pose evidence without mutating authority',()=>{
  assert.match(scene,/ledgeContactEvidence\s*=\s*ledgeTarget\s*\?\s*measureLedgeFingertip/);
  assert.match(scene,/ledgeContact:\s*ledgeContactEvidence/);
  assert.match(scene,/const ledgeTarget = ledgeContact \? pointFor/);
});
