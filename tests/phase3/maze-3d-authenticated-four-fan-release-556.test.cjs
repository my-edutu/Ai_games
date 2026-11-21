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
const stage=axis=>{
 const cells=axis==='x'?[6,7,8]:[1,6,11];
 return {runToken:'full-fan-linked-release-'+axis,lifecycle:'running',result:null,
   width:5,height:axis==='x'?5:9,currentCell:cells[0],visibleCells:cells,
   cells:cells.map((cell,i)=>({cell,blocked:false,
     neighbors:[cells[i-1],cells[i+1]].filter(Number.isInteger)})),
   doors:[],keys:[],inventory:[],traps:[],exitCell:null,
   threats:[{id:'thornback',cell:cells[2],lanternParried:false}]};
};
test('Pass556 the first AUTHENTIC lantern contact folds four attached outboard full-size Tideglass fans together, leaving the real floor/stone wave sequential',async()=>{
 const {createMazeWorld}=await load();
 for(const axis of ['x','z']){
  const s=stage(axis),original=JSON.stringify(s),w=createMazeWorld({balanced:true});
  try{
   w.update(s);
   const actual=()=>[s.currentCell,s.threats[0].cell].flatMap(cell=>[-1,1].map(side=>{
     const p=w.group.getObjectByName('Published guardian Tideglass rooted shell-fan hinge '+cell+' '+side);
     const fan=w.group.getObjectByName('Published guardian Tideglass full shell-fan '+cell+' '+side);
     const shaft=w.group.getObjectByName('Published guardian Tideglass joined sentinel shaft '+cell+' '+side);
     const spar=w.group.getObjectByName('Published guardian Tideglass shell-fan structural spar '+cell+' '+side);
     const crest=w.group.getObjectByName('Published guardian Tideglass shell-fan crest '+cell+' '+side);
     assert.ok(p&&fan&&shaft&&spar&&crest,'complete connected and named authentic 3D endpoint rig');
     assert.equal(fan.parent,p);assert.equal(spar.parent,p);assert.equal(crest.parent,p);
     assert.equal(p.parent,shaft.parent,'whole fan still travels on real rooted post');
     assert.ok(fan.scale.y>=.94-1e-8,'retain entire existing carved 3D feather');
     return {cell,side,p,shaft,fan};
   }));
   const cue={guardianCell:s.threats[0].cell,guardianBeat:.5,guardianParried:false,
     guardianCounterPhase:0,reducedMotion:false};
   const pre=w.stats();w.animate(.1,cue);
   for(const b of actual()){
     const a=b.p.rotation[axis];
     assert.ok(Math.abs(a-(axis==='x'?-b.side:b.side)*.88)<1e-8,
       'genuine witnessed brace raises all four full-size shields');
   }
   w.animate(.2,{...cue,guardianParried:true});
   for(const b of actual()){
     assert.ok(Math.abs(b.p.rotation[axis]-(axis==='x'?-b.side:b.side)*.88)<1e-8,
       'claimed hit without an authoritative public flag may not fold a single shield');
   }
   const parried={...s,threats:[{...s.threats[0],lanternParried:true}]};
   w.update(parried);
   w.animate(.3,{...cue,guardianParried:true});
   const earned=actual();
   for(const b of earned){
     assert.ok(Math.abs(b.p.rotation[axis]-(axis==='x'?b.side:-b.side)*.29)<1e-8,
       'first same-run published counter immediately swings each FULL fan away from living actors');
     assert.equal(b.fan.material.color.getHexString(),'8e7851',
       'true release shifts full physical shell away from lit amber warning');
   }
   // Keep the old Pip->Thornback weighted heavy-stone travel instead of
   // weakening the original per-tile stage timing to make these tests pass.
   const pipPosts=earned.filter(b=>b.cell===s.currentCell);
   // The test cue intentionally holds an ACTIVE .5 brace. Before the
   // public tile-0 pulse the actual Pip-side stone stands at .04+.42=.46,
   // not at the .04 neutral resting height. Do NOT falsify the mechanic.
   assert.ok(pipPosts.every(b=>Math.abs(b.shaft.parent.position.y-.46)<1e-8),
     'hero-end linked stone keeps its truthful .42m defensive brace at initial hit');
   const foePosts=earned.filter(b=>b.cell===s.threats[0].cell);
   assert.ok(foePosts.every(b=>pipPosts[0].shaft.parent.position.y-b.shaft.parent.position.y>1.20),
     'guardian-end heavy stones withdraw at least 1.2m farther than the same-frame Pip-end post');
   w.animate(.4,{...cue,guardianParried:true,guardianCounterPhase:.7});
   for(const b of actual())assert.ok(Math.abs(b.p.rotation[axis]-(axis==='x'?b.side:-b.side)*.20)<1e-8,
     'after original sequential wave crosses the lane, the strict older .20rad fold remains intact');
   w.animate(.5,{...cue,guardianParried:true,guardianCounterPhase:0,reducedMotion:true});
   for(const b of actual())assert.equal(b.p.rotation[axis],0,
     'reduced motion never kicks the real joined shell');
   w.animate(.6,{...cue,guardianParried:false});
   for(const b of actual())assert.ok(Math.abs(b.p.rotation[axis]-(axis==='x'?-b.side:b.side)*.88)<1e-8,
     'revoked true counter returns to ordinary public warning');
   assert.equal(w.stats().geometryCount,pre.geometryCount);
   assert.equal(w.stats().materialCount,pre.materialCount);
   w.update({...s,visibleCells:s.visibleCells.slice(0,2)});
   assert.equal(w.group.getObjectByName('Published guardian Tideglass rooted shell-fan hinge '+s.threats[0].cell+' -1'),undefined,
     'hidden guardian cannot stage its defensive armature');
   for(let i=0;i<6;i++){
     w.update({...s,runToken:'linked-release-reset-'+axis+'-'+i});
     assert.ok(w.stats().geometryCount<100,'unchanged hard six-scene geometry budget');
   }
   assert.equal(JSON.stringify(s),original,'no changes to authentic AI/collision/private state');
  }finally{w.dispose();assert.equal(w.stats().geometryCount,0);assert.equal(w.stats().materialCount,0);}
 }
});
