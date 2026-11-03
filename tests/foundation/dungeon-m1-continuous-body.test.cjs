'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/cinematic-figure.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
test('original skinned anatomical links connect 14 real adjacent body pieces without ghost joints',async()=>{
 const {CINEMATIC_ANATOMY_LINKS:links,planCinematicFigure,planAnatomyBridge}=await load();
 assert.equal(links.length,14);
 assert.equal(new Set(links.map(([a,b])=>[a,b].join(':'))).size,links.length);
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const names=new Set(planCinematicFigure(kind).pieces.map(x=>x.id));
  for(const [a,b] of links){assert.ok(names.has(a),a);assert.ok(names.has(b),b)}
 }
 assert.equal(planAnatomyBridge(0).visible,false);
 assert.equal(planAnatomyBridge(Infinity).visible,false);
 assert.equal(planAnatomyBridge(5).visible,false);
 // Actual browser evidence: long tubes are visible regressions, not anatomy.
 assert.equal(planAnatomyBridge(.35).visible,false);
 assert.equal(planAnatomyBridge(.44,2.3).visible,false);
 assert.equal(planAnatomyBridge(.029).visible,false);
 const normal=planAnatomyBridge(.20),boss=planAnatomyBridge(.20,2.3);
 assert.equal(normal.visible,true);assert.equal(boss.visible,true);
 assert.ok(boss.radius>normal.radius);
 assert.ok(normal.length>.20&&normal.length<.24);
 assert.ok(normal.radius<.06);
});
test('true displacement drives torso/pelvis/shoulders and native knees with bounded opposite balance',async()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/rig-attachment-plan.js'),'utf8');
 const {planRigFullBodyStride,planRigLegGesture}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const p=planRigFullBodyStride(kind,Math.PI/2,1);
  assert.ok(p.hips.yaw*p.chest.yaw<0&&p.arms.left.pitch*p.arms.right.pitch<0);
  assert.ok(Math.abs(p.hips.yaw)<.06&&Math.abs(p.arms.left.pitch)<.10);
  assert.deepEqual(planRigFullBodyStride(kind,0,0),planRigFullBodyStride(kind,0,1,true));
  assert.deepEqual(planRigFullBodyStride(kind,NaN,1),planRigFullBodyStride(kind,0,1));
  assert.ok(planRigLegGesture(Math.PI/2,1).right.lower>.05);
 }
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/stageRigGroundedStride\(actor,reducedMotion\);[\s\S]*stageRigPelvisAfterMixer\(actor\)/);
 assert.match(model,/rigFullBodyStridePeakRad:/);
 assert.doesNotMatch(source,/Math\.random|performance\.now|DungeonRuntime|fetch\(/);
});
test('single original instanced gambeson follows current native bones with no game authority changes',()=>{
 const figure=fs.readFileSync(source,'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(figure,/new T\.InstancedMesh\(bridgeGeometry,mat\.cloth,CINEMATIC_ANATOMY_LINKS\.length\)/);
 assert.match(figure,/const bridgeGeometry=createGambesonGusset\(T\)/);
 assert.doesNotMatch(figure,/const bridgeGeometry=new T\.CylinderGeometry/);
 assert.match(figure,/a\.getWorldPosition\(bridgeStart\)\.applyMatrix4\(inverseGroup\)/);
 assert.match(figure,/b\.getWorldPosition\(bridgeEnd\)\.applyMatrix4\(inverseGroup\)/);
 assert.match(figure,/bridge\.setMatrixAt\(i,pose\)/);
 assert.match(figure,/bridge\.instanceMatrix\.needsUpdate=true/);
 assert.match(model,/cinematicActiveAnatomyBridges:/);
 assert.doesNotMatch(figure,/Math\.random|fetch\(|DungeonRuntime|https?:/);
});
test('Warden camera reveals genuine face only after combat/collision screening',()=>{
 const plan=fs.readFileSync(path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js'),'utf8');
 assert.match(plan,/const faceBonus=2\.8\*Math\.max\(0,heroFace\)\+\.65\*Math\.max\(0,bossFace\)/);
 assert.match(plan,/heroFacialVisibility:Number\(best\.heroFace\.toFixed\(3\)\)/);
 assert.match(plan,/nearWall\(xHero,zHero\)\+nearWall\(xBoss,zBoss\)/);
 assert.doesNotMatch(plan,/Math\.random|fetch\(|DungeonRuntime/);
});
