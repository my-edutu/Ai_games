'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const file=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src
  .replace("'./vendor/three.module.js'",JSON.stringify(file('node_modules/three/build/three.module.js')))
  .replace("'./gate-moment.mjs'",JSON.stringify(file('public/ai-maze-escape/gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(file('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const court=(axis='x')=>{
 const cells=axis==='x'?[6,7,8]:[6,11,16];
 const adjacency=cells.map((cell,i)=>({cell,blocked:false,neighbors:[cells[i-1],cells[i+1]].filter(Number.isInteger)}));
 return {runToken:'true-public-counter-vane-'+axis,lifecycle:'running',result:null,
   width:5,height:5,currentCell:6,visibleCells:cells,cells:adjacency,
   doors:[],keys:[],inventory:[],traps:[],exitCell:null,
   threats:[{id:'thornback',cell:cells[2],lanternParried:false}]};
};
test('Pass549 source-ray-attributed weather vane physically folds outward ONLY for an earned visible lantern counter',async()=>{
 const {createMazeWorld}=await load();
 for(const axis of ['x','z']){
  const initial=court(axis),w=createMazeWorld({balanced:true});
  try{
   w.update(initial);
   const c=initial.threats[0].cell;
   const rootObj=w.group.getObjectByName('Witnessed guardian rooted Tideglass weather vane '+c);
   const shaft=w.group.getObjectByName('Guardian observatory continuous mast '+c);
   const vanes=[-1,1].map(side=>w.group.getObjectByName('Guardian observatory earned shell hinge '+c+' '+side));
   assert.ok(rootObj&&shaft&&vanes.every(Boolean));
   assert.ok(vanes.every(v=>v.parent===rootObj),'same actual joined Three.js assembly');
   const resources=w.stats();
   // world.update() legitimately reconstructs the public mesh on a
   // published threat-state transition. Always inspect the LIVE physical
   // assembly, not a detached old-world root from before the parry.
   const pose=()=>{
     const current=w.group.getObjectByName('Witnessed guardian rooted Tideglass weather vane '+c);
     const currentVanes=[-1,1].map(side=>w.group.getObjectByName(
       'Guardian observatory earned shell hinge '+c+' '+side));
     assert.ok(current&&currentVanes.every(v=>v?.parent===current),
       'inspect the currently rendered rooted assembly after each public rebuild');
     return {x:current.rotation.x,z:current.rotation.z,
       y:current.position.y,hinges:currentVanes.map(v=>v.rotation.y)};
   };
   const options={guardianCell:c,guardianBeat:.55,reducedMotion:false};
   w.animate(.1,options);
   assert.equal(pose().x,0);assert.equal(pose().z,0);
   assert.ok(pose().hinges.every(n=>n===0));
   w.animate(.2,{...options,guardianParried:true,guardianCounterPhase:0});
   assert.ok(pose().hinges.every(n=>n===0),
     'claimed counter without real public authoritative parry cannot fold sculpture');
   const parried={...initial,threats:[{...initial.threats[0],lanternParried:true}]};
   w.update(parried);
   w.animate(.3,{...options,guardianParried:true,guardianCounterPhase:0});
   const earned=pose();
   assert.ok(earned.y < -1.4,'the original whole-root depression contract remains strict');
   assert.ok(axis==='x'?earned.x<-.9:earned.z>.9,
     'original physical mast pivots into its actual outboard causeway margin');
   assert.ok(Math.abs(axis==='x'?earned.z:earned.x)<1e-8,
     'no inward rotation across the real public passable lane');
   assert.ok(earned.hinges[0]<-.5&&earned.hinges[1]>.5,
     'both connected full original shell fans spread laterally rather than form vertical screens');
   w.animate(.4,{...options,guardianParried:false,guardianCounterPhase:.5});
   assert.equal(pose().x,0);assert.equal(pose().z,0);
   assert.ok(pose().hinges.every(n=>n===0),'permission expiry restores all original joints');
   w.animate(.5,{...options,guardianParried:true,guardianCounterPhase:.5,reducedMotion:true});
   assert.equal(pose().x,0);assert.equal(pose().z,0);
   assert.ok(pose().hinges.every(n=>n===0),'reduced motion preserves physical stillness');
   w.animate(.6,{...options,guardianCell:999,guardianParried:true,guardianCounterPhase:0});
   assert.equal(pose().x,0);assert.equal(pose().z,0);
   assert.ok(pose().hinges.every(n=>n===0),'unseen guardian cannot make an effect');
   assert.equal(w.stats().geometryCount,resources.geometryCount);
   assert.equal(w.stats().materialCount,resources.materialCount);
   for(let i=0;i<6;i++){
     w.update({...initial,runToken:'public-fold-reset-'+axis+'-'+i});
     assert.ok(w.stats().geometryCount<100,'unchanged six-run physical geometry limit');
   }
   assert.equal(JSON.stringify(initial),JSON.stringify(court(axis)),
     'no authoritative map, AI or collision mutation');
  }finally{
   w.dispose();assert.equal(w.stats().geometryCount,0);
   assert.equal(w.stats().materialCount,0);
  }
 }
});
