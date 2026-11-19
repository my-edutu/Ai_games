'use strict';
const { resolveTowerWorldFixtureImports } = require('../helpers/tower-world-fixture-imports.cjs');
// Real shipped Three.js Floor8->9 original cap resource ownership; the source
// validator already resides in guardian-passage.mjs, never a fake win fixture.
const {test,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tower-retained-real-cap-'));
const local=path.join(scratch,'world.mjs');
const uri=file=>pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals',file)).href;
const source=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
  .replace("'/tower/vendor/three.module.js'",JSON.stringify(pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href))
  .replace("'./coordinates.mjs'",JSON.stringify(uri('coordinates.mjs')))
  .replace("'./crossfloor-arrival.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs')).href))
  .replace("'./original-clockwork-architecture-palette.mjs'", JSON.stringify(pathToFileURL(require.resolve('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs')).href))
  .replace("'./source-earned-bearing-run.mjs'", JSON.stringify(pathToFileURL(require.resolve('../../public/infinite-tower-climb/visuals/source-earned-bearing-run.mjs')).href))
  .replace("'./source-physical-arrival-palette.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs')).href))
  .replace("'./guardian-passage.mjs'",JSON.stringify(uri('guardian-passage.mjs')))
  .replace("'./world-surface.mjs'",JSON.stringify(uri('world-surface.mjs')))
  .replace("'./scene-hierarchy.mjs'",JSON.stringify(uri('scene-hierarchy.mjs')))
  .replace("'./guardian-transmission-layout.mjs'",JSON.stringify(uri('guardian-transmission-layout.mjs')))
  .replace("'./mesh-provenance.mjs'",JSON.stringify(uri('mesh-provenance.mjs')))
  .replace("'./original-gallery-foreground.mjs'",JSON.stringify(uri('original-gallery-foreground.mjs')))
  .replace("'./far-side-shaft-transition.mjs'",JSON.stringify(uri('far-side-shaft-transition.mjs')));
fs.writeFileSync(local,resolveTowerWorldFixtureImports(source,{root:ROOT,fixtureDir:scratch}));
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
const loaded=Promise.all([import(pathToFileURL(local).href),
  import(uri('guardian-passage.mjs'))]);
// CI-only memory/phase probes for the repeated no-TAP-output hosted-runner
// shutdown: never affect production scene, snapshots or test assertions.
const auditEnabled=process.env.TOWER_P0_RESOURCE_DIAGNOSTICS==='1';
const auditStart=performance.now();
function resourceCheckpoint(phase){
  if(!auditEnabled)return;
  const m=process.memoryUsage();
  process.stderr.write(`TOWER_P0_RESOURCE phase=${phase} elapsedMs=${Math.round(performance.now()-auditStart)} rssMiB=${Math.round(m.rss/1048576)} heapMiB=${Math.round(m.heapUsed/1048576)} externalMiB=${Math.round(m.external/1048576)}
`);
}
// Diagnose the real retained-world hosted-runner SIGKILL at subtest granularity.
// Do not skip tests, increase timeout, alter game snapshots or infer a pass.
beforeEach(t=>resourceCheckpoint('subtest-begin:'+t.name));
afterEach(t=>resourceCheckpoint('subtest-end:'+t.name));
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const body={health:5,grounded:true,state:'standing',vy:0,halfWidth:9000,halfHeight:14000,
  y:3238000,x:gate+13000};
const common={runToken:'real-geometry-lifetime',lifecycle:'running',
  worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,
  hazards:[],pickups:[],projectiles:[]};
function old(){
  return {...common,floor:8,theme:'clockwork',tick:450,
    guardianExitX:gate,platforms:[cap],
    enemies:[{id:'f8:guardian',kind:'guardian',floor:8,active:false,
      health:0,x:235000,y:3250000,halfHeight:18000}],
    player:{...body,groundedPlatformId:'f8:cap'}};
}
function next(){
  return {...common,floor:9,theme:'void',tick:451,
    platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,
      width:480000,height:cap.height}],
    enemies:[],player:{...body,groundedPlatformId:'f9:ground'}};
}
test('late immutable HP-zero crossing reveals only the actually supported beyond-cap roof, not a HUD jump or invented guardian win',async()=>{
  const {observedLateImmutableFarRoofDeparture,
    sourceOwnedOriginalArchitectureCoverage}=await import(uri('source-physical-arrival-palette.mjs'));
  const after=next(),before=old();
  const groundedFar={...after,tick:467,
    player:{...after.player,x:gate+160000},
    lastGuardianCrossing:{
      runToken:after.runToken,sourceTick:451,fromFloor:8,toFloor:9,
      cap:before.platforms[0],exitX:gate,crossingX:gate+13000,
      halfWidth:body.halfWidth,halfHeight:body.halfHeight,
      guardian:before.enemies[0]}};
  const held={runToken:after.runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:cap.y+cap.height,
    thresholdX:gate,sourceTick:460,firstWorldRenderTick:460,
    crossingTick:null,submittedFrames:4,visibleSeconds:.2,
    originalGatewayOpacity:1,originalArchitectureCoverage:1,
    originalGalleryMaterials:[],originalDeckSurface:{opacity:1},
    opticalExitSubmitted:false};
  assert.equal(observedLateImmutableFarRoofDeparture(
    groundedFar,held,after.platforms[0]),true);
  const firstCoverage=sourceOwnedOriginalArchitectureCoverage(groundedFar,held);
  const laterCoverage=sourceOwnedOriginalArchitectureCoverage(groundedFar,{
    ...held,submittedFrames:9,visibleSeconds:1.25});
  assert.ok(firstCoverage>0 && firstCoverage<1,
    'cold one-to-four-return F9 cannot remove the entire bronze room in one hard native frame');
  assert.ok(laterCoverage>=0 && laterCoverage<firstCoverage,
    'real subsequent GPU returns permit the far roof to gradually expose the existing Void shaft');
  const invalid=[
    {...groundedFar,lastGuardianCrossing:null},
    {...groundedFar,lastGuardianCrossing:{
      ...groundedFar.lastGuardianCrossing,runToken:'foreign'}},
    {...groundedFar,lastGuardianCrossing:{
      ...groundedFar.lastGuardianCrossing,
      guardian:{...before.enemies[0],active:true,health:1}}},
    {...groundedFar,player:{...groundedFar.player,grounded:false}},
    {...groundedFar,player:{...groundedFar.player,
      groundedPlatformId:'f9:imaginary'}},
    {...groundedFar,player:{...groundedFar.player,x:gate+30000}},
    {...groundedFar,runToken:'foreign'}
  ];
  for(const fake of invalid){
    assert.equal(observedLateImmutableFarRoofDeparture(
      fake,held,after.platforms[0]),false,
      'only genuine far supported same-run zero-HP passage earns this optical release');
    assert.equal(sourceOwnedOriginalArchitectureCoverage(fake,held),fake.runToken==='foreign'?0:1,
      'an unearned far passage cannot erase original architecture through this late witness');
  }
});

test('first earned F9 WebGL room shares a genuinely far-side Void structural bearing with the original HP-open bronze gateway',async()=>{
  const [{createTowerWorld,sourceEarnedFarSideButtressIndex}]=await loaded;
  const source=old(),arrival=next(),world=createTowerWorld();
  const unchanged=JSON.stringify([source,arrival]);
  try{
    assert.equal(sourceEarnedFarSideButtressIndex((gate/480000-.5)*2.2,
      [{a:-.66,r:16.8,R:4.9,bottom:-31,top:52},
        {a:.67,r:16.65,R:5.25,bottom:-35,top:42}]),0);
    assert.equal(sourceEarnedFarSideButtressIndex(0,
      [{a:-.66,r:16.8,R:4.9,bottom:-31,top:52},
        {a:.67,r:16.65,R:5.25,bottom:-35,top:42}]),null,
      'do not stage an unsafe near-side pylon without angular clearance');
    world.update(source,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(source,arrival),true);
    world.update(arrival,.05,.05,{quality:'low'});
    const first=world.group.getObjectByName('SourceEarnedFirstFrameFarSideVoidButtress');
    assert.ok(first?.isGroup,'source-earned first F9 room now contains the far original successor bearing');
    // All original static meshes are correctly rigid-batched into the SAME
    // retained source-earned frame (outside the emptied authoring group).
    // Verify REAL shipped triangles by immutable mesh provenance, not stale
    // pre-batch names or the existence of a decorative empty Group.
    let authoredFirstFrameSteel=false;
    world.group.getObjectByName('SourceEarnedVoidLandingBearingFrame').traverse(object=>{
      for(const owner of object.geometry?.userData?.originalTriangleOwners??[])
        if(owner.authoringPath?.includes('SourceEarnedFirstFrameFarSideVoidButtress') &&
           owner.authoringPath?.includes('VoidOpenButtressRearPiersAndFrontStanchions'))
          authoredFirstFrameSteel=true;
    });
    assert.ok(authoredFirstFrameSteel,
      'the first-F9 GPU room includes actual far-side source-owned batched pylon triangles');
    assert.ok(world.group.getObjectByName('AuthoritativeGuardianGate')?.isGroup,
      'the same genuine HP-open old guardian doorway remains co-owned');
    assert.ok(world.group.getObjectByName('platform:f9:ground')?.isGroup,
      'actual Floor9 landing physics/rendered geometry is never deferred');
    const cold=world.diagnostics().sourceEarnedFirstReturnInstancing;
    assert.ok(cold.preservedOriginalInstanceDraws>0 && cold.preservedOriginalInstanceDraws<=8,
      'the source-earned real wide landing uses actual retained original Three instancing, not a policy-only no-op');
    assert.ok(cold.estimatedAvoidedPackedBytes>=cold.preservedOriginalInstanceDraws*16384,
      'the source-qualified first returned frame avoids real repeated CPU vertex packing');
    assert.ok(cold.existingSourceAndMatricesBytes<cold.packedBatchBytesIfExpanded,
      'original source attribute and instance matrices are cheaper than expanding vertices');
    assert.equal(world.group.getObjectByName('deferred-original-floor-nine-architecture'),undefined,
      'the expensive noninteractive shell is still absent before the first returned frame');
    assert.equal(world.diagnostics().deferredDistantArrival.actualFirstFrameVoidBearingIndex,0);
    world.noteFrameSubmitted(arrival,{quality:'low'},.05);
    world.update(arrival,.05,.1,{quality:'low'});
    assert.ok(world.group.getObjectByName('deferred-original-floor-nine-architecture')?.isGroup,
      'only a returned actual F9 submission begins construction of other masses');
    assert.equal(world.group.getObjectByName('SourceEarnedFirstFrameFarSideVoidButtress')===first,true,
      'original far bearing is not rebuilt or replaced during deferred uploads');
    assert.equal(JSON.stringify([source,arrival]),unchanged,
      'no scene transition is permitted to alter authoritative source snapshots');
  }finally{world.dispose();}
});

test('one real returned Floor8 renderer frame prepares bounded original gallery BEFORE the cold Floor9 rebuild and transfers exact same-owned geometry',async()=>{
  const [{createTowerWorld}]=await loaded;
  const first=old(),second=next(),world=createTowerWorld();
  try{
    world.update(first,.05,0,{quality:'low'});
    assert.equal(world.diagnostics().originalClockworkGalleryPrebuild.stillOwnedByPrebuild,false);
    // This is the only original 3D source submission; no future-floor
    // snapshot or synthetic victory/frame is fabricated.
    world.noteFrameSubmitted(first,{quality:'low'},.05);
    const pre=world.diagnostics().originalClockworkGalleryPrebuild;
    assert.equal(pre.state,'prepared-after-real-floor-eight-frame');
    assert.ok(pre.faces>0 && pre.faces<=4096);
    assert.ok(pre.batches>0 && pre.batches<=10);
    assert.equal(pre.bytes,pre.faces*96);
    assert.equal(pre.stillOwnedByPrebuild,true);
    world.noteFrameSubmitted(first,{quality:'low'},.05);
    assert.equal(world.diagnostics().originalClockworkGalleryPrebuild.sourceTick,450,
      'duplicate authentic F8 submissions may not rescan or allocate a second cache');
    assert.equal(world.stageGroundedCapContinuation(first,second),true);
    world.update(second,.05,.05,{quality:'low'});
    const carried=world.diagnostics();
    assert.equal(carried.originalClockworkGalleryPrebuild.state,
      'reused-on-real-floor-nine-rebuild');
    assert.equal(carried.originalClockworkGalleryPrebuild.stillOwnedByPrebuild,false,
      'source cache ownership moves to the SAME original bronze gate cap');
    assert.equal(carried.retainedSourceCap.originalGalleryTriangles,pre.faces);
    assert.equal(carried.retainedSourceCap.originalGalleryBytes,pre.bytes);
    assert.ok(world.group.getObjectByName('OriginalSourceClockworkThresholdGallery')?.isGroup);
  }finally{world.dispose();}
});
test('prepared old gateway gallery is discarded on changed run or invalid source, never attached as a ghost victory',async()=>{
  const [{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const original=old();
    world.update(original,.05,0,{quality:'low'});
    world.noteFrameSubmitted(original,{quality:'low'},.05);
    assert.equal(world.diagnostics().originalClockworkGalleryPrebuild.stillOwnedByPrebuild,true);
    world.update({...original,runToken:'new-run',tick:1,
      player:{...original.player}},.05,.1,{quality:'low'});
    assert.equal(world.diagnostics().originalClockworkGalleryPrebuild.stillOwnedByPrebuild,false,
      'new-run floor rebuild releases the old unsubmitted CPU resources');
    const after={...next(),runToken:'new-run'};
    world.update(after,.05,.15,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap,null);
    assert.equal(world.diagnostics().originalClockworkGalleryPrebuild.stillOwnedByPrebuild,false);
  }finally{world.dispose();}
});
test('same earned doorway retains the ORIGINAL old cap real geometry over the Floor9 render rebuild then disposes it',async()=>{
  const [{createTowerWorld},{observedGroundedGuardianHandoff}]=await loaded;
  const first=old(),second=next();
  assert.equal(observedGroundedGuardianHandoff(first,second),true);
  const original=JSON.stringify([first,second]);
  const world=createTowerWorld();
  try{
    resourceCheckpoint('first-test-start');
    world.update(first,.05,0,{quality:'low'});
    resourceCheckpoint('first-clockwork-rebuild');
    const genuine=world.group.getObjectByName('platform:f8:cap');
    assert.ok(genuine && genuine.isGroup,'original rendered source cap is present');
    const originalGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const originalDoor=world.group.getObjectByName('GuardianGateInset');
    assert.ok(originalGate?.isGroup && originalDoor?.isGroup,
      'genuine clockwork guardian gate is its own separate rendered world subtree');
    assert.equal(originalDoor.parent,originalGate,
      'walkable cap alone does NOT include the old physical guardian gateway');
    assert.equal(world.stageGroundedCapContinuation(first,second),true);
    world.update(second,.05,.05,{quality:'low'});
    resourceCheckpoint('first-void-rebuild');
    assert.equal(world.group.getObjectByName('platform:f8:cap')===genuine,true,
      'the already-rendered original meshes must survive, not synthetic replacement');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalGate,true,
      'the ORIGINAL opened guardian doorway must survive the Floor9 rebuild alongside the old deck');
    assert.equal(world.group.getObjectByName('GuardianGateInset')===originalDoor,true,
      'must retain the real HP-driven bronze grille and not substitute decorative inlays');
    // The cold Floor9 rehydrate path MUST reproduce the same real lifted
    // source-open gate pose as the hot Floor8 guardian victory. A historical
    // stage that silently lowers both leaves into the hero's helmet path
    // fails native passage even if the original gateway object survives.
    const coldLeft=world.group.getObjectByName('GuardianSealWingLeft');
    const coldRight=world.group.getObjectByName('GuardianSealWingRight');
    assert.ok(coldLeft?.position.y > 5.5 && coldRight?.position.y > 5.5,
      'actual retained old bronze leaves hoist out of the true Floor9 skinned-body corridor');

    assert.equal(originalGate.parent?.name,'ObservedGroundedCapGatewayContinuity',
      'old rendered cap and gate share one bounded historical transform');
    const retention=world.diagnostics().retainedSourceCap;
    assert.equal(retention.floor,9);
    assert.equal(retention.guardianGateRetained,true,
      'diagnostics expose actual old guardian doorway retention, not just a cosmetic deck');
    // The original filmed hard cut is a WORLD continuity defect, not just
    // the earlier missing-gate/timer problem. The source-owned original
    // structural triangles must now survive in a strictly bounded region,
    // with their original roof/door and no duplicate Floor8 gameplay actors.
    const gallery=world.group.getObjectByName('OriginalSourceClockworkThresholdGallery');
    assert.ok(gallery?.isGroup && gallery.children.length>0,
      'a real bounded fragment of original Floor8 architecture survives with its gate');
    assert.ok(retention.originalGalleryTriangles>0 && retention.originalGalleryTriangles<=4096);
    assert.ok(retention.originalGalleryBatches<=10);
    assert.equal(retention.originalGalleryBytes,retention.originalGalleryTriangles*96);
    assert.ok(gallery.children.every(mesh=>mesh.material?.name==='OriginalClockworkGallerySourceSurface' &&
      mesh.castShadow===false && mesh.receiveShadow===false));
    assert.equal(retention.submittedFrames,0);
    assert.ok(retention.geometryCount>0&&retention.materialCount>0);
    // The original warm cap is physically coplanar with Floor9 ground.
    // Merely retaining its geometry still allows the new opaque violet
    // deck to bury the bronze route in the REAL renderer. Require the
    // existing OLD cap surface to remain front-depth-tested and fade by
    // actual successfully submitted display frames, not source/HTTP ticks.
    const bronzeDeck=genuine.children.filter(o=>o.isMesh &&
      o.material?.name==='SourceEarnedOriginalClockworkDeck');
    assert.ok(bronzeDeck.length>0,
      'actual old cap landing geometry gets an independent retained deck surface');
    const originalCover=bronzeDeck[0].material;
    assert.ok(bronzeDeck.every(o=>o.material===originalCover &&
      o.renderOrder>0),'the retained real deck, not a fake cover, is drawn last');
    assert.equal(originalCover.depthTest,true,'real characters/obstacles still occlude it');
    assert.equal(originalCover.depthWrite,false,'do not occlude the genuine Floor9 route');
    assert.equal(originalCover.polygonOffset,true,'coplanar actual Floor9 floor cannot bury the original route');
    assert.ok(originalCover.opacity>.8);
    assert.ok(retention.originalBronzeDeckMeshes>0);
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'the REAL new source ground must render immediately');
    // Check the same stalled-WebGL source clock at several elapsed boundaries
    // rather than rebuilding identical scene observations 15 times. No source
    // step or successful renderer submission may be invented by the test.
    for(const elapsed of [.1,.35,.75,1.5])
      world.update(second,.1,elapsed,{quality:'low'});
    resourceCheckpoint('pre-first-return-stalled-boundaries');
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'unsubmitted GPU frames cannot consume old world continuity');
    world.noteFrameSubmitted(second,{},.1);
    const firstShownOpacity=originalCover.opacity;
    // The returned WebGL frame is unique: additional observed source updates
    // across several seconds must leave its recorded opacity/time unchanged.
    for(const elapsed of [2,2.75,3.9])
      world.update(second,.1,elapsed,{quality:'low'});
    resourceCheckpoint('post-first-return-stalled-boundaries');
    assert.equal(originalCover.opacity,firstShownOpacity,
      'twenty stalled/unsubmitted updates CANNOT consume the old bronze shot');
    assert.equal(world.diagnostics().retainedSourceCap?.visibleSeconds,.1,
      'the original gateway clock advances only on actually drawn frames');
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'real cap survives the first successful new-floor renderer submission');
    for(let i=0;i<5;i++){
      world.noteFrameSubmitted(second,{},.1);
      world.update(second,.1,4+i*.1,{quality:'low'});
    }
    resourceCheckpoint('six-real-submissions');
    assert.ok(originalCover.opacity>=.9 && originalCover.opacity<=.94,
      'source-stationary full-body at the actual original sill cannot fade away merely because renderer frames returned');
    for(let i=0;i<14;i++){
      world.noteFrameSubmitted(second,{},.1);
      world.update(second,.1,6+i*.1,{quality:'low'});
    }
    resourceCheckpoint('twenty-real-submissions');
    // This static standing-source fixture has NOT physically departed the
    // threshold. The real GPU arch must still exist after twenty submissions,
    // even though an obsolete 1.65-second cleanup test expected early removal.
    // A failed equality on a THREE.Group recursively formats thousands of
    // cyclic meshes and can stall the entire hosted runner: compare booleans.
    assert.equal(world.group.getObjectByName('platform:f8:cap')===genuine,true,
      'a source-stationary body cannot retire the old gateway at two seconds');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalGate,true,
      'retain the same original, not a replacement doorway');
    assert.equal(world.diagnostics().retainedSourceCap?.submittedFrames,20);
    // Exercise the actual finite 30-return / 2.8-second GPU resource
    // backstop, not an invented player departure or an unsubmitted frame.
    // This protects resource bounds; forced retirement is NOT film approval.
    for(let i=0;i<10;i++){
      world.noteFrameSubmitted(second,{},.1);
      world.update(second,.1,8+i*.1,{quality:'low'});
    }
    resourceCheckpoint('thirty-real-submissions');
    resourceCheckpoint('final-retirement-assertions-begin');
    assert.equal(world.group.getObjectByName('platform:f8:cap')===undefined,true,
      'bounded original roof must retire after the published 30-return limit');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===undefined,true,
      'same original unlocked gate and its GPU resources retire with the roof');
    assert.equal(world.diagnostics().retainedSourceCap,null);
    assert.equal(world.group.getObjectByName('OriginalSourceClockworkThresholdGallery')===undefined,true,
      'owned source gallery resources retire with the cap');
    assert.equal(JSON.stringify([first,second]),original,
      'the old/new authoritative source must be immutable');
    resourceCheckpoint('final-retirement-assertions-end');
  }finally{resourceCheckpoint('first-test-dispose-begin');world.dispose();resourceCheckpoint('first-test-dispose-end');}
});
test('unearned, stale, wrong-run or geometry-mismatched cap never attaches old world',async()=>{
  const [{createTowerWorld}]=await loaded;
  for(const mutate of [
    ([a,b])=>{b.runToken='different';},
    ([a,b])=>{b.floor=10;},
    ([a,b])=>{b.player.grounded=false;},
    ([a,b])=>{b.platforms[0].y+=1000;},
    ([a,b])=>{a.platforms[0].width-=1000;},
  ]){
    const world=createTowerWorld();
    try{
      const previous=old(),after=next();world.update(previous,.05,0,{quality:'low'});
      const proof=structuredClone(previous);mutate([proof,after]);
      assert.equal(world.stageGroundedCapContinuation(proof,after),false);
      world.update(after,.05,.05,{quality:'low'});
      assert.equal(world.diagnostics().retainedSourceCap,null);
      assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===undefined,true,
        'no fake unlocked old door may attach on wrong-run or unearned transitions');
    }finally{world.dispose();}
  }
});
test('original cap is bounded to source run, grounded continuation and real restart',async()=>{
  const [{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    world.update(old(),.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(old(),next()),true);
    world.update(next(),.05,0,{quality:'low'});
    assert.ok(world.diagnostics().retainedSourceCap);
    const airborne={...next(),tick:452,
      player:{...next().player,x:gate+20000,y:body.y+8000,
        grounded:false,groundedPlatformId:null,state:'airborne',vy:12000}};
    world.noteFrameSubmitted(next());
    world.update(airborne,.05,.05,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true,
      'the first legitimate nearby Floor9 jump retains the real open gateway');
    const far={...airborne,tick:460,
      player:{...airborne.player,x:gate+150000}};
    world.update(far,.05,.1,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap,null,
      'the old GPU world retires when the actor truly leaves the gate vicinity');
  }finally{world.dispose();}
});

test('an unseen grounded crossing followed immediately by a real first-floor-nine jump retains the ORIGINAL gateway GPU meshes',async()=>{
  const [{createTowerWorld},{observedRecordedGuardianAirborneHandoff,
    observedSourceEarnedAirborneHandoff}]=await loaded;
  const prior=old(),newFloor=next();
  const witness={runToken:prior.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    worldWidth:prior.worldWidth,cap,exitX:gate,
    guardian:prior.enemies[0],previousX:prior.player.x,
    previousY:prior.player.y,previousHealth:prior.player.health,
    crossingX:prior.player.x,crossingY:prior.player.y,
    halfWidth:prior.player.halfWidth,halfHeight:prior.player.halfHeight};
  const after={...newFloor,tick:453,lastGuardianCrossing:witness,
    player:{...newFloor.player,x:prior.player.x+7200,y:prior.player.y+8000,
      grounded:false,groundedPlatformId:null,state:'airborne',vy:12000}};
  const proof=observedRecordedGuardianAirborneHandoff(after);
  assert.ok(proof);
  assert.equal(observedSourceEarnedAirborneHandoff(proof,after),true);
  const world=createTowerWorld();
  try{
    world.update(prior,.05,0,{quality:'low'});
    const actualOldGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    assert.ok(actualOldGate?.isGroup);
    assert.equal(world.stageGroundedCapContinuation(proof,after),true,
      'the real first airborne step after the grounded source crossing keeps the original door');
    world.update(after,.05,.05,{quality:'low'});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===actualOldGate,true);
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true);
    // The original cold gate remains source-proven for up to 48 ticks
    // even if the GPU has not submitted a successor frame. Check both
    // sides of that immutable authority bound, not an obsolete 24-tick
    // presentation-only launch window.
    const within={...after,tick:478};
    world.update(within,.05,.1,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true,
      'the original door is still valid inside the authenticated cold 48-tick window');
    // A previously published 48-tick camera handoff is not the current
    // 70-tick source-owned optical lifetime. The original arch remains
    // genuine while the SAME authenticated new-floor climber stays nearby.
    const withinBound={...after,tick:500};
    world.update(withinBound,.05,.15,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true,
      'the source-backed original arch remains eligible inside its 70-tick bound');
    const outside={...after,tick:525};
    world.update(outside,.05,.20,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap,null,
      'the old GPU owner must retire past 70 authoritative ticks even without returned frames');
  }finally{world.dispose();}
});

