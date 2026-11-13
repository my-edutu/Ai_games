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
 const held={runToken:'real-run',floor:9,sourceTick:454,
  crossingTick:451,firstWorldRenderTick:460,
  thresholdX:320000,oldRoofY:82000,submittedFrames:2,visibleSeconds:.2};
 const passage={sourceBound:true,active:true,stage:'handoff',
  continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
  exteriorMemoryFrameVisible:false,runToken:'real-run',
  floor:9,sourceTick:454};
 const job={state:'awaiting-actual-first-render',
  proof:'recorded-source-gateway',runToken:'real-run',
  floor:9,sourceTick:460,structureDeferred:true,submittedFrames:2};
 return {source,held,passage,job};
}
test('actual supported climber and original source-earned bronze gate delay cold opaque Floor9 shaft',async()=>{
 const {observedClockworkRoofContinuity,holdIncomingStructuralShell}=await loaded;
 const s=specimen();
 assert.equal(observedClockworkRoofContinuity(s.source,s.passage,s.held),true);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,s.job),true);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,s.held,{...s.job,submittedFrames:10}),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,{...s.held,visibleSeconds:1.25},s.job),false);
 assert.equal(holdIncomingStructuralShell(s.source,s.passage,{...s.held,submittedFrames:10},s.job),false);
});
test('mismatched run, time, support, roof, source stage, or later floor cannot prolong old architecture',async()=>{
 const {observedClockworkRoofContinuity,holdIncomingStructuralShell}=await loaded;
 const s=specimen(),f=(over,who='source')=>{
  const q={...s,[who]:{...s[who],...over}};
  return observedClockworkRoofContinuity(q.source,q.passage,q.held)};
 assert.equal(f({runToken:'another-run'}),false);
 assert.equal(f({tick:503}),false);
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
 assert.equal(observedClockworkRoofContinuity({...s.source,tick:502},s.passage,s.held),true);
 assert.equal(observedClockworkRoofContinuity({...s.source,tick:503},s.passage,s.held),false);
});

