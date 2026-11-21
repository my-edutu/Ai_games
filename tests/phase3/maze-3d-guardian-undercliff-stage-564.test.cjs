'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const local=file=>pathToFileURL(path.join(root,file)).href;
const production=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(local('node_modules/three/build/three.module.js')))
  .replace("'./gate-moment.mjs'",JSON.stringify(local('public/ai-maze-escape/gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(local('public/ai-maze-escape/map-view.mjs')))).toString('base64'));

const observed=()=>({
  runToken:'real-public-counter',lifecycle:'running',result:null,width:5,height:5,
  currentCell:6,visibleCells:[6,8],cells:[
    {cell:6,blocked:false,neighbors:[7]},
    {cell:8,blocked:false,neighbors:[7]},
    // An earlier discovered spectator may still appear in the real 3D stage.
    {cell:12,blocked:false,neighbors:[]},
    {cell:17,blocked:true,neighbors:[]},
    {cell:24,blocked:false,neighbors:[]}
  ],
  doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8,lanternParried:true}]
});

test('Pass564 the earned public two-actor stage REPLACES complete optional exterior fern/medallion fields, not walls or puzzle',async()=>{
  const {createMazeWorld}=await production();
  const world=createMazeWorld({balanced:true}),s=observed();
  const before=world.stats(),immutable=JSON.stringify(s);
  try{
    world.update(s);
    const staged=world.stats();
    assert.ok(staged.guardianQuietFacades>=1,
      'one original continuous sea-glass undercliff exists at the disclosed spectator');
    // Global fern/medallion totals can remain nonzero on OTHER published
    // districts; only the physically selected guardian undercliff is replaced.
    assert.match(source,/if \(guardianQuietRingCell\) \{/);
    assert.match(source,/guardianQuietFacades\+\+/);
    assert.equal(staged.geometryCount,before.geometryCount);
    assert.equal(staged.materialCount,before.materialCount);
    assert.equal(staged.textureCount,before.textureCount);
    assert.equal(JSON.stringify(s),immutable);
    assert.deepEqual(staged.renderedCells,s.cells.map(c=>c.cell));
    for(let n=0;n<6;n++){
      world.update({...s,runToken:'public-reset-'+n});
      assert.ok(world.stats().geometryCount<100,'original strict six-reset budget');
    }
  }finally{
    world.dispose();assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});

test('Pass564 hidden, unrewarded, terminal, pressure and reserved rooms never borrow spectator theatre',async()=>{
  const {createMazeWorld}=await production();
  const sourceState=observed();
  const candidates=[
    {...sourceState,threats:[{id:'thornback',cell:8,lanternParried:false}]},
    {...sourceState,visibleCells:[6]},
    {...sourceState,result:{reason:'capture'}},
    {...sourceState,lifecycle:'ended'},
    {...sourceState,cells:sourceState.cells.map(c=>c.cell===12?{...c,trap:true}:c)},
    {...sourceState,doors:[{a:12,b:17,open:false}]}
  ];
  const world=createMazeWorld({balanced:true});
  try{
    for(const [i,s] of candidates.entries()){
      world.update({...s,runToken:'negative-'+i});
      assert.equal(world.stats().guardianQuietFacades,0,
        'unearned, undisclosed or reserved scenes must retain original architecture');
    }
  }finally{world.dispose()}
});

test('Pass564 retains original actual pressure wall/collision and entire strict portrait 3D scene contracts',()=>{
  assert.match(source,/if \(\(dx > 0 \|\| dz > 0\) && !pressureSightline && !guardianCourtCell/);
  assert.match(source,/if \(guardianQuietRingCell\) \{/);
  assert.match(source,/if \(!guardianQuietRingCell && variation\(c\.cell \* 13 \+ side\) > \.83\)/);
  assert.match(source,/const guardianQuietRing=new Set\(\[/);
  assert.match(source,/if \(pressureCourtBasin\) \{/);
  assert.match(source,/if \(c\.trap && !c\.blocked\) \{/);
  assert.match(source,/if \(c\.blocked\) \{/);
});
