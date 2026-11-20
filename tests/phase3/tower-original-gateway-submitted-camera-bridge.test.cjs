'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const load=import('../../public/infinite-tower-climb/visuals/original-gateway-submitted-camera-bridge.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const thresholdX=cap.x+Math.floor(cap.width*.76);
const prior={runToken:'genuine',floor:8,tick:448,chunkBaseY:2880000,
  oldRoofY:cap.y+cap.height,thresholdX,oldCapId:'f8:cap',
  originalGuardianObserved:true,originalGuardianHealth:1,
  camera:[4,40,64],gaze:[8,34,21]};
const held={runToken:'genuine',floor:9,guardianGateRetained:true,
  oldCapId:'f8:cap',oldRoofY:cap.y+cap.height,thresholdX,
  submittedFrames:0,visibleSeconds:0};
const snapshot={runToken:'genuine',floor:9,theme:'void',tick:452,
  lifecycle:'running',chunkBaseY:3120000,
  player:{x:330196,y:3238000,halfHeight:14000,health:4},
  lastGuardianCrossing:{runToken:'genuine',fromFloor:8,toFloor:9,
    sourceTick:451,exitX:thresholdX,cap,
    guardian:{kind:'guardian',active:false,health:0}}};
const view={camera:'follow',stale:false,overview:false,reducedMotion:false};
test('one true defeated doorway rebases last returned old-floor shot, bounded by submitted F9 frames',async()=>{
  const {sourceOriginalGatewayCameraBridge:plan}=await load;
  const result=plan(snapshot,held,prior,view);
  assert.equal(result.sourceBound,true);
  assert.deepEqual(result.camera,[4,16,64]);
  assert.deepEqual(result.gaze,[8,10,21]);
  assert.equal(result.weight,1,
    'the first real F9 submission must retain the exact last rendered F8 lens, not the former 72%-mixed cut');
  const two=plan(snapshot,{...held,submittedFrames:2,visibleSeconds:.16,
    originalGatewayOpacity:1},prior,view);
  assert.equal(two.weight,1,
    'source polling or two successful returns cannot consume a shot before any genuinely shown overlap');
  const faded=plan(snapshot,{...held,submittedFrames:2,visibleSeconds:.16,
    originalGatewayOpacity:.6},prior,view);
  assert.ok(faded && Math.abs(faded.weight-.6)<1e-9,
    'real gate metal opacity must veto borrowing a retired/shrinking old room');
  // A genuine displayed return is a duration, not a fictitious universal FPS.
  const five=plan(snapshot,{...held,submittedFrames:5,
    visibleSeconds:.45,originalGatewayOpacity:.92},prior,view);
  assert.ok(five.weight<result.weight && five.weight>.05);
  assert.ok(five.sourceBound);
  assert.equal(plan(snapshot,{...held,submittedFrames:10},prior,view),null);
});
test('no lock for live guardian, wrong run, old roof, teleport, user camera or later floor',async()=>{
  const {sourceOriginalGatewayCameraBridge:plan}=await load;
  const cases=[
    [snapshot,{...held,runToken:'other'},prior,view],
    [{...snapshot,runToken:'other'},held,prior,view],
    [{...snapshot,floor:10},held,prior,view],
    [{...snapshot,lastGuardianCrossing:{...snapshot.lastGuardianCrossing,
      guardian:{kind:'guardian',health:1,active:true}}},held,prior,view],
    [snapshot,{...held,oldRoofY:held.oldRoofY+100},prior,view],
    [snapshot,held,{...prior,thresholdX:thresholdX+1},view],
    [snapshot,held,{...prior,tick:400},view],
    [{...snapshot,player:{...snapshot.player,x:thresholdX+100000}},held,prior,view],
    [snapshot,held,prior,{...view,camera:'overview'}],
    [snapshot,held,prior,{...view,stale:true}],
    [snapshot,held,prior,{...view,reducedMotion:true}],
    [snapshot,{...held,visibleSeconds:3},prior,view],
  ];
  for(const args of cases) assert.equal(plan(...args),null);
});
test('authentic last returned F8 view at living guardian HP1 is preserved for later HP0 record',async()=>{
  const {observedOriginalGatewaySubmittedView:capture,
    sourceOriginalGatewayCameraBridge:plan}=await load;
  const old={
    runToken:'genuine',floor:8,theme:'clockwork',lifecycle:'running',
    tick:438,chunkBaseY:2880000,worldWidth:480000,
    guardianExitX:thresholdX,platforms:[cap],
    enemies:[{kind:'guardian',floor:8,active:true,health:1}],
    player:{health:4,x:thresholdX-12000}
  };
  const original=capture(old,[4,40,64],[8,34,21]);
  assert.ok(original && original.originalGuardianHealth===1,
    'real previous rendered camera may precede last HP0 fixed step');
  assert.equal(plan(snapshot,held,original,view).sourceBound,true,
    'later immutable actual defeated crossing, NOT earlier active guardian, licenses use');
  assert.equal(capture({...old,enemies:[]},[4,40,64],[8,34,21]),null);
  assert.equal(capture({...old,runToken:'',enemies:old.enemies},[4,40,64],[8,34,21]),null);
  assert.equal(capture({...old,player:{...old.player,x:thresholdX+100000}},[4,40,64],[8,34,21]),null);
  assert.equal(capture({...old,guardianExitX:thresholdX+1},[4,40,64],[8,34,21]),null);
  assert.equal(capture({...old,floor:9},[4,40,64],[8,34,21]),null);
  assert.equal(plan({...snapshot,lastGuardianCrossing:{...snapshot.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held,original,view),null,
    'an early source camera alone must never invent opened gate');
  assert.equal(plan(snapshot,held,{...original,originalGuardianObserved:false},view),null);
  assert.equal(plan(snapshot,held,{...original,originalGuardianHealth:-1},view),null);
});
test('real published F8 snapshot omits enemy.floor yet returns a source-owned camera for the genuine F9 HP0 crossing',async()=>{
  const {observedOriginalGatewaySubmittedView:capture,
    sourceOriginalGatewayCameraBridge:plan}=await load;
  const published={
    runToken:'genuine',floor:8,theme:'clockwork',lifecycle:'running',
    tick:438,chunkBaseY:2880000,worldWidth:480000,
    guardianExitX:thresholdX,platforms:[cap],
    // Actual TowerRenderSnapshot is already floor-filtered: no enemy.floor.
    enemies:[{id:'f8:guardian',kind:'guardian',active:true,health:1,
      x:235000,y:3250000,halfHeight:18000}],
    player:{health:4,x:thresholdX-12000}
  };
  const before=JSON.stringify(published);
  const oldView=capture(published,[4,40,64],[8,34,21]);
  assert.ok(oldView && oldView.originalGuardianObserved===true,
    'real floor-filtered source may no longer be rejected by an absent enemy.floor');
  assert.equal(oldView.tick,438);
  const after=plan(snapshot,held,oldView,view);
  assert.ok(after?.sourceBound && after.proof==='immutable-guardian-defeat',
    'only subsequent source-recorded HP-zero Floor8->9 crossing can use the old submitted camera');
  assert.equal(JSON.stringify(published),before,
    'camera observation cannot mutate the immutable floor-scoped source snapshot');
  assert.equal(capture({...published,enemies:[{...published.enemies[0],floor:7}]},
    [4,40,64],[8,34,21]),null,
    'explicit foreign-floor guardian must not lend its camera');
  assert.equal(capture({...published,floor:9},[4,40,64],[8,34,21]),null);
  assert.equal(capture({...published,enemies:[]},[4,40,64],[8,34,21]),null);
  assert.equal(plan(snapshot,held,{...oldView,runToken:'foreign'},view),null);
  assert.equal(plan({...snapshot,lastGuardianCrossing:{...snapshot.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}},held,oldView,view),null,
    'old returned camera is not an authority for guardian defeat');
});

test('the real camera consumes only genuine submitted old floor view and verifies hero/core on new floor',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.ok(scene.includes('sourceOriginalGatewayCameraBridge(') &&
    scene.includes('snapshot,coldArchProof,originalGatewaySubmittedCamera'),
    'real source bridge must be called with retained original gate and last painted view');
  assert.match(scene,/originalGatewaySubmittedCamera=submittedOldView/);
  assert.match(scene,/observedOriginalGatewaySubmittedView\(/);
  assert.match(scene,/bridgeHeroSafe && bridgeGateSafe/);
  assert.match(scene,/towerCoreSightlineClear\(camera.position,thresholdHero,23\.5\)/);
  assert.match(scene,/towerCoreSightlineClear\(camera.position,thresholdGate,23\.5\)/);
  assert.match(scene,/originalGatewayCameraBridgeAccepted\+\+/);
  assert.match(scene,/sourceBlendFallback=originalBridge\.weight>\.72/);
  assert.match(scene,/rescueTrials\.slice\(0,2\)/,
    'intact original 3D camera and two source-owned exterior trials must share the existing three-shot budget');
  assert.match(scene,/assessOriginalGatewayThreeSubjectCameraFrame/);
  assert.match(scene,/assessOriginalGatewayPhysicalCameraBridge/);
});


test('previous real Clockwork GPU lens bridges the EXACT first grounded Floor9 source receipt before delayed immutable publication',async()=>{
 const {sourceOriginalGatewayCameraBridge:plan}=await load;
 const first={...snapshot,tick:475,lastGuardianCrossing:null,chunkBaseY:3240000,
   worldWidth:480000,platforms:[{id:'f9:ground',x:0,y:3212000,
     width:480000,height:12000}],
   player:{...snapshot.player,x:thresholdX+19400,y:3238000,
     halfWidth:9000,grounded:true,groundedPlatformId:'f9:ground',
     state:'standing',vy:0}};
 const old={...prior,tick:438,chunkBaseY:2880000};
 const retained={...held,tick:475,sourceTick:475,crossingTick:null,
   nextBaseY:3240000,worldWidth:480000,
   oldCapX:cap.x,oldCapWidth:cap.width,
   verifiedObservedFloorAdvance:true,
   observedCrossingX:thresholdX+19400,observedCrossingY:3238000,
   observedHalfWidth:9000,observedHalfHeight:14000};
 const before=JSON.stringify([first,retained,old]);
 const shot=plan(first,retained,old,view);
 assert.ok(shot && shot.sourceBound && shot.proof==='verified-grounded-original-source-receipt');
 assert.deepEqual(shot.camera,[4,4,64],
   'chunk-origin rebase uses actual source positions, not a virtual gateway');
 assert.equal(shot.crossingTick,475);
 assert.equal(JSON.stringify([first,retained,old]),before);
 for(const [s,h,p,v] of [
   [first,{...retained,verifiedObservedFloorAdvance:false},old,view],
   [first,{...retained,observedCrossingX:thresholdX-10000},old,view],
   [first,{...retained,oldRoofY:retained.oldRoofY+10},old,view],
   [{...first,runToken:'other'},retained,old,view],
   [{...first,player:{...first.player,health:0}},retained,old,view],
   [{...first,lastGuardianCrossing:{runToken:'mismatched'}},retained,old,view],
   [first,retained,{...old,tick:420},view],
   [first,retained,old,{...view,camera:'overview'}],
   [first,retained,old,{...view,reducedMotion:true}],
   [first,{...retained,submittedFrames:9},old,view],
 ])assert.equal(plan(s,h,p,v),null);
});

test('immutable guardian victory can use last returned F8 camera 38 ticks earlier, but not an arbitrarily ancient view',async()=>{
 const {sourceOriginalGatewayCameraBridge:plan}=await load;
 assert.equal(plan(snapshot,held,{...prior,tick:413},view)?.sourceBound,true,
   'actual original F8 renderer skipped some genuine fixed ticks before recorded crossing');
 assert.equal(plan(snapshot,held,{...prior,tick:400},view),null,
   'cannot borrow a very old or unrelated hero/guardian camera');
});

test('source-earned old-gate camera and material retire on one real returned-time envelope, rather than a ten-frame hard cut',async()=>{
  const {sourceOriginalGatewayCameraBridge:plan}=await load;
  const before=JSON.stringify([snapshot,held,prior]);
  const early={...held,submittedFrames:8,visibleSeconds:.32,
    originalGatewayOpacity:.83};
  const later={...early,visibleSeconds:.75};
  const fast=plan(snapshot,early,prior,view);
  const slow=plan(snapshot,later,prior,view);
  assert.ok(fast?.weight>.15,
    'rapid GPU returns cannot drop the genuine bronze doorway shot while the old geometry still shows');
  assert.ok(fast.weight<=early.originalGatewayOpacity,
    'camera must never outlive source-owned 3D metal even in the initial continuity hold');
  assert.ok(slow && slow.weight<fast.weight,
    'camera must retire with actual returned display duration, not render count alone');
  const stillPainted={...early,submittedFrames:12};
  assert.ok(plan(snapshot,stillPainted,prior,view)?.sourceBound,
    'returned original gateway survives ten rapid submissions if physically still visible');
  assert.ok(plan(snapshot,{...stillPainted,originalGatewayOpacity:0},prior,view)===null,
    'never borrow a retired old doorway to frame an unrelated new scene');
  assert.equal(plan(snapshot,{...stillPainted,submittedFrames:20},prior,view),null);
  assert.equal(plan(snapshot,{...stillPainted,visibleSeconds:3},prior,view),null);
  assert.equal(plan({...snapshot,runToken:'other'},stillPainted,prior,view),null);
  assert.equal(plan({...snapshot,floor:10},stillPainted,prior,view),null);
  assert.equal(plan(snapshot,stillPainted,prior,{...view,camera:'manual'}),null);
  assert.equal(JSON.stringify([snapshot,held,prior]),before);
});
