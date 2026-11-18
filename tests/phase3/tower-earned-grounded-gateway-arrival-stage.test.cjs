'use strict';
// P0 RED/GREEN: a real boss-gate Floor 8->9 crossing must be recognizably
// traversed ON THE GROUND in normal-speed native film, not immediately
// converted to an unrelated airborne floor-nine jump while WebGL is cold.
// This only selects honest 20Hz autonomous actions. It cannot award a
// guardian victory, modify a collider, simulate any frame or accept a film.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy');
const {guardianArenaExitX}=require('../../dist/games/infinite-tower-climb/src/generation/chunks');
const {checksum}=require('../../dist/packages/replay/src/index');

function sourceEarnedFloorNine(){
  const runtime=TowerRuntime.create({
    launchFloor:9,guardianInterval:8,guardianArenaHazards:true,
    guardianSecondWind:true,guardianGateActuationTicks:28,
    upgradeInterval:12,maxTicks:4000,noProgressTicks:1500
  },'real-gateway-arrival-stage-test');
  const state=runtime.state;
  const ground=state.chunks.find(c=>c.floor===9).platforms.find(p=>p.id==='f9:ground');
  assert.ok(ground);
  const cap={id:'f8:cap',
    x:Math.floor(state.config.worldWidth*.24),
    y:9*state.config.chunkHeight-28000,
    width:Math.floor(state.config.worldWidth*.52),height:12000};
  // This is exactly the same physical roof: old F8 cap, true F9 ground.
  assert.equal(ground.y+ground.height,cap.y+cap.height);
  const exitX=guardianArenaExitX(cap);
  state.tick=500;
  state.player.position={x:exitX+state.player.halfWidth+4000,
    y:ground.y+ground.height+state.player.halfHeight};
  state.player.velocity={x:state.config.maxRunSpeed,y:0};
  state.player.grounded=true;state.player.groundedPlatformId=ground.id;
  state.player.state='standing';
  state.player.health=state.player.maxHealth;
  // Disable unrelated combat/hazard stimuli for the traversal decision,
  // rather than weakening the production priority of real hazards.
  const chunk=state.chunks.find(c=>c.floor===9);
  chunk.hazards=[];state.enemies=[];state.projectiles=[];
  state.pickups=[];state.pendingUpgradeOffers=[];
  state.lastGuardianCrossing={
    runToken:checksum({runId:state.runId}),sourceTick:475,
    fromFloor:8,toFloor:9,
    cap,guardian:{id:'f8:guardian',kind:'guardian',floor:8,
      active:false,health:0,x:200000,y:cap.y+cap.height+18000,
      halfHeight:18000},
    exitX,previousX:exitX,previousY:state.player.position.y,
    previousHealth:state.player.maxHealth,
    crossingX:state.player.position.x,crossingY:state.player.position.y,
    halfWidth:state.player.halfWidth,halfHeight:state.player.halfHeight,
    worldWidth:state.config.worldWidth
  };
  return state;
}
function decide(state,age){
  state.tick=475+age;
  return chooseTowerAction(state,createTowerObservation(state),{tactical:true});
}

test('earned Floor 9 receives a real source-grounded arrival composition until the cold-world 1x film can show the doorway',()=>{
  const s=sourceEarnedFloorNine(),before=JSON.stringify(s);
  for(const age of [0,7,10,18,25,31,35]){
    const d=decide(s,age);
    assert.equal(d.intent.targetPlatformId,'f9:ground',
      'an earned successor cannot immediately abandon the actual gate roof');
    assert.equal(d.action.jump,false);
    assert.equal(d.action.dash,false);
    assert.equal(d.intent.mode,'aligning');
    assert.ok(d.intent.summary.includes(age<12 ? 'guardian threshold' : 'Floor Nine') ||
      d.intent.summary.includes(age<12 ? 'Floor Nine' : 'authentic landing'),
      'the actor's actual source-intent exposes the two observable grounded beats');
    assert.ok(d.action.move===0||d.action.move===1);
  }
  assert.equal(JSON.stringify({...s,tick:500}),before,
    'the policy observes real source but does not mutate it');
});
test('arrival staging expires at a source-bounded interval and wrong-run/fake roof cannot stage a portal',()=>{
  const s=sourceEarnedFloorNine();
  const old=decide(s,36);
  assert.notEqual(old.intent.summary,'Settling onto the real Floor Nine landing',
    'ordinary real traversal resumes once the full grounded shot is earned');
  s.tick=500;
  const contradicted={...s,lastGuardianCrossing:{...s.lastGuardianCrossing,
    guardian:{...s.lastGuardianCrossing.guardian,active:true,health:2}}};
  assert.notEqual(decide(contradicted,25).intent.targetPlatformId,'f9:ground');
  const noContact={...s,player:{...s.player,grounded:false,groundedPlatformId:undefined,
    state:'airborne'}};
  assert.notEqual(decide(noContact,25).intent.summary,
    'Settling onto the real Floor Nine landing');
});
