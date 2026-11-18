'use strict';
// Original source-grounded Floor 8 -> 9 rendered-portal continuity.
// This verifies physical source provenance and reusable 3D stage lifecycle,
// not native-film event alignment or a LOOKS/FEELS/PLAYS vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=import('three');
const passage=import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const halfWidth=9000,halfHeight=14000;
const x=gate+halfWidth+4000;
const y=cap.y+cap.height+halfHeight;
const radius=27.78, angle=.24;
const anchor={x:Math.sin(angle)*radius,y:17.5,z:Math.cos(angle)*radius,angle};
function source(){
 return {runToken:'earned-real-run',floor:8,tick:450,lifecycle:'running',
   guardianExitX:gate,worldWidth:480000,chunkBaseY:2880000,
   platforms:[cap], enemies:[{id:'f8:guardian',kind:'guardian',floor:8,
     x:235000,y:cap.y+cap.height+18000,halfHeight:18000,
     active:false,health:0,maxHealth:8}],
   player:{health:4,grounded:true,groundedPlatformId:cap.id,
     x,y,halfWidth,halfHeight}};
}
function successor(){
 return {runToken:'earned-real-run',floor:9,tick:451,lifecycle:'running',
   chunkBaseY:2880000,worldWidth:480000,platforms:[{id:'f9:ground',kind:'solid',x:0,
     y:cap.y,width:480000,height:cap.height}],enemies:[],
   player:{health:5,grounded:true,groundedPlatformId:'f9:ground',
     x,y,halfWidth,halfHeight}};
}
test('only a physically grounded defeated-guardian crossing on the same supported next-floor deck retains the real arch',async()=>{
 const {observedGroundedGuardianHandoff}=await passage;
 const old=source(),next=successor(),untouched=JSON.stringify([old,next]);
 assert.equal(observedGroundedGuardianHandoff(old,next),true);
 assert.equal(JSON.stringify([old,next]),untouched);
 const mutants=[
  [{...old,guardianExitX:undefined},next],
  [{...old,guardianExitX:gate+1},next],
  [{...old,enemies:[{...old.enemies[0],active:true,health:1}]},next],
  [{...old,player:{...old.player,grounded:false}},next],
  [{...old,player:{...old.player,x:gate-15000}},next],
  [{...old,player:{...old.player,groundedPlatformId:'f8:p4'}},next],
  [old,{...next,runToken:'other'}],
  [old,{...next,floor:10}],
  [old,{...next,player:{...next.player,x:x+19000}}], // Impossible >18k per fixed step; source must never teleport
  [old,{...next,player:{...next.player,y:y+3000}}],
  [old,{...next,player:{...next.player,grounded:false}}],
  [old,{...next,player:{...next.player,groundedPlatformId:'f9:p1'}}],
  [old,{...next,platforms:[{...next.platforms[0],x:x+halfWidth+1}]}],
  [old,{...next,platforms:[{...next.platforms[0],y:cap.y+1000}]}],
 ];
 for(const [before,after] of mutants)
  assert.equal(observedGroundedGuardianHandoff(before,after),false);
});
test('actual open Floor8 arch stays at radius 25 THROUGH the Floor9 scene rebuild instead of swapping to exterior memory',async()=>{
 const [THREE_IMPL,{createTowerGuardianPassage}]=await Promise.all([THREE,passage]);
 const effect=createTowerGuardianPassage(THREE_IMPL);
 try{
  const old=source(),next=successor();
  assert.equal(effect.unlock(old,anchor),true);
  effect.update(.15);
  const threshold=effect.group.getObjectByName('ObservedWalkableGuardianThreshold');
  const memory=effect.group.getObjectByName('EarnedGuardianPassageMemory');
  const inlay=effect.group.getObjectByName('WitnessedGuardianCapWalkwayInlay');
  const edge=effect.group.getObjectByName('SourceSupportedGuardianThresholdEdgeRun');
  assert.ok(threshold&&memory&&inlay&&edge?.isInstancedMesh);
  assert.equal(inlay.visible,true,'earned cap path is visible before crossing');
  assert.equal(edge.count,24,'two true-roof edges share each earned path section');
  assert.equal(edge.castShadow,false);
  assert.equal(edge.userData.collider,undefined);
  assert.equal(effect.diagnostics().supportedRouteEdgePieces,24);
  assert.equal(effect.diagnostics().supportedRouteEdgeDraws,1);
  const oldInlay=new THREE_IMPL.Matrix4();
  inlay.getMatrixAt(0,oldInlay);
  assert.equal(threshold.visible,true);
  assert.equal(memory.visible,false);
  const before=threshold.getWorldPosition(new THREE_IMPL.Vector3());
  assert.equal(effect.begin(old,next,anchor),true);
  effect.update(.02);
  const after=threshold.getWorldPosition(new THREE_IMPL.Vector3());
  assert.deepEqual(after.toArray(),before.toArray(),'no doorway teleport between source frames');
  assert.equal(threshold.visible,true,'the walkable arch cannot disappear exactly at the source transition');
  assert.equal(memory.visible,false,'no second fake exterior arch overlays the boot path');
  assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
  assert.equal(effect.diagnostics().physicallyWalkableThreshold.extraDraws,2);
  assert.equal(effect.diagnostics().physicallyWalkableThreshold.innerRadius,25);
  assert.equal(effect.diagnostics().stage,'handoff');
  assert.equal(inlay.visible,true,'new-floor real grounded lane continues the physical bronze story');
  assert.equal(effect.diagnostics().inlayMode,'successor-ground');
  assert.equal(edge.count,24,'old supported cap and successor ground connect through the same route owner');
  const a=new THREE_IMPL.Matrix4(),b=new THREE_IMPL.Matrix4(),
    pa=new THREE_IMPL.Vector3(),pb=new THREE_IMPL.Vector3();
  edge.getMatrixAt(0,a);edge.getMatrixAt(1,b);
  pa.setFromMatrixPosition(a);pb.setFromMatrixPosition(b);
  assert.ok(pa.distanceTo(pb)>2.2 && pa.distanceTo(pb)<2.7,
    'source-anchored strips flank, not obstruct, the climber');
  edge.getMatrixAt(8,b);
  assert.notDeepEqual(a.elements,b.elements,
    'real successor roof must not reuse old-cap strip positions');
  assert.equal(effect.diagnostics().inlayFromX,Math.max(cap.x,gate-32000),
    'four physical old-cap marks now survive before the real Floor9 runway');
   assert.equal(effect.diagnostics().inlayInheritedOldCapPieces,4);
   assert.equal(effect.diagnostics().retainedOldCapPieces,12);
  assert.ok(effect.diagnostics().inlayToX>x+35000);
  const newInlay=new THREE_IMPL.Matrix4();
  inlay.getMatrixAt(0,newInlay);
  assert.notDeepEqual(newInlay.elements,oldInlay.elements,
    'Floor9 builds a NEW grounded path, never reuses obsolete cap matrices');
  const initial=effect.diagnostics().inlayProgress;
  assert.equal(effect.trackSuccessor({...next,tick:452,
    player:{...next.player,x:x+10000}}),true);
  assert.ok(effect.diagnostics().inlayProgress>initial,
    'only authentic next-floor walking advances the visible treads');
  const now=effect.diagnostics().inlayProgress;
  assert.equal(effect.trackSuccessor({...next,tick:453,
    player:{...next.player,x:x+30000}},true),false);
  assert.equal(effect.diagnostics().inlayProgress,now,'stale source cannot make a new step');
  assert.equal(effect.trackSuccessor({...next,tick:454,
    player:{...next.player,grounded:false}}),false);
  assert.equal(inlay.visible,false,'the trail retires when source feet leave the supported ground');
  assert.equal(edge.visible,false,'un-grounded successor cannot retain visual walkway');
  assert.equal(effect.diagnostics().supportedRouteEdgePieces,0);
  effect.update(.3,{reducedMotion:true});
  assert.equal(threshold.visible,true);
  effect.update(.3,{stale:true});
  assert.equal(threshold.visible,true);
  // The original test assumed every attempted CPU frame was painted. Cold
  // Floor9 WebGL can block for several seconds. A source receipt MUST NOT
  // expire an arch that has not yet survived an actual renderer.render return.
  assert.equal(effect.diagnostics().handoffSubmittedFrames,0);
  assert.equal(effect.noteFrameSubmitted(next,{stale:true}),false);
  assert.equal(effect.noteFrameSubmitted(next),true);
  for(let n=0;n<15;n++)effect.update(.25);
  assert.equal(effect.group.visible,false,
    'after a genuine submitted source frame, the bounded visible memory must retire');
 }finally{effect.dispose();}
});
test('historic immediate floor change keeps the original short exterior memory instead of inventing a physical gateway',async()=>{
 const [THREE_IMPL,{createTowerGuardianPassage}]=await Promise.all([THREE,passage]);
 const effect=createTowerGuardianPassage(THREE_IMPL);
 try{
  const old={...source(),enemies:[{...source().enemies[0],active:true,health:1}]};
  const next=successor();
  assert.equal(effect.unlock(source(),anchor),true);
  assert.equal(effect.diagnostics().supportedRouteEdgePieces,24,
    'earned previous source may have an authentic pre-crossing guide');
  assert.equal(effect.begin(old,next,anchor),true);
  assert.equal(effect.diagnostics().supportedRouteEdgePieces,0,
    'a contradictory living-guardian source cannot inherit a visual walkable Floor9');
  assert.equal(effect.diagnostics().inlayPieces,0);
  assert.equal(effect.diagnostics().continuousGroundedHandoff,false);
  assert.equal(effect.diagnostics().exteriorMemoryFrameVisible,true);
  assert.equal(effect.diagnostics().innerDoorAssemblyVisible,false);
  assert.equal(effect.diagnostics().physicallyWalkableThreshold.extraDraws,0);
 }finally{effect.dispose();}
});


