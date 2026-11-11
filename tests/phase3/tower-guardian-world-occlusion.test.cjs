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
