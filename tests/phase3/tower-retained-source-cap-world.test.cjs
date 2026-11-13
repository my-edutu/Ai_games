'use strict';
// Real shipped Three.js Floor8->9 original cap resource ownership; the source
// validator already resides in guardian-passage.mjs, never a fake win fixture.
const {test,after}=require('node:test');
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
  .replace("'./guardian-passage.mjs'",JSON.stringify(uri('guardian-passage.mjs')))
  .replace("'./world-surface.mjs'",JSON.stringify(uri('world-surface.mjs')))
  .replace("'./scene-hierarchy.mjs'",JSON.stringify(uri('scene-hierarchy.mjs')))
  .replace("'./guardian-transmission-layout.mjs'",JSON.stringify(uri('guardian-transmission-layout.mjs')))
  .replace("'./mesh-provenance.mjs'",JSON.stringify(uri('mesh-provenance.mjs')));
fs.writeFileSync(local,source);
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
const loaded=Promise.all([import(pathToFileURL(local).href),
  import(uri('guardian-passage.mjs'))]);
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const body={health:5,grounded:true,halfWidth:9000,halfHeight:14000,
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
test('same earned doorway retains the ORIGINAL old cap real geometry over the Floor9 render rebuild then disposes it',async()=>{
  const [{createTowerWorld},{observedGroundedGuardianHandoff}]=await loaded;
  const first=old(),second=next();
  assert.equal(observedGroundedGuardianHandoff(first,second),true);
  const original=JSON.stringify([first,second]);
  const world=createTowerWorld();
  try{
    world.update(first,.05,0,{quality:'low'});
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
    assert.equal(world.group.getObjectByName('platform:f8:cap'),genuine,
      'the already-rendered original meshes must survive, not synthetic replacement');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),originalGate,
      'the ORIGINAL opened guardian doorway must survive the Floor9 rebuild alongside the old deck');
    assert.equal(world.group.getObjectByName('GuardianGateInset'),originalDoor,
      'must retain the real HP-driven bronze grille and not substitute decorative inlays');
    assert.equal(originalGate.parent?.name,'ObservedGroundedCapGatewayContinuity',
      'old rendered cap and gate share one bounded historical transform');
    const retention=world.diagnostics().retainedSourceCap;
    assert.equal(retention.floor,9);
    assert.equal(retention.guardianGateRetained,true,
      'diagnostics expose actual old guardian doorway retention, not just a cosmetic deck');
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
    for(let i=0;i<15;i++)world.update(second,.1,.1+i*.1,{quality:'low'});
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'unsubmitted GPU frames cannot consume old world continuity');
    world.noteFrameSubmitted(second,{});
    for(let i=0;i<5;i++)world.update(second,.1,2+i*.1,{quality:'low'});
    assert.ok(originalCover.opacity<.8 && originalCover.opacity>.05,
      'actual bronze deck hands visually into the violet deck during submitted-frame time');
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'real cap survives the first successful new-floor renderer submission');
    world.noteFrameSubmitted(second,{});
    for(let i=0;i<17;i++)world.update(second,.1,3+i*.1,{quality:'low'});
    assert.equal(world.group.getObjectByName('platform:f8:cap'),undefined,
      'the bounded old floor must retire on submitted-frame display time');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),undefined,
      'old unlocked gate and its GPU resources must retire with old cap');
    assert.equal(world.diagnostics().retainedSourceCap,null);
    assert.equal(JSON.stringify([first,second]),original,
      'the old/new authoritative source must be immutable');
  }finally{world.dispose();}
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
      assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),undefined,
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
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),actualOldGate);
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true);
    // No newly submitted frame may extend an airborne doorway beyond the
    // authoritative 24-tick launch allowance; do not conflate source ticks
    // with a GPU submission or introduce a ghost entrance.
    const outside={...after,tick:478};
    world.update(outside,.05,.1,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap,null,
      'the source-earned old cap cannot persist past the bounded first airborne continuation');
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
    assert.equal(world.group.getObjectByName('deferred-original-floor-nine-architecture'),undefined,
      'the first playable frame must not upload the heavyweight new tower shaft');
    world.noteFrameSubmitted(newFloor,{});
    world.update(newFloor,.05,.1,{quality:'low'});
    assert.ok(world.group.getObjectByName('deferred-original-floor-nine-architecture'),
      'the original new-floor architecture returns only after the first genuine render');
    assert.equal(world.diagnostics().vistaLayers,0,
      'canyon upload must not share the structural shaft submission');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-structural-submission');
    world.noteFrameSubmitted(newFloor,{});
    world.update(newFloor,.05,.15,{quality:'low'});
    assert.equal(world.diagnostics().vistaLayers,3,
      'the original panorama returns only after a SECOND successful Three.js source frame submission');
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'awaiting-vista-submission');
    world.noteFrameSubmitted(newFloor,{});
    world.update(newFloor,.05,.2,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,'fading-remote-arrival',
      'authentic distant citadels reappear in their own third submitted-frame stage');
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
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),original,
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
    world.update(previous,.05,0,{quality:'low'});
    const originalGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const originalCap=world.group.getObjectByName('platform:f8:cap');
    assert.ok(originalGate?.isGroup && originalCap?.isGroup);
    assert.equal(world.stageGroundedCapContinuation(previous,first),true);
    world.update(later,.05,.05,{quality:'low'});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),originalGate,
      'late first source frame must attach same original GPU gateway');
    assert.equal(world.group.getObjectByName('platform:f8:cap'),originalCap,
      'original roof is retained, not an invented replacement');
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'authentic next-floor walkable platform must not be deferred');
    const diag=world.diagnostics();
    assert.equal(diag.retainedSourceCap?.firstObservedTick,451);
    assert.equal(diag.retainedSourceCap?.firstWorldRenderTick,460);
    assert.equal(diag.retainedSourceCap?.pendingSourceTickGap,9);
    assert.equal(diag.deferredDistantArrival?.structureDeferred,true,
      'noninteractive opaque shell should not occlude original crossing in first actual frame');
    assert.equal(JSON.stringify([previous,first,later]),frozen);
  }finally{world.dispose();}
});


