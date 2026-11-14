'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const court=(blocked=false)=>({
  runToken:'public-camera-guardian-court',lifecycle:'running',result:null,
  width:5,height:7,currentCell:6,visibleCells:[6,7,8,11,12,13],
  cells:[
    {cell:6,blocked:false,neighbors:[7,11]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]},
    {cell:11,blocked:false,neighbors:[6]},
    {cell:12,blocked:false,neighbors:[]},
    {cell:13,blocked,neighbors:[]}
  ],doors:[],keys:[],inventory:[],exitCell:null,
  threats:[{id:'thornback',cell:8}]
});
test('third-ring foreground scenic withdrawal is earned from CURRENT public sight, never secret topology',async()=>{
  const {publicGuardianCameraSideQuietCells,publicGuardianCausewayCells}=await load();
  const s=court(),before=JSON.stringify(s);
  assert.deepEqual([...publicGuardianCausewayCells(s)],[[6,'x'],[7,'x'],[8,'x']]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells(s).ordinary],[13]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,visibleCells:[6,7,8,11,12]}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,threats:[]}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,doors:[{a:7,b:8,open:false}]}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,cells:s.cells.map(c=>c.cell===13?{...c,trap:true}:c)}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,keys:[{cell:13}]}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,doors:[{a:13,b:14,open:false}]}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,cells:s.cells.map(c=>c.cell===13?{...c,checkpoint:true}:c)}).ordinary],[]);
  assert.deepEqual([...publicGuardianCameraSideQuietCells({...s,cells:s.cells.filter(c=>c.cell!==13)}).ordinary],[]);
  assert.equal(JSON.stringify(s),before,'render-only detection must never mutate the public state');
});
test('camera-side blocked spectator remains fully sealed, resets safely, and adds no GPU resources',async()=>{
  const {createMazeWorld,publicGuardianCameraSideQuietCells}=await load();
  const visible=court(true);
  const hidden={...visible,visibleCells:[6,7,8,11,12]};
  const original=JSON.stringify(visible);
  const w=createMazeWorld({balanced:true}),plain=createMazeWorld({balanced:true});
  try{
    assert.deepEqual([...publicGuardianCameraSideQuietCells(visible).sealed],[13]);
    assert.deepEqual([...publicGuardianCameraSideQuietCells(hidden).sealed],[]);
    plain.update({...visible,threats:[]});
    const before=plain.stats();
    w.update(hidden);
    const old=w.stats();
    w.update(visible);
    const now=w.stats();
    assert.equal(now.guardianCameraSideQuietTiles,1,'one truly witnessed front spectator is quiet');
    assert.equal(old.guardianCameraSideQuietTiles,0,'hidden third-ring spectator retains untouched old world');
    assert.ok(now.guardianBlockedReliefTiles>old.guardianBlockedReliefTiles,
      'observed blocked spectator must be modeled as the existing low CLOSED reef, never opened');
    assert.equal(now.geometryCount,before.geometryCount,'new camera-side stage reuses installed Three geometries');
    assert.equal(now.materialCount,before.materialCount,'no new Three materials');
    w.update(hidden);
    assert.equal(w.stats().guardianCameraSideQuietTiles,0,'visibility loss restores original architecture');
    w.update({...visible,doors:[{a:7,b:8,open:false}]});
    assert.equal(w.stats().guardianCameraSideQuietTiles,0,'closed actual guardian route restores original architecture');
    for(let i=0;i<6;i++){
      w.update({...visible,runToken:'camera-side-sealed-reset-'+i});
      assert.equal(w.stats().guardianCameraSideQuietTiles,1);
      assert.ok(w.stats().geometryCount<100,'unchanged strict six-reset geometry budget');
    }
    assert.equal(JSON.stringify(visible),original,'public state remains unchanged');
  }finally{
    w.dispose();plain.dispose();
    assert.equal(w.stats().geometryCount,0);
    assert.equal(w.stats().materialCount,0);
  }
});
