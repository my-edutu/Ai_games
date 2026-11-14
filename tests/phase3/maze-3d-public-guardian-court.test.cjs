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


test('Pass302 real public duel becomes a full-width joined Tideglass stage, never a private or gated bridge',async()=>{
  const {createMazeWorld,cellPosition}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const w=createMazeWorld({balanced:true}),s=original();
  const originalTruth=JSON.stringify(s),baseline=w.stats();
  const publishedAprons=()=>{
    const found=[],matrix=new Matrix4(),position=new Vector3(),
      quaternion=new Quaternion(),scale=new Vector3();
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh || mesh.material?.color?.getHexString()!=='28574f')return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,matrix);
        matrix.decompose(position,quaternion,scale);
        if(Math.abs(scale.y-.013)<.0001 && Math.abs(scale.x-2.34)<.001
          && Math.abs(scale.z-2.22)<.001)
          found.push({x:position.x,z:position.z});
      }
    });
    return found;
  };
  try {
    w.update(s);
    const stage=publishedAprons();
    assert.equal(stage.length,3,'three real open public tiles form one full-width colored physical court');
    const expected=[6,7,8].map(id=>cellPosition(id,s.width,s.height).x).sort((a,b)=>a-b);
    const actual=stage.map(p=>p.x).sort((a,b)=>a-b);
    assert.ok(actual.every((x,i)=>Math.abs(x-expected[i])<1e-6),
      'full-size dark mineral stage stays on the exact public cells within installed Three Float32 instance precision');
    assert.equal(w.stats().geometryCount,baseline.geometryCount);
    assert.equal(w.stats().materialCount,baseline.materialCount);
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(publishedAprons().length,0,'closed original gate revokes full-width court');
    w.update({...s,visibleCells:[6,7,11]});
    assert.equal(publishedAprons().length,0,'undisclosed guardian revokes stage');
    w.update({...s,result:{reason:'capture'}});
    assert.equal(publishedAprons().length,0,'terminal outcomes clear public encounter');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'full-tideglass-reset-'+i});
      assert.equal(publishedAprons().length,3);
      assert.ok(w.stats().geometryCount<100,'six-reset GPU geometry strict bound remains');
    }
    assert.equal(JSON.stringify(s),originalTruth,'no authoritative AI/public knowledge mutation');
  }finally {
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
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

test('Pass303 actual guardian arena uses a dark mineral field over ALL published court cells without leaking hidden rooms',async()=>{
  const {createMazeWorld,cellPosition}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original(),truth=JSON.stringify(s),w=createMazeWorld({balanced:true});
  const baseline=w.stats(),arena=()=>{
    const seen=[],matrix=new Matrix4(),p=new Vector3(),q=new Quaternion(),scale=new Vector3();
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh||mesh.material?.color?.getHexString()!=='28574f')return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);
        if(Math.abs(scale.x-1.81)<.001&&Math.abs(scale.y-.012)<.001
          &&Math.abs(scale.z-1.81)<.001)seen.push({x:p.x,z:p.z});
      }
    });
    return seen;
  };
  try {
    w.update(s);
    const actual=arena();
    const expected=[6,7,8,11].map(id=>cellPosition(id,s.width,s.height));
    assert.equal(actual.length,4,'all four truly disclosed physical court cells form the same dark arena');
    for(const p of expected)
      assert.ok(actual.some(a=>Math.abs(a.x-p.x)<.0001&&Math.abs(a.z-p.z)<.0001),
        'dark court geometry belongs to a published playable cell, never an invisible extra tile');
    assert.equal(w.stats().guardianCausewayTiles,3,'real contiguous Pip/Thornback threshold is preserved');
    assert.equal(w.stats().geometryCount,baseline.geometryCount);
    assert.equal(w.stats().materialCount,baseline.materialCount);
    w.update({...s,visibleCells:[6,7,11]});
    assert.equal(arena().length,0,'an invisible guardian must not light or rebuild a fictional arena');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(arena().length,0,'a genuinely sealed edge cannot open a visual performance stage');
    w.update({...s,result:{reason:'capture'}});
    assert.equal(arena().length,0,'the court closes on an actual terminal result');
    for(let n=0;n<6;n++){
      w.update({...s,runToken:'basin-reset-'+n});
      assert.equal(arena().length,4);
      assert.ok(w.stats().geometryCount<100,'keep the original strict six-run budget');
    }
    assert.equal(JSON.stringify(s),truth,'only native Three rendering changed; not movement, private data or AI');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass311 native guardian full-frame known closed neighbor becomes a LOW still-solid reef, never a passage',async()=>{
  const {createMazeWorld}=await load();
  const sourceState=original();
  sourceState.visibleCells.push(5,9);
  sourceState.cells.push(
    {cell:5,blocked:false,neighbors:[]},
    {cell:9,blocked:false,neighbors:[]});
  const untouched=JSON.stringify(sourceState);
  const w=createMazeWorld({balanced:true}),baseline=w.stats();
  try {
    w.update(sourceState);
    assert.equal(w.stats().guardianSightlineParapets,2,
      'two same-tier mutually nonadjacent public neighbor graphs earn low opaque physical screens');
    assert.equal(w.stats().guardianCausewayTiles,3,
      'the real reciprocal Pip-to-Thornback stage stays fully joined and otherwise unchanged');
    assert.equal(w.stats().geometryCount,baseline.geometryCount,'reuse real installed geometry pool');
    assert.equal(w.stats().materialCount,baseline.materialCount,'no fresh GPU material class');
    const missing={...sourceState,visibleCells:sourceState.visibleCells.filter(c=>c!==9)};
    w.update(missing);
    assert.equal(w.stats().guardianSightlineParapets,1,
      'a remembered, no-longer-visible candidate wall must retain full silhouette');
    const uncertain={...sourceState,cells:sourceState.cells.map(c=>c.cell===6
      ?{...c,neighbors:[...c.neighbors,5]}:c)};
    w.update(uncertain);
    assert.equal(w.stats().guardianSightlineParapets,1,
      'one-way or partial public adjacency is uncertain; never make a visual shortcut');
    const realPassage={...sourceState,cells:sourceState.cells.map(c=>c.cell===6
      ?{...c,neighbors:[...c.neighbors,5]}
      :c.cell===5?{...c,neighbors:[6]}:c)};
    w.update(realPassage);
    assert.equal(w.stats().guardianSightlineParapets,1,
      'actually connected walkable public cells are NOT a blocked or lowered wall');
    w.update({...sourceState,doors:[{a:6,b:5,open:false}]});
    assert.equal(w.stats().guardianSightlineParapets,1,
      'a real sealed gate must preserve its full gate geometry');
    w.update({...sourceState,doors:[{a:7,b:8,open:false}]});
    assert.equal(w.stats().guardianSightlineParapets,0,
      'no disconnected actor corridor may stage a guardian cutaway');
    w.update({...sourceState,visibleCells:[6,7,11,5,9]});
    assert.equal(w.stats().guardianSightlineParapets,0,'hidden guardian cannot retain an old cutaway');
    w.update({...sourceState,result:{reason:'capture'}});
    assert.equal(w.stats().guardianSightlineParapets,0,'terminal scene resets the court');
    for(let i=0;i<6;i++){
      w.update({...sourceState,runToken:'pass311-opaque-reef-'+i});
      assert.equal(w.stats().guardianSightlineParapets,2);
      assert.ok(w.stats().geometryCount<100,'unchanged strict six-reset GPU geometry ceiling');
    }
    assert.equal(JSON.stringify(sourceState),untouched,'no AI, collisions or public truth edited');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass312 original Tideglass endpoint standards follow the REAL witnessed guardian, never hidden or gated state',async()=>{
  const {createMazeWorld}=await load();
  const s=original(),truth=JSON.stringify(s),w=createMazeWorld({balanced:true}),initial=w.stats();
  const crown=(cell,side)=>w.group.getObjectByName('Published guardian Tideglass sentinel crown '+cell+' '+side);
  const lens=(cell,side)=>w.group.getObjectByName('Published guardian Tideglass sentinel lens '+cell+' '+side);
  try {
    w.update(s);
    const actual=[6,8].flatMap(cell=>[-1,1].map(side=>crown(cell,side)));
    assert.ok(actual.every(Boolean),'FOUR original 3D standards stand on the TWO real actor endpoints');
    assert.equal(crown(7,-1),undefined,'intermediate tile is not an invented actor or gate');
    assert.ok([6,8].flatMap(cell=>[-1,1].map(side=>lens(cell,side))).every(Boolean),
      'each real stone standard includes a distinct physical sea-glass lens');
    assert.ok(actual.every(o=>o.parent?.parent?.isGroup
      &&Math.max(Math.abs(o.parent.parent.position.x),Math.abs(o.parent.parent.position.z))>=1.03),
      'every standard is rooted OUTSIDE Pip’s open centre lane');
    const before=actual.map(o=>({y:o.parent.position.y,mat:o.material}));
    assert.ok(actual.every(o=>o.scale.y>=.17),'each 3D crown has nontrivial native-mobile height');
    w.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    assert.ok(actual.every((o,i)=>o.parent.position.y>before[i].y+.35&&o.material!==before[i].mat),
      'the original published brace physically RAISES and illuminates all four standards');
    w.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    assert.ok(actual.every(o=>o.parent.position.y<.43),'true shell release retracts all FOUR signal shafts');
    w.animate(1,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
    assert.ok(actual.every((o,i)=>o.parent.position.y===before[i].y&&o.material===before[i].mat),
      'unpublished guardian immediately revokes physical light and motion');
    w.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
    assert.ok(actual.every(o=>o.parent.position.y===.04),'reduced motion keeps the true light stationary');
    assert.equal(w.stats().geometryCount,initial.geometryCount,'reuses existing GPU shape pool');
    assert.equal(w.stats().materialCount,initial.materialCount,'reuses existing GPU materials');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(crown(6,1),undefined,'sealed public gate must NOT stage a guardian signal');
    w.update({...s,visibleCells:[6,7,11]});
    assert.equal(crown(6,1),undefined,'hidden warden must NOT leave behind a beacon');
    w.update({...s,result:{reason:'capture'}});
    assert.equal(crown(6,1),undefined,'terminal scene cleans every sentinel');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'tideglass-endpoint-reset-'+i});
      assert.ok(crown(6,-1)&&crown(8,1));
      assert.ok(w.stats().geometryCount<100,'strict SIX reset geometry budget untouched');
    }
    assert.equal(JSON.stringify(s),truth,'no authoritative AI, collision or public truth was changed');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass313 authentic endpoint shell fans open as one rooted THREE warning system without claiming a physical gate',async()=>{
  const {createMazeWorld}=await load();
  const {Vector3}=await import(three);
  const state=original(),untouched=JSON.stringify(state);
  const world=createMazeWorld({balanced:true}),initial=world.stats();
  const get=(cell,side)=>world.group.getObjectByName(
    'Published guardian Tideglass full shell-fan '+cell+' '+side);
  try{
    world.update(state);
    const panels=[6,8].flatMap(cell=>[-1,1].map(side=>get(cell,side)));
    assert.ok(panels.every(Boolean),'four substantial rooted ORIGINAL physical fans on actual actor endpoints');
    assert.equal(get(7,1),undefined,'the intermediate public lane must stay open, without a fake barrier');
    assert.ok(panels.every(p=>p.scale.y>=.67 && Math.max(p.scale.x,p.scale.z)>=.39),
      'shell fans must be sizeable physical THREE geometry, not tiny decorative LEDs');
    const hinges=panels.map(p=>p.parent),neutral=panels.map(p=>p.material);
    assert.ok(hinges.every(h=>h?.isGroup&&h.position.y>=.7),
      'the entire connected shell-fan hangs from its actual stone/ivory sentinel');
    world.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    world.group.updateMatrixWorld(true);
    assert.ok(hinges.every(h=>Math.abs(h.rotation.x)>.78),
      'four whole body-height fans physically swing on witnessed brace, not micro-rotate');
    assert.ok(panels.every((p,i)=>p.material!==neutral[i]),
      'the large physical surfaces display one authentic event-driven amber beat');
    assert.ok(panels.every(p=>Number.isFinite(p.getWorldPosition(new Vector3()).y)),
      'real installed THREE world transforms remain finite');
    world.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    assert.ok(hinges.every(h=>Math.abs(h.rotation.x)<.45),
      'release visibly folds actual hinged sails back');
    world.animate(1,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
    assert.ok(hinges.every(h=>h.rotation.x===0)&&panels.every((p,i)=>p.material===neutral[i]),
      'invalid enemy cue instantly folds and darkens every fan');
    world.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
    assert.ok(hinges.every(h=>h.rotation.x===0)&&panels.every((p,i)=>p.material!==neutral[i]),
      'reduced motion preserves real warning color without sweeping the screen');
    assert.equal(world.stats().geometryCount,initial.geometryCount,'no new GPU geometry classes');
    assert.equal(world.stats().materialCount,initial.materialCount,'no new GPU material classes');
    world.update({...state,visibleCells:[6,7,11]});
    assert.equal(get(6,1),undefined,'hidden guardian cannot retain animated endpoint sculpture');
    world.update({...state,doors:[{a:7,b:8,open:false}]});
    assert.equal(get(8,1),undefined,'closed gate prevents a fictional open guardian court');
    world.update({...state,result:{reason:'capture'}});
    assert.equal(get(6,-1),undefined,'terminal cleanup removes connected physical fans');
    for(let i=0;i<6;i++){
      world.update({...state,runToken:'authored-shell-fan-reset-'+i});
      assert.ok(get(6,1)&&get(8,-1));
      assert.ok(world.stats().geometryCount<100,'original strict six-run geometry ceiling remains <100');
    }
    assert.equal(JSON.stringify(state),untouched,'no AI, collision, private map or authoritative state edits');
  }finally{
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});

test('Pass319 genuine 390px guardian shot: long rooted warning feathers preserve the entire physical actor lane',async()=>{
  const {createMazeWorld,cellPosition}=await load();
  const {Box3}=await import(three);
  const s=original(),truth=JSON.stringify(s);
  const w=createMazeWorld({balanced:true}),baseline=w.stats();
  const panel=(cell,side)=>w.group.getObjectByName(
    'Published guardian Tideglass full shell-fan '+cell+' '+side);
  const feathers=()=>[6,8].flatMap(cell=>[-1,1].map(side=>({cell,side,mesh:panel(cell,side)})));
  const outsideRealLane=()=>{
    w.group.updateMatrixWorld(true);
    return feathers().every(({cell,side,mesh})=>{
      if(!mesh)return false;
      const bounds=new Box3().setFromObject(mesh);
      const centre=cellPosition(cell,s.width,s.height);
      // The entire attached material body, not merely its pivot or a
      // decorative texture, must stay OUTSIDE the physically traversable
      // 1.38m centre strip at native-scale danger and recovery.
      return side>0 ? bounds.min.z-centre.z>.78
        : centre.z-bounds.max.z>.78;
    });
  };
  try{
    w.update(s);
    assert.ok(feathers().every(({mesh})=>mesh
      &&mesh.scale.y>=.92
      &&mesh.scale.x>=.54
      &&mesh.scale.z<=.25),
      'four sculpted vertical feathers are longer along the real x corridor and narrower across it');
    assert.ok(outsideRealLane(),'neutral connected 3D fins cannot obstruct the actor lane');
    w.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    assert.ok(outsideRealLane(),'true witnessed brace fans OUT rather than swallowing Pip/Thornback');
    w.animate(.90,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    assert.ok(outsideRealLane(),'release must preserve the original open corridor');
    w.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
    assert.ok(outsideRealLane(),'reduced motion holds a safe stationary physical shape');
    assert.equal(w.stats().geometryCount,baseline.geometryCount,'no new GPU geometry class');
    assert.equal(w.stats().materialCount,baseline.materialCount,'no new GPU material class');
    w.update({...s,visibleCells:[6,7,11]});
    assert.equal(panel(6,1),undefined,'no invisible guardian receives physical warning blades');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(panel(8,1),undefined,'sealed passage cannot stage a guardian duel');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'pass319-wing-lane-'+i});
      assert.ok(outsideRealLane(),'reset regenerates a physically clear public court');
      assert.ok(w.stats().geometryCount<100,'unchanged six-run GPU budget');
    }
    assert.equal(JSON.stringify(s),truth,'AI state, collision and hidden map untouched');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});



