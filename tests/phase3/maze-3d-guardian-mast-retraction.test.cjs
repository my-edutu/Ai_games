'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src
 .replace("'./vendor/three.module.js'",JSON.stringify(three))
 .replace("'./gate-moment.mjs'",JSON.stringify(gate))
 .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const published=()=>({
 runToken:'authentic-observed-duel',lifecycle:'running',result:null,
 width:5,height:5,currentCell:6,visibleCells:[6,7,8],
 cells:[{cell:6,blocked:false,neighbors:[7]},
   {cell:7,blocked:false,neighbors:[6,8]},
   {cell:8,blocked:false,neighbors:[7]}],
 doors:[],keys:[],inventory:[],traps:[],exitCell:null,
 threats:[{id:'thornback',cell:8,lanternParried:false}]
});
test('real guardian warning raises its rooted mast then retracts to reveal the actors on release',async()=>{
 const {createMazeWorld}=await load(),s=published(),truth=JSON.stringify(s);
 const world=createMazeWorld({balanced:true});
 try{
  const before=world.stats();
  world.update(s);
  const shaft=world.group.getObjectByName('Guardian observatory continuous mast 8');
  const collar=world.group.getObjectByName('Guardian observatory upper stone collar 8');
  const hinge=world.group.getObjectByName('Guardian observatory earned shell hinge 8 1');
  const anchor=world.group.getObjectByName('Guardian observatory submerged stone anchor 8');
  assert.ok(shaft&&collar&&hinge&&anchor,'actual original attached Three geometry is present');
  const sample=()=>({
   height:shaft.scale.y,centre:shaft.position.y,
   collar:collar.position.y,hinge:hinge.position.y,
   foot:shaft.position.y-shaft.scale.y*.5
  });
  world.animate(0,{guardianCell:8,guardianBeat:0,reducedMotion:false});
  const neutral=sample();
  assert.ok(Math.abs(neutral.height-.78)<1e-8);
  world.animate(.7,{guardianCell:8,guardianBeat:.5,reducedMotion:false});
  const brace=sample();
  assert.ok(brace.height>neutral.height+.85,'witnessed brace must produce full-sized rising stage action');
  assert.ok(brace.hinge>neutral.hinge+.85,'connected physical sea-shell crown rises with the mast');
  assert.ok(Math.abs(brace.height-1.66)<1e-8);
  world.animate(1,{guardianCell:8,guardianBeat:.9,reducedMotion:false});
  const release=sample();
  assert.ok(release.height<brace.height-.8,'the TRUE release clears the tall actor-obscuring mast');
  assert.ok(release.height<=neutral.height+.03);
  for(const state of [neutral,brace,release]){
   assert.ok(Math.abs(state.foot-.30)<1e-8,
     'telescope must stay rooted to the same stone base, not float or bury the shaft');
   assert.ok(Math.abs(state.collar-(state.height+.25))<1e-8);
   assert.ok(Math.abs(state.hinge-(state.height+.37))<1e-8);
  }
  world.animate(1.4,{guardianCell:8,guardianBeat:.5,reducedMotion:true});
  assert.deepEqual(sample(),neutral,'reduced motion leaves a legible motionless scene');
  world.animate(1.7,{guardianCell:999,guardianBeat:.5,reducedMotion:false});
  assert.deepEqual(sample(),neutral,'lost public guardian never keeps an invented raised warning');
  assert.equal(world.stats().geometryCount,before.geometryCount);
  assert.equal(world.stats().materialCount,before.materialCount);
  assert.equal(JSON.stringify(s),truth,'no AI state, physics, or private route modification');
  world.update({...s,visibleCells:[6,7]});
  assert.equal(world.group.getObjectByName('Guardian observatory continuous mast 8'),undefined,
    'unknown/hidden guardian cannot retain a weather vane');
  for(let i=0;i<6;i++){
   world.update({...s,runToken:'authentic-duel-'+i});
   assert.ok(world.stats().geometryCount<100,'unchanged six-reset geometry budget');
  }
 }finally{
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
 }
});