test('three authentic crossing clocks preserve original doorway, warm horizon witness, and structural deferral after delayed first GPU render',async()=>{
  const [{createTowerWorld}]=await loaded;
  const oldFrame=old(), first=next();
  first.tick=454;
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
    world.update(realFirstRender,.05,.05,{quality:'low'},passage);
    const retained=world.diagnostics().retainedSourceCap;
    assert.ok(retained);
    assert.equal(retained.crossingTick,451,'recorded authoritative grounded contact');
    assert.equal(retained.sourceTick,454,'browser-accepted successor belongs to passage');
    assert.equal(retained.firstObservedTick,454);
    assert.equal(retained.firstWorldRenderTick,460,'real WebGL rebuild may lag browser');
    assert.equal(retained.pendingSourceTickGap,6);
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),originalArch);
    assert.equal(world.group.getObjectByName('platform:f8:cap'),originalRoof);
    assert.equal(world.group.getObjectByName('platform:f9:ground')?.isGroup,true);
    assert.equal(roof(realFirstRender,passage,retained),true,
      'retained architecture must recognize the SAME passage observation');
    assert.ok(world.retainedFilmHandoff(realFirstRender),
      'warm horizon must receive original recorded HP-zero crossing clock');
    assert.equal(cold(realFirstRender,world.retainedFilmHandoff(realFirstRender)),true);
    assert.equal(world.diagnostics().deferredDistantArrival?.structureDeferred,true);
    world.noteFrameSubmitted(realFirstRender,{});
    const later={...realFirstRender,tick:461};
    world.update(later,.05,.1,{quality:'low'},
      {...passage,handoffSubmittedFrames:1,handoffDisplaySeconds:.05});
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),originalArch);
    assert.equal(world.diagnostics().deferredDistantArrival?.state,
      'awaiting-actual-first-render',
      'the new opaque monumental shaft cannot replace the original first doorway');
    assert.equal(world.diagnostics().vistaLayers,0);
    assert.equal(JSON.stringify([oldFrame,first,realFirstRender]),frozen);
    assert.equal(cold({...realFirstRender,runToken:'other'},
      world.retainedFilmHandoff(realFirstRender)),false);
    assert.equal(cold({...realFirstRender,lastGuardianCrossing:{
      ...crossing,sourceTick:450}},world.retainedFilmHandoff(realFirstRender)),false);
  }finally{world.dispose();}
});