test('real 20Hz browser gap still carries the authentic Floor8->9 opened arch, never a fake floor jump',async()=>{
  // Native 2026-11-12 original 960x600 and 390x844 danger films:
  // independent public source has ALL ticks 443..454, but the browser
  // observes grounded defeated Floor8 tick443 and next submitted Floor9
  // tick454 after a cold WebGL frame. Exact 50ms source positions are
  // 291896->338096 and continuous supported roof y=3238000.
  const [THREE_IMPL,{createTowerGuardianPassage,observedGroundedGuardianHandoff,
    observedFloorNineRunway}]=await Promise.all([THREE,passage]);
  const before=source(),after=successor();
  before.tick=443;before.player.x=291896;
  after.tick=454;after.player.x=338096;
  assert.equal(before.player.y,3238000);
  assert.equal(after.player.y,3238000);
  assert.equal(observedGroundedGuardianHandoff(before,after),true,
    'bounded missing browser frames must not suppress the real defeated guardian crossing');
  assert.ok(observedFloorNineRunway(before,after),
    'the original Floor9 grounded runway must survive a 550ms browser gap');
  const effect=createTowerGuardianPassage(THREE_IMPL);
  try {
    assert.equal(effect.begin(before,after,anchor),true,
      'cold, never-painted earned-open arch must not be a prerequisite');
    assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
    assert.equal(effect.diagnostics().inlayMode,'successor-ground');
    assert.equal(effect.diagnostics().innerDoorAssemblyVisible,true);
    assert.equal(effect.noteFrameSubmitted(after),true);
  }finally{effect.dispose();}
  const invalid=[
    [{...before,runToken:'old-run'},after],
    [{...before,enemies:[{...before.enemies[0],active:true,health:1}]},after],
    [{...before,guardianExitX:undefined},after],
    [{...before,player:{...before.player,grounded:false}},after],
    [before,{...after,tick:471}],
    [before,{...after,player:{...after.player,x:470000}}],
    [before,{...after,player:{...after.player,groundedPlatformId:'f9:p2'}}],
    [before,{...after,platforms:[{...after.platforms[0],y:cap.y+1000}]}],
  ];
  for(const [a,b] of invalid) {
    assert.equal(observedGroundedGuardianHandoff(a,b),false,
      'source-stale, fabricated, unsupported and impossible hops still veto the carry');
    assert.equal(observedFloorNineRunway(a,b),null);
  }
});


