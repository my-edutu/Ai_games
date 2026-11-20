import test from 'node:test';
import assert from 'node:assert/strict';
import { observedRetainedSourceOriginalOpticalRoom } from '../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs';
import { observedSourceBoundColdDoorwayLens } from '../../public/infinite-tower-climb/visuals/cold-doorway-camera.mjs';
import { pointFor } from '../../public/infinite-tower-climb/visuals/coordinates.mjs';

function fixture() {
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const roof=cap.y+cap.height;
  const source={
    lifecycle:'running',floor:9,theme:'void',runToken:'original-run',
    tick:516,chunkBaseY:0,worldWidth:480000,
    player:{x:343196,y:3323800,halfWidth:9000,halfHeight:14000,
      health:4,grounded:false,groundedPlatformId:null,state:'airborne',vy:9000},
    platforms:[{id:'f9:ground',x:115200,y:3212000,width:249600,height:12000}],
    lastGuardianCrossing:{runToken:'original-run',fromFloor:8,toFloor:9,
      sourceTick:475,exitX:thresholdX,crossingX:318000,
      halfWidth:9000,halfHeight:14000,cap,
      guardian:{kind:'guardian',active:false,health:0}}
  };
  const held={runToken:'original-run',floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:roof,thresholdX,
    crossingTick:475,sourceTick:476,firstWorldRenderTick:476,
    submittedFrames:14,visibleSeconds:.7,
    originalGatewayOpacity:.9845,opticalExitSubmitted:false};
  return {source,held};
}

test('source-authenticated original GPU room remains eligible during the real first F9 jump',()=>{
  const {source,held}=fixture();
  const proof=observedRetainedSourceOriginalOpticalRoom(source,held);
  assert.equal(proof?.sourceBound,true);
  assert.equal(proof.sourceTick,516);
  const actor=pointFor(source.player.x,source.player.y,
    source.chunkBaseY,source.worldWidth,25);
  const publicHeld={...held,sourceOwnedOriginalCameraRoom:true,
    sourceOwnedOriginalCameraRoomTick:proof.sourceTick};
  const lens=observedSourceBoundColdDoorwayLens(source,publicHeld,actor,.46);
  assert.equal(lens?.coldOriginalArch,true);
  assert.equal(lens?.sourceTick,516);
  assert.ok(lens.span<26 && lens.rise<28);
});

test('no false old-room certificate for unrelated run, unearned HP, ghost support or retired mesh',()=>{
  for(const mutation of [
    (s,h)=>{s.runToken='other-run';},
    (s,h)=>{s.lastGuardianCrossing.guardian.health=1;},
    (s,h)=>{s.lastGuardianCrossing.cap.width+=10000;},
    (s,h)=>{s.lastGuardianCrossing.sourceTick=474;},
    (s,h)=>{s.player.groundedPlatformId='f9:p2';s.player.grounded=true;s.player.state='standing';s.player.vy=0;},
    (s,h)=>{s.player.x=600000;},
    (s,h)=>{s.player.y=h.oldRoofY+280000+s.player.halfHeight;},
    (s,h)=>{h.originalGatewayOpacity=.01;},
    (s,h)=>{h.opticalExitSubmitted=true;},
    (s,h)=>{h.submittedFrames=30;},
    (s,h)=>{s.tick=600;},
    (s,h)=>{s.lastGuardianCrossing=null;}
  ]) {
    const {source,held}=fixture();
    mutation(source,held);
    assert.equal(observedRetainedSourceOriginalOpticalRoom(source,held),null);
  }
});

test('camera cannot borrow old GPU receipt from a different source tick',()=>{
  const {source,held}=fixture();
  const actor=pointFor(source.player.x,source.player.y,
    source.chunkBaseY,source.worldWidth,25);
  // A current authentic but already completely faded gateway cannot be
  // repainted by a stale source-validated optical receipt.
  held.originalGatewayOpacity=0;
  held.sourceOwnedOriginalCameraRoom=true;
  held.sourceOwnedOriginalCameraRoomTick=source.tick-1;
  const lens=observedSourceBoundColdDoorwayLens(source,held,actor,.46);
  assert.equal(lens,null);
});
