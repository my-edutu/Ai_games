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
  [old,{...next,player:{...next.player,x:x+12000}}],
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
  assert.ok(threshold&&memory&&inlay);
  assert.equal(inlay.visible,true,'earned cap path is visible before crossing');
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
  assert.equal(effect.diagnostics().inlayFromX,gate);
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
  assert.equal(effect.begin(old,next,anchor),true);
  assert.equal(effect.diagnostics().continuousGroundedHandoff,false);
  assert.equal(effect.diagnostics().exteriorMemoryFrameVisible,true);
  assert.equal(effect.diagnostics().innerDoorAssemblyVisible,false);
  assert.equal(effect.diagnostics().physicallyWalkableThreshold.extraDraws,0);
 }finally{effect.dispose();}
});
