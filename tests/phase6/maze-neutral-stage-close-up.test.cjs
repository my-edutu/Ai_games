'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const load=()=>import('../../public/ai-maze-escape/map-view.mjs');

const stage={
  width:7,height:7,currentCell:10,result:null,
  cells:[{cell:10,blocked:false,neighbors:[11]},{cell:11,blocked:false,neighbors:[10]},
    {cell:4,blocked:false,neighbors:[11]},{cell:18,blocked:false,neighbors:[11]},
    {cell:25,blocked:false,neighbors:[18]}]
};
test('neutral genuine public stage approaches the actual full-viewport camera without moving the game',async()=>{
  const {publicCompactExplorationHalfHeight:f,publicFullBleedFollowHalfHeight:full}=await load();
  const before=JSON.stringify(stage);
  assert.equal(f(1280/900,7.3,stage),5.85,'1280 neutral reciprocal public Follow uses the tighter native stage');
  const portraitBase=full(390/844,6.2);
  assert.equal(f(390/844,portraitBase,stage),8.05,'neutral portrait stage ceases to be a tiny ocean thumbnail');
  assert.equal(f(844/390,7.3,stage),6.35,'small landscape still stays physical, not a CSS crop');
  assert.equal(JSON.stringify(stage),before,'camera cannot modify disclosed public state');
  assert.ok(8.05*390/844>3.6,'portrait retains a real horizontal world margin beside Pip');
});
test('never select compact framing from one-way, nonadjacent, hidden or private-only cells',async()=>{
 const {publicCompactExplorationHalfHeight:f}=await load();
 const base=7.3;
 assert.equal(f(1280/900,base,{...stage,result:{reason:'escape'}}),base);
 assert.equal(f(1280/900,base,{...stage,cells:stage.cells.slice(0,3)}),base);
 assert.equal(f(1280/900,base,{...stage,cells:stage.cells.map(c=>c.cell===11?{...c,neighbors:[]}:c)}),base);
 assert.equal(f(1280/900,base,{...stage,cells:stage.cells.map(c=>c.cell===10?{...c,blocked:true}:c)}),base);
 assert.equal(f(1280/900,base,{...stage,cells:stage.cells.map(c=>c.cell===11?{...c,cell:17}:c)}),base);
 assert.equal(f(1280/900,base,{...stage,privateRoute:[10,11],privateExit:10,cells:[]}),base);
 assert.equal(f(1280/900,base,{...stage,currentCell:999}),base);
 assert.equal(f(.9,base,stage),base,'in-between viewports use the preverified camera');
 assert.equal(f(NaN,base,stage),base);
});
test('the renderer excludes the hero close-up in dangerous, keyed, observed goal, terminal and reduced-motion states',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
 assert.match(src,/!result && !cameraGate && !closestThreat\?\.strength/);
 assert.match(src,/!nearObservedGoal && !pressureFirst && !settings\.reducedMotion/);
 assert.match(src,/targetHeight = publicCompactExplorationHalfHeight\(aspect,targetHeight,s\)/);
});
