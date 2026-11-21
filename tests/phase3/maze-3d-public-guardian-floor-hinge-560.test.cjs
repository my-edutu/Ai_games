'use strict';
const test=require('node:test');
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
const snapshot=()=>({
 runToken:'pass560-disclosed-stage',lifecycle:'running',result:null,
 width:5,height:5,currentCell:6,visibleCells:[6,7,8],
 cells:[{cell:6,blocked:false,neighbors:[7]},
   {cell:7,blocked:false,neighbors:[6,8]},
   {cell:8,blocked:false,neighbors:[7]}],
 doors:[],keys:[],inventory:[],traps:[],exitCell:null,
 threats:[{id:'thornback',cell:8,lanternParried:false}]
});
test('witnessed warning raises connected floor leaves, earned lantern counter physically seats their hinges without hiding actors or changing authority',async()=>{
 const {createMazeWorld}=await load(),s=snapshot(),input=JSON.stringify(s);
 const world=createMazeWorld({balanced:true});
 const hinge=(c,side)=>world.group.getObjectByName('Published guardian Tideglass margin hinge '+c+' '+side);
 const leaves=()=>[6,7,8].flatMap(c=>[-1,1].map(side=>hinge(c,side)));
 try {
  const originalBudget=world.stats();
  world.update(s);
  assert.ok(leaves().every(Boolean),'all six current, public, mechanically joined leaves exist');
  const cue={guardianCell:8,guardianParried:true,guardianBeat:0,reducedMotion:false};
  world.animate(0,cue);
  assert.ok(leaves().every(h=>h.position.y===0 && h.rotation.x===0),
    'a caller-only invented parry cannot trigger even a small retraction');
  world.animate(.7,{...cue,guardianParried:false,guardianBeat:.5});
  assert.ok(leaves().every(h=>h.position.y<-.05 && h.position.y>-.06 && Math.abs(h.rotation.x)>1.0),
    'real public brace raises the substantial existing leaf but seats its physically rooted threshold');
  const won={...s,threats:[{...s.threats[0],lanternParried:true}]};
  world.update(won);
  world.animate(2,cue);
  world.animate(2.20,cue);
  const progression=[6,7,8].map(c=>hinge(c,1).position.y);
  assert.ok(progression[0]<progression[1]-.06 && progression[1]<progression[2]-.06,
    'authentic first-counter floor release proceeds in witnessed Pip-to-guardian order');
  world.animate(2.8,cue);
  assert.ok(leaves().every(h=>h.position.y<-.30 && Math.abs(h.rotation.x)>1.4),
    'the entire original joined hinge descends to the existing groove as the earned court clears');
  world.animate(3,{...cue,guardianParried:false});
  assert.ok(leaves().every(h=>h.position.y===0 && h.rotation.x===0),
    'unearned/stale counter cannot leave sunk scenery or a false parry clue');
  world.animate(4,{...cue,reducedMotion:true});
  assert.ok(leaves().every(h=>h.position.y===0 && h.rotation.x===0),
    'reduced motion freezes real hinges without visually inventing damage');
  world.update({...won,visibleCells:[6,7]});
  assert.equal(hinge(8,1),undefined,'hidden guardian no longer earns that scene hardware');
  world.update({...won,doors:[{a:7,b:8,open:false}]});
  assert.equal(hinge(6,1),undefined,'a sealed route never gets a counter stage');
  world.update({...won,result:{reason:'capture'}});
  assert.equal(hinge(6,1),undefined,'terminal capture revokes any fake continuing signal');
  for(let i=0;i<6;i++){
   world.update({...s,runToken:'pass560-reset-'+i});
   assert.ok(world.stats().geometryCount<100,'strict six-scene reset geometry budget is unchanged');
  }
  assert.equal(world.stats().geometryCount,originalBudget.geometryCount,
    'the same pooled geometry class count survives all source resets');
  assert.equal(world.stats().materialCount,originalBudget.materialCount);
  assert.equal(JSON.stringify(s),input,'authentic public snapshot and private gameplay untouched');
 } finally {
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
 }
});
