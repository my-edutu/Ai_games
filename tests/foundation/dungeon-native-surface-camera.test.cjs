'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const rootDir=path.resolve(__dirname,'../..');
const load=async(name)=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(rootDir,'public/ai-dungeon',name))).toString('base64'));
async function originalActor(){
 const T=await import('three'),geo=new T.BoxGeometry(.8,1.9,.5,2,6,2);
 const n=geo.attributes.position.count, joints=new Uint16Array(n*4),weights=new Float32Array(n*4);
 for(let i=0;i<n;i++)weights[i*4]=1;
 geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));
 geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const bone=new T.Bone(),mesh=new T.SkinnedMesh(geo,new T.MeshStandardMaterial());
 mesh.add(bone);mesh.bind(new T.Skeleton([bone]));
 const root=new T.Group();root.position.set(2,0,-3);root.scale.setScalar(1.3);root.add(mesh);root.updateMatrixWorld(true);
 return {T,root,mesh,bone};
}
test('original animated skinned mesh fills real 3D bounds without adding draw calls',async()=>{
 const {root,mesh,bone}=await originalActor(),{createNativeSurfaceSampler}=await load('native-surface-sightline.js');
 const sampler=createNativeSurfaceSampler(root),before=sampler.sample();
 assert.equal(sampler.sourceMeshes,1);
 assert.ok(before.length>=4);
 assert.ok(Math.max(...before.map(p=>p.y))-Math.min(...before.map(p=>p.y))>2.2);
 assert.ok(before.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 bone.position.y=.35;mesh.updateWorldMatrix(true,true);
 const after=sampler.sample();
 assert.ok(after.some((p,i)=>Math.abs(p.y-before[i].y)>.25));
 assert.equal(sampler.sourceMeshes,1);
});
test('sampling excludes non-skinned decoration and is bounded for real imported actor resources',async()=>{
 const {T,root}=await originalActor(),{createNativeSurfaceSampler}=await load('native-surface-sightline.js');
 const decor=new T.Mesh(new T.BoxGeometry(.3,.4,.3),new T.MeshBasicMaterial());
 decor.position.y=2;root.add(decor);root.updateMatrixWorld(true);
 const p=createNativeSurfaceSampler(root).sample();
 assert.ok(p.length>=4&&p.length<=10);
 assert.ok(Math.max(...p.map(x=>x.y))<2);
 assert.equal(createNativeSurfaceSampler(new T.Group()).sample().length,0);
});
test('real perspective camera receives correctly projected source skin body height',async()=>{
 const {T,root,mesh,bone}=await originalActor();
 const {createNativeSurfaceSampler}=await load('native-surface-sightline.js');
 const {planRealActorScreenReadability}=await load('actor-screen-readability.js');
 const camera=new T.PerspectiveCamera(49,390/658,.05,100);
 camera.position.set(5,8,8);camera.lookAt(2,1,-3);camera.updateMatrixWorld(true);
 const points=createNativeSurfaceSampler(root).sample(),q=new T.Vector3();
 const result=planRealActorScreenReadability([{id:'vanguard',kind:'vanguard',faction:'party',hp:100,points,sourceSurfaceCount:points.length}],{
  width:390,height:658,criticalIds:['vanguard'],project:p=>q.set(p.x,p.y,p.z).project(camera)
 });
 assert.equal(result.status,'MEASURED');
 assert.ok(result.actors[0].visibleHeightPx>18);
 assert.equal(result.actors[0].sourceSurfaceCount,points.length);
 bone.position.y=.12;mesh.updateWorldMatrix(true,true);
 assert.notDeepEqual(createNativeSurfaceSampler(root).sample(),points);
});
test('mutable Three.js projection buffer never collapses multiple original body anchors to zero pixels',async()=>{
 const {planRealActorScreenReadability}=await load('actor-screen-readability.js');
 const q={x:0,y:0,z:0};
 const body=[{x:0,y:2,z:0},{x:0,y:0,z:0},{x:.3,y:1,z:0}];
 const result=planRealActorScreenReadability([{id:'warden',kind:'warden',hp:100,points:body}],{
  width:390,height:658,criticalIds:['warden'],project:p=>{
   q.x=p.x;q.y=(p.y-1)/3;q.z=0;return q;
  }
 });
 assert.equal(result.actors[0].inFrame,true);
 assert.ok(result.actors[0].bodyHeightPx>200);
 assert.ok(result.minimumCriticalPx>200);
});
