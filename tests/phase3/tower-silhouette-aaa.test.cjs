'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const file=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
test('climber helmet rendered silhouette no longer exceeds torso envelope',async()=>{
 const code=fs.readFileSync(file,'utf8').replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, `from '${threeURL}'`);
 const [{createClimber},THREE]=await Promise.all([import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`),import(threeURL)]);
 const model=createClimber();
 try{
  model.group.updateMatrixWorld(true);
  function bounds(boneName,predicate){
   const bone=model.group.getObjectByName(boneName),box=new THREE.Box3(),p=new THREE.Vector3();let count=0;
   assert.ok(bone?.isBone);
   model.group.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return;
    const joint=mesh.skeleton.bones.indexOf(bone),idx=mesh.geometry.attributes.skinIndex,loc=mesh.geometry.attributes.position;
    for(let i=0;i<loc.count;i++){
      if(idx.getX(i)!==joint)continue;
      p.fromBufferAttribute(loc,i);
      if(predicate&&!predicate(p))continue;
      mesh.applyBoneTransform(i,p).applyMatrix4(mesh.matrixWorld);box.expandByPoint(p);count++;
    }
   });
   assert.ok(count>50,`measured rendered vertices on ${boneName}`);
   return box.max.x-box.min.x;
  }
  const head=bounds('expressive-helmet');
  const torso=bounds('articulated-body',p=>p.y>1.05&&p.y<1.9&&p.z>-.28);
  assert.ok(head<=torso*1.12,`hero reads adult-proportioned: helmet ${head.toFixed(3)} vs torso ${torso.toFixed(3)}`);
 }finally{model.dispose();}
});
