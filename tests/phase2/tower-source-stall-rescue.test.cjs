'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerObservation } = require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const { chooseTowerAction } = require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const { nextTowerTacticalPlatform } = require('../../dist/games/infinite-tower-climb/src/ai/graph.js');
function fixture() {
  const s = structuredClone(TowerRuntime.create({ maxTicks: 5000, noProgressTicks: 2200 },
    'source-stall-rescue', { policy: 'autonomous' }).state);
  const chunk = s.chunks.find(item => item.floor === s.floor);
  const support = chunk.platforms.find(item => item.id === s.player.groundedPlatformId)
    ?? chunk.platforms[0];
  s.player.position = { x: support.x + Math.floor(support.width / 2),
    y: support.y + support.height + s.player.halfHeight };
  s.player.velocity = { x: 0, y: 0 };
  s.player.grounded = true;
  s.player.groundedPlatformId = support.id;
  s.ai.targetPlatformId = undefined;
  s.ai.recentHeights = Array(40).fill(s.height);
  s.enemies = []; s.projectiles = []; s.pickups = [];
  chunk.hazards = [];
  return { s, support, chunk };
}
test('true stalled ascent uses a connected observed target instead of 20Hz left/right thrashing', () => {
  const { s, support } = fixture();
  const observation = createTowerObservation(s), unchanged = structuredClone(observation);
  const connected = nextTowerTacticalPlatform(observation, s.config,
    support.id, undefined, s.player.halfWidth, s.player.halfHeight);
  assert.ok(connected, 'generated floor should expose a real next deck');
  const first = chooseTowerAction(s, observation), again = chooseTowerAction(s, observation);
  assert.equal(first.intent.mode, 'recovering');
  assert.equal(first.intent.fallbackUsed, true);
  assert.equal(first.intent.targetPlatformId, connected.id);
  assert.equal(first.intent.summary, 'Recovering toward an observed ascent deck');
  assert.deepEqual(first, again, 'same source observation must always yield same input');
  assert.ok(first.action.jump || first.action.move !== 0,
    'recovery must use the real launch controller rather than idle');
  assert.deepEqual(observation, unchanged, 'policy must not mutate source observation');
});
test('stalled airborne route retains observed target and physical air steering', () => {
  const { s, support } = fixture();
  const target = nextTowerTacticalPlatform(createTowerObservation(s), s.config,
    support.id, undefined, s.player.halfWidth, s.player.halfHeight);
  assert.ok(target);
  s.ai.targetPlatformId = target.id;
  s.player.grounded = false;
  s.player.position.y = target.y + target.height + s.player.halfHeight + 50000;
  s.player.velocity = { x: 0, y: -2500 };
  const decision = chooseTowerAction(s, createTowerObservation(s));
  assert.equal(decision.intent.mode, 'recovering');
  assert.equal(decision.intent.targetPlatformId, target.id);
  assert.equal(decision.intent.fallbackUsed, true);
  assert.ok([-1, 0, 1].includes(decision.action.move));
  assert.equal(decision.action.attack, false);
});
test('no present route cannot invent an ascent or spend mobility resources', () => {
  const { s, support, chunk } = fixture();
  chunk.platforms = [support];
  const decision = chooseTowerAction(s, createTowerObservation(s));
  assert.equal(decision.intent.mode, 'recovering');
  assert.equal(decision.intent.targetPlatformId, undefined);
  assert.equal(decision.intent.summary, 'No observed supported recovery route');
  assert.deepEqual(decision.action, { move: 0, jump: false, dash: false,
    attack: false, ability: false });
});
test('historical tactical:false recovery remains byte-for-byte old left/right action policy', () => {
  const { s } = fixture();
  s.tick = 40;
  const even = chooseTowerAction(s, createTowerObservation(s), { tactical: false });
  s.tick = 41;
  const odd = chooseTowerAction(s, createTowerObservation(s), { tactical: false });
  assert.equal(even.intent.summary, 'Breaking a repeated height cycle');
  assert.equal(odd.intent.summary, 'Breaking a repeated height cycle');
  assert.equal(even.action.move, 1);
  assert.equal(odd.action.move, -1);
  assert.equal(even.intent.targetPlatformId, undefined);
});