test('source-witnessed cold Floor9 keeps distant scenery off the FIRST real frame even if browser last saw a LIVING guardian',async()=>{
  const [{createTowerWorld}]=await loaded;
  const observed=old();observed.tick=443;
  observed.enemies=observed.enemies.map(enemy=>({...enemy,health:1,active:true}));
  const sourceDefeat=old(); // Immutable 20Hz trace still proves the real defeated cap.
  const newFloor=next();newFloor.tick=460; // WebGL can skip tick451's actual crossing.
  const world=createTowerWorld();
  try{
    world.update(observed,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(sourceDefeat,newFloor),true,
      'exact source defeat and same-roof crossing may be proven despite an older browser packet');
    world.update(newFloor,.05,.05,{quality:'low'});
    assert.ok(world.group.getObjectByName('AuthoritativeGuardianGate'),
      'retain actual previously drawn opened bronze doorway');
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'the genuine successor roof must never be deferred');
    assert.equal(world.diagnostics().vistaLayers,0,
      'cold noninteractive canyon must not upload before first real floor render');
    const pending=world.diagnostics().deferredDistantArrival;
    assert.equal(pending?.state,'awaiting-actual-first-render',
      'the trusted source proof must authorize deferred distant scenery, not old browser guardian state');
    assert.equal(pending?.structureDeferred,true,
      'only the source-proven Floor 8 guardian exit defers the noninteractive structural shell');
    assert.equal(world.group.getObjectByName('deferred-original-floor-nine-architecture')===undefined,true,
      'the first playable frame must not upload the heavyweight new tower shaft');
    world.noteFrameSubmitted(newFloor,{},.05);
    world.update(newFloor,.05,.1,{quality:'low'});
    const shaft=world.group.getObjectByName('deferred-original-floor-nine-architecture');
    assert.ok(shaft,
      'the original new-floor architecture returns only after the first genuine render');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-void-biome-build',
      'first successful renderer return constructs only authentic load-bearing shell; Void detail awaits ANOTHER returned frame');
    assert.equal(shaft.visible,false,'noninteractive structural root remains completely culled');
    for(let i=0;i<12;i++)world.update(newFloor,.05,.1+i*.05,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-void-biome-build',
      'twelve unsubmitted RAF updates cannot finish CPU construction or spend a GPU receipt');
    world.noteFrameSubmitted(newFloor,{},.05);
    world.update(newFloor,.05,.15,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-void-biome-build',
      'second actual return builds original exterior buttresses without crystal detail');
    assert.ok(shaft.getObjectByName('deferred-original-floor-nine-outer-buttresses')?.isGroup);
    world.noteFrameSubmitted(newFloor,{},.05);
    world.update(newFloor,.05,.2,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-release',
      'third actual return constructs and isolates the original animated biome');
    const shellMaterials=[];
    shaft.traverse(o=>{
      if(o.isMesh && o.material?.name==='SourceEarnedIncomingFloorNineShaft')
        shellMaterials.push(o.material);
    });
    assert.ok(shellMaterials.length>0,'deferred shell isolates actual shaft materials');
    assert.ok(shellMaterials.every(m=>m.transparent && !m.depthWrite && m.opacity===0),
      'original violet structure cannot pop in as an opaque new-world slab');
    assert.equal(world.diagnostics().deferredDistantArrival?.structuralFade,0);
    for(let i=0;i<12;i++)world.update(newFloor,.05,.1+i*.05,{quality:'low'});
    assert.ok(shellMaterials.every(m=>m.opacity===0),
      'unsubmitted RAF frames cannot reveal the entire new shell behind the old gate');
    assert.equal(world.diagnostics().vistaLayers,0,
      'canyon upload must not share the structural shaft submission');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-release');
    world.noteFrameSubmitted(newFloor,{},.05);
    world.update(newFloor,.05,.15,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.structuralFade,0,
      'real WebGL returns alone cannot invent the climber leaving the intact original gateway');
    assert.ok(shellMaterials.every(m=>m.opacity===0),
      'real prebuilt shaft must stay invisible beneath a stationary full-opacity source gate');
    assert.equal(world.diagnostics().vistaLayers,0,
      'no heavyweight panorama may upload before original source doorway departure');
    // The source, not an unobserved elapsed-time cue, now records the actual
    // body clearing the sill and the immutable defeated-guardian crossing.
    const gateX=sourceDefeat.guardianExitX;
    const departed={...newFloor,tick:467,lastGuardianCrossing:{
      runToken:sourceDefeat.runToken,sourceTick:451,fromFloor:8,toFloor:9,
      cap:sourceDefeat.platforms[0],exitX:gateX,
      crossingX:gateX+13000,halfWidth:body.halfWidth,
      halfHeight:body.halfHeight,
      guardian:sourceDefeat.enemies[0]},
      player:{...newFloor.player,x:gateX+160000}};
    world.update(departed,.05,.2,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-submission',
      'actual source departure releases the PREBUILT, hidden shaft without a second cold build');
    world.noteFrameSubmitted(departed,{},.05);
    world.update(departed,.05,.25,{quality:'low'});
    assert.ok(world.diagnostics().deferredDistantArrival.structuralFade>0,
      'a genuine successfully returned new-world render begins the material reveal');
    assert.ok(shellMaterials.every(m=>m.opacity>0 && m.opacity<1));
    assert.equal(world.diagnostics().vistaLayers,0,
      'canyon panorama must remain delayed until the real shaft is substantially present');
    for(let i=0;i<6;i++){
      world.noteFrameSubmitted(departed,{},.05);
      world.update(departed,.05,.3+i*.05,{quality:'low'});
    }
    assert.ok(world.diagnostics().deferredDistantArrival.structuralFade>=.35);
    assert.equal(world.diagnostics().vistaLayers,3,
      'source-owned original vista uploads after the already-present Void shaft actually becomes visible');
    world.noteFrameSubmitted(departed,{},.05);
    world.update(departed,.05,.7,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'fading-remote-arrival',
      'distant original architecture remains a separate returned-frame upload stage');
  }finally{world.dispose();}
});

