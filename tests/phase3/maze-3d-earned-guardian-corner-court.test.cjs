'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const s=()=>({
  runToken:'earned-corner',lifecycle:'running',result:null,
  width:5,height:9,currentCell:6,visibleCells:[6,7,12],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,12]},
    {cell:12,blocked:false,neighbors:[7]}],
  doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:12,lanternParried:true}]
});
test('a REAL earned guardian corner earns only three openly reciprocal, level, public floor tiles',async()=>{
  const {publicEarnedGuardianCornerCourtCells:corner,
    publicGuardianCausewayCells:causeway,publicGuardianStageCells:stage}=await load();
  const a=s(),truth=JSON.stringify(a);
  assert.deepEqual([...corner(a)],[[6,'corner-x'],[7,'corner-z'],[12,'corner-z']]);
  assert.deepEqual([...causeway(a)],[...corner(a)]);
  assert.deepEqual([...stage(a)].sort((x,y)=>x-y),[6,7,12]);
  assert.equal(JSON.stringify(a),truth,'presentation never mutates authoritative truth');
  const invalid=[
    {...a,visibleCells:[6,12]},
    {...a,doors:[{a:7,b:12,open:false}]},
    {...a,cells:a.cells.map(c=>c.cell===7?{...c,neighbors:[6]}:c)},
    {...a,cells:a.cells.map(c=>c.cell===7?{...c,trap:true}:c)},
    {...a,keys:[{id:'key',cell:7}]},
    {...a,threats:[{id:'thornback',cell:12,lanternParried:false}]},
    {...a,lifecycle:'ended'},
    {...a,result:{reason:'capture'}},
    {...a,currentCell:0,visibleCells:[0,7,12]},
    {...a,height:5}, // genuine tier change: no invented flat bridge
  ];
  for(const changed of invalid){
    assert.deepEqual([...corner(changed)],[]);
    assert.deepEqual([...causeway(changed)],[]);
  }
  assert.deepEqual([...corner({...a,privateMap:{allOpen:true},
    predictedRoute:[6,7,12]})],[...corner(a)]);
});
test('the physically bent earned Tideglass stage moves a shared 3-cell floor, not another tall obstructing mast',async()=>{
  const {createMazeWorld}=await load();
  const a=s(),w=createMazeWorld({balanced:true}),initial=w.stats();
  w.update(a);
  assert.equal(w.stats().guardianCausewayTiles,3);
  assert.equal(w.stats().guardianTideSignalTiles,3);
  assert.equal(w.stats().geometryCount,initial.geometryCount);
  assert.equal(w.stats().materialCount,initial.materialCount);
  const rings=[6,7,12].map(cell=>
    w.group.getObjectByName('Earned public guardian Tideglass resonance '+cell));
  assert.ok(rings.every(Boolean),'three original attached Three.js floor rings exist');
  assert.equal(w.group.getObjectByName('Guardian observatory continuous mast 12'),undefined,
    'native phone corner must not acquire a high ornamental screen');
  w.animate(.6,{guardianCell:12,guardianParried:true,guardianCounterPhase:.6,guardianBeat:.85});
  assert.ok(rings.every(r=>r.visible),'true counter lights each public earned route segment');
  w.animate(1.4,{guardianCell:12,guardianParried:false,guardianCounterPhase:undefined});
  assert.ok(rings.every(r=>!r.visible),'unearned or completed counter cannot persist');
  w.update({...a,doors:[{a:7,b:12,open:false}]});
  assert.equal(w.stats().guardianTideSignalTiles,0,'public gate closes the actual stage');
  for(let i=0;i<6;i++){
    w.update({...a,runToken:'earned-corner-reset-'+i});
    assert.ok(w.stats().geometryCount<100,'strict six-reset GPU geometry budget remains unchanged');
    assert.equal(w.stats().guardianTideSignalTiles,3);
  }
  w.dispose();
  assert.equal(w.stats().geometryCount,0);
});
