'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const original=()=>({
  runToken:'public-guardian-court', lifecycle:'running', result:null,
  width:5,height:5,currentCell:6,
  visibleCells:[6,7,8,11],
  cells:[
    {cell:6,blocked:false,neighbors:[7,11]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]},
    {cell:11,blocked:false,neighbors:[6]},
  ],doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8}]
});
test('guardian performance court is ONLY an authentic, reciprocal, open, visible public corridor',async()=>{
 const {publicGuardianStageCells:stage}=await load();
 const s=original(),before=JSON.stringify(s);
 assert.deepEqual([...stage(s)].sort((a,b)=>a-b),[6,7,8,11]);
 assert.equal(JSON.stringify(s),before,'read-only presentation cannot mutate AI truth');
 assert.deepEqual([...stage({...s,visibleCells:[6,7,11]})],[],
   'a threat hidden from the public snapshot cannot stage a court');
 assert.deepEqual([...stage({...s,visibleCells:[6,8,11]})],[],
   'unknown intermediate cell cannot create a transparent fake passage');
 assert.deepEqual([...stage({...s,doors:[{a:7,b:8,open:false}]})],[],
   'the real closed gate stays impassable and visually unrevealed');
 assert.deepEqual([...stage({...s,cells:s.cells.map(c=>c.cell===7?{...c,neighbors:[6]}:c)})],[],
   'one-way disclosure is not reciprocal');
 assert.deepEqual([...stage({...s,threats:[{id:'thornback',cell:12}]})],[],
   'diagonal proximity is not a real two-edge line of sight');
 assert.deepEqual([...stage({...s,lifecycle:'ended'})],[]);
 assert.deepEqual([...stage({...s,result:{reason:'captured'}})],[]);
 assert.deepEqual([...stage({...s,threats:[]})],[]);
 assert.deepEqual([...stage({...s,privateMaze:{cells:[{cell:9,neighbors:[8]}]},
   secretPath:[6,7,8]})].sort((a,b)=>a-b),[6,7,8,11],
   'private data cannot broaden the physical disclosure');
});
test('actual installed Three.js world stages quiet real floor without replacing stairs/walls or GPU pools',async()=>{
 const {createMazeWorld,publicGuardianStageCells}=await load();
 const w=createMazeWorld({balanced:true}),s=original();
 const originalTruth=JSON.stringify(s),initial=w.stats();
 w.update(s);
 const now=w.stats();
 assert.equal(now.guardianCourtTiles,4,'actual four published safe cells receive the uncluttered native court');
 assert.equal(now.renderedCells.length,4,'only disclosed source tiles are drawn');
 assert.equal(now.tideFossilAlcoves,0,'no tall non-gameplay fossil sails obscure actual characters');
 assert.ok(now.instances>0,'the court exists as real batched Three meshes, not dashboard copy');
 assert.equal(now.geometryCount,initial.geometryCount,'reuses pooled geometry, without new GPU classes');
 assert.equal(now.materialCount,initial.materialCount);
 assert.equal(JSON.stringify(s),originalTruth,'no public state, player move or AI edit');
 const hidden={...s,visibleCells:[6,7,11]};
 w.update(hidden);
 assert.equal(w.stats().guardianCourtTiles,0,'no remembered or hidden threat gets a visible court');
 for(let i=0;i<6;i++){
   w.update({...s,runToken:'guardian-reset-'+i});
   const metrics=w.stats();
   assert.ok(metrics.geometryCount<100,'strict six-run geometry budget never relaxed');
   assert.equal(metrics.guardianCourtTiles,4);
 }
 assert.deepEqual([...publicGuardianStageCells(s)].sort((a,b)=>a-b),[6,7,8,11]);
 w.dispose();
 assert.equal(w.stats().geometryCount,0);
 assert.equal(w.stats().materialCount,0);
});

