'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));

// The actual seed-13 mobile parry moves guardian 91 -> 74 (17-wide grid).
// The original uncropped native ray trace shows real foreground masonry:
// cell 93's north wall against 76 and cell 75's east wall against 76.
const publicRecoil=()=>({
  runToken:'public-recoil-screen', lifecycle:'running',result:null,
  width:17,height:12,currentCell:91,
  visibleCells:[91,74,75,76,93],
  cells:[
    {cell:91,blocked:false,neighbors:[]},
    {cell:74,blocked:false,neighbors:[]},
    {cell:75,blocked:false,neighbors:[]},
    {cell:76,blocked:false,neighbors:[]},
    {cell:93,blocked:false,neighbors:[]},
  ],
  threats:[{id:'thornback',cell:74,lanternParried:true}],
  keys:[],inventory:[],doors:[],exitCell:null
});

test('Pass422 physical 75/76 and 76/93 CURRENT sealed corner is cut down, but never treated as a route',async()=>{
  const {createMazeWorld,publicEarnedGuardianRecoilSealedScreens:screens,
    publicGuardianCausewayCells}=await load();
  const snapshot=publicRecoil(),immutable=JSON.stringify(snapshot);
  assert.equal(publicGuardianCausewayCells(snapshot).size,0,
    'true earned retreat is outside the old reciprocal acting corridor');
  assert.deepEqual([...screens(snapshot)].sort(),['75:76','76:93'],
    'the actual two PUBLIC sealed walls, not invented paths or unseen decor');
  const world=createMazeWorld({balanced:true}),plain=createMazeWorld({balanced:true});
  try{
    plain.update({...snapshot,threats:[{id:'thornback',cell:74,lanternParried:false}]});
    const old=plain.stats();
    world.update(snapshot);
    const next=world.stats();
    assert.ok(next.guardianSightlineParapets>=2,
      'real renderer must instantiate at least two low solid Tideglass walls');
    assert.ok(next.guardianSightlineParapets>old.guardianSightlineParapets,
      'this changes ACTUAL guardian theatre geometry, not only source diagnostics');
    assert.equal(next.geometryCount,old.geometryCount,'reuse installed Three geometries');
    assert.equal(next.materialCount,old.materialCount,'reuse installed Three materials');
    assert.deepEqual(snapshot,JSON.parse(immutable),'presentation cannot mutate AI knowledge');
    for(let i=0;i<6;i++){
      world.update({...snapshot,runToken:'public-recoil-screen-reset-'+i});
      assert.ok(world.stats().geometryCount<100,
        'preserve original six-run strict <100 GPU geometry budget');
    }
  }finally{
    world.dispose();plain.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});

test('Pass422 only fully public genuinely SEALED same-tier stone earns cutaway',async()=>{
  const {publicEarnedGuardianRecoilSealedScreens:screens}=await load();
  const s=publicRecoil(),original=JSON.stringify(s);
  const invalid=[
    {...s,threats:[{cell:74,lanternParried:false}]},
    {...s,visibleCells:[91,74,75,93]},
    {...s,lifecycle:'ended'},
    {...s,result:{reason:'capture'}},
    {...s,doors:[{a:75,b:76,open:false}]},
  ];
  for(const changed of invalid){
    const edges=screens(changed);
    if(changed.doors.length)assert.equal(edges.has('75:76'),false,'a real closed gate must remain original');
    else assert.equal(edges.size,0,'no false stage from hidden or unwitnessed state');
  }
  assert.equal(screens({...s,cells:s.cells.map(c=>c.cell===75?{...c,neighbors:[76]}:c)}).has('75:76'),false,
    'one-way disclosure must not be flattened as a real seal');
  assert.equal(screens({...s,cells:s.cells.map(c=>c.cell===76?{...c,neighbors:[75]}:c)}).has('75:76'),false,
    'the reverse one-way report is also NOT a mutually sealed wall');
  assert.equal(screens({...s,cells:s.cells.map(c=>c.cell===76?{...c,trap:true}:c)}).size,0,
    'a real published pressure trigger is NEVER reconstructed as spectator wall');
  assert.equal(screens({...s,keys:[{cell:76}]}).size,0,
    'a known key cannot disappear into theatre geometry');
  assert.deepEqual(screens({...s,privateMaze:{neighbors:[75,76],secretRoute:[91,74]}}),screens(s),
    'private topology is neither read nor promoted to visibility');
  assert.equal(JSON.stringify(s),original);
});