test('Pass329 authentic 390px guardian warning keeps full physical movement but gives actors visual priority over four amber paddles',async()=>{
  const {createMazeWorld}=await load();
  const s=original(),source=JSON.stringify(s);
  const w=createMazeWorld({balanced:true}),budget=w.stats();
  const names=kind=>[6,8].flatMap(cell=>[-1,1].map(side=>
    w.group.getObjectByName('Published guardian Tideglass '+kind+' '+cell+' '+side)));
  try{
    w.update(s);
    const sails=()=>names('full shell-fan');
    const crests=()=>names('shell-fan crest');
    const crowns=()=>names('sentinel crown');
    const initialSails=sails().map(p=>p?.material);
    const initialCrests=crests().map(p=>p?.material);
    assert.equal(sails().filter(Boolean).length,4,'all four substantial original endpoint fans remain');
    assert.equal(crests().filter(Boolean).length,4,'each full-size moving fan retains a connected narrow enamel crown');
    w.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    assert.ok(sails().every((p,i)=>p.material!==initialSails[i]
      && p.material!==crests()[i].material),
      'the broad moving bodies use dark mineral rather than becoming four enormous amber warning slabs');
    assert.ok(crests().every((p,i)=>p.material!==initialCrests[i]
      && p.material===crowns()[i].material),
      'the true witnessed guardian brace illuminates only the connected narrow feather crests and rooted crowns');
    assert.ok(sails().every(p=>Math.abs(p.parent.rotation.x)>.78),
      'the full real hinge still swings outside the physically open actor corridor');
    w.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    assert.ok(sails().every(p=>Math.abs(p.parent.rotation.x)<.45),
      'real withdrawal restores the original physical silhouette');
    w.animate(1,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
    assert.ok(sails().every((p,i)=>p.material===initialSails[i]
      && p.parent.rotation.x===0));
    assert.ok(crests().every((p,i)=>p.material===initialCrests[i]),
      'invalid or hidden guardian threat must remove all original amber emphasis');
    w.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
    assert.ok(sails().every((p,i)=>p.parent.rotation.x===0
      && p.material!==initialSails[i]));
    assert.ok(crests().every((p,i)=>p.material===crowns()[i].material),
      'reduced motion must keep the real warning visible but stationary');
    assert.equal(w.stats().geometryCount,budget.geometryCount);
    assert.equal(w.stats().materialCount,budget.materialCount);
    w.update({...s,visibleCells:[6,7,11]});
    assert.ok(sails().every(p=>p===undefined),'an unseen guardian cannot stage the warning');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.ok(sails().every(p=>p===undefined),'a sealed corridor cannot signal a guardian crossing');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'pass329-guardian-signal-reset-'+i});
      assert.equal(sails().filter(Boolean).length,4);
      assert.ok(w.stats().geometryCount<100,'strict six-run geometry budget remains unchanged');
    }
    assert.equal(JSON.stringify(s),source,'presentation never changes authoritative AI or public disclosure');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass320 verified 390px guardian foreground is a rooted low sealed mineral reef, never a pale fake route',async()=>{
  const {createMazeWorld,cellPosition,cellHeight}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original();
  s.visibleCells.push(5,9,12);
  s.cells.push(...[5,9,12].map(cell=>({cell,blocked:true,neighbors:[]})));
  const truth=JSON.stringify(s);
  const world=createMazeWorld({balanced:true}),budget=world.stats();
  const sealCenters=()=>{
    const found=[],oldCaps=[];
    const matrix=new Matrix4(),p=new Vector3(),q=new Quaternion(),size=new Vector3();
    world.group.traverse(object=>{
      if(!object.isInstancedMesh)return;
      for(let i=0;i<object.count;i++){
        object.getMatrixAt(i,matrix);matrix.decompose(p,q,size);
        if(object.material?.color?.getHexString()==='28574f'
          &&Math.abs(size.x-1.92)<.00001&&Math.abs(size.y-.055)<.00001
          &&Math.abs(size.z-1.92)<.00001)
          found.push({x:p.x,y:p.y,z:p.z});
        if(object.material?.color?.getHexString()==='eed5a0'
          &&Math.abs(size.x-1.91)<.00001&&Math.abs(size.y-.074)<.00001
          &&Math.abs(size.z-1.91)<.00001)
          oldCaps.push({x:p.x,z:p.z});
      }
    });
    return {found,oldCaps};
  };
  try{
    world.update(s);
    assert.equal(world.stats().guardianBlockedReliefTiles,3);
    const {found,oldCaps}=sealCenters();
    assert.equal(found.length,3,'three actual opaque inset reefs replace three foreground ivory slabs');
    assert.equal(oldCaps.length,0,'the old large pale foreground caps must truly disappear');
    for(const cell of [5,9,12]){
      const {x,z}=cellPosition(cell,s.width,s.height),y=cellHeight(cell,s.width,s.height);
      assert.ok(found.some(p=>Math.abs(p.x-x)<.00001
        &&Math.abs(p.y-y-.235)<.00001&&Math.abs(p.z-z)<.00001),
        'each lowered blind reef must physically occupy exactly its disclosed blocked cell');
    }
    assert.equal(world.stats().geometryCount,budget.geometryCount,'no extra GPU geometry class');
    assert.equal(world.stats().materialCount,budget.materialCount,'only pooled original materials');
    assert.equal(JSON.stringify(s),truth,'renderer does not modify AI or public knowledge');
    world.update({...s,visibleCells:[6,7,8,11]});
    assert.equal(world.stats().guardianBlockedReliefTiles,0,'hidden blocked cells never appear');
    assert.equal(sealCenters().found.length,0,'no hidden mineral seal persists');
    world.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(world.stats().guardianBlockedReliefTiles,0,'sealed guardian passage revokes whole court');
    world.update({...s,result:{reason:'capture'}});
    assert.equal(world.stats().guardianBlockedReliefTiles,0,'terminal encounter clears visible stage');
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'low-reef-reset-'+i});
      assert.equal(sealCenters().found.length,3,'three original low galleries return on true redisclosure');
      assert.ok(world.stats().geometryCount<100,'preserve six-run hard GPU geometry ceiling');
    }
  }finally{
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});

