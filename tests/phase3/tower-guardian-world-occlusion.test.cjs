const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const file=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/guardian-world-occlusion.mjs');
let imported;
test('physical guardian sightline policy: blocked opaque torso rays drive a genuine two-body improvement',async()=>{
  imported ||= await import(pathToFileURL(file).href);
  const {weightedGuardianWorldOcclusion,selectGuardianWorldShoulder}=imported;
  const hero={x:1,y:2,z:3},guardian={x:5,y:3,z:2};
  const base=weightedGuardianWorldOcclusion((x,y)=>x===1||x===5,hero,guardian,1,2);
  const clear=weightedGuardianWorldOcclusion(()=>false,hero,guardian,1,2);
  assert.deepEqual(base,{heroBlocked:2,guardianBlocked:2,weighted:10});
  assert.deepEqual(clear,{heroBlocked:0,guardianBlocked:0,weighted:0});
  assert.deepEqual(selectGuardianWorldShoulder(base,clear,base),
    {direction:-1,weighted:0,heroBlocked:0,gain:10});
  assert.equal(selectGuardianWorldShoulder(clear,base,clear),null);
  assert.equal(selectGuardianWorldShoulder(base,base,base),null);
  assert.equal(selectGuardianWorldShoulder(base,
    {heroBlocked:3,guardianBlocked:0,weighted:0},base),null);
});
test('real guardian camera cannot cut instantly, predict, or accept unbounded time',async()=>{
  imported ||= await import(pathToFileURL(file).href);
  const {boundedGuardianWorldAngle,weightedGuardianWorldOcclusion}=imported;
  assert.equal(boundedGuardianWorldAngle(0,.25,.016),.016*.95);
  assert.equal(boundedGuardianWorldAngle(0,.25,.2),null);
  assert.equal(boundedGuardianWorldAngle(0,Infinity,.016),null);
  assert.equal(boundedGuardianWorldAngle(.2,.21,.016),.21);
  assert.equal(weightedGuardianWorldOcclusion(()=>true,{x:1,y:0,z:0},null,1,2),null);
});
test('real source guardian integration uses opaque Three scene triangles, preserves real actor/core/landing vetoes',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(scene,/raycastGuardianWorldOcclusion/);
 assert.match(scene,/guardianWorldRay\.intersectObjects\(world\.group\.children,true/);
 assert.match(scene,/selectGuardianWorldShoulder\(baseWorldRay,/);
 assert.match(scene,/towerCoreSightlineClear\(candidateWorldPos,actorFramePoint,23\.5\)/);
 assert.match(scene,/worldGuardianLanding/);
 assert.match(scene,/Math\.abs\(orbit\) < \.025/);
 assert.match(scene,/guardianWorldOcclusion: \{/);
});

test('no actor can be newly obscured to improve the aggregate physical score',async()=>{
  imported ||= await import(pathToFileURL(file).href);
  const {selectGuardianWorldShoulder:select,guardianWorldStepSafe:step}=imported;
  const rays=(heroBlocked,guardianBlocked)=>({heroBlocked,guardianBlocked,
    weighted:heroBlocked*3+guardianBlocked*2});
  assert.equal(select(rays(2,0),rays(0,1),null),null);
  assert.equal(select(rays(0,1),rays(0,0),null)?.gain,2);
  assert.equal(step(rays(1,0),rays(0,1)),false);
  assert.equal(step(rays(1,0),rays(1,0)),true);
  assert.equal(step(rays(1,0),null),false);
});
test('the actual helmet ray and bounded vertical recovery protect the current physical pose',async()=>{
  imported ||= await import(pathToFileURL(file).href);
  const {weightedGuardianWorldOcclusion:measure,boundedGuardianWorldLift:lift}=imported;
  assert.equal(measure((x,y)=>x===1&&y>=2.9,
    {x:1,y:2,z:3},{x:5,y:3,z:2},1,2).heroBlocked,1);
  assert.equal(lift(10,14,.05),10.175);
  assert.equal(lift(10,10.1,.05),10.1);
  assert.equal(lift(10,14,.2),null);
});
test('final F8 physical corridor is not portrait-only and checks the actual step before rendering',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const start=scene.indexOf('const worldRayActive =');
  const end=scene.indexOf('const worldRayEpisode=',start);
  assert.ok(start>=0&&end>start);
  const guard=scene.slice(start,end);
  assert.doesNotMatch(guard,/protectLivingGuardian|\bportrait\b/);
  assert.match(guard,/options\.reducedMotion/);
  assert.match(guard,/sourceGuardian\.health > 0/);
  const actual=scene.indexOf('const actualStep=nextAngle');
  assert.ok(actual>scene.indexOf("auditF9Camera('final-after-scale'"));
  assert.ok(actual<scene.indexOf('renderer.render(scene, camera)',actual));
  assert.match(scene,/guardianWorldStepSafe\(baseWorldRay,actualStep\)/);
});
