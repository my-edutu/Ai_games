'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/actor-occlusion-stage.js'),'utf8')).toString('base64'));
function rig(){
 class Vec3{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}length(){return Math.hypot(this.x,this.y,this.z)}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}}
 class Raycaster{set(){}intersectObject(mesh){return mesh.hit?[{instanceId:mesh.id,point:{x:1,y:0,z:0}}]:[]}}
 return {Vector3:Vec3,Raycaster};
}
test('real skinned combat actors ray-clear original instanced wall and facade; stable after transforms shrink',async()=>{
 const {createActorOcclusionStage}=await load(),stage=createActorOcclusionStage(rig());
 const cam={position:{x:5,y:8,z:4},updateMatrixWorld(){}};
 const wall={isInstancedMesh:true,visible:true,count:10,id:3,hit:true};
 const facade={isInstancedMesh:true,visible:true,count:10,id:4,hit:true};
 const hero={x:0,z:0,visibleActor:true,bodyPoints:[{x:0,y:.2,z:0},{x:0,y:1,z:0},{x:0,y:1.7,z:0}]};
 const first=stage.resolve('1-1',cam,[hero],wall,facade,0);
 assert.deepEqual([...first.walls],[3]);assert.deepEqual([...first.facades],[4]);
 wall.hit=false;facade.hit=false;
 const stable=stage.resolve('1-1',cam,[hero],wall,facade,.7);
 assert.deepEqual([...stable.walls],[3],'originally blocking cutaways stay down while real hero remains');
 assert.deepEqual([...stable.facades],[4]);
 assert.equal(stage.resolve('2-1',cam,[hero],wall,facade,.8).walls.size,0,'old floor indices do not leak into next floor');
});
test('invalid actor, background hit and corrupt instance cannot erase an entire dungeon',async()=>{
 const {createActorOcclusionStage}=await load(),stage=createActorOcclusionStage(rig());
 const cam={position:{x:6,y:8,z:0}},mesh={isInstancedMesh:true,count:10,id:2,hit:true};
 assert.equal(stage.resolve('a',cam,[{x:0,z:0}],mesh,null,0).walls.size,0);
 mesh.id=25;
 assert.equal(stage.resolve('a',cam,[{x:0,z:0,visibleActor:true}],mesh,null,1).walls.size,0);
 mesh.id=2;
 const far={x:12,z:12,visibleActor:true,bodyPoints:[{x:12,y:1,z:12},{x:12,y:2,z:12},{x:12,y:.2,z:12}]};
 assert.equal(stage.resolve('a',cam,[far],mesh,null,2).walls.size,0);
});
test('finite five-actor ray budget, held stage and no authority mutation',async()=>{
 const {createActorOcclusionStage}=await load(),stage=createActorOcclusionStage(rig());
 const cam={position:{x:6,y:8,z:0}},mesh={isInstancedMesh:true,count:1000,id:2,hit:true};
 const live=Array.from({length:30},(_,i)=>({x:0,z:i%2,visibleActor:true}));
 stage.resolve('a',cam,live,mesh,mesh,1);
 const first=stage.metrics().rays;assert.ok(first<=60);
 stage.resolve('a',cam,live,mesh,mesh,1.1);
 assert.equal(stage.metrics().rays,first,'no unbounded per-frame recasting');
 stage.resolve('a',cam,live,mesh,mesh,1.3);
 assert.ok(stage.metrics().rays<=120);
 assert.equal(stage.metrics().authorityChanged,false);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const dressing=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/actorOcclusionStage\.resolve\(/);
 assert.match(app,/forceWalls\?\.has\(i\)/);
 assert.match(dressing,/forceFacades\?\.has\(i\)/);
});

