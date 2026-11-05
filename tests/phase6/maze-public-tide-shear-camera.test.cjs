'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const camera=()=>import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href);
const size=2.4;
const grid=(cells,visibleCells,overrides={})=>({
  runToken:'real-public-trap',tick:1,width:9,height:9,currentCell:40,
  cells,visibleCells,keys:[],doors:[],inventory:[],result:null,...overrides
});
const tile=(cell,trap=true)=>({cell,trap,blocked:false,neighbors:[],clue:false,checkpoint:false});

test('real public one-cell pressure trap earns a continuous shared mobile stage without moving anything',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const actual=grid([tile(40,false),tile(41,true)],[40,41]);
  const before=JSON.stringify(actual),hero={x:0,z:0};
  const atCell=focus(actual,hero,size,390/844);
  assert.equal(atCell.cell,41);
  assert.equal(atCell.x,2.4);
  assert.equal(atCell.z,0);
  assert.ok(Math.abs(atCell.weight-.44)<1e-10);
  const edging=focus(actual,{x:-.8,z:0},size,390/844);
  assert.ok(edging.weight>0 && edging.weight<atCell.weight,
    'camera pan must fade rather than snap across approach boundary');
  assert.equal(focus(actual,{x:-1.2,z:0},size,390/844).weight,0,
    'at exactly one-and-a-half cell distance shared focus ends smoothly');
  assert.equal(focus(actual,{x:-3,z:0},size,390/844),null,
    'far-away hazard must not hijack ordinary autonomous exploration');
  assert.equal(JSON.stringify(actual),before,'never mutate authoritative public snapshot');
  assert.deepEqual(hero,{x:0,z:0},'never move or steer Pip');
});

test('only a genuinely diagonal published jaw gets extra pan, while axial departure fades',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const actual=grid([tile(40,false),tile(50,true)],[40,50]);
  const realDiagonal=focus(actual,{x:0,z:0},size,320/740);
  assert.equal(realDiagonal.cell,50);
  assert.ok(Math.abs(realDiagonal.weight-.57)<1e-10,
    'genuine one-by-one diagonal 320px trap preserves its stronger shared camera');
  const axis=grid([tile(40,false),tile(41,true)],[40,41]);
  assert.ok(Math.abs(focus(axis,{x:0,z:0},size,320/740).weight-.44)<1e-10);
  const axialDeparture=focus(axis,{x:-.8,z:0},size,320/740);
  assert.ok(axialDeparture.weight>0&&axialDeparture.weight<.44,
    'axial departure must not masquerade as a diagonal encounter');
  const outer=focus(axis,{x:-1.2,z:0},size,320/740);
  assert.equal(outer.weight,0,'camera returns continuously to ordinary exploration');
  assert.deepEqual(focus(actual,{x:0,z:0},size,320/740),realDiagonal,
    'source-bound identical public frames remain deterministic');
});

test('private, merely remembered or invalid trap cannot take over the public camera',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const hero={x:0,z:0},seen=grid([tile(40,false),tile(41,true)],[40,41]);
  assert.equal(focus(grid([tile(40,false),tile(41,true)],[40]),hero,size,390/844),null,
    'remembered-only disclosed hazard is NOT current public visual contact');
  assert.equal(focus(grid([tile(40,false)],[40],{privateTrapCells:[41],privateMap:{41:'trap'}}),hero,size,390/844),null,
    'private server fields cannot manufacture a presentation cue');
  assert.equal(focus(grid([tile(40,false),tile(41,false)],[40,41]),hero,size,390/844),null);
  assert.equal(focus(grid([tile(40,false),{...tile(41,true),blocked:true}],[40,41]),hero,size,390/844),null);
  assert.equal(focus(seen,hero,size,1280/900),null,'desktop stays on its prior camera');
  assert.equal(focus(seen,hero,size,844/390),null,'landscape remains unmodified');
  assert.equal(focus(seen,hero,size,320/740)?.cell,41,'real 320px is protected too');
  assert.equal(focus(grid(seen.cells,seen.visibleCells,{result:'escaped'}),hero,size,390/844),null,
    'terminal animation must not gain a new inferred pressure shot');
});

test('tie-breaking and replay remain deterministic across public source frames',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const a=grid([tile(40,false),tile(39,true),tile(41,true)],[40,39,41]);
  const b=grid([tile(41,true),tile(40,false),tile(39,true)],[41,40,39]);
  const pose={x:0,z:0};
  const first=focus(a,pose,size,390/844),second=focus(b,pose,size,390/844);
  assert.equal(first.cell,39,'equal real distances use stable public cell identity');
  assert.deepEqual(first,second,'public cell enumeration order cannot shift the camera');
  assert.deepEqual(focus(a,pose,size,390/844),first,'same state always gives same framing');
});