test('a publicly witnessed guardian clears tall ornamental tops on sealed adjacent stone, never hidden stone',async()=>{
 const {createMazeWorld,publicGuardianStageCells,publicGuardianBlockedReliefCells:relief}=await load();
 const s=original();
 s.visibleCells.push(5,9,12);
 s.cells.push(...[5,9,12].map(cell=>({cell,blocked:true,neighbors:[]})));
 const truth=JSON.stringify(s);
 assert.deepEqual([...publicGuardianStageCells(s)].sort((a,b)=>a-b),[6,7,8,11]);
 assert.deepEqual([...relief(s)].sort((a,b)=>a-b),[5,9,12]);
 const unseen={...s,visibleCells:s.visibleCells.filter(id=>id!==12)};
 assert.deepEqual([...relief(unseen)].sort((a,b)=>a-b),[5,9]);
 const closed={...s,doors:[{a:7,b:8,open:false}]};
 assert.deepEqual([...relief(closed)],[],'a sealed guardian route earns no new sightline');
 assert.deepEqual([...relief({...s,result:{reason:'capture'}})],[]);
 assert.deepEqual([...relief({...s,privateMaze:{cells:[{cell:4,blocked:true}]},
   secretPath:[6,7,8]})].sort((a,b)=>a-b),[5,9,12],
   'private state cannot inform decorative cutaway');
 const w=createMazeWorld({balanced:true}),before=w.stats();
 w.update(s);
 const now=w.stats();
 assert.equal(now.guardianBlockedReliefTiles,3,'actual new low relief occupies three genuine blocked cells');
 assert.equal(now.guardianCourtTiles,4,'main public encounter court is unchanged');
 assert.equal(now.renderedCells.length,7,'never materialise an unrevealed cell');
 assert.equal(now.geometryCount,before.geometryCount,'no additional GPU class');
 assert.equal(now.materialCount,before.materialCount);
 assert.equal(JSON.stringify(s),truth,'no authoritative state changes');
 w.update(unseen);
 assert.equal(w.stats().guardianBlockedReliefTiles,2);
 for(let i=0;i<6;i++){
   w.update({...s,runToken:'guardian-stone-reset-'+i});
   assert.equal(w.stats().guardianBlockedReliefTiles,3);
   assert.ok(w.stats().geometryCount<100,'strict six-scene reset budget remains <100');
 }
 w.dispose();
 assert.equal(w.stats().geometryCount,0);
 assert.equal(w.stats().materialCount,0);
});


test('one real guardian duel earns a continuous public, level, open physical causeway—not a secret route',async()=>{
 const {publicGuardianCausewayCells:causeway,createMazeWorld}=await load();
 const s=original(),truth=JSON.stringify(s);
 assert.deepEqual([...causeway(s)],[[6,'x'],[7,'x'],[8,'x']],
   'a two-edge horizontal actor encounter becomes exactly three real published stage tiles');
 assert.deepEqual([...causeway({...s,visibleCells:[6,7,11]})],[],
   'hidden threat cannot draw a public stage');
 assert.deepEqual([...causeway({...s,doors:[{a:7,b:8,open:false}]})],[],
   'gated and authoritative impassable paths cannot gain a false floor connection');
 assert.deepEqual([...causeway({...s,cells:s.cells.map(c=>c.cell===7?{...c,neighbors:[6]}:c)})],[],
   'one-way or forged public neighbor data is never enough');
 assert.deepEqual([...causeway({...s,threats:[{id:'thornback',cell:11}]})],[],
   'real traversable stairs retain their vertical geometry, never a fake flat causeway');
 assert.deepEqual([...causeway({...s,keys:[{id:'actual-key',cell:7,collected:false}]})],[],
   'a public collectible is not covered by a new floor shape');
 assert.deepEqual([...causeway({...s,result:{reason:'captured'}})],[]);
 assert.deepEqual([...causeway({...s,lifecycle:'ended'})],[]);
 assert.deepEqual([...causeway({...s,privateMaze:{cells:[{cell:9,blocked:false,neighbors:[8]}]},
   secretPath:[6,7,8]})],[[6,'x'],[7,'x'],[8,'x']]);
 assert.equal(JSON.stringify(s),truth,'scene causeway never edits authoritative truth');
 const world=createMazeWorld({balanced:true}),initial=world.stats();
 world.update(s);
 assert.equal(world.stats().guardianCausewayTiles,3,'all three physical course tiles are source bound');
 assert.equal(world.stats().guardianCourtTiles,4,'authentic side-step court remains intact');
 assert.equal(world.stats().geometryCount,initial.geometryCount,'reuses original installed Three shape pools');
 assert.equal(world.stats().materialCount,initial.materialCount);
 world.update({...s,doors:[{a:7,b:8,open:false}]});
 assert.equal(world.stats().guardianCausewayTiles,0,'a closed public gate revokes the duel stage');
 world.update({...s,visibleCells:[6,7,11]});
 assert.equal(world.stats().guardianCausewayTiles,0,'hidden guardian revokes it immediately');
 for(let i=0;i<6;i++) {
   world.update({...s,runToken:'guardian-causeway-reset-'+i});
   assert.equal(world.stats().guardianCausewayTiles,3);
   assert.ok(world.stats().geometryCount<100,'do not relax unchanged 6-run geometry budget');
 }
 world.dispose();
 assert.equal(world.stats().geometryCount,0);
 assert.equal(world.stats().materialCount,0);
});