test('Pass321 authentic guardian visual foreground is a public sealed Tideglass floor, never a guessed route',async()=>{
  const {createMazeWorld,publicGuardianForecourtShoulderCells:shoulders,
    publicGuardianCausewayCells:duel,cellPosition,cellHeight}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original();
  s.visibleCells.push(9);
  s.cells.push({cell:9,blocked:false,neighbors:[]});
  const truth=JSON.stringify(s);
  assert.deepEqual([...duel(s).keys()],[6,7,8]);
  assert.deepEqual([...shoulders(s)],[9]);
  assert.deepEqual([...shoulders({...s,visibleCells:s.visibleCells.filter(id=>id!==9)})],[],
    'unseen stone cannot materialise');
  assert.deepEqual([...shoulders({...s,doors:[{a:8,b:9,open:false}]})],[],
    'a real portcullis must not look like a blind forecourt wall');
  assert.deepEqual([...shoulders({...s,threats:[]})],[],
    'no real publicly seen guardian means no stage');
  assert.deepEqual([...shoulders({...s,privateMaze:{cells:[{cell:14,blocked:false}]},
    secretPath:[8,9,14]})],[9],'private map cannot affect original stage');
  const reciprocal={...s,cells:s.cells.map(c=>c.cell===8
    ?{...c,neighbors:[7,9]}:c.cell===9?{...c,neighbors:[8]}:c)};
  assert.deepEqual([...shoulders(reciprocal)],[],
    'a true public passage cannot masquerade as a sealed wall');
  assert.equal(JSON.stringify(s),truth);
  const w=createMazeWorld({balanced:true}),initial=w.stats();
  const physicalDarkFloor=()=>{
    const pos=cellPosition(9,s.width,s.height),height=cellHeight(9,s.width,s.height);
    let count=0;
    const m=new Matrix4(),p=new Vector3(),q=new Quaternion(),sz=new Vector3();
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh||mesh.material?.color?.getHexString()!=='28574f')return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,m);m.decompose(p,q,sz);
        if(Math.abs(p.x-pos.x)<.0001&&Math.abs(p.z-pos.z)<.0001
          &&Math.abs(p.y-height+.035)<.0001
          &&Math.abs(sz.x-2.31)<.0001&&Math.abs(sz.y-.07)<.0001
          &&Math.abs(sz.z-2.31)<.0001)count++;
      }
    });
    return count;
  };
  try{
    w.update(s);
    assert.equal(w.stats().guardianForecourtShoulderTiles,1);
    assert.equal(physicalDarkFloor(),1,'an actual 2.31m dark floor replaces the ivory forecourt');
    assert.equal(w.stats().geometryCount,initial.geometryCount);
    assert.equal(w.stats().materialCount,initial.materialCount);
    w.update({...s,visibleCells:s.visibleCells.filter(id=>id!==9)});
    assert.equal(w.stats().guardianForecourtShoulderTiles,0);
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'pass321-forecourt-'+i});
      assert.equal(w.stats().guardianForecourtShoulderTiles,1);
      assert.equal(physicalDarkFloor(),1);
      assert.ok(w.stats().geometryCount<100,'original strict six-reset budget unchanged');
    }
    assert.equal(JSON.stringify(s),truth);
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass322 witnessed second-ring mobile forecourt physically converts public floor and sealed stone',async()=>{
  const {createMazeWorld,publicGuardianOuterCourtCells:outer,cellPosition,cellHeight}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const state={
    runToken:'second-ring-webgl',lifecycle:'running',result:null,
    width:17,height:10,currentCell:99,visibleCells:[98,99,101,117],
    cells:[
      {cell:98,blocked:false,neighbors:[99]},
      {cell:99,blocked:false,neighbors:[98]},
      {cell:101,blocked:false,neighbors:[]},
      {cell:117,blocked:true,neighbors:[]}
    ],doors:[],keys:[],inventory:[],exitCell:null,
    threats:[{id:'thornback',cell:98}]
  },truth=JSON.stringify(state);
  assert.deepEqual([...outer(state).ordinary],[101],
    'only real second-ring published ordinary floor forms a broad physical stage');
  assert.deepEqual([...outer(state).sealed],[117],
    'next public blocked stone gets sealed relief, never a fake bridge');
  const hidden={...state,visibleCells:[98,99]};
  assert.deepEqual([...outer(hidden).ordinary],[],'no hidden tile in the decorative stage');
  assert.deepEqual([...outer(hidden).sealed],[],'no unseen blocked rock reveal');
  assert.equal(outer({...state,doors:[{a:98,b:99,open:false}]}).ordinary.size,0,
    'closed actual guardian gate revokes the entire encounter stage');
  assert.equal(outer({...state,threats:[]}).ordinary.size,0,
    'unseen/absent threat cannot trigger architecture');
  assert.equal(outer({...state,result:{reason:'capture'}}).sealed.size,0,
    'terminal result clears visual marker');
  assert.deepEqual([...outer({...state,doors:[{a:101,b:102,open:false}]}).ordinary],[],
    'gate hardware/landing is never painted by cosmetic scenery');
  assert.deepEqual([...outer({...state,privateMaze:{cells:[{cell:100,blocked:false}]},
    secretPath:[99,100,101]}).ordinary],[101],
    'private map/AI solver must not affect authored scene');
  const w=createMazeWorld({balanced:true}),originalBudget=w.stats();
  const fullFloor=(cell)=>{
    const center=cellPosition(cell,state.width,state.height),height=cellHeight(cell,state.width,state.height);
    const m=new Matrix4(),p=new Vector3(),q=new Quaternion(),dim=new Vector3();
    let count=0;
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh||mesh.material?.color?.getHexString()!=='28574f')return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,m);m.decompose(p,q,dim);
        if(Math.abs(p.x-center.x)<.0001&&Math.abs(p.z-center.z)<.0001
          &&Math.abs(p.y-height+.035)<.0001&&Math.abs(dim.x-2.31)<.0001
          &&Math.abs(dim.y-.07)<.0001&&Math.abs(dim.z-2.31)<.0001)count++;
      }
    });
    return count;
  };
  try {
    w.update(state);
    assert.equal(w.stats().guardianOuterCourtFloorTiles,1);
    assert.equal(w.stats().guardianOuterCourtSealedTiles,1);
    assert.equal(fullFloor(101),1,'actual 2.31m dark floor exists at disclosed real tile');
    assert.equal(w.stats().geometryCount,originalBudget.geometryCount);
    assert.equal(w.stats().materialCount,originalBudget.materialCount);
    w.update(hidden);
    assert.equal(w.stats().guardianOuterCourtFloorTiles,0,
      'public visibility change immediately invalidates terrain signature');
    assert.equal(w.stats().guardianOuterCourtSealedTiles,0);
    w.update({...state,doors:[{a:98,b:99,open:false}]});
    assert.equal(w.stats().guardianOuterCourtFloorTiles,0);
    for(let i=0;i<6;i++){
      w.update({...state,runToken:'outer-court-reset-'+i});
      assert.equal(w.stats().guardianOuterCourtFloorTiles,1);
      assert.equal(w.stats().guardianOuterCourtSealedTiles,1);
      assert.ok(w.stats().geometryCount<100,'unchanged six-run GPU resource bar');
    }
    assert.equal(JSON.stringify(state),truth,'no AI, physics, hidden-map or authority modification');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass323 whole blind guardian wall converts full size masonry without changing opacity, truth or GPU pool',async()=>{
  const {createMazeWorld,cellPosition}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original(),truth=JSON.stringify(s),hero=cellPosition(6,s.width,s.height);
  const w=createMazeWorld({balanced:true}),budget=w.stats();
  const capColors=()=>{
    const found=[],matrix=new Matrix4(),p=new Vector3(),q=new Quaternion(),sz=new Vector3();
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh)return;
      const color=mesh.material?.color?.getHexString();
      if(color!=='82b1a2' && color!=='eed5a0')return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,matrix);matrix.decompose(p,q,sz);
        if(Math.abs(p.x-(hero.x-1.2))<.0005 && Math.abs(p.z-hero.z)<.0005
          && Math.abs(sz.x-.43)<.0005 && Math.abs(sz.y-.13)<.0005
          && Math.abs(sz.z-2.37)<.0005)found.push(color);
      }
    });
    return found;
  };
  try{
    w.update(s);
    assert.deepEqual(capColors(),['82b1a2'],
      'actual still-solid west wall has a full 2.37m minted mineral top, not an ivory curtain');
    assert.equal(w.stats().geometryCount,budget.geometryCount,'no new geometry class');
    assert.equal(w.stats().materialCount,budget.materialCount,'no new material class');
    w.update({...s,visibleCells:[6,7,11]});
    assert.deepEqual(capColors(),['eed5a0'],
      'hidden guardian restores the original full opaque wall');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.deepEqual(capColors(),['eed5a0'],'a genuinely closed gate cannot trigger the guardian stage');
    w.update({...s,result:{reason:'capture'}});
    assert.deepEqual(capColors(),['eed5a0'],'terminal run restores original wall');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'blind-guardian-wall-'+i});
      assert.deepEqual(capColors(),['82b1a2']);
      assert.ok(w.stats().geometryCount<100,'strict six-run reset ceiling is not relaxed');
    }
    assert.equal(JSON.stringify(s),truth,'public world/AI rules remain immutable');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass324 real 390px foreground ray-identified public cell gets full-floor Tideglass top AND mineral lip',async()=>{
  const {createMazeWorld,publicGuardianWitnessedForegroundCells:foreground,cellPosition,cellHeight}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  // Actual source-bound native guardian: tick34 Pip 99, Thornback 98,
  // foreground THREE ray hit cell100 .73/.80 native y at x16.8,z0.
  // A known checkpoint may display unchanged props while its BASE floor
  // receives neutral scenery, never a route, private clue or fake passage.
  const s={runToken:'ray-grounded-foreground',lifecycle:'running',result:null,
    width:17,height:11,currentCell:99,visibleCells:[98,99,100],
    cells:[
      {cell:98,blocked:false,neighbors:[99]},
      {cell:99,blocked:false,neighbors:[98]},
      {cell:100,blocked:false,checkpoint:true,neighbors:[]}
    ],doors:[],keys:[],inventory:[],exitCell:null,
    threats:[{id:'thornback',cell:98}]};
  const original=JSON.stringify(s);
  assert.deepEqual([...foreground(s)],[98,100],
    'only actual visible same-level neighbors of a public open guardian pair qualify');
  assert.equal(foreground({...s,visibleCells:[98,99]}).has(100),false,
    'a no-longer-visible cell is never staged by this public image treatment');
  assert.equal(foreground({...s,threats:[]}).size,0,'no visible guardian, no foreground effect');
  assert.equal(foreground({...s,doors:[{a:98,b:99,open:false}]}).size,0,
    'closed true gate revokes the whole staged causeway');
  assert.equal(foreground({...s,cells:s.cells.map(c=>c.cell===100?{...c,trap:true}:c)}).has(100),false,
    'pressure hazard retains its own authored floor rather than a guardian carpet');
  assert.equal(foreground({...s,privateMaze:{cells:[{cell:101,trap:false}]}}).has(100),true,
    'private maze cannot change the public art decision');
  const w=createMazeWorld({balanced:true}),budget=w.stats();
  const instances=(id,color,sx,sy,sz,y)=>{
    const center=cellPosition(id,s.width,s.height),floor=cellHeight(id,s.width,s.height);
    const m=new Matrix4(),p=new Vector3(),q=new Quaternion(),size=new Vector3();
    let count=0;
    w.group.traverse(mesh=>{
      if(!mesh.isInstancedMesh||mesh.material?.color?.getHexString()!==color)return;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,m);m.decompose(p,q,size);
        if(Math.abs(p.x-center.x)<.0005&&Math.abs(p.z-center.z)<.0005
          &&Math.abs(p.y-(floor+y))<.0005
          &&Math.abs(size.x-sx)<.0005&&Math.abs(size.y-sy)<.0005
          &&Math.abs(size.z-sz)<.0005)count++;
      }
    });
    return count;
  };
  const assertColored=()=>{
    assert.equal(instances(100,'5d968e',2.31,.07,2.31,-.035),1,
      'actual full 2.31m foreground slab is teal instead of untouched beige');
    assert.equal(instances(100,'8e7851',2.39,.19,2.39,-.135),1,
      'actual 2.39m foreground load lip loses its dominant pale face');
    assert.equal(instances(100,'cead72',2.31,.07,2.31,-.035),0,
      'native-identified foreground top can no longer remain pale');
  };
  try{
    w.update(s);assertColored();
    // Real source images revealed an overlooked interaction: a currently
    // published pressure tile one more cell away can make cell100 part of
    // pressureSightlines. The CHECKPOINT floor remains a neutral public
    // guardian foreground (not an asserted safe route or moving hazard).
    // Pass328: replicate the real native public state, not the earlier
    // checkpoint=true synthetic which accidentally prevented the actual
    // pressureCourtApron material-precedence conflict. Cell100 is ordinary,
    // with an observed nearby trap but NO reciprocal trap route.
    const nearPressure={...s,visibleCells:[98,99,100,101],
      cells:[...s.cells.map(c=>c.cell===100
        ? {...c,checkpoint:false,clue:false,neighbors:[101]}:c),
      {cell:101,blocked:false,trap:true,neighbors:[]}]};
    w.update(nearPressure);assertColored();
    // When BOTH observed tiles really open reciprocally onto the pressure
    // trigger, its authored dark physical basin must still win. Neutral
    // guardian art cannot conceal a real accessible pressure mechanism.
    const linkedPressure={...nearPressure,cells:nearPressure.cells.map(c=>
      c.cell===101?{...c,neighbors:[100]}:c)};
    w.update(linkedPressure);
    assert.equal(instances(100,'28574f',2.39,.07,2.39,-.035),1,
      'an actual reciprocal discovered pressure link retains its basin');
    assert.equal(instances(100,'5d968e',2.31,.07,2.31,-.035),0,
      'guardian art cannot disguise the physical active linked basin');
    // Pass326: the authentic near-camera foreground can be a physically
    // IMPASSABLE public tile. Previously the helper rejected it as blocked,
    // leaving both huge original TAN meshes in the native 390px screenshots.
    // Recolor the solid load deck but NEVER alter its original blockage or
    // invent a link through the existing real wall.
    const sealedForeground={...s,cells:s.cells.map(c=>
      c.cell===100?{...c,blocked:true}:c)};
    assert.equal(foreground(sealedForeground).has(100),true,
      'currently public blocked terrace remains legitimate neutral stage art');
    w.update(sealedForeground);assertColored();
    assert.equal(w.stats().geometryCount,budget.geometryCount);
    assert.equal(w.stats().materialCount,budget.materialCount);
    w.update({...s,visibleCells:[98,99]});
    assert.equal(instances(100,'5d968e',2.31,.07,2.31,-.035),0,
      'visibility loss invalidates the actual terrain and removes decoration');
    w.update({...s,threats:[]});
    assert.equal(instances(100,'5d968e',2.31,.07,2.31,-.035),0);
    w.update({...s,doors:[{a:98,b:99,open:false}]});
    assert.equal(instances(100,'5d968e',2.31,.07,2.31,-.035),0);
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'foreground-rebuild-'+i});assertColored();
      assert.ok(w.stats().geometryCount<100,'existing strict six-reset GPU cap stays unchanged');
    }
    assert.equal(JSON.stringify(s),original,'no map/AI/physics/hidden information is mutated');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});