test('no proven passage cannot postpone the successor world on an unrelated old source frame',async()=>{
  const [{createTowerWorld}]=await loaded;
  const observed=old();observed.tick=443;
  observed.enemies=observed.enemies.map(enemy=>({...enemy,health:1,active:true}));
  const unrelated=next();unrelated.tick=460;
  const world=createTowerWorld();
  try {
    world.update(observed,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(observed,unrelated),false);
    world.update(unrelated,.05,.05,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival,null,
      'no forged earned crossing may receive a source-authorized cold upload schedule');
    assert.equal(world.diagnostics().vistaLayers,3,
      'regular unrelated floor changes retain their existing immediate original art');
  } finally {world.dispose();}
});

test('source-owned visual gateway and original real cap survive first authentic airborne frames, never wrong-run or aged source',async()=>{
  const [{createTowerWorld}]=await loaded;
  const before=old(),after=next();
  const witness={sourceBound:true,active:true,stage:'handoff',
    continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
    exteriorMemoryFrameVisible:false,runToken:after.runToken,
    floor:9,sourceTick:451,handoffSubmittedFrames:1,
    handoffDisplaySeconds:.4,handoffVisibleWindowSeconds:1.65};
  const flying={...after,tick:471,
    player:{...after.player,x:gate+30000,y:after.player.y+80000,
      grounded:false,groundedPlatformId:null,state:'airborne',vy:12000}};
  const world=createTowerWorld();
  try{
    world.update(before,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(before,after),true);
    world.update(after,.05,.05,{quality:'low'},witness);
    const original=world.group.getObjectByName('AuthoritativeGuardianGate');
    assert.ok(original?.isGroup);
    world.noteFrameSubmitted(after);
    world.update(flying,.1,.15,{quality:'low'},witness);
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===original,true,
      'source earned old gateway cannot vanish while same physical doorway remains in first submitted airborne view');
    assert.equal(world.diagnostics().retainedSourceCap?.sourceAlignedPassage,true);
    world.update({...flying,tick:500},.1,.25,{quality:'low'},witness);
    assert.equal(world.diagnostics().retainedSourceCap,null,
      'a stale source tick cannot perpetuate old architecture');
  }finally{world.dispose();}
  const other=createTowerWorld();
  try{
    other.update(before,.05,0,{quality:'low'});
    assert.equal(other.stageGroundedCapContinuation(before,after),true);
    other.update(after,.05,.05,{quality:'low'},witness);
    other.noteFrameSubmitted(after);
    other.update(flying,.1,.15,{quality:'low'}, {...witness,runToken:'foreign'});
    assert.equal(other.diagnostics().retainedSourceCap,null,
      'a wrong-run visual passage cannot borrow authenticated old world geometry');
  }finally{other.dispose();}
});


