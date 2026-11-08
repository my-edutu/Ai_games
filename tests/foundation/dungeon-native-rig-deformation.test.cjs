'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/native-rig-deformation-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const bones=()=>[{name:'Hips',quaternion:[0,0,0,1],matrix:identity()},
 {name:'RightArm',quaternion:[0,.087,0,.996208],matrix:identity()}];
const sample=()=>({skinnedMeshes:7,bones:bones(),segments:[
 {name:'left-arm',from:[0,1.52,0],to:[.22,1.24,0],connected:true},
 {name:'left-forearm',from:[.22,1.24,0],to:[.39,1.03,0],connected:true},
 {name:'right-arm',from:[0,1.52,0],to:[-.22,1.24,0],connected:true},
 {name:'right-forearm',from:[-.22,1.24,0],to:[-.39,1.03,0],connected:true},
 {name:'left-thigh',from:[.14,.9,0],to:[.14,.52,.08],connected:true},
 {name:'left-calf',from:[.14,.52,.08],to:[.14,.10,.05],connected:true},
 {name:'right-thigh',from:[-.14,.9,0],to:[-.14,.52,.08],connected:true},
 {name:'right-calf',from:[-.14,.52,.08],to:[-.14,.10,.05],connected:true}
]});

test('genuine skinned-chain measurements remain finite with 8 original arm/leg joints',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const src=sample(),first=measure(src);
 assert.equal(first.segments.length,8);
 assert.equal(first.validSegments,8);
 assert.equal(first.disconnectedSegments,0);
 assert.equal(first.invalidSegments,0);
 assert.equal(first.invalidMatrixCount,0);
 assert.equal(first.invalidQuaternionCount,0);
 assert.ok(first.maxQuaternionError<.001);
 assert.equal(first.maxStretchFraction,0);
 assert.equal(first.skinnedMeshes,7);
 assert.deepEqual(measure(src,first).segments,first.segments);
 assert.equal(src.segments.length,8,'the audit must not mutate source samples');
});

test('leg length does not change under legal root translation or whole actor yaw',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const src=sample(),baseline=measure(src);
 const moved=sample();
 for(const s of moved.segments)for(const key of ['from','to']){
  const [x,y,z]=s[key];
  s[key]=[3+z,y,-2-x]; // rigid 90-degree turn + real world travel
 }
 const turn=measure(moved,baseline);
 assert.equal(turn.maxStretchFraction,0,'world travel and yaw cannot stretch source limb chains');
 assert.equal(turn.disconnectedSegments,0);
});

test('true broken joint hierarchy and physical limb stretch are independently flagged',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const baseline=measure(sample()),bad=sample();
 bad.segments[0].connected=false;
 bad.segments[2].to=[-.65,1.15,0];
 const report=measure(bad,baseline);
 assert.equal(report.disconnectedSegments,1);
 assert.ok(report.maxStretchFraction>.4);
 assert.equal(report.validSegments,7);
});

test('nonfinite bones, bad matrices, malformed segments and huge values cannot masquerade as valid source skeleton',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const bad=sample();
 bad.bones[0].quaternion=[NaN,0,0,1];
 bad.bones[1].matrix[7]=Infinity;
 bad.segments[0].from=[NaN,0,0];
 bad.segments[1].to=[Infinity,1,1];
 bad.segments[2].to=[100,0,0];
 const report=measure(bad);
 assert.equal(report.invalidQuaternionCount,1);
 assert.equal(report.invalidMatrixCount,1);
 assert.equal(report.invalidSegments,3);
 assert.ok(report.sampledBones<=128);
 assert.equal(measure(null).validSegments,0);
 assert.equal(measure({segments:[],bones:[]}).validSegments,0);
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/DungeonRuntime|Math\.random|fetch\(|performance\.now|Date\.now|requestAnimationFrame/);
});

test('real GLB deformation audit is explicitly sampled, bounded, and joined to actual browser evidence',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(model,/function inspectSourceRigDeformation\(actors\)/);
 assert.match(model,/const sourceRigDeformationBaselines=new WeakMap\(\)/);
 assert.match(model,/sourceRigDeformationBaselines\.set\(actor\.assetRoot,baseline\)/);
 assert.match(model,/export \{attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats,inspectSourceRigDeformation\}/);
 assert.match(app,/window\.__DUNGEON_SOURCE_RIG_DEFORMATION__=\(\)=>inspectSourceRigDeformation\(actors\)/);
 assert.match(server,/\/dungeon\/native-rig-deformation-plan\.js/);
 assert.match(browser,/__DUNGEON_SOURCE_RIG_DEFORMATION__/);
 assert.doesNotMatch(model,/requestAnimationFrame\([\s\S]*?inspectSourceRigDeformation\(/,
  'the expensive segment scan must be demand driven only');
});


test('live deformation reference comes from original inverse-bind matrices, never first moving pose',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/o\.skeleton\.boneInverses/);
 assert.match(model,/inverse\.clone\(\)\.invert\(\)/);
 assert.match(model,/baseline=measureSourceRigDeformation\(\{segments:bindSegments/);
 assert.doesNotMatch(model,/baseline=measureSourceRigDeformation\(sample\)/);
 assert.match(model,/bindReferenceComplete:actorsOut\.length>0&&actorsOut\.every/);
 assert.match(model,/sourceRigDeformationBaselines\.set\(actor\.assetRoot,baseline\)/);
});
