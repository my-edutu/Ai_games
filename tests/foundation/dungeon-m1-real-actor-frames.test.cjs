const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
const modulePath=path.join(__dirname,'../../public/ai-dungeon/actor-screen-readability.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(modulePath)).toString('base64'));
const project=(camera)=>point=>new THREE.Vector3(point.x,point.y,point.z).project(camera);
function camera(){const c=new THREE.PerspectiveCamera(45,390/658,.1,100);c.position.set(0,7,9);c.lookAt(0,1,0);c.updateMatrixWorld();return c;}
const actor=(id,z,role)=>({id,kind:role,faction:role==='warden'||role==='revenant'?'enemy':'party',hp:40,
 points:[{x:0,y:.08,z},{x:0,y:.9,z},{x:0,y:1.84,z}]});
test('true projected native body anchors identify engaged actors and distinguish distant living teammates',async()=>{
 const {planRealActorScreenReadability}=await load();const c=camera();
 const result=planRealActorScreenReadability([actor('vanguard',0,'vanguard'),actor('warden',0,'warden'),actor('ranger',-6,'ranger')],
  {project:project(c),width:390,height:658,criticalIds:['vanguard','warden'],maxActors:8});
 assert.deepEqual(result.criticalActorIds,['vanguard','warden']);
 assert.equal(result.actors.length,3);
 const v=result.actors.find(a=>a.id==='vanguard'),r=result.actors.find(a=>a.id==='ranger');
 assert(v.bodyHeightPx>r.bodyHeightPx,'physically farther character gets fewer pixels');
 assert.equal(v.critical,true);assert.equal(r.critical,false);
 assert.equal(result.minimumCriticalPx,Math.min(...result.actors.filter(a=>a.critical&&a.inFrame).map(a=>a.visibleHeightPx)));
 assert.equal(result.method,'projected 3D body anchors; NOT verified silhouette pixels or occlusion');
});
test('no fabricated pixel dimensions for behind-camera, dead, invalid or beyond resource cap',async()=>{
 const {planRealActorScreenReadability}=await load();const c=camera();
 const actors=[actor('vanguard',0,'vanguard'),actor('behind',20,'revenant'),{...actor('dead',0,'ranger'),hp:0},actor('outside',30,'warden')];
 const out=planRealActorScreenReadability(actors,{project:project(c),width:390,height:658,criticalIds:['behind'],maxActors:3});
 assert(out.actors.length<=3);assert(!out.actors.some(a=>a.id==='dead'));
 assert.equal(out.actors.find(a=>a.id==='behind')?.inFrame,false);
 assert.equal(out.minimumCriticalPx,0);
 assert.equal(planRealActorScreenReadability(actors,{project:project(c),width:0,height:658}).status,'UNAVAILABLE');
});