test('Pass332 witnessed sealed flank reconstructs full solid Tideglass bulwarks without exposing hidden routes',async()=>{
  const {createMazeWorld}=await load();
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const s=original();
  // Cell 9 is public, on the same floor as guardian cell 8, but the two
  // explicitly reject one another as neighbors: the wall is NOT a passage.
  s.visibleCells.push(9);
  s.cells.push({cell:9,blocked:false,neighbors:[]});
  const truth=JSON.stringify(s);
  const w=createMazeWorld({balanced:true}),baseline=w.stats();
  const instances=(color,dimensions)=>{
    const found=[],m=new Matrix4(),p=new Vector3(),q=new Quaternion(),size=new Vector3();
    w.group.traverse(node=>{
      if(!node.isInstancedMesh || node.material?.color?.getHexString()!==color)return;
      for(let i=0;i<node.count;i++){
        node.getMatrixAt(i,m);m.decompose(p,q,size);
        if(dimensions.every((value,j)=>Math.abs([size.x,size.y,size.z][j]-value)<.002))
          found.push({x:p.x,z:p.z});
      }
    });
    return found;
  };
  try {
    w.update(s);
    assert.ok(w.stats().guardianSightlineParapets>=1,
      'the actual public disconnected flank keeps a continuous blocking wall');
    assert.ok(instances('28574f',[.39,.34,2.32]).length>=1,
      'the full-scale opaque guardian wall uses dark Tideglass stone, not a cosmetic dot');
    assert.ok(instances('334a46',[.43,.22,2.14]).length>=1,
      'one substantial dark attached face belongs to the real wall footprint');
    assert.ok(instances('82b1a2',[.08,.042,2.08]).length>=1,
      'its restrained long mineral crest is physically attached to the same solid flank');
    assert.equal(w.stats().geometryCount,baseline.geometryCount,
      'the rebuilt architecture only uses pooled installed Three geometry');
    assert.equal(w.stats().materialCount,baseline.materialCount);
    assert.equal(JSON.stringify(s),truth,'no public map or AI mutation');
    w.update({...s,visibleCells:s.visibleCells.filter(c=>c!==9)});
    assert.equal(w.stats().guardianSightlineParapets,0,
      'a hidden far-side cell must not generate an invented blocking bulwark');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(w.stats().guardianSightlineParapets,0,
      'a real closed gate withdraws the guardian-specific stage');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'guardian-bulwark-reset-'+i});
      assert.ok(w.stats().guardianSightlineParapets>=1);
      assert.ok(w.stats().geometryCount<100,
        'the unchanged strict six-run reset geometry budget holds');
    }
  } finally {
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});


