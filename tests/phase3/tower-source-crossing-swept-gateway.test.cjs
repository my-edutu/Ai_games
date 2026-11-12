'use strict';
// Source-authentic Floor 8 -> 9 physical traversal: native tick 450 -> 451.
// A moving climber crosses the clearance plane during the actual winning
// fixed step; equality of old/new X is NOT a valid source requirement.
// This contract never fabricates a victory, floor, collider or film pass.
const {test}=require('node:test');
const assert=require('node:assert/strict');
function awaitModule(){return import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');}
const oldCap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const ground={id:'f9:ground',kind:'ground',x:0,y:3212000,width:480000,height:12000};
const gate=oldCap.x+Math.floor(oldCap.width*.76);
const playerY=oldCap.y+oldCap.height+14000;
function genuine(){
  const old={runToken:'native-tick-450-451',floor:8,tick:450,
    lifecycle:'running',theme:'clockwork',guardianExitX:gate,
    worldWidth:480000,chunkBaseY:2880000,platforms:[oldCap],
    enemies:[{id:'f8:guardian',kind:'guardian',floor:8,active:false,health:0,x:235000,y:3239000,halfHeight:18000,halfWidth:14000}],
    player:{x:317096,y:playerY,halfWidth:9000,halfHeight:14000,
      grounded:true,groundedPlatformId:'f8:cap',health:3}};
  const next={runToken:old.runToken,floor:9,tick:451,
    lifecycle:'running',theme:'void',worldWidth:480000,chunkBaseY:3240000,
    platforms:[ground],enemies:[],player:{...old.player,x:324296,
      groundedPlatformId:'f9:ground',health:4}};
  return [old,next];
}
test('real 7200-unit source step crosses whole-body threshold and carries the one grounded doorway',async()=>{
  const {observedGroundedGuardianHandoff,observedFloorNineRunway,createTowerGuardianPassage}=await awaitModule();
  const [old,next]=genuine(),unchanged=JSON.stringify([old,next]);
  assert.equal(old.player.x<gate+old.player.halfWidth+4000,true);
  assert.equal(next.player.x>=gate+next.player.halfWidth+4000,true);
  assert.equal(observedGroundedGuardianHandoff(old,next),true,
    'source player advanced 7200 in a real 50ms tick, not zero');
  assert.ok(observedFloorNineRunway(old,next),'real successor ground carries the exit route');
  const THREE=await import('three');
  const effect=createTowerGuardianPassage(THREE);
  const angle=.24,anchor={x:Math.sin(angle)*27.78,y:17.5,z:Math.cos(angle)*27.78,angle};
  try{
    assert.equal(effect.unlock(old,anchor),true);
    assert.equal(effect.begin(old,next,anchor),true);
    assert.equal(effect.diagnostics().continuousGroundedHandoff,true);
    assert.equal(effect.diagnostics().innerDoorAssemblyVisible,true);
    assert.equal(effect.diagnostics().inlayMode,'successor-ground');
    assert.equal(effect.diagnostics().exteriorMemoryFrameVisible,false);
  }finally{effect.dispose();}
  assert.equal(JSON.stringify([old,next]),unchanged,'no authority mutation');
});
test('real crossing permission rejects unsupported teleport, stale and non-grounded replacements',async()=>{
  const {observedGroundedGuardianHandoff}=await awaitModule();
  const [old,next]=genuine();
  for(const [before,after] of [
    [old,{...next,player:{...next.player,x:old.player.x+18001}}],
    [old,{...next,player:{...next.player,x:old.player.x-1000}}],
    [old,{...next,player:{...next.player,y:next.player.y+1}}],
    [old,{...next,player:{...next.player,grounded:false}}],
    [old,{...next,runToken:'unrelated'}],
    [old,{...next,tick:450}],
    [old,{...next,worldWidth:450000}],
    [old,{...next,platforms:[{...ground,y:ground.y+1}]}],
    [{...old,enemies:[{id:'f8:guardian',kind:'guardian',active:true,health:1}]},next],
  ]) assert.equal(observedGroundedGuardianHandoff(before,after),false);
});
