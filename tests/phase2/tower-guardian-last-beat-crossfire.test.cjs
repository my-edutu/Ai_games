'use strict';
// A real source-observed physical crossfire, not an isolated model or
// a verdict on the transformation quality of the whole 3D game.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerObservation } = require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const { chooseTowerAction } = require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const { STREAM_CONFIG } = require('../../scripts/serve-tower-stream.cjs');

function collisionWindow(ticksUntilCrusher = 2) {
  const runtime = TowerRuntime.create({...STREAM_CONFIG, launchFloor: 8},
    'tower-last-beat-crossfire',{policy:'autonomous'});
  const state = structuredClone(runtime.state);
  const cap = state.chunks[0].platforms.find(x => x.id === 'f8:cap');
  const crusher = state.chunks[0].hazards.find(x => x.id === 'f8:guardian-shutter');
  const guardian = state.enemies.find(x => x.kind === 'guardian');
  assert.ok(cap && crusher && guardian, 'original streamed guardian and crusher');
  assert.ok(state.config.guardianArenaHazards && state.config.guardianSecondWind);
  state.tick = crusher.activeFromTick - ticksUntilCrusher;
  state.player.position = {x: crusher.x + Math.floor(crusher.width / 2),
    y: cap.y + cap.height + state.player.halfHeight};
  state.player.velocity = {x:0,y:0};
  state.player.state = 'standing';
  state.player.grounded = true;
  state.player.groundedPlatformId = cap.id;
  state.player.health = state.player.maxHealth;
  state.player.attackCooldown = 7;
  state.projectiles = [];
  guardian.position = {x: state.player.position.x - 30000, y: state.player.position.y};
  guardian.facing = 1;
  guardian.telegraphUntilTick = state.tick + 2;
  guardian.cooldown = 0;
  return {state,crusher,guardian};
}

test('an actual 2-tick guardian shot cannot hide a MORE urgent closing physical crusher',()=>{
  const {state,crusher} = collisionWindow(2);
  const observation = createTowerObservation(state,{includeHazardWindup:true});
  assert.equal(observation.hazards.find(x => x.id === crusher.id).chargeTicksRemaining,2);
  const original = structuredClone(state);
  const decision = chooseTowerAction(state,observation);
  assert.equal(decision.intent.mode,'evading-hazard',
    'the physically closing jaw gets the last-beat escape action and coherent 3D warning');
  assert.ok(decision.action.move !== 0 || decision.action.jump,
    'only real lateral movement or ordinary jump physics may resolve the crossfire');
  assert.equal(decision.action.attack,false,
    'a hazardous shot warning does not grant a scripted guardian hit');
  assert.equal(decision.action.ability,false,
    'a closing shutter never grants a free counter-projectile');
  assert.deepEqual(state,original,'crossfire arbitration must not mutate authoritative state');
  assert.deepEqual(chooseTowerAction(state,observation),decision,
    'replay and repeated observation keep the same tactical choice');
});

test('an unannounced shutter and historical-v1 cannot manufacture new physical crossfire',()=>{
  const {state,guardian} = collisionWindow(2);
  const previous = structuredClone(state);
  // The source crusher is not yet charging. It must not steal camera/AI
  // priority from the genuinely published guardian windup.
  previous.tick = state.chunks[0].hazards.find(x => x.id === 'f8:guardian-shutter').activeFromTick - 14;
  previous.enemies.find(x => x.id === guardian.id).telegraphUntilTick = previous.tick + 2;
  const observation = createTowerObservation(previous,{includeHazardWindup:true});
  const shutter = observation.hazards.find(x => x.id === 'f8:guardian-shutter');
  assert.equal(shutter.chargeTicksRemaining,0);
  assert.equal(chooseTowerAction(previous,observation).intent.mode,'evading-telegraph');
  const legacy = chooseTowerAction(state,createTowerObservation(state),{tactical:false});
  assert.notEqual(legacy.intent.mode,'evading-hazard',
    'frozen historical policy has no published shutter countdown and no new reflex');
});
