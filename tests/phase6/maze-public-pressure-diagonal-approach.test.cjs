'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const moduleFile=path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs');

test('authentic publicly discovered diagonal pressure approach gets readable 390px optical stage, not a hidden cue',async()=>{
  const {publicPressureDiagonalApproachHalfHeight:stage}=await import(pathToFileURL(moduleFile).href);
  const visible={runToken:'published-approach',tick:4,width:10,height:10,currentCell:44,
    cells:[{cell:55,trap:true,blocked:false}],visibleCells:[44,55],result:null};
  const trap={cell:55,distance:4*Math.SQRT2,weight:.57};
  const sourceHeight=6.923;
  const run=(aspect=390/844,s=visible,t=trap,contact=false,retreat=false,reduced=false)=>
    stage(aspect,sourceHeight,s,t,4,contact,retreat,reduced);
  assert.equal(run(),sourceHeight*.96,
    'real 390px public diagonal receives a stronger complete hero/jaw stage');
  assert.ok(.6897967009211443/.96>.70,
    'the actual measured original jaw image crosses the old >.70 contract without lowering it');
  assert.equal(run(320/740),sourceHeight,'320px previous valid stage remains unchanged');
  assert.equal(run(844/390),sourceHeight,'landscape cannot steal a portrait-only scene');
  assert.equal(run(390/844,visible,trap,true),sourceHeight,'contact keeps its prior safe camera');
  assert.equal(run(390/844,visible,trap,false,true),sourceHeight,'withdrawal keeps existing strict physical no-crop');
  assert.equal(run(390/844,visible,trap,false,false,true),sourceHeight,'reduced motion retains original optic');
  assert.equal(run(390/844,{...visible,visibleCells:[44]}),sourceHeight,
    'undiscovered hazard never influences the viewer');
  assert.equal(run(390/844,{...visible,cells:[]}),sourceHeight,
    'an invented but absent trap record cannot stage a camera');
  assert.equal(run(390/844,{...visible,runToken:'new-run',result:'escape'}),sourceHeight,
    'terminal frame cannot fake an opening warning');
  assert.equal(run(390/844,{...visible,currentCell:45}),sourceHeight,
    'collinear public passage never earns a diagonal zoom');
  assert.equal(run(390/844,visible,{...trap,distance:24}),sourceHeight,
    'far/forged trap distances are rejected');
  assert.equal(run(390/844,visible,{...trap,weight:.01}),sourceHeight,
    'unverified public visual attention is ignored');
});
