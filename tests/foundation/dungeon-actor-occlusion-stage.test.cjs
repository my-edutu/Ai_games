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