test('both real lower-leg source points clear genuine mid-foreground masonry, but never rear background or non-fighters',async()=>{
 const {createActorOcclusionStage}=await load();
 class Ray extends rig().Raycaster{
  intersectObject(mesh){return mesh.hit?[{instanceId:mesh.id,point:{x:mesh.x??0,y:1,z:mesh.z}}]:[]}
 }
 const stage=createActorOcclusionStage({...rig(),Raycaster:Ray});
 const camera={position:{x:0,y:4,z:8}};
 const source={x:0,z:0,visibleActor:true,bodyPoints:[
  {x:0,y:1.7,z:0},{x:0,y:1.15,z:0},
  {x:-.32,y:1.2,z:0},{x:.32,y:1.2,z:0},
  {x:-.23,y:.35,z:0},{x:.23,y:.35,z:0}
 ]};
 const front={isInstancedMesh:true,visible:true,count:12,id:5,hit:true,z:5.5};
 const back={isInstancedMesh:true,visible:true,count:12,id:6,hit:true,z:7.2};
 const selected=stage.resolve('run-floor',camera,[source],front,back,0);
 assert.deepEqual([...selected.walls],[5],'full-body occluded forewall must clear even outside old 4.15m radius');
 assert.equal(selected.facades.size,0,'too-distant architectural stone must remain');
 assert.equal(stage.metrics().rays,12,'both source calves are sampled within the finite actor budget');
 assert.equal(stage.metrics().maxPoints,6);
 front.hit=false;
 assert.deepEqual([...stage.resolve('run-floor',camera,[source],front,back,.7).walls],[5],'held wall must not flicker mid-duel');
 assert.equal(stage.resolve('next-floor',camera,[source],front,back,.8).walls.size,0,'old arena geometry cannot follow a new floor');
 assert.equal(stage.resolve('next-floor',camera,[{...source,visibleActor:false}],front,back,1.1).walls.size,0);
});

test('original instanced stone exact ray acceleration preserves true foreground hits, excludes off-ray meshes and resets with a new floor',async()=>{
 const {createActorOcclusionStage}=await load();
 let precise=0,legacy=0;
 class Vec{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}
  copy(v){return this.set(v.x,v.y,v.z)}
  applyMatrix4(m){this.x+=m.x||0;this.y+=m.y||0;this.z+=m.z||0;return this}
  subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}
  length(){return Math.hypot(this.x,this.y,this.z)}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
 }
 class Matrix{
  multiplyMatrices(a,b){this.x=(a.x||0)+(b.x||0);this.y=(a.y||0)+(b.y||0);this.z=(a.z||0)+(b.z||0);return this}
  getMaxScaleOnAxis(){return 1}
 }
 class Mesh{
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.matrixWorld=new Matrix()}
  raycast(ray,hits){precise++;if(Math.abs(this.matrixWorld.x)<.2&&Math.abs(this.matrixWorld.z-5)<.2)
   hits.push({point:{x:0,y:1,z:5},distance:5})}
 }
 class Raycaster{
  set(){}
  intersectObject(mesh){legacy++;return [{instanceId:0,point:{x:0,y:1,z:5},distance:5}]}
 }
 const positions=Array.from({length:101},(_,i)=>i?{x:9+(i%10),z:4+Math.floor(i/10)}:{x:0,z:5});
 const mesh={isInstancedMesh:true,visible:true,count:101,geometry:{
  boundingSphere:{center:{x:0,y:0,z:0},radius:.42}},material:{},matrixWorld:{x:0,y:0,z:0},
  getMatrixAt(i,m){Object.assign(m,positions[i])},updateWorldMatrix(){}};
 const hero={x:0,z:0,visibleActor:true,bodyPoints:[
  {x:0,y:.2,z:0},{x:0,y:.6,z:0},{x:0,y:1.1,z:0},
  {x:0,y:1.5,z:0},{x:0,y:1.7,z:0},{x:0,y:1.9,z:0}
 ]};
 const stage=createActorOcclusionStage({Vector3:Vec,Matrix4:Matrix,Mesh,Raycaster});
 const camera={position:{x:0,y:5,z:8},updateMatrixWorld(){}};
 const first=stage.resolve('floor-1',camera,[hero],mesh,null,0);
 assert.deepEqual([...first.walls],[0],'physical original wall must clear');
 assert.equal(precise,6,'one exact triangle candidate per anatomical ray');
 assert.equal(legacy,0,'full instance geometry may be avoided only with valid geometry');
 assert.equal(stage.metrics().broadphaseRejected,600,'off-ray stone is still physically present');
 positions[0].x=15;
 const next=stage.resolve('floor-2',camera,[hero],mesh,null,.5);
 assert.equal(next.walls.size,0,'fresh floor/moved masonry cannot use previous wall clearance');
 assert.equal(precise,6,'off-ray geometry is rejected after a floor change');
 mesh.geometry={};
 stage.resolve('floor-3',camera,[hero],mesh,null,1);
 assert.equal(legacy,6,'invalid or absent geometry returns to original complete raycast');
 assert.equal(stage.metrics().authorityChanged,false);
});


