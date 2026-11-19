'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const owner=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

function actualSourceRoof(){
  // Same physical F8 sill/F9 receiving roof as the recorded HP-zero episode.
  // The new specimen sits in the 60–100m walkable-roof corridor where
  // existing near-door (<=60m) and far-side (>100m / +7m rise) proofs BOTH
  // returned null. No proxy destination/actor or invented collision.
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const runToken='one-authentic-guardian-defeat';
  const roofY=cap.y+cap.height;
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:520,
    player:{health:5,x:thresholdX+85000+9000,y:roofY+14000,
      halfWidth:9000,halfHeight:14000,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:0,y:cap.y,width:480000,height:cap.height}],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,sourceTick:475,
      exitX:thresholdX,cap,guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:roofY,
    thresholdX,crossingTick:475,firstWorldRenderTick:480,
    submittedFrames:3,visibleSeconds:.24,originalGatewayOpacity:.88,
    opticalExitSubmitted:false};
  const job={runToken,floor:9,proof:'recorded-source-gateway',
    sourceTick:480,structureDeferred:true,state:'awaiting-void-biome-build',
    submittedFrames:3,structureBuiltAtSubmitted:1,
    structuralVisibleReturns:0,structuralRoot:{isGroup:true,visible:false}};
  return {source,held,job};
}

test('REAL grounded Floor9 roof between short aperture and far-side lease exposes the already-built original shaft',async()=>{
  const {observedSourceSupportedVoidFirstPaint:paint,
    observedSourceEarnedEarlyVoidShaftAperture:near,
    observedEarnedFarSideShaftOverlap:far}=await owner;
  const f=actualSourceRoof();
  const untouched=JSON.stringify(f);
  assert.equal(near(f.source,f.held,f.job),null,'6–60m only in original early aperture');
  assert.equal(far(f.source,f.held,f.job),null,'far-side requires 100m horizontal or a genuine 7m rise');
  const earned=paint(f.source,f.held,f.job);
  assert.equal(earned?.sourceBound,true);
  assert.equal(earned?.sourceTick,520);
  assert.equal(earned?.basis,'authentic-grounded-receiving-roof-corridor');
  assert.ok(earned.alpha>=.15 && earned.alpha<=.28);
  assert.equal(JSON.stringify(f),untouched,'presentation proof must not write physics or GPU history');
});

test('a source-only floor label, false victory, wrong roof/contact or zero returned WebGL frames cannot show the successor',async()=>{
  const {observedSourceSupportedVoidFirstPaint:paint}=await owner;
  for(const mutate of [
    f=>{f.source.runToken='other';},
    f=>{f.source.floor=8;},
    f=>{f.source.lifecycle='result';},
    f=>{f.source.player.health=0;},
    f=>{f.source.player.grounded=false;},
    f=>{f.source.player.groundedPlatformId='fictional';},
    f=>{f.source.player.y+=1000;},
    f=>{f.source.player.x=f.held.thresholdX+3000;},
    f=>{f.source.player.x=f.held.thresholdX+125000;},
    f=>{f.source.platforms[0].y-=1000;},
    f=>{f.source.lastGuardianCrossing.guardian.health=4;},
    f=>{f.source.lastGuardianCrossing.guardian.active=true;},
    f=>{f.source.lastGuardianCrossing.cap.width-=500;},
    f=>{f.source.lastGuardianCrossing=null;},
    f=>{f.held.guardianGateRetained=false;},
    f=>{f.held.verifiedObservedFloorAdvance=false;},
    f=>{f.held.originalGatewayOpacity=0;},
    f=>{f.held.submittedFrames=0;},
    f=>{f.held.visibleSeconds=3;},
    f=>{f.source.tick=650;},
    f=>{f.job.runToken='another';},
    f=>{f.job.proof='floor-label';},
    f=>{f.job.structureDeferred=false;},
    f=>{f.job.structuralVisibleReturns=1;},
    f=>{f.job.structuralRoot=null;},
    f=>{f.job.structureBuiltAtSubmitted=0;},
    f=>{f.job.submittedFrames=0;}
  ]){
    const f=actualSourceRoof();mutate(f);
    assert.equal(paint(f.source,f.held,f.job),null,'invalid true-gateway route/returned-world evidence must veto paint');
  }
});

test('the real World keeps the first-painted original shaft under returned WebGL authority, not HUD/physics',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceSupportedVoidFirstPaint\(\s*snapshot,retainedEarnedCap,arrival\)/);
  assert.match(world,/arrival\.structuralFade=Math\.min\(\.28,earlyShell\.alpha\)/);
  assert.match(world,/structuralRoot\.visible=arrival\.structuralFade>\.015/);
  assert.match(world,/observedSourceReturnedCoreBeforeScenicUpload\(/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