test('real old bronze arch and cap remain the SAME GPU objects when source advances before first Floor9 world render',async()=>{
  const [{createTowerWorld}]=await loaded;
  const previous=old(),first=next();
  first.lastGuardianCrossing={
    runToken:previous.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    worldWidth:previous.worldWidth,cap,exitX:gate,
    crossingX:first.player.x,crossingY:first.player.y,
    halfWidth:first.player.halfWidth,halfHeight:first.player.halfHeight,
    guardian:previous.enemies[0],
  };
  const later={...first,tick:460,player:{...first.player,x:gate+19000}};
  const frozen=JSON.stringify([previous,first,later]);
  const world=createTowerWorld();
  try{
    resourceCheckpoint('late-original-before-world-build');
    world.update(previous,.05,0,{quality:'low'});
    resourceCheckpoint('late-original-after-world-build');
    const originalGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const originalCap=world.group.getObjectByName('platform:f8:cap');
    assert.ok(originalGate?.isGroup && originalCap?.isGroup);
    assert.equal(world.stageGroundedCapContinuation(previous,first),true);
    resourceCheckpoint('late-original-after-source-stage');
    resourceCheckpoint('late-original-before-first-delayed-successor');
    world.update(later,.05,.05,{quality:'low'});
    resourceCheckpoint('late-original-after-first-delayed-successor');
    // Giant Three scene graphs have recursive parent links: compare GPU
    // identity as booleans so a *failing* identity assertion produces a
    // useful TAP failure, rather than spending the runner's deadline
    // formatting an enormous actual/expected hierarchy.
    resourceCheckpoint('late-original-before-gpu-identity-lookup');
    const survivingGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const survivingCap=world.group.getObjectByName('platform:f8:cap');
    resourceCheckpoint('late-original-after-gpu-identity-lookup');
    assert.equal(survivingGate === originalGate,true,
      'late first source frame must attach same original GPU gateway');
    assert.equal(survivingCap === originalCap,true,
      'original roof is retained, not an invented replacement');
    resourceCheckpoint('late-original-after-identity-assertions');
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'authentic next-floor walkable platform must not be deferred');
    const diag=world.diagnostics();
    assert.equal(diag.retainedSourceCap?.firstObservedTick,451);
    assert.equal(diag.retainedSourceCap?.firstWorldRenderTick,460);
    assert.equal(diag.retainedSourceCap?.pendingSourceTickGap,9);
    assert.equal(diag.deferredDistantArrival?.structureDeferred,true,
      'noninteractive opaque shell should not occlude original crossing in first actual frame');
    assert.equal(JSON.stringify([previous,first,later]),frozen);
    resourceCheckpoint('late-original-after-assertions');
  }finally{resourceCheckpoint('late-original-dispose-begin');world.dispose();resourceCheckpoint('late-original-dispose-end');}
});


