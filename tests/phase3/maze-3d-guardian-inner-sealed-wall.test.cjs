'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
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
// Seven rows keep both the witnessed 7/12 crossing and 11/12 spectator
// pair on the SAME published elevation; the old five-row fixture placed
// row 2 a full 1.4m lower, so it never met the original unchanged geometry gate.
const court=()=>({
  runToken:'guardian-public-inner-seal',lifecycle:'running',result:null,
  width:5,height:7,currentCell:6,visibleCells:[6,7,8,11,12],
  cells:[
    {cell:6,blocked:false,neighbors:[7,11]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]},
    {cell:11,blocked:false,neighbors:[6]},
    {cell:12,blocked:false,neighbors:[]},
  ],doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8}],
});
test('actual disclosed inner guardian sealed edge has low solid masonry, never an unseen or one-way opening',async()=>{
  const {createMazeWorld,publicGuardianCausewayCells}=await load();
  const s=court(),pristine=JSON.stringify(s),w=createMazeWorld({balanced:true}),plain=createMazeWorld({balanced:true});
  try{
    assert.deepEqual([...publicGuardianCausewayCells(s)],[[6,'x'],[7,'x'],[8,'x']]);
    plain.update({...s,threats:[]});
    const before=plain.stats();
    w.update(s);
    const actual=w.stats();
    assert.ok(actual.guardianSightlineParapets>=2,
      'sealed inner 11/12 and causeway 7/12 must use physically continuous low opaque parapets');
    assert.equal(actual.geometryCount,before.geometryCount,'no new Three geometry resource');
    assert.equal(actual.materialCount,before.materialCount,'no new Three material resource');
    assert.equal(JSON.stringify(s),pristine,'never mutate public game state');
    w.update({...s,cells:s.cells.map(c=>c.cell===11?{...c,neighbors:[6,12]}:c)});
    assert.ok(w.stats().guardianSightlineParapets<actual.guardianSightlineParapets,
      'one-way reported traversal cannot be visually flattened as a confirmed sealed edge');
    w.update({...s,doors:[{a:7,b:8,open:false}]});
    assert.equal(w.stats().guardianSightlineParapets,0,'locked encounter restores untouched masonry');
    w.update({...s,visibleCells:[6,7,11,12]});
    assert.equal(w.stats().guardianSightlineParapets,0,'unseen guardian cannot grant a false cutaway');
    for(let i=0;i<6;i++){
      w.update({...s,runToken:'guardian-seal-reset-'+i});
      assert.ok(w.stats().guardianSightlineParapets>=2);
      assert.ok(w.stats().geometryCount<100,'strict six-reset GPU budget is unchanged');
    }
  }finally{
    w.dispose();plain.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});


test('Pass344 third-ring public same-tier NONPASSAGE screens become real low stone; hidden/pressure/gated edges stay authoritative',async()=>{
  const {createMazeWorld,publicGuardianWitnessedForegroundCells}=await load();
  const s=court(),original=JSON.stringify(s);
  const w=createMazeWorld({balanced:true}),starting=w.stats();
  try {
    const near=publicGuardianWitnessedForegroundCells(s);
    assert.equal(near.has(12),true);
    assert.equal(near.has(13),false,'original two-cell floor/material district cannot spread');
    w.update(s);
    const oldWallCount=w.stats().guardianSightlineParapets;
    const far={...s,visibleCells:[...s.visibleCells,13],
      cells:[...s.cells,{cell:13,blocked:false,neighbors:[]}]};
    const truth=JSON.stringify(far);
    assert.equal(publicGuardianWitnessedForegroundCells(far).has(13),false,
      'the ordinary visual court never uses a speculative third ring');
    assert.equal(publicGuardianWitnessedForegroundCells(far,undefined,3).has(13),true,
      'the extra wall-only tile is actually already published and level-matched');
    w.update(far);
    const actual=w.stats();
    assert.ok(actual.guardianSightlineParapets>oldWallCount,
      'real source-bound 12/13 spectator screen now reconstructs as solid LOW masonry');
    assert.equal(actual.geometryCount,starting.geometryCount,'no new GPU geometry classes');
    assert.equal(actual.materialCount,starting.materialCount,'no new material classes');
    assert.equal(JSON.stringify(far),truth,'world rendering never mutates public knowledge');
    const oneWay={...far,cells:far.cells.map(c=>c.cell===12?{...c,neighbors:[13]}:c)};
    w.update(oneWay);
    assert.ok(w.stats().guardianSightlineParapets<actual.guardianSightlineParapets,
      'one-sided movement report is not proof of a sealed public wall');
    w.update({...far,visibleCells:s.visibleCells});
    assert.equal(w.stats().guardianSightlineParapets,oldWallCount,
      'unpublished far endpoint never authorizes a cutaway');
    w.update({...far,doors:[{a:12,b:13,open:false}]});
    assert.ok(w.stats().guardianSightlineParapets<actual.guardianSightlineParapets,
      'authentic closed gate must keep original sealed geometry');
    w.update({...far,cells:far.cells.map(c=>c.cell===13?{...c,trap:true}:c)});
    assert.ok(w.stats().guardianSightlineParapets<actual.guardianSightlineParapets,
      'real disclosed pressure machinery cannot be flattened');
    w.update({...far,visibleCells:far.visibleCells.filter(c=>c!==8)});
    assert.equal(w.stats().guardianSightlineParapets,0,
      'hidden Thornback cannot authorize a false visual cutaway');
    for(let i=0;i<6;i++){
      w.update({...far,runToken:'pass344-third-ring-reset-'+i});
      assert.equal(w.stats().guardianSightlineParapets,actual.guardianSightlineParapets);
      assert.ok(w.stats().geometryCount<100,'original strict six-run GPU budget remains <100');
    }
    assert.equal(JSON.stringify(s),original);
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});

test('Pass345 visibility-only disclosure restores real third-ring low and tall guardian walls',async()=>{
  const {createMazeWorld,publicGuardianCausewayCells,
    publicGuardianWitnessedForegroundCells}=await load();
  const base=court();
  // Real one-edge guardian route 6-7; known 13 is grid distance 3 from
  // explorer6 and NOT adjacent to either route cell. Former reefVisibility
  // failed to include its disclosure, leaving old physical masonry stale.
  const hidden={...base,threats:[{id:'thornback',cell:7}],
    visibleCells:[6,7,11,12],
    cells:[...base.cells,{cell:13,blocked:false,neighbors:[]}]};
  const visible={...hidden,visibleCells:[...hidden.visibleCells,13]};
  const original=JSON.stringify(visible),w=createMazeWorld({balanced:true});
  try{
    assert.deepEqual([...publicGuardianCausewayCells(hidden)],[[6,'x'],[7,'x']]);
    assert.equal(publicGuardianWitnessedForegroundCells(hidden,undefined,3).has(13),false);
    assert.equal(publicGuardianWitnessedForegroundCells(visible,undefined,3).has(13),true);
    assert.equal(publicGuardianWitnessedForegroundCells(visible).has(13),false,
      'the original material/floor district stays exactly two cells');
    w.update(hidden);
    const before=w.stats();
    // Only visibleCells changes: same known geometry, run, topology, threat.
    w.update(visible);
    const now=w.stats();
    assert.ok(now.guardianSightlineParapets>before.guardianSightlineParapets,
      'new public far-end must rebuild actual opaque low guardian wall');
    assert.equal(now.geometryCount,before.geometryCount,'no new GPU classes');
    w.update(hidden);
    assert.equal(w.stats().guardianSightlineParapets,before.guardianSightlineParapets,
      'loss of current visibility restores authentic full-height solid wall');
    w.update(visible);
    assert.equal(w.stats().guardianSightlineParapets,now.guardianSightlineParapets,
      're-disclosure restores ONLY the witnessed solid low wall');
    w.update({...visible,threats:[]});
    assert.equal(w.stats().guardianSightlineParapets,0,
      'unwitnessed guardian cannot create cutaway');
    assert.equal(JSON.stringify(visible),original,'public source remains immutable');
    assert.ok(w.stats().geometryCount<100,'strict existing GPU budget');
  }finally{
    w.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});