test('Pass335 native 390px guardian foreground replaces the actual 2.34m ivory parapet, not a secret opening',async()=>{
 const {createMazeWorld,cellPosition}=await load();
 const {Matrix4,Vector3,Quaternion}=await import(three);
 // Exact ORIGINAL public geometry relationship from 2026-11-13 WebGL:
 // The real source has a 17x11 grid: rows 5 and 6 are one terrace.\n // Pip99 faces Thornback98; publicly visible ordinary100 and117 have a
 // closed NONPASSAGE boundary at x16.8,z1.2. Only color and genuine joined
 // mineral masonry change, never the game collision or navigation truth.
 const s={runToken:'source-guardian-rail',lifecycle:'running',result:null,
   width:17,height:11,currentCell:99,
   visibleCells:[98,99,100,117],
   cells:[
     {cell:98,blocked:false,trap:false,checkpoint:false,clue:false,neighbors:[99]},
     {cell:99,blocked:false,trap:false,checkpoint:false,clue:false,neighbors:[98]},
     {cell:100,blocked:false,trap:false,checkpoint:false,clue:false,neighbors:[83,101]},
     {cell:117,blocked:false,trap:false,checkpoint:false,clue:false,neighbors:[116,134]}
   ],doors:[],keys:[],inventory:[],exitCell:null,
   threats:[{id:'thornback',cell:98}]};
 const before=JSON.stringify(s),w=createMazeWorld({balanced:true}),budget=w.stats();
 const a=cellPosition(100,s.width,s.height),b=cellPosition(117,s.width,s.height),
   mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
 const wallInstances=(hex,dims)=>{
   let count=0;const matrix=new Matrix4(),position=new Vector3(),
     rotation=new Quaternion(),scale=new Vector3();
   w.group.traverse(node=>{
     if(!node.isInstancedMesh || node.material?.color?.getHexString()!==hex)return;
     for(let i=0;i<node.count;i++){
       node.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
       if(Math.abs(position.x-mx)<.003 && Math.abs(position.z-mz)<.003
         && dims.every((n,j)=>Math.abs([scale.x,scale.y,scale.z][j]-n)<.003))
         count++;
     }
   });
   return count;
 };
 const darkWall=()=>{
   assert.equal(wallInstances('eed5a0',[2.34,.075,.44]),0,
     'real foreground must not retain the source-proven wide ivory railing');
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),1,
     'original full-width rail now belongs to one connected sea-glass court');
   assert.equal(wallInstances('28574f',[2.32,.34,.39]),1,
     'solid full-scale dark masonry persists at the actual nonpassage');
   assert.equal(wallInstances('334a46',[2.14,.22,.43]),1,
     'large, physically attached dark mineral wall face replaces repetition');
 };
 try {
   w.update(s);darkWall();
   assert.ok(w.stats().guardianSightlineParapets>=1);
   assert.equal(w.stats().geometryCount,budget.geometryCount);
   assert.equal(w.stats().materialCount,budget.materialCount);
   assert.equal(JSON.stringify(s),before,'no autonomous gameplay, public map or source mutation');
   w.update({...s,visibleCells:[98,99,100]});
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),0,
     'unknown opposite cell cannot produce a disclosed guardian boundary');
   w.update({...s,doors:[{a:98,b:99,open:false}]});
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),0,
     'a real sealed guardian encounter removes its stage');
   w.update({...s,cells:s.cells.map(c=>c.cell===100
     ? {...c,neighbors:[83,101,117]}
     : c.cell===117 ? {...c,neighbors:[100,116,134]}:c)});
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),0,
     'a real discovered passage must never be disguised as a solid rail');
   const linkedPressure={...s,visibleCells:[...s.visibleCells,101],
     cells:[...s.cells.map(c=>c.cell===100?{...c,neighbors:[83,101]}:c),
       {cell:101,blocked:false,trap:true,neighbors:[100]}]};
   w.update(linkedPressure);
   assert.equal(wallInstances('eed5a0',[2.34,.075,.44]),0,
     'a linked pressure trigger on another edge cannot restore a giant ivory spectator cap');
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),1);
   assert.equal(wallInstances('28574f',[2.32,.34,.39]),1,
     'the true nonpassage dark guardian body remains opaque');
   assert.equal(wallInstances('334a46',[2.14,.22,.43]),0,
     'do not stack a redundant broad physical facing over an adjacent real pressure stage');
   assert.ok(w.stats().guardianSightlineParapets>=1,
     'the nonpassage spectator boundary may be dark even when another real edge leads to pressure');
   // The actual pressure tile and its true reciprocal path remain authoritative;
   // never reclassify a spectator wall ON a physical pressure endpoint.
   const pressureOnBoundary={...s,cells:s.cells.map(c=>c.cell===117
     ? {...c,trap:true}:c)};
   w.update(pressureOnBoundary);
   assert.equal(wallInstances('5d968e',[2.34,.075,.44]),0,
     'the spectator cutaway cannot recolor a wall with a real trap endpoint');
   for(let i=0;i<6;i++){
     w.update({...s,runToken:'guardian-rail-reset-'+i});darkWall();
     assert.ok(w.stats().geometryCount<100,'original six-reset GPU budget stays strict');
   }
 }finally{
   w.dispose();assert.equal(w.stats().geometryCount,0);
   assert.equal(w.stats().materialCount,0);
 }
});

