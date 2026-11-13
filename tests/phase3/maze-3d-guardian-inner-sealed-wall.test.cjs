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
const court=()=>({
  runToken:'guardian-public-inner-seal',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,visibleCells:[6,7,8,11,12],
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
