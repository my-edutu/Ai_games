'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
function physical() {
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  const runToken='original-earned-four-drawn-frame-departure';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:535,
    worldWidth:480000,chunkBaseY:3212000,
    player:{x:336796,y:3364000,halfWidth:9000,halfHeight:14000,
      health:5,grounded:true,groundedPlatformId:'f9:p2',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:105000,y:3212000,width:270000,height:12000},
      {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}],
    lastGuardianCrossing:{runToken,sourceTick:475,fromFloor:8,toFloor:9,
      cap,exitX,crossingX:321096,halfWidth:9000,halfHeight:14000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    oldCapId:'f8:cap',oldCapX:cap.x,oldCapWidth:cap.width,
    oldRoofY:3224000,thresholdX:exitX,sourceTick:475,crossingTick:475,
    firstWorldRenderTick:475,submittedFrames:0,visibleSeconds:0,
    originalGatewayOpacity:1,opticalExitSubmitted:false};
  return {source,held};
}
test('true raised landing retires one original bronze doorway over a few actually returned 3D frames, before the 70-tick source proof expires', async () => {
  const {observedSourcePhysicalArrivalPalette:palette, observedSourceGatewayDeparturePresence:door} =
    await import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
  const {source,held}=physical(), samples=[];
  for(const [frames,seconds] of [[0,0],[1,.12],[2,.22],[3,.32],[4,.42]]) {
    held.submittedFrames=frames;
    held.visibleSeconds=seconds;
    const physicalProof=palette(source,held), departure=door(source,held);
    assert.equal(physicalProof?.sourceBound,true,'must remain same source-owned real platform');
    assert.equal(departure?.sourceBound,true);
    assert.equal(departure.wholeBodyCleared,true);
    samples.push(departure.opacity);
  }
  assert.equal(samples[0],1,'first returned new-floor draw must keep old arch');
  assert.equal(samples[1],1,'one submitted 3D frame cannot erase the original door');
  assert.ok(samples[2]<.86 && samples[2]>.5,'second returned frame must show a partial, not hard, old→new handoff');
  assert.ok(samples[3]<.5 && samples[3]>.1,'third return must actually advance old-world departure');
  assert.ok(samples[4]<.02,'fourth real submission must have visibly completed source-cleared original-gate material retirement');
  for(let i=1;i<samples.length;i++)assert.ok(samples[i]<=samples[i-1]);
});
test('never dissolve historical door on a forged passage, uncleared body, or expired source story',async()=>{
  const {observedSourceGatewayDeparturePresence:door}=await import(
    '../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
  const {source,held}=physical();
  held.submittedFrames=4;held.visibleSeconds=.42;
  source.player.x=source.lastGuardianCrossing.crossingX;source.player.y=3238000;
  source.player.groundedPlatformId='f9:ground';
  source.player.state='standing';source.player.vy=0;
  assert.equal(door(source,held)?.opacity,1,'uncleared physical doorway remains intact');
  source.player.x=336796;source.player.y=3364000;
  source.player.groundedPlatformId='f9:p2';
  source.tick=546;
  assert.equal(door(source,held),null,'source proof never extends past 70 ticks');
  source.tick=535;source.lastGuardianCrossing.guardian.health=1;
  assert.equal(door(source,held),null,'no synthetic guardian win');
});
