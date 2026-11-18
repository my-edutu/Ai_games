'use strict';
// Real source-earned F8 guardian -> F9 original walkway composition.
// These are source/Three camera safety tests, not claims of native video acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helpers=import('../../public/infinite-tower-climb/visuals/physical-threshold-shot.mjs');
const runToken='guardian-original-physical-walkable-floor-nine';
function scene(){
  const cap={id:'f8:cap',x:200000,y:3220000,width:140000,height:20000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const ground={id:'f9:ground',x:294000,y:3220000,width:66000,height:20000};
  const player={health:5,x:325000,y:3254000,halfWidth:8000,halfHeight:14000,
    grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0};
  const source={runToken,lifecycle:'running',theme:'void',floor:9,tick:479,
    worldWidth:480000,chunkBaseY:3240000,player,platforms:[ground],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,sourceTick:475,
      cap,exitX,crossingX:317000,halfWidth:8000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,sourceTick:475,
    crossingTick:475,verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:cap.y+cap.height,
    thresholdX:exitX};
  return {source,held};
}
test('physical successor shot includes a real walkable location BEYOND the original HP-zero gateway, not invented support',async()=>{
  const {observedSourceWalkableCrossfloorShot:shot}=await helpers;
  const f=scene(),before=JSON.stringify(f);
  const result=shot(f.source,f.held);
  assert.equal(result?.sourceBound,true);
  assert.equal(result.platformId,'f9:ground');
  assert.equal(result.sourceTick,479);
  assert.ok(result.anchorX>f.held.thresholdX);
  assert.ok(result.anchorX+f.source.player.halfWidth<=f.source.platforms[0].x+f.source.platforms[0].width);
  assert.ok(result.anchorX-f.source.player.halfWidth>=f.source.platforms[0].x);
  assert.equal(result.world.length,3);
  assert.ok(result.world.every(Number.isFinite));
  assert.ok(Math.hypot(result.world[0],result.world[2])>24);
  assert.equal(JSON.stringify(f),before,'3D camera witness must not mutate source or retained GPU owner');
});
test('only same-run source-backed guardian defeat and real Floor9 geometry earn a visible successor destination',async()=>{
  const {observedSourceWalkableCrossfloorShot:shot}=await helpers;
  for(const change of [
    f=>f.source.floor=8,
    f=>f.source.theme='clockwork',
    f=>f.source.lifecycle='intermission',
    f=>f.source.runToken='another-run',
    f=>f.source.tick=620,
    f=>f.source.player.health=0,
    f=>f.source.player.groundedPlatformId='f9:phantom',
    f=>f.source.player.x=50000,
    f=>f.source.player.y+=50000,
    f=>f.source.platforms[0].width=5000,
    f=>f.source.platforms[0].y+=2000,
    f=>f.source.lastGuardianCrossing.guardian.active=true,
    f=>f.source.lastGuardianCrossing.guardian.health=1,
    f=>f.source.lastGuardianCrossing.cap.id='f7:cap',
    f=>f.held.guardianGateRetained=false,
    f=>f.held.oldCapId='f7:cap',
    f=>f.held.oldRoofY+=20000,
  ]){
    const f=scene();change(f);
    assert.equal(shot(f.source,f.held),null,change.toString());
  }
});
test('unrecorded first returned F9 source can only use the previously observed SAME grounded HP-zero gateway receipt',async()=>{
  const {observedSourceWalkableCrossfloorShot:shot}=await helpers;
  const f=scene();f.source.lastGuardianCrossing=null;f.held.crossingTick=null;
  assert.equal(shot(f.source,f.held)?.sourceBound,true);
  f.held.verifiedObservedFloorAdvance=false;
  assert.equal(shot(f.source,f.held),null);
});
test('actual third walkable-deck projection improves with no loss of hero/old open gateway; no blind camera move',async()=>{
  const {sourceWalkableCrossfloorFrameGain:gain,
    sourceWalkableCrossfloorProjectionHeld:held}=await helpers;
  const hero=[-.18,0,.5,.15],gate=[.32,.03,.5,.13];
  const cropped=[1.04,.04,.5],improved=[.66,.04,.5];
  assert.ok(gain(hero,gate,cropped,hero,gate,improved,true,true,true)>.05);
  assert.equal(gain(hero,gate,cropped,[.88,0,.5,.15],gate,improved,true,true,true),0);
  assert.equal(gain(hero,gate,cropped,hero,[1.1,.03,.5,.13],improved,true,true,true),0);
  assert.equal(gain(hero,gate,cropped,hero,gate,improved,true,true,false),0);
  assert.equal(gain(hero,gate,cropped,hero,gate,[Infinity,0,.5],true,true,true),0);
  assert.equal(held([.22,.1,.5],[.33,.2,.5]),true);
  assert.equal(held([.22,.1,.5],[.96,.1,.5]),false);
  assert.equal(held([.22,.1,.5],[.2,.2,2]),false);
});
test('real composed scene keeps all THREE source-earned subjects protected through cold bridge, ray ladder and final optical correction',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/observedSourceWalkableCrossfloorShot\(snapshot,coldArchProof\)/);
  assert.match(scene,/sourceWalkableCrossfloorProjectionHeld\(/);
  assert.match(scene,/sourceWalkableCrossfloorFrameGain\(/);
  assert.match(scene,/sourceDoorwayFrameGain\(/);
  assert.match(scene,/world\.measureSuccessorDeckVisibility\(/);
  assert.match(scene,/towerCoreSightlineClear\(camera\.position,thresholdWalkable/);
  assert.match(scene,/physicalThresholdFrameGain/);
  assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y)\s*=/);
});

test('source-earned F9 camera can search reversible shoulder and pullback only with a REAL walkable third subject',async()=>{
  const {sourceDoorwayFrameSteps:steps,
    sourceWalkableThreeSubjectOrbitCandidates:candidates}=await helpers;
  for(const aspect of [960/600,390/844]){
    const s=steps(1/25,aspect);
    const trials=candidates(s,true);
    assert.equal(trials.length,6);
    assert.deepEqual(trials[0],[0,0,0]);
    assert.ok(trials[3][1]>0 && trials[3][1]<=.65);
    assert.ok(trials[3][2]>0 && trials[3][2]<=.31);
    assert.ok(trials[4][0]<0 && trials[5][0]>0);
    assert.ok(trials.every(([yaw,dolly,lift])=>
      Math.abs(yaw)<=.035 && dolly>=0 && lift>=0),
      'camera travel must remain frame-bounded');
    assert.equal(candidates(s,false),null,'no fictional successor deck camera');
    assert.equal(candidates({...s,pullbackMetres:Infinity},true),null);
    assert.equal(candidates({...s,orbitRadians:.4},true),null);
  }
});
test('real old cap, gate, bearing and deck rays veto a falsely clearer projected shot BEFORE ranking',async()=>{
  const {sourceThreeSubjectRaySafe:safe}=await helpers;
  const before={active:true,bodyBlockedRays:2,gatewayBlockedRays:1,
    originalGateBlockedRays:1,originalCapBlockedBodyRays:1,
    originalCapBlockedGatewayRays:0,architectureBlockedRays:1,score:5};
  assert.equal(safe(before,{...before,bodyBlockedRays:1,
    originalCapBlockedBodyRays:0,score:3}),true);
  for(const field of ['bodyBlockedRays','gatewayBlockedRays',
    'originalGateBlockedRays','originalCapBlockedBodyRays',
    'originalCapBlockedGatewayRays','architectureBlockedRays','score']){
    const next={...before,[field]:before[field]+1};
    assert.equal(safe(before,next),false,field);
  }
  assert.equal(safe(before,null),false);
  assert.equal(safe({...before,active:false},before),false);
  assert.equal(safe(before,{...before,score:NaN}),false);
});
test('composed final physical camera ranks ONLY individually source-ray-safe triad candidates',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const stage=code.slice(code.indexOf('// POST-DIRECTOR PHYSICAL CROSSING:'),
    code.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints);'));
  assert.match(stage,/sourceWalkableThreeSubjectOrbitCandidates\(thresholdSteps,true\)/);
  assert.match(stage,/if\(!sourceThreeSubjectRaySafe\(\s*deckViewBeforeThreshold,currentRays\)\)continue;/);
  assert.match(stage,/world\.measureSuccessorDeckVisibility\(/);
  assert.match(stage,/camera\.position\.set\(Math\.sin\(angle\)\*candidateRadius/);
  assert.match(stage,/towerCoreSightlineClear\(camera\.position,thresholdGate/);
});
