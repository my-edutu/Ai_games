'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const loaded=import('../../public/infinite-tower-climb/visuals/crossfloor-arrival.mjs');

function originalGate(){
  const source={runToken:'observed-void-run',lifecycle:'running',
    floor:9,theme:'void',tick:465,
    player:{x:334000,y:100000,halfWidth:9000,halfHeight:18000,
      health:5,grounded:true,groundedPlatformId:'f9:p1',
      vy:0,state:'standing'},
    platforms:[{id:'f9:p1',x:280000,y:80000,width:90000,height:2000}]};
  const held={runToken:source.runToken,floor:9,sourceTick:454,
    firstWorldRenderTick:460,thresholdX:320000,oldRoofY:82000,
    submittedFrames:2,visibleSeconds:.2,guardianGateRetained:true,
    originalGatewayOpacity:.95,opticalExitSubmitted:false};
  const passage={sourceBound:true,active:true,stage:'handoff',
    continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
    exteriorMemoryFrameVisible:false,runToken:source.runToken,
    floor:9,sourceTick:454};
  const job={state:'awaiting-structural-release',
    proof:'recorded-source-gateway',runToken:source.runToken,
    floor:9,sourceTick:460,structureDeferred:true,
    submittedFrames:2,structureBuiltAtSubmitted:1};
  const gate={sourceBound:true,sourceTick:source.tick,opacity:.95};
  return {source,held,passage,job,gate};
}

test('source-authorized F9 builds its authentic shaft hidden, then releases only when the old bronze gateway physically recedes',async()=>{
  const {holdIncomingStructuralShell:hold,observedPrebuiltVoidShaftRelease:release}=await loaded;
  const s=originalGate(),unchanged=JSON.stringify(s);
  assert.equal(hold(s.source,s.passage,s.held,s.job,s.gate),true);
  assert.equal(release(s.source,s.passage,s.held,s.job,s.gate),false,
    'do not convert the source-owned opaque bronze gateway into an instant violet shaft');
  const departing={...s.held,originalGatewayOpacity:.60};
  const visible={...s.gate,opacity:.60};
  assert.equal(hold(s.source,s.passage,departing,s.job,visible),true,
    'physical old geometry still present while authentic shaft is allowed to overlap');
  assert.equal(release(s.source,s.passage,departing,s.job,visible),true);
  assert.equal(JSON.stringify(s),unchanged,'render gates never change source or fixtures');
});

test('no speculative F9 fade on same frame as prebuild, stale run, source mismatch, no old gateway, or unearned floor',async()=>{
  const {observedPrebuiltVoidShaftRelease:release}=await loaded;
  const s=originalGate();
  const v=(source=s.source,held=s.held,job=s.job,gate=s.gate)=>
    release(source,s.passage,held,job,gate);
  assert.equal(v(s.source,s.held,{...s.job,submittedFrames:1}),false,
    'one authentic returned 3D frame must upload prebuilt geometry first');
  assert.equal(v({...s.source,runToken:'another-run'}),false);
  assert.equal(v({...s.source,floor:10}),false);
  assert.equal(v({...s.source,lifecycle:'outcome'}),false);
  assert.equal(v({...s.source,player:{...s.source.player,health:0}}),false);
  assert.equal(v({...s.source,tick:535}),false);
  assert.equal(v(s.source,{...s.held,runToken:'other-run'}),false);
  assert.equal(v(s.source,s.held,{...s.job,proof:'adjacent-browser-guardian'}),false);
  assert.equal(v(s.source,s.held,{...s.job,state:'awaiting-actual-first-render'}),false);
  assert.equal(v(s.source,s.held,{...s.job,structureDeferred:false}),false);
  const almostDeparted={...s.held,originalGatewayOpacity:.60};
  assert.equal(v(s.source,almostDeparted,s.job,{...s.gate,sourceTick:464,opacity:.60}),false,
    'another source-tick gate must never authorize overlap');
  assert.equal(v(s.source,almostDeparted,s.job,{...s.gate,opacity:.9}),false,
    'one retained material is not enough to claim the same physical gateway retreated');
});

test('after the original cap has genuinely expired, recorded same-run HP0 crossing allows built F9 shell to appear',async()=>{
  const {observedPrebuiltVoidShaftRelease:release}=await loaded;
  const s=originalGate();
  const cap={id:'f8:cap'};
  const later={...s.source,tick:480,lastGuardianCrossing:{
    runToken:s.source.runToken,fromFloor:8,toFloor:9,sourceTick:451,
    cap,guardian:{kind:'guardian',active:false,health:0}}};
  assert.equal(release(later,s.passage,null,
    {...s.job,submittedFrames:30,structureBuiltAtSubmitted:1},null),true,
    'rendered source victory may finish after the old material owner has disposed');
  assert.equal(release({...later,lastGuardianCrossing:{
    ...later.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:1}}},
    s.passage,null,{...s.job,submittedFrames:30,structureBuiltAtSubmitted:1},null),false);
});

test('actual Floor9 world uploads original noninteractive shaft after first renderer return, holds alpha zero until source release, then reveals before vista',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/arrival\.submittedFrames>=1 && !options\.stale\) \{/);
  assert.match(world,/buildTower\(arrival\.height,false\)/);
  assert.match(world,/material\.name='SourceEarnedIncomingFloorNineShaft'[\s\S]*?material\.opacity=0/);
  assert.match(world,/arrival\.state='awaiting-structural-release'/);
  assert.match(world,/job\.state!=='awaiting-structural-release'[\s\S]*?job\.structuralFade<1/);
  assert.match(world,/observedPrebuiltVoidShaftRelease\(snapshot,passageWitness,[\s\S]*?arrival\.state='awaiting-structural-submission'/);
  assert.match(world,/arrival\.structuralFade>=\.35[\s\S]*?appendDeferredVista\(arrival\)/);
  assert.match(world,/for\(const p of snapshot\.platforms\|\|\[\]\)/);
  assert.match(world,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});
