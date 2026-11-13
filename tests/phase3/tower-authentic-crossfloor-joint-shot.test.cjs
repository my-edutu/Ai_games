'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const helper = import('../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs');
const coordinate = import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
const make = async () => {
  const { pointFor } = await coordinate;
  const player = {health:4,x:309000,y:3240000,
    halfHeight:14000,halfWidth:9000,grounded:false,
    groundedPlatformId:null,state:'airborne',vy:4500};
  const source={runToken:'real-crossing-1',floor:9,theme:'void',tick:454,
    lifecycle:'running',worldWidth:480000,chunkBaseY:3210000,
    player};
  const hero=pointFor(player.x,player.y,source.chunkBaseY,source.worldWidth,25);
  const passage={sourceBound:true,active:true,stage:'handoff',
    continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
    exteriorMemoryFrameVisible:false,runToken:source.runToken,floor:9,
    sourceTick:451,focusPosition:[hero.x-1,hero.y+1.5,hero.z],
    ageSeconds:.25,durationSeconds:2.5};
  return {source,passage,hero};
};
test('real first Floor9 airborne body and the original bronze doorway get one bounded shared gaze in both viewports',async()=>{
  const {observedEarnedCrossfloorJointShot:shot}=await helper;
  const {source,passage,hero}=await make();
  for(const aspect of [960/600,390/844]){
    const result=shot(source,passage,hero,aspect);
    assert.equal(result?.sourceTick,454);
    assert.equal(result?.sourceBound,true);
    assert.ok(result.focusWeight>0 && result.focusWeight<=.34);
    assert.ok(result.focus.every(Number.isFinite));
    assert.ok(result.planarSeparation<13&&result.verticalSeparation<8);
    assert.ok(Math.abs(result.focus[0] - (hero.x+passage.focusPosition[0])*.5)<1e-8);
  }
});
test('no old run, fake gateway, missing contact, stale renderer, remote body or floor can invite cinematic camera',async()=>{
  const {observedEarnedCrossfloorJointShot:shot}=await helper;
  const {source,passage,hero}=await make();
  const reject=[
    [ {...source,floor:8},passage,hero ],
    [ {...source,runToken:'new-run'},passage,hero ],
    [ {...source,tick:500},passage,hero ],
    [ {...source,stale:true},passage,hero ],
    [ {...source,theme:'clockwork'},passage,hero ],
    [ {...source,player:{...source.player,health:0}},passage,hero ],
    [ source,{...passage,stage:'guardian-locked'},hero ],
    [ source,{...passage,active:false},hero ],
    [ source,{...passage,sourceBound:false},hero ],
    [ source,{...passage,innerDoorAssemblyVisible:false},hero ],
    [ source,{...passage,focusPosition:[hero.x+30,hero.y,hero.z]},hero ],
    [ source,passage,{...hero,x:hero.x+30} ],
  ];
  for(const [s,p,h] of reject)
    assert.equal(shot(s,p,h,390/844),null);
  assert.equal(shot(source,passage,hero,0),null);
  assert.equal(shot(source,passage,hero,390/844,2),null);
});
test('the production scene uses the same camera and retains original authority',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/jointThresholdShot = !overview && !options\.stale/);
  assert.match(scene,/observedEarnedCrossfloorJointShot\(snapshot, passage\.diagnostics\(\),/);
  assert.match(scene,/focus\.x \+= \(x - focus\.x\) \* w/);
  assert.match(scene,/if \(airborneHandoffEscort > \.04 && !options\.reducedMotion\)/);
  assert.doesNotMatch(scene,/snapshot\.player\.x\s*=/);
});
