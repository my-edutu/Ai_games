'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const worldSource=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const file=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(worldSource
 .replace("'./vendor/three.module.js'",JSON.stringify(file('node_modules/three/build/three.module.js')))
 .replace("'./gate-moment.mjs'",JSON.stringify(file('public/ai-maze-escape/gate-moment.mjs')))
 .replace("'./map-view.mjs'",JSON.stringify(file('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const court=axis=>{
 const cells=axis==='x'?[6,7,8]:[1,6,11];
 return {runToken:'low-orrery-'+axis,lifecycle:'running',result:null,
  width:5,height:axis==='x'?5:9,currentCell:cells[0],visibleCells:cells,
  cells:cells.map((cell,i)=>({cell,blocked:false,
   neighbors:[cells[i-1],cells[i+1]].filter(Number.isInteger)})),
  doors:[],keys:[],inventory:[],traps:[],exitCell:null,
  threats:[{id:'thornback',cell:cells[2],lanternParried:false}]};
};
test('Pass550 real disclosed guardian re-authors a LOW outboard orrery with honest public-only impact',async()=>{
 const {createMazeWorld}=await load();
 for(const axis of ['x','z']){
  const s=court(axis),original=JSON.stringify(s);
  const w=createMazeWorld({balanced:true});
  const cell=s.threats[0].cell;
  try{
   w.update(s);
   const full=name=>w.group.getObjectByName(name+' '+cell);
   const stone=full('Guardian outboard Tideglass orrery stone base');
   const inlay=full('Guardian outboard Tideglass orrery inlay');
   const pulse=full('Guardian earned Tideglass orrery pulse');
   const mast=full('Witnessed guardian rooted Tideglass weather vane');
   const shaft=full('Guardian observatory continuous mast');
   const shell=[-1,1].map(side=>w.group.getObjectByName('Guardian observatory joined upper shell '+cell+' '+side));
   assert.ok(stone&&inlay&&pulse&&mast&&shaft);
   assert.ok(shell.every(Boolean));
   const low=w.group.getObjectByName('Guardian observatory low Tideglass mechanism '+cell);
   assert.ok(low,'compact moving parts are one physical low assembly');
   assert.equal(shaft.parent,low,'real moving shaft belongs to the compact linked rig');
   assert.equal(low.parent,mast,'impact moves the true unscaled observatory root');
   assert.ok(Math.abs(mast.position.y)<1e-8);
   assert.ok(Math.abs(low.position.y+.47)<1e-8);
   assert.ok(Math.abs(low.scale.y-.52)<1e-8,
    'the actual screen-dominating 3D source mast is physically re-proportioned');
   assert.ok(Math.abs(stone.position[axis==='x'?'z':'x']+.65)<1e-8,
    'single outboard side on actual public lane, within original cell');
   assert.ok(Math.max(stone.scale.x,stone.scale.z)>.9,'a full low stage, not a tiny trim');
   assert.ok(Math.abs(stone.position.y)<.03 && inlay.position.y<.04);
   assert.equal(pulse.visible,false,'no fabricated action before real public event');
   const costs=w.stats();
   const cue={guardianCell:cell,guardianBeat:0,
     guardianParried:true,guardianCounterPhase:0,reducedMotion:false};
   w.animate(.1,cue);
   assert.equal(pulse.visible,false,'claimed parry cannot invent a hit');
   w.animate(.2,{...cue,guardianParried:false,guardianBeat:.5});
   assert.equal(pulse.visible,true,'genuine seen warning illuminates only the real plinth');
   w.animate(.3,{...cue,guardianParried:false,guardianBeat:1});
   assert.equal(pulse.visible,false,'release returns quiet');
   const earned={...s,threats:[{...s.threats[0],lanternParried:true}]};
   w.update(earned);
   const newMast=full('Witnessed guardian rooted Tideglass weather vane');
   const newPulse=full('Guardian earned Tideglass orrery pulse');
   w.animate(.4,cue);
   const newLow=w.group.getObjectByName('Guardian observatory low Tideglass mechanism '+cell);
   assert.ok(newMast.position.y+newLow.position.y < -2.1,
    'authenticated counter sinks the actual compact connected orrery below the original physical threshold');
   assert.equal(newPulse.visible,true,'real counter visibly travels across low original machine');
   w.animate(.5,{...cue,reducedMotion:true});
   assert.equal(newPulse.visible,false,'reduced-motion must not pulse');
   assert.ok(Math.abs(newMast.position.y)<1e-8 && Math.abs(newLow.position.y+.47)<1e-8,
    'calm accessibility state restores BOTH real root and low mechanism');
   w.animate(.6,{...cue,guardianCell:999});
   assert.equal(newPulse.visible,false,'hidden or mismatched event never animates stage');
   assert.equal(w.stats().geometryCount,costs.geometryCount,
    'the new authored stage reuses existing GPU classes');
   assert.equal(w.stats().materialCount,costs.materialCount);
   w.update({...s,visibleCells:s.visibleCells.slice(0,2)});
   assert.equal(full('Guardian outboard Tideglass orrery stone base'),undefined,
    'unseen guardian cannot reveal its stage');
   for(let i=0;i<6;i++){
    w.update({...s,runToken:'compact-orrery-reset-'+axis+'-'+i});
    assert.ok(w.stats().geometryCount<100,'unchanged six-reset geometry budget');
   }
   assert.equal(JSON.stringify(s),original,'AI, collision and source state unchanged');
  }finally{
   w.dispose();
   assert.equal(w.stats().geometryCount,0);
   assert.equal(w.stats().materialCount,0);
  }
 }
});
