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
const production=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))
    .replace("'./gate-moment.mjs'",JSON.stringify(gate))
    .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));

const publicRecoil=()=>({
  runToken:'real-parried-spectator-court',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,
  visibleCells:[6,7,8,11,16,20,24],
  cells:[
    {cell:6,blocked:false,neighbors:[7,11]},
    {cell:7,blocked:false,neighbors:[6]},
    {cell:8,blocked:false,neighbors:[]},
    {cell:11,blocked:false,neighbors:[6,16]},
    {cell:16,blocked:false,neighbors:[11]},
    {cell:20,blocked:false,neighbors:[]},
    {cell:24,blocked:false,neighbors:[]}
  ],doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'public-thornback',cell:8,lanternParried:true}]
});

test('earned retreat builds a truthful published actor court, with separate spectator horizon and no invented path',async()=>{
  const {publicEarnedGuardianRecoilCourtCells:quiet,
    publicGuardianCausewayCells:causeway}=await production;
  const s=publicRecoil(),truth=JSON.stringify(s);
  assert.equal(causeway(s).size,0,
    'real guardian has retreated past the known reciprocal corridor');
  const actor=quiet(s),spectator=quiet(s,{spectator:true});
  assert.ok(actor.has(6)&&actor.has(8),
    'Pip and a genuinely publicly parried guardian still own the actual stage');
  assert.ok(spectator.has(20) && !actor.has(20),
    'the disclosed fourth-ring spectator clears only optional vegetation, not the low actor court');
  assert.ok(spectator.has(24),
    'the disclosed fourth-ring threshold must clear tall spectators');
  const beyond={...s,width:9,height:9,
    visibleCells:[...s.visibleCells,80],
    cells:[...s.cells,{cell:80,blocked:false,neighbors:[]}]};
  assert.ok(!quiet(beyond,{spectator:true}).has(80),
    'a remotely disclosed eighth-row cell cannot lose world dressing');
  assert.ok([...actor].every(id=>s.visibleCells.includes(id)),
    'never stage an undisclosed or privately inferred tile');
  assert.equal(JSON.stringify(s),truth,
    'decorative source must never mutate AI, map, route or collision authority');
  assert.equal(quiet({...s,visibleCells:s.visibleCells.filter(id=>id!==8)}).size,0);
  assert.equal(quiet({...s,threats:[{cell:8,lanternParried:false}]}).size,0);
  assert.equal(quiet({...s,lifecycle:'ended'}).size,0);
  assert.equal(quiet({...s,result:{reason:'capture'}}).size,0);
  assert.deepEqual([...quiet({...s,privateMaze:{cells:[{cell:9,neighbors:[8]}]},
    secretRoute:[6,7,8]},{spectator:true})].sort((a,b)=>a-b),
    [...spectator].sort((a,b)=>a-b),
    'hidden scene truth cannot expand spectator visibility');
  const reserved={...s,keys:[{cell:20}],doors:[{a:11,b:16,open:false}]};
  assert.ok(!quiet(reserved,{spectator:true}).has(20),
    'a visible real collectible is not hidden by quiet scenery');
  assert.ok(!quiet(reserved,{spectator:true}).has(11),
    'actual gate landings retain their public source-bound architecture');
});

test('installed Three builds a continuous physically flush earned court without a route, GPU growth or stale scenery',async()=>{
  const {createMazeWorld,publicGuardianCausewayCells}=await production;
  const scene=createMazeWorld({balanced:true}),s=publicRecoil(),truth=JSON.stringify(s);
  const initial=scene.stats();
  try {
    scene.update(s);
    assert.equal(publicGuardianCausewayCells(s).size,0,
      'never turn post-recoil into a fabricated connected lane');
    const after=scene.stats();
    assert.ok(after.guardianCourtTiles>=2,
      'visible complete Pip and Thornback get real authored low Tideglass geometry');
    assert.equal(after.geometryCount,initial.geometryCount,
      'reuses the actual original pooled Three geometry classes');
    assert.equal(after.materialCount,initial.materialCount,
      'no extra pooled material classes');
    const hidden={...s,visibleCells:s.visibleCells.filter(id=>id!==8)};
    scene.update(hidden);
    assert.equal(scene.stats().guardianCourtTiles,0,
      'as soon as Thornback is no longer public, the special stage goes away');
    scene.update({...s,threats:[{cell:8,lanternParried:false}]});
    assert.equal(scene.stats().guardianCourtTiles,0,
      'no invented parry can retain the cutaway');
    for(let i=0;i<6;i++){
      scene.update({...s,runToken:'earned-theatre-reset-'+i});
      assert.ok(scene.stats().guardianCourtTiles>=2);
      assert.ok(scene.stats().geometryCount<100,
        'six-run original strict geometry budget stays below 100');
    }
    assert.equal(JSON.stringify(s),truth,
      'the rendered court must not change the autonomous source state');
  }finally{
    scene.dispose();
    assert.equal(scene.stats().geometryCount,0);
    assert.equal(scene.stats().materialCount,0);
  }
});


// A rendering-only isolated decision: no route, actor, wall, or simulation
// field is involved. Real scene.js feeds connected physical Box3 projections.
test('source-bound current parry clears only camera-front optional fossil silhouettes',async()=>{
  const camera=await import(pathToFileURL(path.join(root,
    'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
  const occludes=camera.publicGuardianScenicOccludesActor;
  const pip={left:-.34,right:.32,bottom:-.43,top:.25,nearestZ:.24};
  const foreground={left:-.21,right:.28,bottom:-.24,top:.58,nearestZ:.05};
  assert.equal(occludes(pip,foreground,true,false),true,
    'a genuine in-front fossil tree masking Pip is a meaningful scene occluder');
  assert.equal(occludes(pip,foreground,false,false),false,
    'a synthetic or stale parry cannot clear real scenic geometry');
  assert.equal(occludes(pip,foreground,true,true),false,
    'reduced-motion presentation retains its unchanged stable scene');
  assert.equal(occludes(pip,{...foreground,nearestZ:.50},true,false),false,
    'a fossil landmark BEHIND the actor is never suppressed');
  assert.equal(occludes(pip,{...foreground,left:.7,right:.9},true,false),false,
    'unrelated nearby trees are not erased by a broad radius');
  assert.equal(occludes(pip,{...foreground,left:.30,right:.52},true,false),false,
    'a barely touching silhouette does not cause pop or thinning');
  assert.equal(occludes(pip,{...foreground,nearestZ:NaN},true,false),false);
});
