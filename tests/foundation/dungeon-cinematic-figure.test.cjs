'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=path.join(root,'public/ai-dungeon/cinematic-figure.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(src)).toString('base64'))}
test('six physical figures include the sculpted phase-responsive Warden and truthful hand-bound weapons',async()=>{
 const {planCinematicFigure}=await load(),roles=['vanguard','ranger','mystic','revenant','cultist','warden'],signatures=new Set();
 for(const role of roles){
  const r=planCinematicFigure(role);
  assert.equal(r.statureMeters,role==='warden'?2.30:1.82);
  assert.ok(r.pieces.length>=22&&r.pieces.length<=(role==='warden'?30:24));
  if(role==='warden')assert.ok(r.pieces.some(p=>p.id==='oathbreaker-keel')&&r.pieces.some(p=>p.id==='oathbreaker-left-knee'));
  assert.equal(new Set(r.pieces.map(p=>p.id)).size,r.pieces.length);
  assert.ok(r.pieces.some(p=>p.id==='helmet')&&r.pieces.some(p=>p.id==='torso'));
  assert.ok(r.pieces.filter(p=>p.id.includes('boot')).length===2);
  assert.equal(r.pieces.find(p=>p.id==='true-hand-weapon').anchor,'rightHand');
  assert.ok(r.pieces.every(p=>[p.x,p.y,p.z,p.sx,p.sy,p.sz].every(Number.isFinite)));
  signatures.add(r.palette.metal+'|'+r.weapon);
 }
 assert.equal(signatures.size,6);
 assert.equal(planCinematicFigure('not-a-faction'),null);
});
test('a missing native limb or hand retains original character, never a half-built replacement',async()=>{
 const {planFigureJointCoverage,CRITICAL_FIGURE_JOINTS}=await load();
 const joints=Object.fromEntries(CRITICAL_FIGURE_JOINTS.map(k=>[k,{isBone:true}]));
 assert.equal(planFigureJointCoverage(joints).valid,true);
 delete joints.rightForearm;
 assert.equal(planFigureJointCoverage(joints).valid,false);
 assert.ok(planFigureJointCoverage(joints).missing.includes('rightForearm'));
});
test('actual renderer and server bind figures with fallback, bounded GPU and no new simulation input',()=>{
 const body=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const code=fs.readFileSync(src,'utf8');
 assert.match(body,/actor\.nativePresentation=\{mode:'original-continuous-rig'/);
 assert.match(body,/if\(isBoss\)addWardenRegalia\(actor\)/,'new articulated boss retains genuine phase-driven regalia');
 assert.match(body,/cinematicBosses:/);
 assert.match(body,/cinematicSourceHidden:/);
 assert.match(server,/cinematic-figure\.js/);
 assert.match(code,/obj\.isMesh&&!obj\.userData\?\.cinematicFigurePiece/);
 assert.match(code,/hand\.attach\(grip\)/);
 assert.match(code,/grip\.position\.set\(0,0,0\)/,'the actual native hand must own the weapon grip');
 assert.match(code,/handGripOffsetMeters:gripOffset/);
 assert.doesNotMatch(code,/Math\.random|fetch\(|DungeonRuntime|performance\.now|https?:/);
});
test('six mirrored armour groups use separate true-bone poses while retaining all original physical parts',async()=>{
 const {planCinematicFigure,planCinematicPairedParts}=await load();
 for(const role of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const figure=planCinematicFigure(role),pairs=planCinematicPairedParts(role);
  assert.equal(pairs.length,6);
  const ids=pairs.flatMap(p=>p.parts.map(x=>x.id));
  assert.equal(ids.length,12);assert.equal(new Set(ids).size,12);
  assert.ok(ids.every(id=>figure.pieces.some(x=>x.id===id)));
  for(const p of pairs){
   assert.equal(p.parts[0].shape,p.parts[1].shape);
   assert.equal(p.parts[0].finish,p.parts[1].finish);
   assert.notEqual(p.parts[0].anchor,p.parts[1].anchor);
  }
 }
 assert.equal(planCinematicPairedParts('unknown').length,0);
 const code=fs.readFileSync(src,'utf8');
 const body=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(code,/new T\.InstancedMesh\(geometry\[pair\.shape\],mat\[pair\.finish\],2\)/);
 assert.match(code,/joints\[p\.anchor\]\.attach\(anchor\)/);
 assert.match(code,/pose\.multiplyMatrices\(inverseGroup,pair\.anchors\[i\]\.matrixWorld\)/);
 assert.match(code,/pair\.mesh\.setMatrixAt\(i,pose\)/);
 assert.match(code,/for\(const anchor of anchors\)anchor\.removeFromParent\(\)/);
 assert.match(body,/actor\.cinematicFigure\?\.sync\?\.\(\)/);
 assert.match(body,/actor\.cinematicFigure\?\.dispose\?\.\(\)/);
 assert.match(body,/cinematicPairedBatches:/);
});
test('original six-class heads have closed physical facial anatomy and split iron lenses without extra draw calls',()=>{
 const code=fs.readFileSync(src,'utf8');
 assert.match(code,/function createAnatomicalFace\(T,kind\)/);
 assert.match(code,/function createSplitVisor\(T\)/);
 assert.match(code,/forms\.visage=createAnatomicalFace\(T,kind\)/);
 assert.match(code,/forms\.eyes=createSplitVisor\(T\)/);
 assert.match(code,/indices\.push\(a,c,b,b,c,d\)/);
 assert.doesNotMatch(code,/Math\.random|fetch\(|https?:/);
});