test('original cap contact survives a genuinely late first F9 browser frame, never invents a F9 platform',async()=>{
 const {observedRetainedOriginalCapRoofContact:contact,
  observedClockworkRoofContinuity:continuity,
  holdIncomingStructuralShell:shell}=await loaded;
 const s=specimen();
 s.source.tick=476;s.held.sourceTick=454;s.passage.sourceTick=454;s.job.sourceTick=460;
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


test('cold actual source crossing keeps original cap/horizon through first delayed airborne Floor9 render without inventing frames',async()=>{
 const {observedSourceEarnedColdFrameContinuation:real,
   holdIncomingStructuralShell:shell}=await loaded;
 const oldCap={id:'f8:cap',x:260000,y:80000,width:120000,height:2000};
 const exitX=oldCap.x+Math.floor(oldCap.width*.76);
 const crossingX=exitX+13000, crossingY=100000;
 const guardian={kind:'guardian',floor:8,active:false,health:0};
 const witness={runToken:'real-run',sourceTick:451,fromFloor:8,toFloor:9,
   exitX,crossingX,crossingY,halfWidth:9000,halfHeight:18000,
   guardian,cap:oldCap};
 const source={runToken:'real-run',lifecycle:'running',theme:'void',
   floor:9,tick:483,lastGuardianCrossing:witness,
   player:{x:crossingX+8000,y:195000,halfWidth:9000,halfHeight:18000,
     health:5,grounded:false,groundedPlatformId:null,vy:4000,state:'airborne'},
   platforms:[{id:'f9:ground',x:260000,y:80000,width:160000,height:2000}]};
 const held={runToken:'real-run',floor:9,sourceTick:453,
   crossingTick:451,firstWorldRenderTick:460,
   thresholdX:exitX,oldRoofY:82000,oldCapId:oldCap.id,
   oldCapX:oldCap.x,oldCapWidth:oldCap.width,
   submittedFrames:1,visibleSeconds:.12};
 const inactivePassage={sourceBound:false,active:false,stage:'idle'};
 const job={state:'awaiting-actual-first-render',
   structureDeferred:true,proof:'recorded-source-gateway',
   runToken:'real-run',floor:9,sourceTick:460,submittedFrames:1};
 const initial=JSON.stringify([source,held,job]);
 assert.equal(real(source,held),true);
 assert.equal(shell(source,inactivePassage,held,job),true);
 assert.equal(shell(source,inactivePassage,held,{...job,sourceTick:453}),false,
   'a browser receipt tick must never impersonate actual first WebGL rebuild');
 assert.equal(JSON.stringify([source,held,job]),initial);
 const {observedGroundedBiomeThreshold}=await import('../../public/infinite-tower-climb/visuals/biome-threshold.mjs');
 const fade=observedGroundedBiomeThreshold(source,inactivePassage,{},held);
 assert.ok(fade && fade.oldWeight>.9);
 assert.equal(observedGroundedBiomeThreshold(source,inactivePassage,{stale:true},held),null);
 assert.equal(observedGroundedBiomeThreshold(source,inactivePassage,{reducedMotion:true},held),null);
 const deny=(s=source,h=held)=>real(s,h);
 assert.equal(deny({...source,tick:500}),false);
 assert.equal(deny({...source,runToken:'restarted'}),false);
 assert.equal(deny({...source,floor:10}),false);
 assert.equal(deny({...source,lifecycle:'intermission'}),false);
 assert.equal(deny({...source,lastGuardianCrossing:{...witness,sourceTick:450}}),false);
 assert.equal(deny({...source,lastGuardianCrossing:{...witness,guardian:{...guardian,active:true,health:1}}}),false);
 assert.equal(deny({...source,player:{...source.player,health:0}}),false);
 assert.equal(deny({...source,player:{...source.player,groundedPlatformId:'invented'}}),false);
 assert.equal(deny({...source,player:{...source.player,x:exitX+140000}}),false);
 assert.equal(deny({...source,player:{...source.player,y:265000}}),false);
 assert.equal(deny(source,{...held,oldCapWidth:119999}),false);
 assert.equal(deny(source,{...held,visibleSeconds:1.25}),false);
 assert.equal(deny(source,{...held,submittedFrames:9}),false);
 assert.equal(shell(source,inactivePassage,held,{...job,proof:'guessed-gate'}),false);
 assert.match((await import('node:fs')).readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8'),/sourceColdFrame=observedSourceEarnedColdFrameContinuation/);
});

test('queued real guardian crossing survives skipped render observations without inventing a new world',async()=>{
 const {observedQueuedOriginalCapAtFirstRender:valid}=await loaded;
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const exitX=cap.x+Math.floor(cap.width*.76);
 const w={runToken:'same-run',sourceTick:451,fromFloor:8,toFloor:9,
   cap,exitX,crossingX:exitX+13000,halfWidth:9000,halfHeight:14000,
   guardian:{kind:'guardian',floor:8,active:false,health:0}};
 const queued={runToken:w.runToken,floor:9,tick:454,crossingTick:451,
   oldCapId:'f8:cap',oldCapX:cap.x,oldCapWidth:cap.width,
   oldRoofY:3224000,thresholdX:exitX,nextBaseY:3240000,worldWidth:480000};
 const source={runToken:w.runToken,floor:9,theme:'void',lifecycle:'running',
   tick:460,chunkBaseY:3240000,worldWidth:480000,lastGuardianCrossing:w,
   platforms:[{id:'f9:ground',x:0,y:3212000,width:480000,height:12000}],
   player:{x:exitX+19000,y:3238000,halfWidth:9000,halfHeight:14000,
     health:4,grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0}};
 const frozen=JSON.stringify([source,queued]);
 assert.equal(valid(source,queued),true);
 assert.equal(valid({...source,player:{...source.player,y:3265000,
   grounded:false,groundedPlatformId:null,state:'airborne',vy:2400}},queued),true);
 for(const [s,q] of [
   [{...source,tick:454},queued],
   [{...source,tick:467},queued],
   [{...source,runToken:'other'},queued],
   [{...source,floor:10},queued],
   [{...source,lastGuardianCrossing:{...w,sourceTick:450}},queued],
   [{...source,lastGuardianCrossing:{...w,guardian:{...w.guardian,health:1,active:true}}},queued],
   [{...source,platforms:[{...source.platforms[0],y:3212001}]},queued],
   [{...source,player:{...source.player,x:exitX+100000}},queued],
   [{...source,player:{...source.player,health:0}},queued],
   [source,{...queued,crossingTick:450}],
   [source,{...queued,oldCapWidth:249599}],
 ]) assert.equal(valid(s,q),false);
 assert.equal(JSON.stringify([source,queued]),frozen);
});

test('delayed immutable HP-zero record re-authenticates an already-rendered REAL old gate, not a new fabricated crossing',async()=>{
 const {reconcileRecordedOriginalCapCrossing:reconcile}=await loaded;
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const exitX=cap.x+Math.floor(cap.width*.76),crossingX=exitX+13000;
 const w={runToken:'source-run',sourceTick:451,fromFloor:8,toFloor:9,
  cap,exitX,crossingX,crossingY:3238000,halfWidth:9000,halfHeight:14000,
  guardian:{kind:'guardian',floor:8,active:false,health:0}};
 const held={runToken:'source-run',floor:9,sourceTick:451,
  crossingTick:null,oldCapId:'f8:cap',oldCapX:cap.x,
  oldCapWidth:cap.width,oldRoofY:cap.y+cap.height,thresholdX:exitX,
  submittedFrames:1,visibleSeconds:.08};
 const source={runToken:'source-run',lifecycle:'running',floor:9,theme:'void',
  tick:462,lastGuardianCrossing:w,
  platforms:[{id:'f9:ground',x:0,y:3212000,width:480000,height:12000}],
  player:{x:crossingX,y:3238000,halfWidth:9000,halfHeight:14000,
   grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0,health:5}};
 const before=JSON.stringify([source,held]);
 assert.equal(reconcile(source,held),451);
 assert.equal(JSON.stringify([source,held]),before,
  'immutable source and retained witnesses may not be modified by validation');
 assert.equal(reconcile(source,{...held,crossingTick:451}),null,
  'never rebind an already witnessed GPU doorway');
 for(const changed of [
  {...source,runToken:'new-run'},
  {...source,lastGuardianCrossing:{...w,runToken:'other-run'}},
  {...source,lastGuardianCrossing:{...w,sourceTick:437}},
  {...source,lastGuardianCrossing:{...w,cap:{...cap,width:cap.width-1}}},
  {...source,lastGuardianCrossing:{...w,guardian:{...w.guardian,health:1,active:true}}},
  {...source,player:{...source.player,x:exitX+140000}},
  {...source,player:{...source.player,health:0}},
  {...source,tick:500},
  {...source,floor:10},
  {...source,lifecycle:'result'},
 ]) assert.equal(reconcile(changed,held),null);
 assert.equal(reconcile(source,{...held,visibleSeconds:1.25}),null,
  'a finished display window cannot reopen the old world');
 assert.equal(reconcile(source,{...held,sourceTick:464}),null,
  'a source tick beyond the original 12-tick doorway authorization is invalid');
});


test('portrait first GPU submission keeps the actual previously rendered bronze gateway when the HP-zero record arrives late',async()=>{
 const {observedQueuedOriginalCapAtFirstRender:admit}=await loaded;
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const exitX=cap.x+Math.floor(cap.width*.76);
 const queued={runToken:'same-source-run',floor:9,tick:451,crossingTick:null,
   oldCapId:cap.id,oldCapX:cap.x,oldCapWidth:cap.width,
   oldRoofY:cap.y+cap.height,thresholdX:exitX,nextBaseY:3240000,
   worldWidth:480000,
   // Set only by a successful prior-floor HP0 + real grounded F8->F9
   // stage, never inferred on a future-floor frame.
   verifiedObservedFloorAdvance:true,observedCrossingX:324296,
   observedCrossingY:3238000,observedHalfWidth:9000,
   observedHalfHeight:14000};
 const source={runToken:queued.runToken,lifecycle:'running',floor:9,
   theme:'void',tick:460,chunkBaseY:3240000,worldWidth:480000,
   platforms:[{id:'f9:ground',x:0,y:3212000,width:480000,height:12000}],
   player:{x:340796,y:3238000,halfWidth:9000,halfHeight:14000,
     health:4,grounded:true,groundedPlatformId:'f9:ground',
     state:'standing',vy:0}};
 const before=JSON.stringify([source,queued]);
 assert.equal(admit(source,queued),true,
   'do not delete the genuine old GPU doorway merely because delayed first Floor9 render still lacks a published crossing record');
 assert.equal(JSON.stringify([source,queued]),before);
 const w={runToken:queued.runToken,sourceTick:451,fromFloor:8,toFloor:9,
   cap,exitX,crossingX:324296,halfWidth:9000,halfHeight:14000,
   guardian:{kind:'guardian',floor:8,active:false,health:0}};
 assert.equal(admit({...source,lastGuardianCrossing:w},queued),true,
   'the recorded HP-zero crossing may arrive after the browser has already staged the original doorway');
 for(const [s,q] of [
   [{...source,runToken:'another-run'},queued],
   [{...source,tick:464},queued],
   [{...source,floor:10},queued],
   [{...source,platforms:[{...source.platforms[0],y:3212001}]},queued],
   [{...source,player:{...source.player,x:exitX+120000}},queued],
   [{...source,player:{...source.player,groundedPlatformId:'invented'}},queued],
   [source,{...queued,verifiedObservedFloorAdvance:false}],
   [source,{...queued,observedCrossingX:exitX-25000}],
   [source,{...queued,observedCrossingY:3238001}],
   [{...source,lastGuardianCrossing:{...w,runToken:'another-run'}},queued],
   [{...source,lastGuardianCrossing:{...w,guardian:{...w.guardian,active:true,health:1}}},queued],
 ]) assert.equal(admit(s,q),false);
});
