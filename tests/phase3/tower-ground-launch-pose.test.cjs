'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const file=path.join(__dirname,'../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
const source=fs.readFileSync(file,'utf8').replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/,`from '${threeURL}'`);
const modulePromise=import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const state=Object.freeze({state:'standing',vx:8500,vy:0,facing:1,health:5,maxHealth:5,
 attacking:false,runToken:'real-source',floor:0,tick:410});
const bone=(model,name)=>{const b=model.group.getObjectByName(name);assert.ok(b?.isBone,name);return b};
test('a real grounded launch-brake decision counterbalances the same skinned climber',async t=>{
 const {createClimber}=await modulePromise,model=createClimber();
 t.after(()=>model.dispose());
 const root=[...model.group.position,...model.group.quaternion];
 model.animate({...state,intentMode:'aligning'},1/60,0,{});
 const ordinary={body:bone(model,'articulated-body').rotation.z,
 helmet:bone(model,'expressive-helmet').rotation.z,knee:bone(model,'1-knee').rotation.x};
 model.animate({...state,intentMode:'settling-launch'},1/60,1/60,{});
 const brake={body:bone(model,'articulated-body').rotation.z,
 helmet:bone(model,'expressive-helmet').rotation.z,knee:bone(model,'1-knee').rotation.x};
 assert.ok(Math.abs(brake.body-ordinary.body)>.08);
 assert.ok(Math.abs(brake.helmet-ordinary.helmet)>.05);
 assert.ok(Math.abs(brake.knee-ordinary.knee)>.01);
 assert.deepEqual([...model.group.position,...model.group.quaternion],root);
 model.animate({...state,intentMode:'aligning'},1/60,2/60,{});
 assert.ok(Math.abs(bone(model,'articulated-body').rotation.z-ordinary.body)<.001);
 model.animate({...state,intentMode:'settling-launch'},1/60,3/60,{reducedMotion:true});
 assert.ok(Math.abs(bone(model,'articulated-body').rotation.z)<Math.abs(brake.body));
});
test('stale, hurt and combat source states veto the grounded launch brace',async t=>{
 const {createClimber}=await modulePromise,model=createClimber();
 t.after(()=>model.dispose());
 const z=()=>bone(model,'articulated-body').rotation.z;
 for(const [edit,opt] of [[{attacking:true},{}],[{state:'hurt'},{}],[{},{stale:true}]]){
  model.animate({...state,...edit,intentMode:'aligning'},1/60,0,opt);
  const before=z();
  model.animate({...state,...edit,intentMode:'settling-launch'},1/60,0,opt);
  assert.ok(Math.abs(z()-before)<.001);
 }
});