// Native source-pinned run 43734553251: an original 6.8m bronze forecourt
// occludes the real skinned actor near earned Floor8→9 in BOTH viewports.
// Enforce original load-bearing clearspan, not camera opacity or fake portal.
test('source-earned old/new shared 3D threshold has a broad sightline aperture and a real crown', async () => {
 const [THREE_IMPL,{createTowerGuardianPassage}]=await Promise.all([THREE,passage]);
 const effect=createTowerGuardianPassage(THREE_IMPL);
 try {
  const old=source(),next=successor();
  assert.equal(effect.unlock(old,anchor),true);
  assert.equal(effect.begin(old,next,anchor),true);
  const threshold=effect.group.getObjectByName('ObservedWalkableGuardianThreshold');
  const arches=threshold?.getObjectByName('WalkableSourceCapArchAndBraces');
  assert.ok(arches?.isInstancedMesh && arches.count===7,
    'source-retained original walkable doorway must contain open piers, crown, outboard shoes and stays');
  const pose=new THREE_IMPL.Matrix4(),p=new THREE_IMPL.Vector3(),
    q=new THREE_IMPL.Quaternion(),s=new THREE_IMPL.Vector3();
  const parts=[];
  for(let i=0;i<arches.count;i++){
    arches.getMatrixAt(i,pose);pose.decompose(p,q,s);
    parts.push({x:p.x,y:p.y,z:p.z,width:s.x,height:s.y,depth:s.z});
  }
  const [left,right,crown,leftShoe,rightShoe,leftStay,rightStay]=parts;
  assert.ok(left.x<-4 && right.x>4,
    'old bronze side piers must stand physically outside the whole-body portrait sightline');
  assert.ok(-left.x-left.width/2>3.75 && right.x-right.width/2>3.75,
    'both piers give a real uninterrupted >=7.5m source gateway aperture');
  assert.ok(crown.y-crown.height/2>5.0 && crown.width>8.2,
    'a real continuous lintel must crown above the adult airborne silhouette');
  // Original 390x844 candidate 9fcf62e, F9 tick484: the old
  // full-width index-3 source sill intersected a real body-CENTRE ray
  // at 33.328m with opacity .82, despite a geometrically safe camera.
  // Two boot-low masonry shoes cannot form that opaque central wall.
  for(const shoe of [leftShoe,rightShoe])
    assert.ok(shoe.y+shoe.height/2<.2 && shoe.width<=.85,
      'the original doorway keeps low, narrow footings, not a full-width bar');
  assert.ok(leftShoe.x+leftShoe.width/2<=-3.3 &&
    rightShoe.x-rightShoe.width/2>=3.3,
    'both source masonry feet must clear at least 6.6m of central body corridor');
  assert.ok(Math.abs(leftShoe.x+rightShoe.x)<.001 &&
    Math.abs(leftShoe.width-rightShoe.width)<.001,
    'the original old/new walkable arch keeps a symmetric physical doorway');
  assert.ok(leftStay.x<-4 && rightStay.x>4,
    'source-tensile corner stays are genuinely outboard rather than a centred foreground X');
  assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
  assert.equal(effect.diagnostics().physicallyWalkableThreshold.innerRadius,25,
    'the wider arch belongs to the real supported climber radius');
  assert.equal(arches.userData.collider,undefined);
  assert.equal(arches.castShadow,false);
  assert.equal(arches.receiveShadow,false);
 }finally{effect.dispose();}
});