test('three authentic crossing clocks preserve original doorway, warm horizon witness, and structural deferral after delayed first GPU render',async()=>{
  const [{createTowerWorld}]=await loaded;
  const oldFrame=old(), first=next();
  first.tick=454;
  // The actual immutable F9 snapshot carries a standing/zero-vy roof contact;
  // source-grounded fixture provides the same valid authoritative motion fields.
  first.player={...first.player,state:'standing',vy:0};
  const crossing={
    runToken:oldFrame.runToken,sourceTick:451,fromFloor:8,toFloor:9,
    cap,exitX:gate,crossingX:gate+13000,crossingY:body.y,
    halfWidth:body.halfWidth,halfHeight:body.halfHeight,
    guardian:oldFrame.enemies[0],
  };
  first.lastGuardianCrossing=crossing;
  const realFirstRender={...first,tick:460,player:{...first.player,x:gate+19000}};
  const frozen=JSON.stringify([oldFrame,first,realFirstRender]);
  const passage={sourceBound:true,active:true,stage:'handoff',
    continuousGroundedHandoff:true,innerDoorAssemblyVisible:true,
    exteriorMemoryFrameVisible:false,runToken:first.runToken,
    floor:9,sourceTick:454,handoffSubmittedFrames:0,
    handoffDisplaySeconds:0,handoffVisibleWindowSeconds:1.65};
  const {observedSourceEarnedColdFrameContinuation:cold,
    observedClockworkRoofContinuity:roof}=await import(uri('crossfloor-arrival.mjs'));
  const world=createTowerWorld();
  try{
    world.update(oldFrame,.05,0,{quality:'low'});
    const originalArch=world.group.getObjectByName('AuthoritativeGuardianGate');
    const originalRoof=world.group.getObjectByName('platform:f8:cap');
    assert.ok(originalArch && originalRoof);
    assert.equal(world.stageGroundedCapContinuation(oldFrame,first),true);
    resourceCheckpoint('three-clocks-before-real-cold-f9-world-update');
    world.update(realFirstRender,.05,.05,{quality:'low'},passage);
    resourceCheckpoint('three-clocks-after-real-cold-f9-world-update');
    const retained=world.diagnostics().retainedSourceCap;
    assert.ok(retained);
    assert.equal(retained.crossingTick,451,'recorded authoritative grounded contact');
    assert.equal(retained.sourceTick,454,'browser-accepted successor belongs to passage');
    assert.equal(retained.firstObservedTick,454);
    assert.equal(retained.firstWorldRenderTick,460,'real WebGL rebuild may lag browser');
    assert.equal(retained.pendingSourceTickGap,6);
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalArch,true,
      'original bronze gate GPU identity must survive; never format the gigantic Three.js graph');
    assert.equal(world.group.getObjectByName('platform:f8:cap')===originalRoof,true,
      'original physical cap GPU identity must survive without recursive diff formatting');
    const realSuccessorRoof=world.group.getObjectByName('platform:f9:ground');
    assert.equal(realSuccessorRoof?.isGroup,true);
    const sharedSurface=realSuccessorRoof.children.find(o=>o.isMesh &&
      o.material?.name==='SourceEarnedSharedPhysicalArrivalRoof');
    const oldSurface=originalRoof.children.find(o=>o.isMesh &&
      o.material?.name==='SourceEarnedOriginalClockworkDeck');
    assert.ok(sharedSurface && oldSurface,
      'one physical real F9 route must inherit old retained cap color, no proxy bridge');
    assert.ok(sharedSurface.material.color.equals(oldSurface.material.color),
      'the same walkable roof cannot begin its new-floor film as a violet hard cut');
    const firstGroundColor=sharedSurface.material.color.clone();
    const canonicalVoidColor=world.group.getObjectByName('platform:f9:ground')
      .children.find(o=>o.isMesh&&o.material?.name==='SourceEarnedSharedPhysicalArrivalRoof')
      .material.color.clone();
    const ownedSourceWitness=world.retainedFilmHandoff(realFirstRender);
    assert.ok(ownedSourceWitness,'retained world issues real source-bound roof witness');
    assert.equal(roof(realFirstRender,passage,ownedSourceWitness),true,
      'retained architecture must recognize the SAME passage observation');
    assert.ok(world.retainedFilmHandoff(realFirstRender),
      'warm horizon must receive original recorded HP-zero crossing clock');
    assert.equal(cold(realFirstRender,ownedSourceWitness),true);
    assert.equal(world.diagnostics().deferredDistantArrival?.structureDeferred,true);
    world.noteFrameSubmitted(realFirstRender,{},.05);
    const later={...realFirstRender,tick:461,
      player:{...realFirstRender.player,x:gate+29000}};
    world.update(later,.05,.1,{quality:'low'},
      {...passage,handoffSubmittedFrames:1,handoffDisplaySeconds:.05});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalArch,true,
      'original bronze gate GPU identity must survive; never format the gigantic Three.js graph');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,
      'awaiting-void-biome-build',
      'one source-cleared old-door return builds only original load-bearing structure, never a rushed whole-world alpha switch');
    world.noteFrameSubmitted(later,{},.05);
    world.update(later,.05,.15,{quality:'low'},
      {...passage,handoffSubmittedFrames:2,handoffDisplaySeconds:.10});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,
      'awaiting-void-biome-build',
      'second actual return finishes only the real outer load-bearing supports');
    assert.ok(world.group.getObjectByName('deferred-original-floor-nine-outer-buttresses')?.isGroup);
    world.noteFrameSubmitted(later,{},.05);
    world.update(later,.05,.2,{quality:'low'},
      {...passage,handoffSubmittedFrames:3,handoffDisplaySeconds:.15});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,
      'awaiting-structural-submission',
      'third actual return finishes original moving biome before source-certified aperture');
    const hiddenShaft=world.group.getObjectByName('deferred-original-floor-nine-architecture');
    assert.ok(hiddenShaft);
    const shaftOpacity=[];
    hiddenShaft.traverse(object=>{
      if(object.isMesh && object.material?.name==='SourceEarnedIncomingFloorNineShaft')
        shaftOpacity.push(object.material.opacity);
    });
    assert.ok(shaftOpacity.length>0 &&
      shaftOpacity.some(opacity=>opacity>0 && opacity<=.28) &&
      shaftOpacity.every(opacity=>opacity>=0 && opacity<=.28),
      'source-gated returned shell may reach 28% while original Void biome detail remains zero-alpha and unsent');
    const deferredDetail=hiddenShaft.getObjectByName('deferred-authentic-floor-nine-crystal-biome');
    assert.ok(deferredDetail?.isGroup && deferredDetail.visible===false,
      'authentic biome detail must not steal the first source-authenticated shell shot');
    const details=[];
    deferredDetail.traverse(mesh=>{if(mesh.isMesh && mesh.material?.name==='SourceEarnedIncomingFloorNineShaft') details.push(mesh.material.opacity);});
    assert.ok(details.length>0 && details.every(value=>value===0),
      'unreturned crystal details remain truly invisible, not a counterfeit already-painted room');
    assert.equal(world.diagnostics().vistaLayers,0);
    assert.ok(!sharedSurface.material.color.equals(firstGroundColor),
      'a genuine observed 10,000-unit step beyond the old sill, not WebGL wall-time, blends the real landing toward void');
    assert.equal(world.diagnostics().retainedSourceCap?.sharedPhysicalRoofColor,
      sharedSurface.material.color.getHexString());
    // The real-world compositor advances staged alpha from returned WebGL *time*,
    // not from a fictional count of zero-duration renders. This source-level
    // Three probe must submit the exact modeled 50ms clock on each return;
    // absent render duration is a valid zero-time no-fade case elsewhere.
    // Source-authenticated handoff can now stage restrained depth after one
    // real original-gateway return. Eight subsequent submissions are still
    // not permission to bury that original bronze threshold in opaque Void.
    resourceCheckpoint('three-clocks-before-8-real-return-loop');
    for(let step=3;step<=8;step++){
      resourceCheckpoint('three-clocks-return-'+step+'-begin');
      const frame={...later,tick:460+step};
      const witness={...passage,handoffSubmittedFrames:step,
        handoffDisplaySeconds:step*.05};
      world.noteFrameSubmitted(frame,{},.05);
      world.update(frame,.05,.1+step*.05,{quality:'low'},witness);
      resourceCheckpoint('three-clocks-return-'+step+'-end');
    }
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalArch,true,
      'original bronze gate GPU identity must survive; never format the gigantic Three.js graph');
    assert.ok(world.group.getObjectByName('deferred-original-floor-nine-architecture'),
      'the original Void structural meshes are prebuilt hidden after the authentic F9 render');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-submission',
      'eight matched source returns show the real F9 shaft without retiring the original gate');
    const earlyShaft=world.group.getObjectByName('deferred-original-floor-nine-architecture');
    const earlyOpacity=[];
    earlyShaft.traverse(o=>{
      if(o.isMesh && o.material?.name==='SourceEarnedIncomingFloorNineShaft')
        earlyOpacity.push(o.material.opacity);
    });
    assert.ok(earlyOpacity.length>0 && earlyOpacity.some(opacity=>opacity>0) &&
      earlyOpacity.every(opacity=>opacity>=0 && opacity<=.28),
      'without a raised/far-side real body, successive GPU returns cannot make the F9 shaft exceed its 28% scenic lease');
    // Authenticated far-side support must open the actual successor shaft
    // FIRST. The original gate cannot disappear while the shaft has yet
    // to contribute one successfully returned structural draw; the old
    // expectation here deleted the doorway before it could be painted
    // together with its genuine Floor9 destination. This is a synthetic
    // Three.js contract test, never evidence of actual native movie pixels.
    const departed={...later,tick:476,
      player:{...later.player,x:gate+160000}};
    resourceCheckpoint('three-clocks-far-departure-before');
    world.update(departed,.05,.8,{quality:'low'},passage);
    resourceCheckpoint('three-clocks-far-departure-after');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalArch,true,
      'far-side clearance alone must NOT erase the actual old bronze GPU gate before the incoming shaft returns a painted frame');
    const successorJob=world.diagnostics().deferredDistantArrival;
    assert.equal(successorJob?.state,'awaiting-structural-submission',
      'verified living departure should unlock the original incoming shaft, not keep it hidden indefinitely');
    assert.ok(world.group.getObjectByName('deferred-original-floor-nine-architecture'),
      'actual new-floor geometry must coexist with the original gate pending successful GPU submission');
    // The preceding eight real renderer returns HAVE already submitted the
    // first alpha-visible successor shaft on later steps. The old assertion
    // claimed there were ZERO shaft returns here and demanded bronze forever:
    // that incorrectly vetoed a source- and GPU-earned color retirement.
    // Keep the stronger causal guard: without an actual returned shaft the
    // original physical F9 roof must remain identical; with one, real source
    // departure may start its chromatic transition. Browser/native painted
    // pixels still require separate video-clock proof.
    const returnedShaftFrames=successorJob?.structuralVisibleReturns??0;
    assert.ok(Number.isSafeInteger(returnedShaftFrames) &&
      returnedShaftFrames>=0 && returnedShaftFrames<=successorJob.submittedFrames,
      'only actual post-draw shaft submissions can authorize optical retirement');
    if(returnedShaftFrames===0)
      assert.ok(sharedSurface.material.color.equals(firstGroundColor),
        'renderer-silent original room cannot recolor its walkable F9 roof');
    else
      assert.ok(!sharedSurface.material.color.equals(firstGroundColor),
        'genuine current far-side support after a returned visible shaft may blend the roof toward F9');
    assert.equal(JSON.stringify([oldFrame,first,realFirstRender]),frozen);
    assert.equal(cold({...realFirstRender,runToken:'other'},
      world.retainedFilmHandoff(realFirstRender)),false);
    assert.equal(cold({...realFirstRender,lastGuardianCrossing:{
      ...crossing,sourceTick:450}},world.retainedFilmHandoff(realFirstRender)),false);
  }finally{world.dispose();}
});


