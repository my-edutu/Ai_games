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
    assert.ok(trials[4][1]<0 && trials[5][1]<0,
      'source-gated near-camera alternatives must combat tiny portrait hero');
    assert.ok(trials[4][1]>=-.325 && trials[5][1]>=-.325);
    assert.ok(trials[4][2]>0 && trials[5][2]>0);
    assert.ok(trials.every(([yaw,dolly,lift])=>
      Math.abs(yaw)<=.035 && dolly>=-.325 && dolly<=.65 && lift>=0 && lift<=.31),
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
    originalCapBlockedGatewayRays:0,originalCapBlockedRays:1,
    originalGalleryBlockedRays:2,originalGalleryBlockedBodyRays:1,
    originalGalleryBlockedGatewayRays:1,
    architectureBlockedRays:1,score:5};
  assert.equal(safe(before,{...before,bodyBlockedRays:1,
    originalCapBlockedBodyRays:0,score:3}),true);
  for(const field of ['bodyBlockedRays','gatewayBlockedRays',
    'originalGateBlockedRays','originalCapBlockedBodyRays',
    'originalCapBlockedGatewayRays','originalCapBlockedRays',
    'originalGalleryBlockedRays','originalGalleryBlockedBodyRays',
    'originalGalleryBlockedGatewayRays',
    'architectureBlockedRays','score']){
    const next={...before,[field]:before[field]+1};
    assert.equal(safe(before,next),false,field);
  }
  assert.equal(safe(before,null),false);
  assert.equal(safe({...before,active:false},before),false);
  assert.equal(safe(before,{...before,score:NaN}),false);
  assert.equal(safe(before,{...before,originalGalleryBlockedRays:undefined}),false,
    'missing physical-gallery ray evidence cannot license a camera');
});