test('witnessed guardian visibly actuates only the true public Tideglass causeway, without a fake attack or GPU churn',async()=>{
  const {createMazeWorld}=await load();
  const s=original(),truth=JSON.stringify(s),world=createMazeWorld({balanced:true});
  const budget=world.stats();
  const leaf=(cell,side)=>world.group.getObjectByName('Published guardian warning floor leaf '+cell+' '+side);
  world.update(s);
  assert.equal(world.stats().guardianTideSignalTiles,3,'three joined real public causeway cells earn physical floor leaves');
  const real=[6,7,8].flatMap(cell=>[-1,1].map(side=>leaf(cell,side)));
  assert.ok(real.every(Boolean),'six actual attached original Three meshes, not an overlay or counted fiction');
  // True 390px full-frame Pass299 still showed separated small tiles and no
  // legible guardian-wide moving floor. The three public stage cells now join
  // as one continuous dark spine with long paired side leaves, while leaving
  // the real central walking space open. These are actual connected meshes,
  // not altered acceptance bounds or a new collision/safe-route promise.
  assert.ok(real.every(mesh=>Math.max(mesh.scale.x,mesh.scale.z)>=2.29),
    'each physical warning leaf spans a whole genuine published tile');
  assert.ok(real.every(mesh=>Math.min(mesh.scale.x,mesh.scale.z)>=.60),
    'wide genuine attached leaf is substantial enough to rise at native mobile scale');
  const hinges=real.map(mesh=>mesh.parent);
  assert.ok(hinges.every((hinge,i)=>hinge?.isGroup
    &&Math.abs(hinge.position.z)>=.68 && Math.abs(hinge.position.x)<1e-8
    &&Math.abs(real[i].position.z)>=.30),
    'each real margin root lies outside Pip’s clear central lane, joined to its full-size leaf');
  const roots=[6,7,8].flatMap(cell=>[-1,1].map(side=>
    world.group.getObjectByName('Published guardian Tideglass hinge root '+cell+' '+side)));
  assert.ok(roots.every(Boolean),'six tangible dark rooted hinge rails anchor the leaves to real disclosed terrain');

  const sourceMaterials=new Set(real.map(mesh=>mesh.material));
  assert.equal(sourceMaterials.size,1,'neutral floor has one pooled sea-glass material');
  assert.equal(world.stats().geometryCount,budget.geometryCount);
  assert.equal(world.stats().materialCount,budget.materialCount);
  world.animate(0,{guardianCell:8,guardianBeat:0,reducedMotion:false});
  const {Vector3}=await import(three);
  const before=real.map((mesh,i)=>({m:mesh.material,r:hinges[i].rotation.x}));
  world.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
  world.group.updateMatrixWorld(true);
  const raised=real.map(mesh=>mesh.getWorldPosition(new Vector3()).y);
  for(let i=0;i<real.length;i++){
    assert.notEqual(real[i].material,before[i].m,'actual witnessed brace lights the full connected threshold');
    assert.ok(Math.abs(hinges[i].rotation.x)>1.0,
      'real outer-margin hinge opens over one radian, not a microscopic floor tilt');
    assert.ok(raised[i]>real[i].parent.parent.position.y+.20,
      'actual attached plate centre rises substantially above its world floor');
  }
  const braceAngle=Math.abs(hinges[0].rotation.x);
  world.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
  assert.ok(Math.abs(hinges[0].rotation.x)<braceAngle,
    'genuine release folds the real rooted leaf down rather than inventing a strike');
  world.animate(1,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
  assert.ok(real.every((mesh,i)=>mesh.material===before[i].m&&hinges[i].rotation.x===0),
    'unpublished enemy ID instantly revokes all signal, including root hinge transforms');
  world.animate(1,{guardianCell:8,guardianBeat:1,reducedMotion:true});
  assert.ok(hinges.every(hinge=>hinge.rotation.x===0),
    'reduced motion holds a static witnessed warning without turning hardware');
  world.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
  assert.equal(world.stats().geometryCount,budget.geometryCount,'animated warning never creates new GPU shapes');
  assert.equal(world.stats().materialCount,budget.materialCount,'animated warning reuses the installed material pool');
  world.update({...s,visibleCells:[6,7,11]});
  assert.equal(world.stats().guardianTideSignalTiles,0,'hidden guardian removes its entire 3D warning lane');
  world.update({...s,doors:[{a:7,b:8,open:false}]});
  assert.equal(world.stats().guardianTideSignalTiles,0,'sealed door never receives a false continuous warning');
  world.update({...s,result:{reason:'capture'}});
  assert.equal(world.stats().guardianTideSignalTiles,0,'terminal result clears stage and warning');
  for(let i=0;i<6;i++){
    world.update({...s,runToken:'tideglass-signal-reset-'+i});
    assert.equal(world.stats().guardianTideSignalTiles,3);
    assert.ok(world.stats().geometryCount<100,'strict six-run geometry ceiling unchanged');
  }
  assert.equal(JSON.stringify(s),truth,'no mutation of autonomous game state or public knowledge');
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
});


test('authentic guardian lane lowers ONLY disclosed impassable flanks; hidden, gated and private walls stay sealed',async()=>{
  const {createMazeWorld}=await load();
  const s=original();
  s.visibleCells.push(5,9);
  s.cells.push(...[5,9].map(cell=>({cell,blocked:true,neighbors:[]})));
  const truth=JSON.stringify(s),world=createMazeWorld({balanced:true}),baseline=world.stats();
  world.update(s);
  assert.equal(world.stats().guardianCausewayTiles,3);
  assert.equal(world.stats().guardianSightlineParapets,2,
    'two real publicly blocked side walls gain low SOLID caps, not tall camera obstructions');
  assert.equal(world.stats().pressureStageParapets,0);
  assert.equal(world.stats().geometryCount,baseline.geometryCount);
  assert.equal(world.stats().materialCount,baseline.materialCount);
  world.update({...s,visibleCells:s.visibleCells.filter(id=>id!==9)});
  assert.equal(world.stats().guardianSightlineParapets,1,
    'an undisclosed neighboring wall must retain the normal full solid silhouette');
  world.update({...s,doors:[{a:7,b:8,open:false}]});
  assert.equal(world.stats().guardianSightlineParapets,0,
    'no connected duel or false open flank exists beyond a closed gate');
  world.update({...s,visibleCells:[6,7,11,5,9]});
  assert.equal(world.stats().guardianSightlineParapets,0,
    'hidden guardian cannot preserve an old sightline');
  world.update({...s,result:{reason:'capture'}});
  assert.equal(world.stats().guardianSightlineParapets,0);
  world.update({...s,privateMaze:{cells:[{cell:10,blocked:true}]},secretPath:[6,7,8]});
  assert.equal(world.stats().guardianSightlineParapets,2,
    'private truth never adds a decorative opening');
  for(let i=0;i<6;i++){
    world.update({...s,runToken:'guardian-opaque-cutaway-'+i});
    assert.equal(world.stats().guardianSightlineParapets,2);
    assert.ok(world.stats().geometryCount<100,
      'six-run installed-Three geometry budget stays strict');
  }
  assert.equal(JSON.stringify(s),truth);
  world.dispose();
  assert.equal(world.stats().guardianSightlineParapets,0);
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
});
