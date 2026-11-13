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

test('original cap contact survives a genuinely late first F9 browser frame, never invents a F9 platform',async()=>{
 const {observedRetainedOriginalCapRoofContact:contact,
  observedClockworkRoofContinuity:continuity,
  holdIncomingStructuralShell:shell}=await loaded;
 const s=specimen();
 s.source.tick=476;s.held.sourceTick=454;s.passage.sourceTick=454;s.job.sourceTick=454;
 s.source.player.groundedPlatformId='f8:cap';
 s.source.platforms=[{id:'f9:ground',x:280000,y:80000,width:90000,height:2000}];
 s.held.oldCapId='f8:cap';s.held.oldCapX=280000;s.held.oldCapWidth=90000;
 const before=JSON.stringify(s);
 assert.equal(contact(s.source,s.held),true);
 assert.equal(continuity(s.source,s.passage,s.held),true);
 assert.equal(shell(s.source,s.passage,s.held,s.job),true);
 assert.equal(JSON.stringify(s),before);
 // The previously recorded OLD cap is the only admissible old-floor ID.
 const bad=(player,held=s.held,source=s.source)=>contact({...source,player},{...held});
 assert.equal(bad({...s.source.player,groundedPlatformId:'unknown'}),false);
 assert.equal(bad({...s.source.player,groundedPlatformId:'f9:ground'}),false);
 assert.equal(bad({...s.source.player,groundedPlatformId:'f8:cap'}, {...s.held,oldCapId:'f7:cap'}),false);
 assert.equal(bad({...s.source.player,groundedPlatformId:'f8:cap'}, {...s.held,oldCapX:340000}),false);
 assert.equal(bad({...s.source.player,x:400000}),false);
 assert.equal(bad({...s.source.player,y:100001}),false);
 assert.equal(bad({...s.source.player,health:0}),false);
 assert.equal(bad({...s.source.player,grounded:false,state:'airborne'}),false);
 assert.equal(contact({...s.source,tick:503},s.held),false);
 assert.equal(contact({...s.source,runToken:'another'},s.held),false);
 assert.equal(contact({...s.source,floor:10},s.held),false);
 assert.equal(contact({...s.source,lifecycle:'result'},s.held),false);
 assert.equal(continuity({...s.source,player:{...s.source.player,x:400000}},s.passage,s.held),false);
});
test('production world retains only the actual original floor-eight roof owner and reports its true support',async()=>{
 const fs=require('node:fs');
 const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/oldCapId:authored\.id,oldCapX:authored\.x,oldCapWidth:authored\.width/);
 assert.match(world,/onOriginalCapRoof=observedRetainedOriginalCapRoofContact\(snapshot,held\)/);
 assert.match(world,/actualOldCapSupport:observedRetainedOriginalCapRoofContact\(lastSnapshot,retainedEarnedCap\)/);
});
