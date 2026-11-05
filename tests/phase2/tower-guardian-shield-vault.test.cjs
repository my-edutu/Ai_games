'use strict';
// A legal, source-backed jump during shield pressure, not free invulnerability
// or proof of better player experience. Physical/mobile film is still required.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function shieldCap({arena=true,corner=true}={}){
  const config={...STREAM_CONFIG,launchFloor:8,guardianSecondWind:true,
    guardianArenaHazards:arena};
  const state=structuredClone(TowerRuntime.create(config,
    'tower-shield-vault-source-v1',{policy:'autonomous'}).state);
  const cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const boss=state.enemies.find(e=>e.active&&e.kind==='guardian');
  assert.ok(cap&&boss,'a real generated cap and living guardian are required');
  const player=state.player;
  player.position={x:corner?cap.x+player.halfWidth+6100:
    cap.x+Math.floor(cap.width*.5),
    y:cap.y+cap.height+player.halfHeight};
  player.velocity={x:0,y:0};player.grounded=true;
  player.groundedPlatformId=cap.id;player.facing=1;
  player.attackCooldown=6;player.invulnerableTicks=0;
  boss.position={x:player.position.x+38000,y:player.position.y};
  boss.patrolMinX=cap.x+boss.halfWidth;
  boss.patrolMaxX=cap.x+cap.width-boss.halfWidth;
  boss.cooldown=20;boss.telegraphUntilTick=0;
  boss.guardUntilTick=state.tick+18;
  boss.staggerUntilTick=0;boss.health=4;
  state.enemies=[boss];state.projectiles=[];state.pickups=[];
  state.chunks[0].hazards=[];
  return {state,player,boss,cap};
}
test('cornered cap shield pressure yields a REAL legal jump and same-seed deterministic decision',()=>{
  const {state}=shieldCap();
  const original=structuredClone(state);
  const obs=createTowerObservation(state,{includeHazardWindup:true});
  const choice=chooseTowerAction(state,obs);
  assert.equal(choice.intent.mode,'bracing-guardian-shield');
  assert.equal(choice.action.jump,true);
  assert.equal(choice.action.move,0,'the edge must not be crossed by a lateral dodge');
  assert.equal(choice.action.attack,false,'raised armor is not secretly bypassed');
  assert.equal(choice.action.ability,false);
  assert.match(choice.intent.summary,/vault/i);
  const physics=stepTowerPhysics(state,choice.action);
  assert.equal(physics.state.player.grounded,false);
  assert.ok(physics.state.player.velocity.y>0,'actual 20Hz gravity owns the ascent');
  assert.equal(physics.state.player.attackCooldown,6,'physics cannot invent a strike');
  assert.equal(physics.state.stats.jumps,state.stats.jumps+1);
  assert.deepEqual(state,original,'policy and physics cannot mutate the source input');
  assert.deepEqual(chooseTowerAction(state,createTowerObservation(state,{includeHazardWindup:true})),choice);
});
test('wide cap still chooses normal supported spacing without unnecessary jump',()=>{
  const {state}=shieldCap({corner:false});
  const choice=chooseTowerAction(state,createTowerObservation(state,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'bracing-guardian-shield');
  assert.equal(choice.action.move,-1,'normal deck retreat is preferable to an aerial vault');
  assert.equal(choice.action.jump,false);
});
test('unflagged guardian shield duel and unrelated cap combat never inherit the vault',()=>{
  const {state}=shieldCap({arena:false});
  const choice=chooseTowerAction(state,createTowerObservation(state,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'bracing-guardian-shield');
  assert.equal(choice.action.jump,false,'historical opt-out is untouched');
  const oldPolicy=chooseTowerAction(state,createTowerObservation(state),{tactical:false});
  assert.equal(oldPolicy.action.jump,false,'frozen v1 never receives the cap vault');
});
