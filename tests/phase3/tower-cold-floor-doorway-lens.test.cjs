'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const entry=import('../../public/infinite-tower-climb/visuals/cold-doorway-camera.mjs');
const coordinates=import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
async function fixture() {
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const exitX=cap.x+Math.floor(cap.width*.76), crossingX=exitX+19000;
  const runToken='source-crossing-retained';
  const p={x:crossingX+14000,y:100000,halfWidth:9000,halfHeight:18000,
    health:5,grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0};
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:476,
    chunkBaseY:80000,worldWidth:480000,player:p,
    platforms:[{id:'f9:ground',x:240000,y:80000,width:175000,height:2000}],
    lastGuardianCrossing:{
      runToken,fromFloor:8,toFloor:9,sourceTick:451,
      cap,guardian:{kind:'guardian',active:false,health:0},
      exitX,crossingX,halfWidth:p.halfWidth,halfHeight:p.halfHeight}};
  const held={runToken,floor:9,oldCapId:cap.id,oldCapX:cap.x,
    oldCapWidth:cap.width,oldRoofY:82000,thresholdX:exitX,
    sourceTick:454,crossingTick:451,submittedFrames:1,visibleSeconds:.16};
  const hero=await coordinates.then(c=>c.pointFor(p.x,p.y,
    source.chunkBaseY,source.worldWidth,25));
  return {source,held,hero};
}
test('cold native Floor9 receives real body+same original arch composition after cosmetic cue expires',async()=>{
  const {observedSourceBoundColdDoorwayLens:shot}=await entry;
  const {source,held,hero}=await fixture();
  for(const aspect of [960/600,390/844]){
    const result=shot(source,held,hero,aspect);
    assert.equal(result?.sourceBound,true);
    assert.equal(result?.coldOriginalArch,true);
    assert.equal(result.sourceTick,476);
    assert.ok(result.span>0 && result.span<26);
    assert.ok(result.focusWeight>.1 && result.focusWeight<=.44);
    assert.ok(result.radius>=47 && result.radius<=104);
    assert.ok(result.focus.every(Number.isFinite));
    const frozen=JSON.stringify({source,held,hero});
    shot(source,held,hero,aspect);
    assert.equal(JSON.stringify({source,held,hero}),frozen,
      'camera must not mutate the authoritative source or original GPU proof');
  }
});
test('no false or detached source, dead guardian, wrong run, distant body, stale GPU shot',async()=>{
  const {observedSourceBoundColdDoorwayLens:shot}=await entry;
  const {source,held,hero}=await fixture();
  const cases=[
    [ {...source,runToken:'other'},held,hero ],
    [ {...source,theme:'clockwork'},held,hero ],
    [ {...source,floor:10},held,hero ],
    [ {...source,tick:505},held,hero ],
    [ {...source,player:{...source.player,health:0}},held,hero ],
    [ {...source,player:{...source.player,x:held.thresholdX+100000}},held,hero ],
    [ {...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}},held,hero ],
    [ {...source,platforms:[]},held,hero ],
    [ source,{...held,oldCapX:0},hero ],
    [ source,{...held,submittedFrames:9},hero ],
    [ source,{...held,visibleSeconds:1.5},hero ],
    [ source,held,{...hero,x:hero.x+12} ]
  ];
  for(const [s,h,v] of cases)assert.equal(shot(s,h,v,390/844),null);
  assert.equal(shot(source,held,hero,0),null);
});
test('source-backed late portrait submissions still frame the SAME original physical gate and actual moving body',async()=>{
  const {observedSourceBoundColdDoorwayLens:shot}=await entry;
  const {source,held,hero}=await fixture();
  const late={...held,submittedFrames:7,visibleSeconds:1.1};
  const frame=shot(source,late,hero,390/844);
  assert.equal(frame?.coldOriginalArch,true);
  assert.equal(frame?.sourceTick,source.tick);
  assert.ok(frame.radius>=62,'portrait keeps both real subjects within its physically safe exterior radius');
  assert.equal(shot(source,{...late,visibleSeconds:1.26},hero,390/844),null,
    'old geometry cannot be prolonged past its bounded submitted-frame sightline');
  assert.equal(shot(source,{...late,submittedFrames:9},hero,390/844),null);
});
test('production bridge consumes the genuine retained GPU witness in one camera, no teleport',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/world\.retainedFilmHandoff\?\.\(snapshot\)/);
  assert.match(scene,/observedSourceBoundColdDoorwayLens\(snapshot, coldArchProof,/);
  assert.match(scene,/coldArchLens\?\.coldOriginalArch/);
  assert.match(scene,/const opticalHandoff=!opticalGuardian/);
  assert.match(scene,/snapshot\.floor===9 && opticalHandoff/);
  assert.match(scene,/source-original-floor-nine-gateway/);
  assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y)\s*=/);
});