test('the ORIGINAL HP-controlled bronze gate straddles the physical increasing-X walkway, not a radial wall',async()=>{
  const [{createTowerWorld}]=await loaded;
  const {guardianTraversalGatePose,pointFor,GUARDIAN_CAP_CORRIDOR}
    =await import(uri('coordinates.mjs'));
  const THREE=await import('three');
  const before=old(),after=next();
  const expected=guardianTraversalGatePose(gate,
    cap.y+cap.height,before.chunkBaseY,before.worldWidth);
  assert.ok(expected,'real source exit has a physical-world pose');
  assert.equal(expected.radius,GUARDIAN_CAP_CORRIDOR.visibleSealRadius);
  const world=createTowerWorld();
  try{
    const immutable=JSON.stringify([before,after]);
    world.update(before,.05,0,{quality:'low'});
    const arch=world.group.getObjectByName('AuthoritativeGuardianGate');
    assert.ok(arch?.isGroup,'use the real originally modelled door');
    arch.updateWorldMatrix(true,true);
    const origin=arch.getWorldPosition(new THREE.Vector3());
    assert.ok(origin.distanceTo(new THREE.Vector3(
      expected.x,expected.y,expected.z))<1e-5,
      'the physical door is centered at the actual annular source exit');
    assert.ok(Math.abs(arch.rotation.y-expected.yaw)<1e-6,
      'the arch normal must follow travel tangent, not the radial world normal');
    // The true source x threshold must intersect the portal opening. This
    // is a spatial proof, NOT a fabricated passage event or visual score.
    const entry=pointFor(gate-12000,cap.y+cap.height,
      before.chunkBaseY,before.worldWidth,GUARDIAN_CAP_CORRIDOR.climberPathRadius);
    const exit=pointFor(gate+12000,cap.y+cap.height,
      before.chunkBaseY,before.worldWidth,GUARDIAN_CAP_CORRIDOR.climberPathRadius);
    const insideBefore=arch.worldToLocal(new THREE.Vector3(entry.x,entry.y,entry.z));
    const insideAfter=arch.worldToLocal(new THREE.Vector3(exit.x,exit.y,exit.z));
    assert.ok(insideBefore.z<-.3&&insideAfter.z>.3,
      'real forward movement must cross the original bronze leaf plane');
    assert.ok(Math.max(Math.abs(insideBefore.x),Math.abs(insideAfter.x))<3.0,
      'the avatar corridor passes between actual bronze doorway piers');
    // The source-earned floor progression retains the exact original GPU
    // arch and the same crossing plane; it never synthesizes a replacement.
    assert.equal(world.stageGroundedCapContinuation(before,after),true);
    world.update(after,.05,.05,{quality:'low'});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===arch,true);
    arch.updateWorldMatrix(true,true);
    assert.ok(Math.abs(arch.rotation.y-expected.yaw)<1e-6);
    assert.equal(JSON.stringify([before,after]),immutable);
  }finally{world.dispose();}
});
test('cross-route gateway pose fails closed on invalid source geography',async()=>{
  const {guardianTraversalGatePose}=await import(uri('coordinates.mjs'));
  for(const data of [
    [NaN,3236000,2880000,480000],
    [-1,3236000,2880000,480000],
    [480001,3236000,2880000,480000],
    [300000,3236000,2880000,0],
    [300000,Infinity,2880000,480000],
  ]) assert.equal(guardianTraversalGatePose(...data),null);
});

test('real Three Floor8 original cap and bronze doorway survive a LATE HP-zero record after genuine browser successor',async()=>{
 const [{createTowerWorld}]=await loaded;
 const before=old(),after=next();
 const crossing={runToken:before.runToken,sourceTick:451,fromFloor:8,toFloor:9,
  cap:{...cap},exitX:gate,crossingX:gate+13000,
  crossingY:after.player.y,halfWidth:after.player.halfWidth,
  halfHeight:after.player.halfHeight,
  guardian:{kind:'guardian',floor:8,active:false,health:0}};
 const late={...after,tick:462,lastGuardianCrossing:crossing};
 const original=JSON.stringify([before,after,late]);
 const world=createTowerWorld();
 try{
  world.update(before,.05,0,{quality:'low'});
  const originalArch=world.group.getObjectByName('AuthoritativeGuardianGate');
  const originalCap=world.group.getObjectByName('platform:f8:cap');
  assert.ok(originalArch && originalCap);
  assert.equal(world.stageGroundedCapContinuation(before,after),true);
  world.update(after,.05,.05,{quality:'low'});
  assert.equal(world.diagnostics().retainedSourceCap?.crossingTick,null,
   'first observed browser successor has no immutable crossing record yet');
  world.noteFrameSubmitted(after,{},.05);
  world.update(late,.05,.15,{quality:'low'});
  assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===originalArch,true,
      'original bronze gate GPU identity must survive; never format the gigantic Three.js graph');
  assert.equal(world.group.getObjectByName('platform:f8:cap')===originalCap,true);
  const retained=world.diagnostics().retainedSourceCap;
  assert.equal(retained?.crossingTick,451);
  assert.equal(retained?.lateRecordedCrossingReacquiredAtTick,462);
  assert.equal(retained?.sourceAlignedPassage,true);
  assert.equal(world.retainedFilmHandoff(late)?.crossingTick,451,
   'real camera/biome source ownership can now share the retained original doorway');
  assert.ok(world.group.getObjectByName('platform:f9:ground'),
   'the source-authoritative next-floor ground remains live and walkable');
  assert.equal(JSON.stringify([before,after,late]),original,
   'source snapshots remain untouched; no floor, collider or outcome synthesized');
 }finally{world.dispose();}
});

