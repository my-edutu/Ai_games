'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function chargedGuardian(distance=80000) {
  const runtime=TowerRuntime.create({maxTicks:4000,noProgressTicks:2000},
    'source-owned-counterfire-v1',{policy:'autonomous'});
  const state=structuredClone(runtime.state),p=state.player;
  const deck=state.chunks.find(c=>c.floor===state.floor).platforms[0];
  const side=deck.x+deck.width/2<state.config.worldWidth/2?1:-1;
  p.grounded=true;p.groundedPlatformId=deck.id;p.state='standing';
  p.position={x:deck.x+deck.width/2,y:deck.y+deck.height+p.halfHeight};
  p.velocity={x:0,y:0};p.facing=side;p.abilityCooldown=0;
  state.ai.targetPlatformId=undefined;state.ai.recentHeights=[];
  state.chunks[0].hazards=[];state.projectiles=[];
  state.build.upgradeIds=[...new Set([...state.build.upgradeIds,'pulse-shot'])];
  const guardian={id:'observed-guardian',kind:'guardian',floor:state.floor,
    position:{x:p.position.x+side*distance,y:p.position.y},
    velocity:{x:0,y:0},halfWidth:16000,halfHeight:18000,
    health:8,maxHealth:8,facing:-side,
    patrolMinX:0,patrolMaxX:state.config.worldWidth,
    cooldown:0,telegraphUntilTick:state.tick+6,active:true,damage:1};
  state.enemies=[guardian];
  return {runtime,state,guardian,side};
}

test('early real guardian windup permits earned centreline counter-shot while anchored safely',()=>{
  const {runtime,state}=chargedGuardian();
  const unmodified=JSON.stringify(state);
  const decision=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(decision.intent.mode,'bracing-telegraph');
  assert.equal(decision.action.jump,false,'late evasive jump has its own phase');
  assert.equal(decision.action.move,0,'safe planted counter-shot preserves footing');
  assert.equal(decision.action.ability,true,'actual learned Pulse Shot fires into current charged guardian');
  assert.equal(JSON.stringify(state),unmodified,'policy may not mutate authoritative state');
  const before=state.stats.projectilesFired;
  runtime.state=state;
  runtime.step();
  assert.equal(runtime.state.stats.projectilesFired,before+1,
    'real fixed-step combat launches the shot instead of a visual-only effect');
});

test('no upgrade, blocked cooldown, wrong facing or impossible height never trigger fictional fire',()=>{
  const {state,guardian}=chargedGuardian();
  state.build.upgradeIds=[];
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  state.build.upgradeIds=['pulse-shot'];state.player.abilityCooldown=8;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  state.player.abilityCooldown=0;state.player.facing*=-1;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  state.player.facing*=-1;guardian.position.y+=80000;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
});

test('short-range retreat and imminent danger outrank counter-fire',()=>{
  const {state,guardian,side}=chargedGuardian(12000);
  const retreat=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(retreat.intent.mode,'bracing-telegraph');
  assert.equal(retreat.action.move,-side,'real defensive room must still be created');
  assert.equal(retreat.action.ability,false,'do not discharge backwards while retreating');
  guardian.position.x+=side*65000;
  guardian.telegraphUntilTick=state.tick+2;
  const final=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(final.intent.mode,'evading-telegraph');
  assert.equal(final.action.jump,true);
  assert.equal(final.action.ability,false);
});

test('frozen tactical:false replay behaviour never gains the new counter-fire decision',()=>{
  const {state}=chargedGuardian();
  const legacy=chooseTowerAction(state,createTowerObservation(state),{tactical:false});
  assert.notEqual(legacy.intent.mode,'bracing-telegraph');
  assert.equal(legacy.action.ability,false);
});
