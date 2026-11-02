'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/fabric-drape-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

test('Round 36: fabric hem actually bends in 3D while stitched shoulders stay anchored',async()=>{
 const {planDrapeVertexBend}=await load();
 assert.equal(typeof planDrapeVertexBend,'function');
 for(const action of ['idle','move','attack','cast','hurt','guard','other']){
  for(const age of [0,.05,.12,.25,.45,1,5,-50,Infinity,NaN]){
   for(const u of [0,.25,.5,.75,1]){
    const atTop=planDrapeVertexBend(0,u,action,age,false);
    assert.deepEqual(atTop,{x:0,y:0,z:0},'shoulder seam remains pinned');
    const bottom=planDrapeVertexBend(1,u,action,age,false);
    for(const key of ['x','y','z'])assert.ok(Number.isFinite(bottom[key])&&Math.abs(bottom[key])<=.19,key+' physically bounded');
    assert.deepEqual(planDrapeVertexBend(1,u,action,age,true),{x:0,y:0,z:0},'reduced-motion keeps rest mesh');
   }
  }
 }
 const walk=planDrapeVertexBend(1,.5,'move',.25);
 const idle=planDrapeVertexBend(1,.5,'idle',.25);
 assert.ok(Math.abs(walk.z-idle.z)>.025,'actual travelling cape hem should lag behind walking');
 assert.ok(Math.abs(walk.z)>Math.abs(planDrapeVertexBend(.15,.5,'move',.25).z)*3,'hem must bend more than neck');
 assert.deepEqual(planDrapeVertexBend(1,.5,'move',.25),walk,'replay-safe frame pose');
});

test('Round 36: invalid inputs do not poison GPU buffers or consume gameplay RNG',async()=>{
 const {planDrapeVertexBend}=await load();
 for(const args of [[NaN,.5,'move',.2],[.5,Infinity,'move',.2],[-10,2,'idle',1],[Infinity,.5,'attack',0]]){
  const pose=planDrapeVertexBend(...args);
  assert.ok(['x','y','z'].every(key=>Number.isFinite(pose[key])&&Math.abs(pose[key])<=.19));
 }
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});

test('Round 36: actual GLB cloth geometry changes its vertex positions and reports bounded real movement',()=>{
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(assets,/planDrapeVertexBend\(/);
 assert.match(assets,/restPositions/);
 assert.match(assets,/\.needsUpdate=true/);
 assert.match(assets,/draperyPeakDeformationMeters:/);
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.ok(pkg.scripts['dungeon:test'].includes('dungeon-drape-deformation.test.cjs'),'focused suite actually discovers new tests');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-fabric-drape.spec.cjs'),'utf8');
 assert.ok(browser.includes('draperyPeakDeformationMeters'),'real-browser evidence gate required');
});


test('Round 54: cloth pose cache has a canonical rest key and preserves moving deformation',async()=>{
 const {drapePoseKey}=await load();
 const rest=drapePoseKey('attack',.63,false);
 assert.equal(rest,drapePoseKey('attack',5,false));
 assert.equal(rest,drapePoseKey('hurt',.43,false));
 assert.equal(rest,drapePoseKey('cast',.69,false));
 assert.equal(rest,drapePoseKey('guard',.49,false));
 assert.equal(rest,drapePoseKey('idle',1,true));
 assert.equal(rest,drapePoseKey('move',.1,true));
 assert.equal(rest,drapePoseKey('not-an-action',.1,false));
 for(const action of ['idle','move','attack','cast','hurt','guard']){
  assert.equal(drapePoseKey(action,1.25,false),drapePoseKey(action,1.25,false));
  assert.equal(typeof drapePoseKey(action,0,false),'string');
 }
 assert.notEqual(drapePoseKey('move',.10),drapePoseKey('move',.20),'moving fabric cannot freeze');
 assert.notEqual(drapePoseKey('idle',.10),drapePoseKey('idle',.20),'breathing fabric cannot freeze');
 assert.notEqual(drapePoseKey('attack',.10),drapePoseKey('attack',.25),'strike keeps wind-up and follow-through');
 assert.notEqual(drapePoseKey('cast',.20),drapePoseKey('cast',.35),'cast cloth stays alive');
 for(const age of [NaN,Infinity,-Infinity,-100,0,1e30]){
  assert.equal(typeof drapePoseKey('move',age,false),'string');
  assert.ok(drapePoseKey('move',age,false).length<40,'cache keys remain finite and bounded');
 }
});

test('Round 54: GLB fabric skips redundant CPU vertex and normal work without dropping rest recovery',()=>{
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(assets,/import \{[^}]*drapePoseKey[^}]*\} from '\/dungeon\/fabric-drape-plan\.js'/);
 assert.match(assets,/if\(poseKey!==actor\.draperyPoseKey\)/);
 assert.match(assets,/actor\.draperyPoseKey=poseKey/);
 assert.match(assets,/draperyFramesSkipped/);
 assert.match(assets,/draperyNormalRebuilds/);
 assert.match(assets,/position\.needsUpdate=true/);
 assert.match(assets,/computeVertexNormals\(\)/);
 assert.match(assets,/actor\.draperyPoseKey=null/,'floor/restart disposal resets the cache');
});
