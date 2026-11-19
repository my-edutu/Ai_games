'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const url=(relative)=>pathToFileURL(path.join(root,relative)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(url('node_modules/three/build/three.module.js')))
  .replace("'./gate-moment.mjs'",JSON.stringify(url('public/ai-maze-escape/gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(url('public/ai-maze-escape/map-view.mjs')))).toString('base64'));

const snapshot=()=>({
  runToken:'one-public-parried-recoil', lifecycle:'running',result:null,
  width:7,height:7,currentCell:17,exitCell:null,
  visibleCells:[17,18,19,34,42], discoveredCells:[17,18,19,34,42],
  cells:[
    {cell:17,blocked:false,neighbors:[18]},
    {cell:18,blocked:false,neighbors:[17,19]},
    {cell:19,blocked:false,neighbors:[18]},
    // Confirmed elevated sealed stone at a camera-side distance of three
    // from the ACTUAL guardian, beyond the previous two-cell cutaway.
    {cell:34,blocked:true,neighbors:[]},
    {cell:42,blocked:true,neighbors:[]},
  ],doors:[],keys:[],inventory:[],
  threats:[{id:'thornback',cell:19,lanternParried:true}]
});
test('Pass495 public earned recoil includes only observed impassable spectator stone, never hidden geometry or trap/gate',async()=>{
  const {publicEarnedGuardianRecoilCourtCells:quiet}=await load();
  const s=snapshot(),immutable=JSON.stringify(s);
  assert.equal(quiet(s).has(34),false,'existing small same-level low-stone court cannot pretend elevated stone is flat');
  assert.equal(quiet(s,{spectator:true}).has(34),true,
    'observed blocked third-ring foreground is eligible for a real LOW SEALED scenic reef');
  assert.equal(quiet(s,{spectator:true}).has(42),false,'distant blocked landmark stays a full skyline silhouette');
  // The three still-visible, genuinely public actor-floor cells remain a
  // legitimate low court. Hiding spectator 34 must not suppress their stage;
  // nor may it continue lowering that previously discovered solid terrace.
  const afterOcclusion=quiet({...s,visibleCells:[17,18,19,42]},{spectator:true});
  assert.deepEqual([...afterOcclusion].sort((a,b)=>a-b),[17,18,19],
    'visible public actor court persists but the hidden blocked spectator is excluded');
  assert.equal(afterOcclusion.has(34),false,
    'a previously observed, now-hidden blocked spectator cannot remain lowered');
  assert.deepEqual([...quiet({...s,threats:[{id:'thornback',cell:19}]},{spectator:true})],[],
    'no published lantern parry means no earned blocked spectator');
  assert.deepEqual([...quiet({...s,result:{reason:'capture'}},{spectator:true})],[]);
  assert.equal(quiet({...s,cells:s.cells.map(c=>c.cell===34?{...c,blocked:undefined}:c)},{spectator:true}).has(34),false,
    'unresolved stone must never be guessed solid or open');
  assert.equal(quiet({...s,cells:s.cells.map(c=>c.cell===34?{...c,trap:true}:c)},{spectator:true}).has(34),false,
    'an actual published pressure jaw may never be cut down');
  assert.equal(quiet({...s,doors:[{id:'authentic-lock',a:34,b:33,open:false}]},{spectator:true}).has(34),false);
  assert.equal(quiet({...s,keys:[{id:'authentic-key',cell:34,collected:false}]},{spectator:true}).has(34),false);
  assert.equal(JSON.stringify(s),immutable,'presentation may not mutate public AI/collision data');
});
test('Pass495 installed Three world replaces only earned blocked spectator dressing with tangible sealed Tideglass low reef',async()=>{
  const {createMazeWorld}=await load();
  const s=snapshot(),original=JSON.stringify(s);
  const world=createMazeWorld({balanced:true}),resources=world.stats();
  try {
    world.update({...s,threats:[{id:'thornback',cell:19}]});
    const unearned=world.stats();
    world.update(s);
    const earned=world.stats();
    assert.ok(earned.guardianBlockedReliefTiles>unearned.guardianBlockedReliefTiles,
      'a real newly witnessed blocked upper spectator is rebuilt into physical opaque low stone');
    assert.deepEqual(earned.renderedCells,s.cells.map(c=>c.cell),
      'only the same five published true source cells exist after the cutaway');
    assert.equal(earned.geometryCount,resources.geometryCount);
    assert.equal(earned.materialCount,resources.materialCount);
    assert.equal(earned.textureCount,resources.textureCount);
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'blocked-reef-repeat-'+i});
      const now=world.stats();
      assert.ok(now.geometryCount<100,'unchanged strict six-reset geometry budget');
      assert.equal(now.guardianBlockedReliefTiles,earned.guardianBlockedReliefTiles,
        'each reset reproduces the same physically sealed actor foreground');
    }
    world.update({...s,runToken:'guardian-now-hidden',visibleCells:[17,18,34,42]});
    assert.equal(world.stats().guardianBlockedReliefTiles,unearned.guardianBlockedReliefTiles,
      'an unseen actor cannot keep the blocking reef artificially lowered');
    assert.equal(JSON.stringify(s),original);
  } finally {
    world.dispose();
  }
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
});