test('true four-body-point visibility reuses exact original masonry bounds without hiding foreground stone',async()=>{
 const {createActorOcclusionStage}=await load();
 let exact=0,native=0;
 class Vec{
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}
  copy(v){return this.set(v.x,v.y,v.z)}
  applyMatrix4(m){this.x+=m.x||0;this.y+=m.y||0;this.z+=m.z||0;return this}
  subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}
  length(){return Math.hypot(this.x,this.y,this.z)}
  multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this}
 }
 class Matrix{
  multiplyMatrices(a,b){this.x=(a.x||0)+(b.x||0);this.y=(a.y||0)+(b.y||0);this.z=(a.z||0)+(b.z||0);return this}
  getMaxScaleOnAxis(){return 1}
 }
 class Mesh{
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.matrixWorld=new Matrix()}
  raycast(ray,hits){exact++;if(Math.abs(this.matrixWorld.x)<.2&&Math.abs(this.matrixWorld.z-5)<.2)
   hits.push({distance:3,point:{x:0,y:1,z:5}})}
 }
 class Raycaster{
  set(){}
  intersectObject(mesh){native++;return mesh.hit?[{distance:3,point:{x:0,y:1,z:5}}]:[]}
 }
 const stage=createActorOcclusionStage({Vector3:Vec,Matrix4:Matrix,Mesh,Raycaster});
 const positions=Array.from({length:101},(_,i)=>i?{x:9+i%10,z:4+Math.floor(i/10)}:{x:0,z:5});
 const masonry={isInstancedMesh:true,visible:true,count:101,
  geometry:{boundingSphere:{center:{x:0,y:0,z:0},radius:.42}},material:{},matrixWorld:{},
  updateWorldMatrix(){},getMatrixAt(i,m){Object.assign(m,positions[i])}};
 const from={x:0,y:1,z:8},to={x:0,y:1,z:0};
 const sample=stage.createDiagnosticSampler([masonry]);
 for(let i=0;i<4;i++)assert.equal(sample(from,to),true);
 assert.equal(exact,4,'four real-ray original triangular candidates');
 assert.equal(native,0);
 assert.equal(stage.metrics().broadphaseRejected,400);
 assert.equal(stage.metrics().broadphaseBuilds,1,'build current world spheres once per audit');
 positions[0].x=15;
 assert.equal(stage.createDiagnosticSampler([masonry])(from,to),false,'new matrix clears old obstruction');
 assert.equal(exact,4);
 masonry.geometry={};masonry.hit=true;
 const unsupported=stage.createDiagnosticSampler([masonry]);
 assert.equal(unsupported(from,to),true,'invalid geometry retains native original raycast');
 assert.equal(native,1);
 assert.equal(unsupported(from,{x:NaN,y:1,z:0}),false,'malformed body point cannot corrupt audit');
 assert.equal(stage.metrics().diagnosticRays,6);
 assert.equal(stage.metrics().diagnosticBlocked,5);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/actorOcclusionStage\.createDiagnosticSampler\(obstacles\)/);
 assert.match(app,/auditDurationMs:/);
});
