'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;
const production=()=>import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))
    .replace("'./gate-moment.mjs'",JSON.stringify(gate))
    .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));

const publishedParry=()=>({
  runToken:'genuine-published-parry',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,visibleCells:[6,8],
  cells:[
    {cell:6,blocked:false,neighbors:[7]},
    {cell:8,blocked:false,neighbors:[7]},
    // Discovered earlier: still PHYSICALLY rendered but not in current FOV.
    {cell:12,blocked:false,neighbors:[]},
    {cell:17,blocked:true,neighbors:[]},
    {cell:24,blocked:false,neighbors:[]}
  ],
  doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8,lanternParried:true}]
});

test('Pass540 the earned two-actor picture clears ONLY previously disclosed spectator dressing, never unknown map',async()=>{
  const {publicEarnedGuardianRecoilCourtCells:quiet}=await production();
  const s=publishedParry(),original=JSON.stringify(s);
  const physical=quiet(s);
  const scenic=quiet(s,{spectator:true});
  assert.deepEqual([...physical].sort((a,b)=>a-b),[6,8],
    'physical actor-level floor remains strictly current and public');
  assert.ok(scenic.has(12)&&scenic.has(24),
    'only previously disclosed ordinary spectator foliage may yield to a genuine on-screen parry');
  assert.ok(!scenic.has(17),
    'formerly observed but now invisible SOLID spectator keeps its original full-height sealed wall');
  assert.ok(!physical.has(12)&&!physical.has(17),
    'remembered-only cells cannot become a fake newly playable actor court');
  assert.ok(!scenic.has(13) && !scenic.has(18) && !scenic.has(23),
    'undisclosed terrain cannot be inferred from radius or physical positions');
  assert.equal(JSON.stringify(s),original,
    'all public gameplay, memory, AI/collision and cell flags remain immutable');
  assert.deepEqual([...quiet({...s,privateMaze:{cells:[{cell:13,blocked:false}]},
    secretPath:[6,13,8]},{spectator:true})].sort((a,b)=>a-b),
    [...scenic].sort((a,b)=>a-b),
    'private truth cannot enlarge the ornamental public screen treatment');
});

test('Pass540 never stages a hidden/stale parry, reserved objective, terminal scene or new unobserved guardian',async()=>{
  const {publicEarnedGuardianRecoilCourtCells:quiet}=await production();
  const s=publishedParry();
  for(const bad of [
    {...s,visibleCells:[6]},
    {...s,threats:[{cell:8,lanternParried:false}]},
    {...s,threats:[{cell:18,lanternParried:true}]},
    {...s,lifecycle:'ended'},
    {...s,result:{reason:'capture'}}
  ])assert.equal(quiet(bad,{spectator:true}).size,0);
  const reserved={...s,doors:[{a:12,b:17,open:false}],
    keys:[{id:'real-key',cell:24}]};
  const q=quiet(reserved,{spectator:true});
  for(const cell of [12,17,24])assert.ok(!q.has(cell),
    'the truth of gates and keys survives an earned visual cutaway');
  const distant={...s,width:9,height:9,
    cells:[...s.cells,{cell:80,blocked:false,neighbors:[]}]};
  assert.ok(!quiet(distant,{spectator:true}).has(80),
    'remote remembered terrain should not be stripped of its authored world silhouette');
});

test('Pass540 real world uses spectator ring solely for original foliage/wall decoration, not authority or GPU expansion',async()=>{
  const {createMazeWorld}=await production();
  const s=publishedParry(),world=createMazeWorld({balanced:true}),initial=world.stats();
  try{
    world.update(s);
    const first=world.stats();
    assert.ok(first.guardianCourtTiles>=2,'connected characters have real low physical terrain');
    assert.equal(first.geometryCount,initial.geometryCount,'reuse existing pooled geometry');
    assert.equal(first.materialCount,initial.materialCount,'reuse existing pooled materials');
    assert.match(source,/const guardianQuietRing=new Set\(\[/);
    assert.match(source,/\.\.\.earnedSpectatorHorizon/);
    assert.match(source,/!guardianQuietRingCell && variation\(patch\)/);
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'pass540-public-reset-'+i});
      assert.ok(world.stats().geometryCount<100,'original six-run geometry budget is unchanged');
    }
  }finally{
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});