test('same-source physical ray relief changes camera priority, but not when bronze or live decks get worse',async()=>{
  const {sourceThreeSubjectPhysicalGain:gain,
    sourceThreeSubjectRaySafe:safe}=await helpers;
  const base={active:true,bodyBlockedRays:3,gatewayBlockedRays:2,
    originalGateBlockedRays:1,originalCapBlockedRays:1,
    originalCapBlockedBodyRays:1,originalCapBlockedGatewayRays:0,
    originalGalleryBlockedRays:2,originalGalleryBlockedBodyRays:1,
    originalGalleryBlockedGatewayRays:1,architectureBlockedRays:1,score:8};
  const improved={...base,bodyBlockedRays:2,gatewayBlockedRays:1,
    originalGalleryBlockedRays:1,originalGalleryBlockedGatewayRays:0,score:5};
  assert.equal(safe(base,improved),true);
  assert.ok(gain(base,improved)>.10,
    'real uncloaked hero/gateway must compete even with no crop relief');
  assert.equal(gain(base,base),0,'no empty camera preference');
  assert.equal(gain(base,{...improved,originalCapBlockedRays:2}),0,
    'no rescue by hiding the original floor-eight cap');
  assert.equal(gain(base,{...improved,originalGalleryBlockedBodyRays:2}),0,
    'no rescue by hiding the source-sized hero behind bronze');
  assert.equal(gain(base,{...improved,architectureBlockedRays:2}),0,
    'no rescue through real void bearing triangles');
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

test('HP-zero three-subject shot can improve genuine in-frame silhouette separation without pretending a crop',async()=>{
  const {sourceThreeSubjectSilhouetteRelief:relief}=await helpers;
  // All three authentic projected subjects fit already; older cropping-only
  // directors returned zero and allowed the opened gate to disappear behind
  // the skinned player and actual successor roof in original portrait film.
  const hero=[-.02,.07,.5,.20],gate=[.04,.08,.5,.16],roof=[.10,.09,.5];
  const separatedHero=[-.20,.06,.5,.20];
  const separatedGate=[.14,.07,.5,.16];
  const separatedRoof=[.41,.08,.5];
  const gain=relief(hero,gate,roof,separatedHero,separatedGate,separatedRoof,true,true,true);
  assert.ok(gain>.04,'safe genuine three-body separation merits a source ray trial');
  assert.equal(relief(hero,gate,roof,hero,gate,roof,true,true,true),0,
    'unchanged in-frame overlap is not a camera improvement');
  assert.equal(relief(hero,gate,roof,separatedHero,separatedGate,separatedRoof,false,true,true),0,
    'solid-core body ray may never earn an optical correction');
  assert.equal(relief(hero,gate,roof,separatedHero,separatedGate,separatedRoof,true,true,false),0,
    'actual walkable roof must have a real clear core ray');
  assert.equal(relief(hero,gate,roof,[.91,.06,.5,.20],separatedGate,separatedRoof,true,true,true),0,
    'moving the actor outside the safe viewport is not relief');
  assert.equal(relief(hero,gate,roof,[-.20,.06,.5,.07],separatedGate,separatedRoof,true,true,true),0,
    'reducing the actor to a tiny speck is not relief');
  assert.equal(relief(hero,gate,roof,separatedHero,[.14,.07,.5,.04],separatedRoof,true,true,true),0,
    'shrinking the actual opened gate is not relief');
  assert.equal(relief(hero,gate,roof,separatedHero,separatedGate,[.95,.08,.5],true,true,true),0,
    'an offscreen authentic Floor9 destination cannot earn a better shot');
});
test('final camera attempts source-backed in-frame triad relief only with real world-triangle veto',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const shot=code.slice(code.indexOf('// POST-DIRECTOR PHYSICAL CROSSING:'),
    code.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints);'));
  assert.match(shot,/physicalWalkableShot\?\.sourceBound===true\s*\?sourceThreeSubjectSilhouetteRelief\(/);
  assert.match(shot,/routeGain,steelGain,silhouetteRelief/);
  assert.match(shot,/if\(!sourceThreeSubjectRaySafe\(\s*deckViewBeforeThreshold,currentRays\)\)continue;/);
  assert.match(shot,/towerCoreSightlineClear\(camera\.position,thresholdWalkable,23\.5\)/);
  assert.match(shot,/sourceThreeSubjectPhysicalGain\(\s*deckViewBeforeThreshold,currentRays\)/);
  assert.match(shot,/const gain=Math\.max\(opticalGain,physicalGain\)/);
  assert.match(shot,/if\(!sourceThreeSubjectRaySafe\(\s*deckViewBeforeThreshold,deckViewAfterThreshold\)\)/);
});

test('source-earned close-camera benefit must grow the real player without losing metal arch or physical roof',async()=>{
  const {sourceThreeSubjectActorScaleGain:gain}=await helpers;
  const hero=[.04,.03,.5,.075],gate=[.25,.03,.5,.13],roof=[.45,.02,.5];
  const closerHero=[.03,.025,.5,.087],steadyGate=[.24,.03,.5,.132],
    steadyRoof=[.46,.02,.5];
  assert.ok(gain(hero,gate,roof,closerHero,steadyGate,steadyRoof,true,true,true)>.01);
  assert.equal(gain(hero,gate,roof,hero,steadyGate,steadyRoof,true,true,true),0,
    'camera with no added real actor size is not an improvement');
  assert.equal(gain(hero,gate,roof,closerHero,[.24,.03,.5,.09],steadyRoof,true,true,true),0,
    'cannot trade the actual HP-open portal away for a close hero');
  assert.equal(gain(hero,gate,roof,[.90,.025,.5,.087],steadyGate,steadyRoof,true,true,true),0,
    'must keep the entire moving character onscreen');
  assert.equal(gain(hero,gate,roof,closerHero,steadyGate,[.95,.02,.5],true,true,true),0,
    'cannot lose the real receiving deck');
  assert.equal(gain(hero,gate,roof,closerHero,steadyGate,steadyRoof,true,true,false),0,
    'uncleared physical roof is an immediate veto');
  assert.equal(gain(hero,gate,roof,closerHero,steadyGate,steadyRoof,true,false,true),0,
    'the real original metal gateway must have clear core sightline');
});
test('final in-game F9 camera considers physical actor scale only with source F8 arch and independent real triangle veto',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const shot=code.slice(code.indexOf('// POST-DIRECTOR PHYSICAL CROSSING:'),
    code.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints);'));
  assert.match(shot,/physicalWalkableShot\?\.sourceBound===true\s*\?sourceThreeSubjectActorScaleGain\(/);
  assert.match(shot,/routeGain,steelGain,silhouetteRelief,scaleGain/);
  assert.match(shot,/if\(!sourceThreeSubjectRaySafe\(\s*deckViewBeforeThreshold,currentRays\)\)continue;/);
});