test('public guardian second-ring performance clears tall decorative occluders but keeps every real wall',async()=>{
  const {createMazeWorld,publicGuardianCausewayCells}=await load();
  // The actual public floor tiers matter: 14 and 15 are both row two
  // (2.8m), while cell22 sits on the lower row-three clay terrace (1.4m).
  // The 14->15 sealed edge is built by cell14 first and owns a real
  // deterministic roofed windcatcher. The different-height 22 remains
  // a negative control and must retain its original unrelated scenery.
  // Pip 15->16->17 is a genuinely reciprocal level actor corridor.
  const duo={
    runToken:'guardian-negative-space',lifecycle:'running',result:null,
    width:7,height:7,currentCell:15,
    visibleCells:[14,15,16,17,22],
    cells:[
      {cell:14,blocked:false,neighbors:[]},
      {cell:15,blocked:false,neighbors:[16]},
      {cell:16,blocked:false,neighbors:[15,17]},
      {cell:17,blocked:false,neighbors:[16]},
      {cell:22,blocked:false,neighbors:[]},
    ],
    threats:[{id:'thornback',cell:17}],
    doors:[],keys:[],inventory:[],exitCell:null,
  };
  const quiet={...duo,threats:[]},hidden={...duo,visibleCells:[14,15,16,22]};
  const baseline=createMazeWorld({balanced:true}),world=createMazeWorld({balanced:true});
  const first=JSON.stringify(duo);
  try{
    baseline.update(quiet);
    const before=baseline.stats();
    assert.ok(before.wallWindcatchers>0,'the disclosed ordinary spectator has real roofed wall towers to clear');
    assert.deepEqual([...publicGuardianCausewayCells(duo)],[[15,'x'],[16,'x'],[17,'x']]);
    world.update(duo);
    const during=world.stats();
    assert.equal(during.guardianCausewayTiles,3,'the genuine connected hero/guardian stage remains');
    assert.ok(during.wallWindcatchers<before.wallWindcatchers,
      'repeated tall windcatcher towers clear the original living actor stage');
    assert.ok(during.instances>0&&during.renderedCells.includes(14)&&during.renderedCells.includes(22),
      'the known sealed spectator wall and its world tile remain physical');
    assert.equal(during.geometryCount,before.geometryCount,'no new GPU geometry classes');
    assert.equal(during.materialCount,before.materialCount,'no new material classes');
    assert.equal(JSON.stringify(duo),first,'rendering does not change gameplay or public truth');
    world.update(hidden);
    assert.equal(world.stats().guardianCausewayTiles,0,
      'undisclosed guardian instantly revokes the open performance envelope');
    world.update(quiet);
    assert.equal(world.stats().wallWindcatchers,before.wallWindcatchers,
      'ordinary taller public scenery returns without an authentic encounter');
    world.update({...duo,doors:[{a:16,b:17,open:false}]});
    assert.equal(world.stats().guardianCausewayTiles,0,'known closed gate cannot earn a clear false stage');
    for(let i=0;i<6;i++){
      world.update({...duo,runToken:'guardian-negative-reset-'+i});
      assert.equal(world.stats().guardianCausewayTiles,3);
      assert.ok(world.stats().geometryCount<100,'unchanged strict six-reset resource ceiling');
    }
  }finally{
    world.dispose();baseline.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});


test('Pass342 a public pressure-proximity overlap no longer resurrects giant ornamental guardian spectator towers',async()=>{
  const {createMazeWorld,publicGuardianCausewayCells}=await load();
  // Source-real 7x7 SAME-TIER sightline: Pip11->10->9 Thornback. The
  // published spectator tile12 lies directly beyond a confirmed sealed
  // nonpassage. Its NORTH wall faces undisclosed cell5 and owns an
  // existing deterministic full roofed windcatcher. A separate public
  // trap19 is nearby (distance 1 from spectator12), but is NOT connected
  // to that northern wall. Unlike the rejected first fixture (cell14's
  // east wall beside a public pressure edge), the real tower exists
  // BEFORE any ornamental quieting. Do not weaken the expected reduction.
  const s={runToken:'published-pressure-overlap',lifecycle:'running',result:null,
    width:7,height:7,currentCell:11,visibleCells:[9,10,11,12,19],
    cells:[
      {cell:9,blocked:false,neighbors:[10]},
      {cell:10,blocked:false,neighbors:[9,11]},
      {cell:11,blocked:false,neighbors:[10]},
      {cell:12,blocked:false,neighbors:[]},
      {cell:19,blocked:false,trap:true,neighbors:[]},
    ],threats:[{id:'thornback',cell:9}],doors:[],keys:[],inventory:[],exitCell:null
  };
  const pristine=JSON.stringify(s),noGuardian={...s,threats:[]};
  const baseline=createMazeWorld({balanced:true}),world=createMazeWorld({balanced:true});
  try {
    baseline.update(noGuardian);
    const usual=baseline.stats();
    assert.ok(usual.wallWindcatchers>0,
      'actual published spectator owns a deterministic roof above a true, unconnected solid north wall');
    assert.deepEqual([...publicGuardianCausewayCells(s)],[[11,'x'],[10,'x'],[9,'x']],
      'publicly nearby pressure never falsifies the reciprocal Pip-Thornback route');
    world.update(s);
    const staged=world.stats();
    assert.ok(staged.wallWindcatchers<usual.wallWindcatchers,
      'the existing roofed spectator ornament must yield during true encounter despite the separate public trap');
    assert.ok(staged.renderedCells.includes(12)&&staged.renderedCells.includes(19),
      'the published spectator and real trap remain full physical scenery');
    assert.equal(staged.geometryCount,usual.geometryCount,
      'only original pooled Three geometry, no resource budget change');
    assert.equal(staged.materialCount,usual.materialCount);
    assert.equal(JSON.stringify(s),pristine,'no authoritative AI, trap, route, public state mutation');
    world.update(noGuardian);
    assert.equal(world.stats().wallWindcatchers,usual.wallWindcatchers,
      'without public guardian the original tall roof returns');
    world.update({...s,doors:[{a:10,b:9,open:false}]});
    assert.equal(world.stats().wallWindcatchers,usual.wallWindcatchers,
      'closed gate must not draw false guardian performance space');
    world.update({...s,visibleCells:[10,11,12,19],
      cells:s.cells.filter(c=>c.cell!==9)});
    assert.equal(world.stats().wallWindcatchers,usual.wallWindcatchers,
      'hidden warden cannot influence known spectator or unrelated public pressure');
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'pressure-overlap-reset-'+i});
      assert.ok(world.stats().wallWindcatchers<usual.wallWindcatchers);
      assert.ok(world.stats().geometryCount<100,
        'strict original six-reset real geometry budget remains unchanged');
    }
  }finally{
    world.dispose();baseline.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});
  
