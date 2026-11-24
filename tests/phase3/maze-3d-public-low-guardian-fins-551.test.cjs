'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const file=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(file('node_modules/three/build/three.module.js')))
 .replace("'./gate-moment.mjs'",JSON.stringify(file('public/ai-maze-escape/gate-moment.mjs')))
 .replace("'./map-view.mjs'",JSON.stringify(file('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const court=axis=>{const c=axis==='x'?[6,7,8]:[1,6,11];return {
 runToken:'low-guardian-fins-'+axis,lifecycle:'running',result:null,
 width:5,height:axis==='x'?5:9,currentCell:c[0],visibleCells:c,
 cells:c.map((cell,i)=>({cell,blocked:false,neighbors:[c[i-1],c[i+1]].filter(Number.isInteger)})),
 doors:[],keys:[],inventory:[],traps:[],exitCell:null,
 threats:[{id:'threat',cell:c[2],lanternParried:false}]};};
test('Pass551 joined guardian sentinel stage is physically low, outboard, genuinely earned and reusable on both public corridor axes',async()=>{
 const {createMazeWorld}=await load();
 for(const axis of ['x','z']) {
  const s=court(axis),before=JSON.stringify(s),w=createMazeWorld({balanced:true});
  try{
   w.update(s);
   const id=s.currentCell;
   const get=(name,side)=>w.group.getObjectByName(name+' '+id+' '+side);
   const structs=[-1,1].map(side=>({
    pillar:get('Published guardian Tideglass joined sentinel shaft',side),
    crown:get('Published guardian Tideglass sentinel crown',side),
    fan:get('Published guardian Tideglass full shell-fan',side),
    pivot:get('Published guardian Tideglass rooted shell-fan hinge',side),
    yoke:get('Published guardian Tideglass connected shell-fan yoke',side),
    foot:get('Published guardian Tideglass sentinel footing',side),
   }));
   assert.equal(structs.length,2);
   for(const b of structs){
    assert.ok(b.pillar&&b.crown&&b.fan&&b.pivot&&b.foot&&b.yoke,
      'all original endpoint sentinel parts are physically joined');
    assert.equal(b.pillar.parent.parent,b.foot,'the short pillar rides the rooted lift');
    assert.ok(Math.abs(b.pillar.scale.y-.26)<1e-8);
    assert.ok(Math.abs(b.pillar.position.y-.18)<1e-8);
    assert.ok(Math.abs(b.crown.position.y-.36)<1e-8 && b.crown.scale.y>=.17,
      'short rooted crown still meets original physical mobile silhouette size');
    assert.ok(Math.abs(b.pivot.position.y-.70)<1e-8 && b.pivot.position.y>=.7,
      'original full shell hinge elevation retained on low stone sentinel');
    assert.ok(b.yoke.parent===b.pillar.parent && b.yoke.position.y===.55 && b.yoke.scale.y>=.40,
      'true joined metal bearing bridges compact stone crown and .70m rotating shell pivot');
    assert.ok(Math.abs(b.fan.scale.y-.94)<1e-8 && b.fan.scale.y>=.92,
      'outward-folded low fin retains original substantial physical feather size');
    assert.ok(Math.abs(b.fan.position.y-.22)<1e-8);
    assert.ok(Math.abs(b.foot.position[axis==='x'?'z':'x'])>=1.03,
      'both long ceramic fins are outside the same publicly open center aisle');
   }
   const beforeCosts=w.stats();
   const cue={guardianCell:s.threats[0].cell,guardianBeat:0.5,
     guardianParried:false,guardianCounterPhase:undefined,reducedMotion:false};
   w.animate(.2,cue);
   assert.ok(structs.every(b=>b.pillar.parent.position.y>.04),
     'authentic public warning physically lifts both joined fins');
   w.animate(.3,{...cue,guardianBeat:0});
   assert.ok(structs.every(b=>Math.abs(b.pillar.parent.position.y-.04)<1e-8),
     'neutral public scene restores low resting silhouette');
   const earned={...s,threats:[{...s.threats[0],lanternParried:true}]};
   w.update(earned);
   w.animate(.4,{...cue,guardianParried:true,guardianCounterPhase:0});
   const earnedPillar=w.group.getObjectByName('Published guardian Tideglass joined sentinel shaft '+s.threats[0].cell+' -1');
   assert.ok(earnedPillar.parent.position.y < -.5,
     'actual published parry retracts the whole connected original guardian-end standard');
   w.animate(.5,{...cue,guardianParried:true,guardianCounterPhase:0,reducedMotion:true});
   assert.ok(Math.abs(earnedPillar.parent.position.y-.04)<1e-8,
     'reduced motion must preserve calm low physical silhouette');
   assert.equal(w.stats().geometryCount,beforeCosts.geometryCount);
   assert.equal(w.stats().materialCount,beforeCosts.materialCount);
   w.update({...s,visibleCells:s.visibleCells.slice(0,2)});
   assert.equal(get('Published guardian Tideglass joined sentinel shaft',-1),undefined,
     'undiscovered guardian cannot leak its physical stage');
   for(let i=0;i<6;i++){
    w.update({...s,runToken:'fin-reset-'+axis+'-'+i});
    assert.ok(w.stats().geometryCount<100,'unchanged six-reset strict budget');
   }
   assert.equal(JSON.stringify(s),before,'presentation never changes authoritative game state');
  }finally{w.dispose();assert.equal(w.stats().geometryCount,0);assert.equal(w.stats().materialCount,0);}
 }
});
