'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const mod=name=>pathToFileURL(path.join(root,name)).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src
  .replace("'./vendor/three.module.js'",JSON.stringify(mod('node_modules/three/build/three.module.js')))
  .replace("'./gate-moment.mjs'",JSON.stringify(mod('public/ai-maze-escape/gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(mod('public/ai-maze-escape/map-view.mjs')))).toString('base64'));
const publicCourt=()=>({runToken:'public-first-hit-towers',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,visibleCells:[6,7,8],
  cells:[{cell:6,blocked:false,neighbors:[7]},{cell:7,blocked:false,neighbors:[6,8]},{cell:8,blocked:false,neighbors:[7]}],
  doors:[],keys:[],inventory:[],traps:[],exitCell:null,threats:[{id:'thornback',cell:8,lanternParried:false}]});
test('Pass545 authentic first hit sinks two linked guardian-end towers while Pip-side structures retain real tile delay',async()=>{
 const {createMazeWorld}=await load(),s=publicCourt(),truth=JSON.stringify(s),w=createMazeWorld({balanced:true});
 try{
  w.update(s);
  const heights=cell=>[-1,1].map(side=>{
    const shaft=w.group.getObjectByName('Published guardian Tideglass joined sentinel shaft '+cell+' '+side);
    const crown=w.group.getObjectByName('Published guardian Tideglass sentinel crown '+cell+' '+side);
    const fan=w.group.getObjectByName('Published guardian Tideglass rooted shell-fan hinge '+cell+' '+side);
    assert.ok(shaft&&crown&&fan,'real linked full-size original parts at published endpoint');
    assert.equal(shaft.parent,crown.parent);assert.equal(shaft.parent,fan.parent);
    return shaft.parent.position.y;
  });
  const cue={guardianCell:8,guardianBeat:0,guardianParried:true,guardianCounterPhase:0,reducedMotion:false};
  w.animate(.1,cue);
  assert.deepEqual(heights(8),[.04,.04],'unverified claim cannot stage earned counter');
  const parried={...s,threats:[{...s.threats[0],lanternParried:true}]};w.update(parried);
  const resources=w.stats();w.animate(.2,cue);
  assert.ok(heights(8).every(y=>y < -1.15),'both connected guardian-end standards retract at first authenticated contact');
  assert.ok(heights(6).every(y=>Math.abs(y-.04)<.001),'Pip-side original stage must not anticipate later wave');
  const mast=w.group.getObjectByName('Witnessed guardian rooted Tideglass weather vane 8');
  assert.ok(mast&&mast.position.y < -1.4,'original observatory sinks in the same source-authentic frame');
  w.animate(.3,{...cue,guardianCounterPhase:.08});
  assert.ok(heights(8).every(y=>y < -1.15),'no rebound before the tile pulse catches up');
  w.animate(.4,{...cue,reducedMotion:true});
  assert.ok(heights(8).every(y=>Math.abs(y-.04)<.001),'reduced motion returns calm stillness');
  w.animate(.5,{...cue,guardianParried:false});
  assert.ok(heights(8).every(y=>Math.abs(y-.04)<.001),'permission expiry restores neutral original towers');
  w.animate(.6,{...cue,guardianCell:999});
  assert.ok(heights(8).every(y=>Math.abs(y-.04)<.001),'unknown guardian cannot fabricate a hit');
  assert.equal(w.stats().geometryCount,resources.geometryCount);
  assert.equal(w.stats().materialCount,resources.materialCount);
  assert.equal(JSON.stringify(s),truth,'AI snapshot and collision unchanged');
 }finally{w.dispose();assert.equal(w.stats().geometryCount,0);assert.equal(w.stats().materialCount,0);}
});
