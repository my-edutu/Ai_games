'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const loaded=import('../../public/infinite-tower-climb/visuals/crossfloor-arrival.mjs');
function specimen(){
 const source={runToken:'real-run',lifecycle:'running',floor:9,
  theme:'void',tick:465,player:{x:334000,y:100000,halfWidth:9000,
    halfHeight:18000,health:5,grounded:true,
    groundedPlatformId:'f9:p1',vy:0,state:'standing'},
  platforms:[{id:'f9:p1',x:280000,y:80000,width:90000,height:2000}]};
 const held={runToken:'real-run',floor:9,sourceTick:451,
  thresholdX:320000,oldRoofY:82000,submittedFrames:2,visibleSeconds:.2};
 const passage={sourceBound:true,active:true,stage:'handoff',
  continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
  exteriorMemoryFrameVisible:false,runToken:'real-run',
  floor:9,sourceTick:451};
 const job={state:'awaiting-actual-first-render',
  proof:'recorded-source-gateway',runToken:'real-run',
  floor:9,sourceTick:451,structureDeferred:true,submittedFrames:2};
 return {source,held,passage,job};
}
test('actual supported climber and original source-earned bronze gate delay cold opaque Floor9 shaft',async()=>{
 const {observedClockworkRoofContinuity,holdIncomingStructuralShell}=await loaded;
 const s=specimen();
 assert.equal(observedClockworkRoofContinuity(s.source,s.passage,s.held),true);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,s.job),true);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,{...s.job,submittedFrames:5}),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,{...s.held,visibleSeconds:.55},s.job),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,{...s.held,submittedFrames:5},s.job),false);
});
test('mismatched run, time, support, roof, source stage, or later floor cannot prolong old architecture',async()=>{
 const {observedClockworkRoofContinuity,holdIncomingStructuralShell}=await loaded;
 const s=specimen(),f=(over,who='source')=>{
  const q={...s,[who]:{...s[who],...over}};
  return observedClockworkRoofContinuity(q.source,q.passage,q.held)};
 assert.equal(f({runToken:'another-run'}),false);
 assert.equal(f({tick:500}),false);
 assert.equal(f({floor:10}),false);
 assert.equal(f({theme:'clockwork'}),false);
 assert.equal(f({lifecycle:'intermission'}),false);
 assert.equal(f({player:{...s.source.player,x:480000}}),false);
 assert.equal(f({player:{...s.source.player,groundedPlatformId:'fake'}}),false);
 assert.equal(f({player:{...s.source.player,y:260000}}),false);
 assert.equal(f({runToken:'another-run'},'passage'),false);
 assert.equal(f({sourceTick:450},'passage'),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,
   {...s.job,proof:'adjacent-browser-guardian'}),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,
   {...s.job,state:'awaiting-vista-submission'}),false);
 const airborne={...s.source,player:{...s.source.player,y:115000,
  grounded:false,groundedPlatformId:null,vy:8000,state:'airborne'}};
 assert.equal(observedClockworkRoofContinuity(airborne,s.passage,s.held),true);
 assert.equal(observedClockworkRoofContinuity({...airborne,
  player:{...airborne.player,groundedPlatformId:'f9:p1'}},s.passage,s.held),false);
});
test('source continuity makes no changes to immutable gameplay records',async()=>{
 const {observedClockworkRoofContinuity}=await loaded,s=specimen();
 const before=JSON.stringify(s);
 assert.equal(observedClockworkRoofContinuity(s.source,s.passage,s.held),true);
 assert.equal(JSON.stringify(s),before);
 assert.equal(observedClockworkRoofContinuity({...s.source,tick:499},s.passage,s.held),true);
 assert.equal(observedClockworkRoofContinuity({...s.source,tick:500},s.passage,s.held),false);
});