test('an unrelated late crossing cannot reauthorize the retained original gateway',async()=>{
 const [{createTowerWorld}]=await loaded;
 const first=old(),second=next(),world=createTowerWorld();
 try{
  world.update(first,.05,0,{quality:'low'});
  assert.equal(world.stageGroundedCapContinuation(first,second),true);
  world.update(second,.05,.05,{quality:'low'});
  const corrupt={...second,tick:462,lastGuardianCrossing:{
   runToken:second.runToken,sourceTick:451,fromFloor:8,toFloor:9,
   cap:{...cap,width:cap.width-1},exitX:gate,crossingX:gate+13000,
   crossingY:second.player.y,halfWidth:second.player.halfWidth,
   halfHeight:second.player.halfHeight,
   guardian:{kind:'guardian',floor:8,active:false,health:0}}};
  world.update(corrupt,.05,.1,{quality:'low'});
  assert.equal(world.diagnostics().retainedSourceCap?.crossingTick,null);
  assert.equal(world.retainedFilmHandoff(corrupt),null);
 }finally{world.dispose();}
});


test('real Three world retains the identical old bronze gate across a nine-tick delayed portrait GPU rebuild before crossing publication',async()=>{
  const [{createTowerWorld}]=await loaded;
  const before=old(),crossed=next();
  assert.equal(before.floor,8);
  assert.equal(crossed.floor,9);
  assert.equal(crossed.tick-before.tick,1);
  assert.equal(crossed.lastGuardianCrossing,undefined,
    'this test exercises the authentic delayed publication, not a manufactured immutable record');
  const world=createTowerWorld();
  try{
    world.update(before,.05,0,{quality:'low'});
    const oldCap=world.group.getObjectByName('platform:f8:cap');
    const oldGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    assert.ok(oldCap?.isGroup && oldGate?.isGroup,
      'actual original Floor8 cap and separate HP-driven guardian door must already exist');
    assert.equal(world.stageGroundedCapContinuation(before,crossed),true,
      'a zero-HP guardian with a genuine same-roof grounded old-to-new handoff stages the old GPU owner');
    const late={...crossed,tick:460,
      player:{...crossed.player,x:crossed.player.x+16500}};
    const untouched=JSON.stringify([before,crossed,late]);
    world.update(late,.05,.5,{quality:'low'});
    assert.equal(world.group.getObjectByName('platform:f8:cap')===oldCap,true,
      'first actual Floor9 Three rebuild must not delete the already-rendered bronze cap');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===oldGate,true,
      'first actual Floor9 Three rebuild must not delete the original opened doorway');
    const held=world.diagnostics().retainedSourceCap;
    assert.equal(held?.guardianGateRetained,true);
    assert.equal(held?.crossingTick,null,
      'unpublished immutable guardian crossing stays UNKNOWN, not fabricated as tick451');
    assert.equal(held?.firstWorldRenderTick,460);
    assert.equal(JSON.stringify([before,crossed,late]),untouched,
      'reconstructing visuals cannot edit authoritative source snapshots');
    world.update({...late,runToken:'unrelated-run'},.05,.55,{quality:'low'});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate') == null,true,
      'wrong-run retention is immediately discarded');
  } finally { world.dispose(); }
});

test('source-earned Floor9 paints one actual open Void load path beside the retained bronze doorway before deferred pylons arrive',async()=>{
  const [{createTowerWorld}]=await loaded;
  const before=old(),after=next(),world=createTowerWorld();
  const immutable=JSON.stringify([before,after]);
  try {
    world.update(before,.05,0,{quality:'low'});
    const bronzeArch=world.group.getObjectByName('AuthoritativeGuardianGate');
    assert.ok(bronzeArch?.isGroup);
    assert.equal(world.stageGroundedCapContinuation(before,after),true);
    world.update(after,.05,.05,{quality:'low'});
    const bearing=world.group.getObjectByName('SourceEarnedVoidLandingBearingFrame');
    assert.ok(bearing?.isGroup,'actual F9 frame must contain source-gated structural destination');
    assert.ok(bearing.getObjectByName('VoidOpenCoreLoadPath')?.isGroup,
      'the first genuine F9 render must contain the actual open core, not an empty destination and cold late world swap');
    // The world legitimately merges those exact rigid meshes into GPU batches
    // before the FIRST painted frame; source-face provenance must survive.
    const originalOwners=[];
    bearing.traverse(o=>{
      if(o.isMesh)for(const owner of o.geometry.userData.originalTriangleOwners||[])
        originalOwners.push(owner.authoringPath);
    });
    for(const original of ['VoidOpenCoreRearDiagonalStay',
      'VoidOpenCoreCrownTie','VoidOpenCoreRearLoadPosts'])
      assert.ok(originalOwners.some(owner=>owner.includes(original)),
        'the first rendered batched F9 BRACING retains exact source geometry: '+original);
    assert.equal(originalOwners.some(owner=>owner.includes('VoidOpenCoreFoundation') ||
      owner.includes('VoidOpenCoreSupportedCrown')),false,
      'high-mass foundation/crown must not be uploaded on the expensive first WebGL frame');
    assert.equal(bearing.getObjectByName('SourceEarnedVoidExteriorButtress')===undefined,true,
      'new opaque nearest Void pylon must not screen the real still-visible bronze gateway on first F9');
    assert.equal(world.group.getObjectByName('tapered-structural-pylon')===undefined,true,
      'all incoming exterior buttresses wait for physical source departure; gameplay floor stays');
    // The first source-authenticated F9 render now carries the ORIGINAL
    // small Void vault: two actual halo meshes and five moving crystals.
    // Previous low-tier 2..6 rigid steel batches remain, so seven additional
    // genuine authored visual meshes are the exact new bounded first draw.
    const originalVault=bearing.getObjectByName('OriginalVoidVaultHaloAndCrystals');
    assert.ok(originalVault?.isGroup,'genuine F9 destination must be physically present');
    let vaultMeshes=0,meshes=0;
    originalVault.traverse(o=>{if(o.isMesh)vaultMeshes++;});
    bearing.traverse(o=>{if(o.isMesh)meshes++;});
    assert.equal(vaultMeshes,7,'2 genuine halo meshes and 5 original floating crystals, never a full cloned biome');
    assert.ok(meshes>=9 && meshes<=13,
      'source-owned bracing plus 7 real Void landmark meshes; no entire cold exterior shaft');
    const animatedHalo=originalVault.children.find(o=>o.isGroup);
    assert.ok(animatedHalo?.children.length===2,
      'the original rotating halo must remain a live scene node, not a rigid baked batch');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===bronzeArch,true);
    const pending=world.diagnostics().deferredDistantArrival;
    assert.equal(pending?.actualFirstFrameVoidBearings,true);
    assert.equal(pending?.entireIncomingVoidCoreDeferred,false);
    assert.ok(world.group.getObjectByName('OriginalSourceClockworkThresholdGallery')?.isGroup,
      'the original historic machine room, rather than incoming violet core, backs the first real successor doorway');
    assert.equal(pending.actualFirstFrameVoidBearingIndex,0,
      'ONLY the far-side authored original Void shoulder is present with the old opened doorway; the nearest pylon is still deferred');
    assert.ok(originalOwners.some(owner=>owner.includes('VoidOpenButtressRearPiersAndFrontStanchions')),
      'source-owned far-side pylon steel appears as authentic first-frame batched structural triangles');
    assert.equal(originalOwners.some(owner=>owner.includes('VoidOpenButtressFooting') ||
      owner.includes('VoidOpenButtressCrown')),false,
      'large original far-pylon masses still await the renderer-returned deferred shaft');
    assert.ok(pending.deferredPhysicalButtressIndex===0 ||
              pending.deferredPhysicalButtressIndex===1,
      'source-authored nearest exterior support is identified for deferred world assembly');
    assert.equal(world.group.getObjectByName('deferred-original-floor-nine-architecture')===undefined,true);
    // Genuine source-grounded departure releases the remaining *authored*
    // shaft, but may never reconstruct or double the already visible bay.
    world.noteFrameSubmitted(after,{},.05);
    const departed={...after,tick:476,
      player:{...after.player,x:gate+160000}};
    world.update(departed,.05,.9,{quality:'low'});
    assert.equal(world.group.getObjectByName('SourceEarnedVoidLandingBearingFrame')===bearing,true,
      'same GPU structural owner continues through the new shaft upload');
    const newShaft=world.group.getObjectByName('deferred-original-floor-nine-architecture');
    assert.ok(newShaft,'incoming original support loads only after the real gateway is left behind');
    assert.equal(newShaft.visible,false,
      'source-deferred zero-alpha shaft must be culled as an entire real Three subtree; transparent opacity zero still incurs draw calls and shader work');
    assert.equal(world.group.getObjectByName('platform:f9:ground')?.visible,true,
      'the real physical new-floor walkable ground must NEVER be hidden with decorative architecture');
    assert.equal(newShaft.getObjectByName('VoidOpenCoreLoadPath')===undefined,true,
      'the original open core is already visibly built and may NEVER be duplicated during deferred shaft upload');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-void-biome-build',
      'first return only constructs the authentic load-bearing shell, with no premature material isolation');
    world.noteFrameSubmitted(departed,{},.05);
    world.update(departed,.05,.95,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-void-biome-build',
      'second real source return builds the actual exterior buttresses, not crystals');
    assert.ok(newShaft.getObjectByName('deferred-original-floor-nine-outer-buttresses')?.isGroup);
    world.noteFrameSubmitted(departed,{},.05);
    world.update(departed,.05,1.0,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-release',
      'third actual return builds original crystals and isolates the final noninteractive biome');
    const incomingMeshes=[];
    newShaft.traverse(o=>{if(o.isMesh)incomingMeshes.push(o);});
    assert.ok(incomingMeshes.length>0 &&
      incomingMeshes.every(mesh=>!Array.isArray(mesh.material) ?
        mesh.material?.opacity>=0 && mesh.material?.opacity<=.28 :
        mesh.material.every(material=>material.opacity>=0 && material.opacity<=.28)),
      'real supported source departure permits at most 28% scenic shell while genuine F9 route stays opaque');
    const newDetails=newShaft.getObjectByName('deferred-authentic-floor-nine-crystal-biome');
    assert.ok(newDetails?.isGroup && newDetails.visible===false,
      'the separately built original crystal details cannot claim a GPU-returned frame they have not received');
    const vaultCopies=[];
    world.group.traverse(o=>{
      if(o.name==='OriginalVoidVaultHaloAndCrystals')vaultCopies.push(o);
    });
    assert.equal(vaultCopies.length,1,
      'later original Void rock construction may never recreate the already-rendered live vault');
    assert.equal(vaultCopies[0],originalVault,
      'the exact same original animated source-owned object persists across returned stages');
    assert.ok(newShaft.getObjectByName('tapered-structural-pylon'),
      'the actual new exterior buttresses must still be constructed after departure');
    const deferredOriginalOwners=[];
    newShaft.traverse(o=>{
      if(o.isMesh)for(const owner of o.geometry.userData.originalTriangleOwners||[])
        deferredOriginalOwners.push(owner.authoringPath);
    });
    for(const original of ['VoidOpenCoreFoundation','VoidOpenCoreSupportedCrown'])
      assert.ok(deferredOriginalOwners.some(owner=>owner.includes(original)),
        'actual authored heavy source core mass is uploaded only after the first real F9 submission: '+original);
    for(const original of ['VoidOpenCoreRearDiagonalStay',
      'VoidOpenCoreCrownTie','VoidOpenCoreRearLoadPosts'])
      assert.equal(deferredOriginalOwners.some(owner=>owner.includes(original)),false,
        'already-rendered source structural bracing must not be duplicated on deferred upload: '+original);
    const copies=[];world.group.traverse(o=>{
      if(o.name==='VoidOpenCoreLoadPath')copies.push(o);
    });
    assert.equal(copies.length,1,'first-painted and deferred worlds share exactly one original real core');
    assert.equal(world.group.getObjectByName('platform:f9:ground')!==undefined,true,
      'same source-owned new-floor platform must remain truly walkable throughout the handoff');
    assert.equal(JSON.stringify([before,after]),immutable);
  }finally{world.dispose();}
});

