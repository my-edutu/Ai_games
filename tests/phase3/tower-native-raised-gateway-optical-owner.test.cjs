'use strict';
// Real native 43776301618 portrait: a source-certified original gate is still
// 0.84 opaque at tick517, then all bronze structure vanishes at raised F9
// contact tick535. The short-lived lastGuardianCrossing can expire in a
// browser receipt; only an already VERIFIED original old-cap transfer and
// exact *current* raised source sole may restore its optical owner.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sourceModule=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');

function authenticRaised() {
  const runToken='earned-old-cap-current-raised-contact';
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const source={runToken,floor:9,theme:'void',lifecycle:'running',tick:535,
    player:{x:336796,y:3364000,halfWidth:9000,halfHeight:14000,
      grounded:true,groundedPlatformId:'f9:p2',state:'standing',vy:0,
      health:4},
    platforms:[
      {id:'f9:ground',x:105000,y:3212000,width:270000,height:12000},
      {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}],
    lastGuardianCrossing:null};
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,
    oldCapId:'f8:cap',oldCapX:cap.x,oldCapWidth:cap.width,
    oldRoofY:3224000,thresholdX,sourceTick:483,crossingTick:475,
    observedCrossingX:321096,observedCrossingY:3238000,
    observedHalfWidth:9000,observedHalfHeight:14000,
    raisedDeckSourceTick:535,firstWorldRenderTick:483,
    submittedFrames:9,visibleSeconds:.383,
    originalGatewayOpacity:1,opticalExitSubmitted:false};
  return {source,held,cap};
}
test('observed tick535 raised source keeps original bronze deck, gate and sky in ONE optical lifecycle even after short-lived crossing record expires',async()=>{
  const {observedSourceRetainedRaisedExit:raised,
    observedSourcePhysicalArrivalPalette:palette,
    observedSourceGatewayDeparturePresence:gate}=await sourceModule;
  const {source,held}=authenticRaised();
  const original=JSON.stringify({source,held});
  assert.equal(raised(source,held,held.oldRoofY),true,
    'historical source certificate + actual current f9:p2 sole must not be lost to an expiring event packet');
  const material=palette(source,held),door=gate(source,held);
  assert.equal(material?.sourceBound,true);
  assert.equal(door?.sourceBound,true);
  assert.equal(door.wholeBodyCleared,true);
  assert.ok(door.opacity>.5,
    'the still drawn 0.84-alpha bronze original cannot be forcibly replaced with void');
  assert.ok(material.oldWeight>.5,
    'sky/deck/shaft must stay materially coherent with currently opaque original gate, not flip violet');
  assert.ok(Math.abs(material.oldWeight-door.opacity)<.015,
    'shared genuine source and returned-frame lifetime must agree on material/physical gateway coverage');
  assert.equal(JSON.stringify({source,held}),original,'presentation cannot edit any source snapshot or GPU owner');
});
test('historical raised optical proof refuses forged previous ownership, live guardian, invalid contact and expired source',async()=>{
  const {observedSourceRetainedRaisedExit:raised,
    observedSourcePhysicalArrivalPalette:palette}=await sourceModule;
  const {source,held,cap}=authenticRaised();
  const mutants=[
    [s=>s.player.grounded=false,()=>{}],
    [s=>s.player.groundedPlatformId='f9:fake',()=>{}],
    [s=>s.platforms[1].y+=1000,()=>{}],
    [s=>s.player.x=500000,()=>{}],
    [s=>s.runToken='different-run',()=>{}],
    [s=>s.tick=600,()=>{}],
    [()=>{},h=>h.verifiedObservedFloorAdvance=false],
    [()=>{},h=>h.crossingTick=900],
    [()=>{},h=>h.oldCapWidth=1],
    [()=>{},h=>h.thresholdX+=2000],
    [()=>{},h=>h.observedHalfHeight=100],
    [s=>s.lastGuardianCrossing={runToken:s.runToken,fromFloor:8,toFloor:9,
      sourceTick:475,cap,exitX:held.thresholdX,crossingX:321096,
      guardian:{kind:'guardian',active:true,health:10}},()=>{}],
  ];
  for(const [mutateSource,mutateHeld] of mutants){
    const s=structuredClone(source),h=structuredClone(held);
    mutateSource(s);mutateHeld(h);
    assert.equal(raised(s,h,h.oldRoofY),false,'not a valid actual source raised continuation');
    assert.equal(palette(s,h),null,'invalid historical proof cannot color any 3D successor scene');
  }
});
test('real source-retained cap owner must recognize supported raised deck before retiring its ORIGINAL meshes',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceSuccessorRaisedDeck\(snapshot,held\.oldRoofY\)/);
  assert.match(world,/const onNewRoof[\s\S]{0,500}observedSourceRetainedRaisedExit\(/,
    'real raised deck cannot be excluded from onNewRoof just because ground is lower');
});