// Authentic 1x portrait source trace, immutable candidate d72fa0f1, captured
// 2026-11-15: the old browser last rendered grounded F8 tick474 while a
// cold software-WebGL frame skipped to grounded F9 tick489. The separate
// source traced the true 475 crossing, but next.lastGuardianCrossing had
// expired in the browser before first F9 paint. This must not replace a
// real original walkable gate with the non-walkable exterior memorial.
test('15-tick sparse portrait first F9 paint keeps defeated original cap and physically supported doorway; unsafe sparse routes veto',async()=>{
 const {observedGroundedGuardianHandoff,observedFloorNineRunway,
  createTowerGuardianPassage}=await passage;
 const old=source(),next=successor();
 old.tick=474;old.player.x=314796;next.tick=489;next.player.x=330096;
 assert.equal(next.lastGuardianCrossing,undefined,
   'this actual browser viewport had no still-published immutable crossing');
 const untouched=JSON.stringify([old,next]);
 assert.equal(observedGroundedGuardianHandoff(old,next),true,
  'sparse 750ms browser observations are not a 750ms simulated jump');
 assert.ok(observedFloorNineRunway(old,next),
  'grounded source corridor still leads into the real walkable F9 deck');
 const THREE_IMPL=await THREE;
 const effect=createTowerGuardianPassage(THREE_IMPL);
 try{
  assert.equal(effect.begin(old,next,anchor),true);
  assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
  assert.equal(effect.diagnostics().innerDoorAssemblyVisible,true);
  assert.equal(effect.diagnostics().exteriorMemoryFrameVisible,false);
 }finally{effect.dispose();}
 assert.equal(JSON.stringify([old,next]),untouched,'no mutation of source records');
 for(const [a,b] of [
   [old,{...next,tick:495}], // 21-tick stale / unbounded first paint
   [{...old,runToken:'other-episode'},next],
   [{...old,player:{...old.player,grounded:false}},next],
   [{...old,enemies:[{...old.enemies[0],active:true,health:1}]},next],
   [{...old,guardianExitX:gate+1},next],
   [old,{...next,player:{...next.player,groundedPlatformId:'f9:p2'}}],
   [old,{...next,player:{...next.player,y:y+1000}}],
   [old,{...next,player:{...next.player,x:cap.x+cap.width+1}}],
   [old,{...next,platforms:[{...next.platforms[0],y:cap.y+1}]}]
 ]) assert.equal(observedGroundedGuardianHandoff(a,b),false,
  'no displaced, wrong-run, living-guardian or unsupported cap carry');
});
