'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const file=path.join(__dirname,'../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
const source=fs.readFileSync(file,'utf8').replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/,`from '${threeURL}'`);
const modulePromise=import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const state=Object.freeze({state:'airborne',vx:9000,vy:-4500,facing:1,
 health:5,maxHealth:5,attacking:false,runToken:'real-source',floor:1,tick:400});
const bone=(model,name)=>{
 const b=model.group.getObjectByName(name);
 assert.ok(b?.isBone,`real skinned joint ${name}`);
 return b;
};
test('actual airborne decision visibly counterbalances the existing skinned body and knees',async t=>{
 const {createClimber}=await modulePromise,model=createClimber();
 t.after(()=>model.dispose());
 const root=[...model.group.position,...model.group.quaternion];
 model.animate({...state,intentMode:'air-control'},1/60,0,{});
 const ordinary={body:bone(model,'articulated-body').rotation.z,
   helmet:bone(model,'expressive-helmet').rotation.z,
   knee:bone(model,'1-knee').rotation.x};
 model.animate({...state,intentMode:'settling-landing'},1/60,1/60,{});
 const brake={body:bone(model,'articulated-body').rotation.z,
   helmet:bone(model,'expressive-helmet').rotation.z,
   knee:bone(model,'1-knee').rotation.x};
 assert.ok(Math.abs(brake.body-ordinary.body)>.1,'torso counterbalance is visible');
 assert.ok(Math.abs(brake.helmet-ordinary.helmet)>.05,'helmet stabilizes against braking');
 assert.ok(Math.abs(brake.knee-ordinary.knee)>.01,'a real skinned knee prepares to land');
 assert.deepEqual([...model.group.position,...model.group.quaternion],root,'render cannot move physics root');
 model.animate({...state,intentMode:'air-control'},1/60,2/60,{});
 assert.ok(Math.abs(bone(model,'articulated-body').rotation.z-ordinary.body)<.001,
   'neutral airborne pose returns immediately when the source no longer brakes');
 model.animate({...state,intentMode:'settling-landing'},1/60,3/60,{reducedMotion:true});
 assert.ok(Math.abs(bone(model,'articulated-body').rotation.z)<Math.abs(brake.body),
   'reduced motion preserves a quieter physical stance');
});
test('combat, ledge grip, stale packets and injury veto the cosmetic brake',async t=>{
 const {createClimber}=await modulePromise,model=createClimber();
 t.after(()=>model.dispose());
 const rest=()=>bone(model,'articulated-body').rotation.z;
 for(const [edit,opt] of [
   [{attacking:true},{}],
   [{state:'hurt'},{}],
   [{ledgeTarget:{x:0,y:0,z:0}},{}],
   [{},{stale:true}]
 ]){
   model.animate({...state,...edit,intentMode:'air-control'},1/60,0,opt);
   const reference=rest();
   model.animate({...state,...edit,intentMode:'settling-landing'},1/60,0,opt);
   assert.ok(Math.abs(rest()-reference)<.001,'source veto preserves the matching ordinary rig');
 }
});
