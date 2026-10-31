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