test('Pass346 physical guardian fins recline out of the actor lane and rise only on publicly witnessed brace',async()=>{
  const {createMazeWorld}=await load();
  const {Box3}=await import(three);
  const s=original(),source=JSON.stringify(s);
  const w=createMazeWorld({balanced:true}),budget=w.stats();
  const panels=()=>[6,8].flatMap(cell=>[-1,1].map(side=>({
    side,mesh:w.group.getObjectByName('Published guardian Tideglass full shell-fan '+cell+' '+side)
  })));
  const tops=()=>{w.group.updateMatrixWorld(true);
    return panels().map(({mesh})=>new Box3().setFromObject(mesh).max.y)};
  try{
    w.update(s);
    assert.ok(panels().every(({mesh,side})=>mesh
      && Math.abs(mesh.rotation.x-side*1.28)<1e-8
      && mesh.parent.rotation.x===0),
      'four original large fins physically rest reclined OUTWARD, not hidden or scaled away');
    const folded=tops();
    w.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    const active=tops();
    assert.ok(panels().every(({mesh,side})=>mesh.parent.rotation.x*side<-.78),
      'actual public brace pivots all four ORIGINAL joined fins toward upright');
    assert.ok(active.every((y,i)=>y>folded[i]+.30),
      'the genuine Three.js world-space panels rise substantially, not merely flash');
    w.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    const released=tops();
    assert.ok(released.every((y,i)=>y<active[i]-.10),
      'guardian release reclines the physical mechanism');
    assert.ok(released.every((y,i)=>Math.abs(y-folded[i])<.08),
      'at public 90% shell release each complete 3D fin must clear to its original folded height, not linger over both actors');
    for (const cell of [6,8]) for (const side of [-1,1]) {
      const hinge=w.group.getObjectByName('Published guardian Tideglass margin hinge '+cell+' '+side);
      assert.ok(hinge&&Math.abs(hinge.rotation.x)<.04,
        'the connected full-width physical floor warning also settles before the witnessed release');
    }
    w.animate(1,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
    assert.deepEqual(tops(),folded,'unknown attacker cannot retain a raised cue');
    w.animate(1,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
    assert.deepEqual(tops(),folded,'reduced motion holds one static physical pose');
    assert.equal(w.stats().geometryCount,budget.geometryCount);
    assert.equal(w.stats().materialCount,budget.materialCount);
    w.update({...s,visibleCells:[6,7,11]});
    assert.ok(panels().every(({mesh})=>!mesh),'an unseen guardian cannot create public stage props');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'pass346-folding-reset-'+i});
      assert.ok(panels().every(({mesh})=>!!mesh));
      assert.ok(w.stats().geometryCount<100,'unchanged strict six-run resource gate');
    }
    assert.equal(JSON.stringify(s),source,'no AI authority or published topology mutation');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass348 original guardian shell frame has true through-space and still physically responds to witnessed events',async()=>{
  const {createMazeWorld}=await load();
  const {Box3,Vector3,Raycaster}=await import(three);
  const state=original(),unchanged=JSON.stringify(state);
  const w=createMazeWorld({balanced:true}),initial=w.stats();
  const fins=()=>[6,8].flatMap(cell=>[-1,1].map(side=>
    w.group.getObjectByName('Published guardian Tideglass full shell-fan '+cell+' '+side)));
  const ray=(mesh,x,y)=>{
    mesh.updateWorldMatrix(true,false);
    const start=mesh.localToWorld(new Vector3(x,y,2));
    const end=mesh.localToWorld(new Vector3(x,y,-2));
    return new Raycaster(start,end.sub(start).normalize(),0,5).intersectObject(mesh).length;
  };
  try{
    w.update(state);
    const panels=fins();
    assert.ok(panels.length===4&&panels.every(Boolean),'four full-size original moving endpoint frames');
    assert.ok(panels.every(p=>p.geometry.type==='ExtrudeGeometry'
      && p.geometry.parameters.shapes.holes.length===1),'solid original shell has one real opening');
    assert.ok(panels.every(p=>ray(p,0,0)===0),'central void reveals the real court, not an alpha-blended wall');
    assert.ok(panels.every(p=>ray(p,-.36,0)>0),'the broad rooted rim remains genuinely opaque geometry');
    w.group.updateMatrixWorld(true);
    const rest=panels.map(p=>new Box3().setFromObject(p).max.y);
    w.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
    w.group.updateMatrixWorld(true);
    assert.ok(panels.every((p,i)=>new Box3().setFromObject(p).max.y>rest[i]+.30),
      'published brace still lifts original full-size mechanical silhouettes');
    w.animate(.9,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
    w.group.updateMatrixWorld(true);
    assert.ok(panels.every((p,i)=>Math.abs(new Box3().setFromObject(p).max.y-rest[i])<.08),
      'published shell release still folds full frames before true 90% moment');
    w.update({...state,visibleCells:[6,7,11]});
    assert.ok(fins().every(p=>!p),'hidden real threat cannot retain its display');
    w.update({...state,doors:[{a:7,b:8,open:false}]});
    assert.ok(fins().every(p=>!p),'closed real door cannot create a false guardian passage');
    for(let i=0;i<6;i++){
      w.update({...state,runToken:'pass348-shell-reset-'+i});
      assert.ok(fins().every(Boolean));
      assert.ok(w.stats().geometryCount<100,'unchanged six-reset geometry ceiling');
      assert.equal(w.stats().materialCount,initial.materialCount);
    }
    assert.equal(JSON.stringify(state),unchanged,'no authoritative state mutation');
  }finally{
    w.dispose();assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});