test('unearned ordinary Void rebuild never invents a source-original F8 entrance frame',async()=>{
  const [{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try {
    const successor=next();
    world.update(successor,.05,0,{quality:'low'});
    assert.equal(world.group.getObjectByName('SourceEarnedVoidLandingBearingFrame')===undefined,true);
    assert.equal(world.diagnostics().deferredDistantArrival,null);
    assert.ok(world.group.getObjectByName('VoidOpenCoreLoadPath')?.isGroup,
      'normal Floor9 receives its original authored shaft, no fabricated F8 gate');
  }finally{world.dispose();}
});


test('actual cold first Floor9 desktop receipt inherits ORIGINAL GPU gate, cap and source Clockwork architecture after 64.8m ascent',async()=>{
  const [{createTowerWorld},{observedRecordedGuardianAirborneHandoff,
    observedSourceEarnedAirborneHandoff}]=await loaded;
  // Exact seed danger witness: fixed-step HP0 tick441, winch opens, crossing
  // tick475, first desktop WebGL-successor observation tick481. The last
  // genuinely rendered Floor8 packet can still show a living locked guardian.
  const first=old();first.tick=438;
  first.enemies=[{...first.enemies[0],active:true,health:1}];
  const second=next();second.tick=481;
  second.player={...second.player,x:339996,y:3302800,health:4,
    state:'airborne',vy:78000,grounded:false,groundedPlatformId:null};
  second.lastGuardianCrossing={
    runToken:first.runToken,sourceTick:475,fromFloor:8,toFloor:9,
    cap:{id:cap.id,x:cap.x,y:cap.y,width:cap.width,height:cap.height},
    guardian:{id:'f8:guardian',kind:'guardian',floor:8,active:false,
      health:0,x:235000,y:3250000,halfHeight:18000},
    exitX:gate,previousX:314796,previousY:3238000,previousHealth:1,
    crossingX:321096,crossingY:3238000,halfWidth:9000,halfHeight:14000,
    worldWidth:480000
  };
  const unchanged=JSON.stringify([first,second]);
  const recorded=observedRecordedGuardianAirborneHandoff(second);
  assert.ok(recorded,'true tick475 crossing must yield the old cap at tick481');
  assert.equal(observedSourceEarnedAirborneHandoff(recorded,second),true);
  const world=createTowerWorld();
  try{
    world.update(first,.05,0,{quality:'low'});
    const realOldGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const realOldCap=world.group.getObjectByName('platform:f8:cap');
    assert.ok(realOldGate?.isGroup && realOldCap?.isGroup);
    world.noteFrameSubmitted(first,{quality:'low'},.05);
    assert.equal(world.stageGroundedCapContinuation(recorded,second),true,
      'source-authenticated airborne floor advance must schedule historical GPU ownership');
    world.update(second,.05,.05,{quality:'low'});
    const owner=world.diagnostics().retainedSourceCap;
    assert.equal(owner?.guardianGateRetained,true);
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate')===realOldGate,true,
      'rendered original unlocked bronze arch survives the GPU rebuild');
    assert.equal(world.group.getObjectByName('platform:f8:cap')===realOldCap,true,
      'the source original cap survives rather than a synthetic proxy');
    assert.ok(owner.originalGalleryTriangles>0,
      'bounded source-original Clockwork geometry must accompany the old arch');
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'Floor9 gameplay ground is present alongside the source original gate');
    assert.equal(JSON.stringify([first,second]),unchanged);
  }finally{world.dispose();}
});


// Source-authentic 2026-11-15 candidate portrait: first actual F9 WebGL
// floor render occurred at tick489 after final browser F8 receipt tick474;
// lastGuardianCrossing was NO LONGER published at this late first paint.
// This is the exact real-world contract that prevented the source-extracted
// old bronze gate from ever sharing a drawn frame with the floor-nine roof.
test('cold 15-tick source-observed F8-to-F9 first paint retains original real Three cap, grille and gallery without phantom crossing',async()=>{
 const [{createTowerWorld},{observedGroundedGuardianHandoff}]=await loaded;
 const first=old(),second=next();
 first.tick=474;first.player.x=314796;
 second.tick=489;second.player.x=330096;
 assert.equal(second.lastGuardianCrossing,undefined);
 assert.equal(observedGroundedGuardianHandoff(first,second),true);
 const saved=JSON.stringify([first,second]),world=createTowerWorld();
 try{
  world.update(first,.05,0,{quality:'low'});
  world.noteFrameSubmitted(first,{quality:'low'},.05);
  assert.equal(world.stageGroundedCapContinuation(first,second),true);
  world.update(second,.05,.05,{quality:'low'});
  const evidence=world.diagnostics();
  assert.ok(evidence.retainedSourceCap,'original cap must exist at first genuine F9 paint');
  assert.ok(world.group.getObjectByName('ObservedGroundedCapGatewayContinuity'));
  assert.ok(world.group.getObjectByName('OriginalSourceClockworkThresholdGallery'));
  assert.equal(world.group.getObjectByName('SourceEarnedClockworkVoidBearingGallery')===undefined,true,
   'this fixture contains no authentic F9 raised step, so visual world must not invent one');
  assert.equal(evidence.retainedSourceCap.verifiedObservedFloorAdvance,true,
   'the browser observation must not masquerade as an immutable source event');
  assert.equal(evidence.retainedSourceCap.crossingTick,null,
   'no fabricated published lastGuardianCrossing after its actual expiry');
  world.noteFrameSubmitted(second,{quality:'low'},.05);
  assert.ok(world.diagnostics().retainedSourceCap,
   'one actual returned F9 WebGL frame does not delete genuine source-owned arch');
 }finally{world.dispose();}
 assert.equal(JSON.stringify([first,second]),saved);
});
