'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const load=()=>import('../../public/ai-maze-escape/map-view.mjs');
const CELL=2.4,ASPECT=320/740;
const snap=(cell,extras={})=>({runToken:'public-camera-test',width:7,height:7,
 currentCell:24,visibleCells:[cell],cells:[{cell,trap:true,blocked:false}],...extras});
test('real 320px diagonal published pressure jaw gets a shared physical stage without reducing hero scale',async()=>{
 const {publicObservedTrapCameraFocus:focus}=await load();
 const hero={x:0,z:0};
 const orthogonal=focus(snap(25),hero,CELL,ASPECT);
 const diagonal=focus(snap(32),hero,CELL,ASPECT);
 assert.equal(orthogonal.weight,.44,'previous in-frame one-cell pose remains unchanged');
 assert.ok(diagonal.distance>CELL*1.41&&diagonal.distance<CELL*1.42);
 assert.ok(diagonal.weight>.54&&diagonal.weight<.59,
  'a genuinely visible diagonal jaw cannot receive the prior ~.076 aim that clipped its 320px physical silhouette');
 assert.ok(diagonal.weight>orthogonal.weight);
 assert.deepEqual(focus(snap(32),hero,CELL,ASPECT),diagonal,'deterministic public camera');
});
test('diagonal trap composition never reads hidden traps, persists after results or changes landscape/other cameras',async()=>{
 const {publicObservedTrapCameraFocus:focus}=await load();
 const hero={x:0,z:0},s=snap(32),before=JSON.stringify(s);
 assert.equal(focus(snap(32,{visibleCells:[]}),hero,CELL,ASPECT),null);
 assert.equal(focus(snap(32,{cells:[{cell:32,trap:true,blocked:true}]}),hero,CELL,ASPECT),null);
 assert.equal(focus(snap(32,{result:{reason:'capture'}}),hero,CELL,ASPECT),null);
 assert.equal(focus(s,hero,CELL,844/390),null);
 assert.equal(focus(s,hero,CELL,NaN),null);
 assert.equal(focus(s,{x:NaN,z:0},CELL,ASPECT),null);
 assert.equal(focus(s,hero,0,ASPECT),null);
 assert.equal(JSON.stringify(s),before,'no source snapshot mutation');
 const closer=focus(s,{x:CELL*.24,z:CELL*.24},CELL,ASPECT);
 assert.ok(closer.weight<.57&&closer.weight>0,'continuous public approach pan');
});

test('real public pressure camera catches autonomous diagonal staging without altering other modes',async()=>{
 const {publicCameraSettleRate:rate}=await load();
 const eased=(value)=>1-Math.exp(-.18*value); // one real 180ms public update
 assert.equal(rate(false,false,false,false),4.5,'neutral exploration remains unchanged');
 assert.equal(rate(false,false,false,true),8,'witnessed opening retains its own camera speed');
 assert.equal(rate(false,true,false,false),10,'public guardian keeps its verified response');
 assert.equal(rate(false,false,true,false),10,'actual published pressure stage receives fast framing');
 assert.equal(rate(true,false,true,false),12,'witnessed pickup retains priority');
 assert.equal(rate(false,false,true,true),10,'pressure shot outranks generic gate transition');
 assert.ok(eased(rate(false,false,true,false))>.83,'camera settles over 83% within a normal public poll interval');
 assert.ok(eased(rate(false,false,false,false))<.56,'unrelated maze discovery keeps calm settling');
});
