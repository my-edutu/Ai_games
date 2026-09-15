'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase6(seed = 'phase6-economy') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

test('generated Eko Token collection is authoritative and idempotent', () => {
  let state = phase6('phase6-token');
  const token = state.progression.activeContent.tokens[0];
  assert.ok(token);
  state.player.position.x = token.x;
  const first = eko.stepSimulation(state, []);
  assert.equal(first.state.resources.ekoTokens, token.value);
  assert.ok(first.state.resources.collectedTokenIds.includes(token.id));
  assert.ok(first.events.some(event => event.type === 'token.collected'));

  const secondState = structuredClone(first.state);
  secondState.player.position.x = token.x;
  const second = eko.stepSimulation(secondState, []);
  assert.equal(second.state.resources.ekoTokens, token.value);
  assert.equal(second.state.resources.collectedTokenIds.filter(id => id === token.id).length, 1);
});

test('reward ledger is bounded and cosmetic unlocks never grant gameplay modifiers', () => {
  assert.equal(typeof eko.PHASE6_TOKEN_CAP, 'number');
  const state = phase6('phase6-ledger');
  state.resources.ekoTokens = eko.PHASE6_TOKEN_CAP;
  const token = state.progression.activeContent.tokens[0];
  state.player.position.x = token.x;
  const out = eko.stepSimulation(state, []);
  assert.equal(out.state.resources.ekoTokens, eko.PHASE6_TOKEN_CAP);
  assert.ok(out.state.resources.unlockedCosmetics.length <= 64);
  assert.equal('speedMultiplier' in out.state.resources, false);
  assert.equal('collisionModifier' in out.state.resources, false);
  assert.equal('invulnerable' in out.state.resources, false);
});

test('cosmetic reward state cannot alter kinematic movement outcome', () => {
  const base = phase6('phase6-cosmetic-neutral');
  const decorated = structuredClone(base);
  decorated.resources.ekoTokens = 500;
  decorated.resources.unlockedCosmetics = ['checkpoint-burst', 'trail-lagos-lines'];
  decorated.resources.unlockedThemes = ['sunset-accent'];
  decorated.resources.unlockedCelebrations = ['district-confetti'];

  const intent = { axis: 1, jumpPressed: true, jumpReleased: false, slide: false, vault: false };
  const a = eko.stepPlayerKinematic(base.player, base.route, intent, eko.createDefaultConfig({ seed: base.rootSeed }), base.tick);
  const b = eko.stepPlayerKinematic(decorated.player, decorated.route, intent, eko.createDefaultConfig({ seed: decorated.rootSeed }), decorated.tick);
  assert.deepEqual(a, b);
});

test('snapshot and restore retain progression/economy and exact checksum', () => {
  let state = phase6('phase6-restore');
  const token = state.progression.activeContent.tokens[0];
  state.player.position.x = token.x;
  state = eko.stepSimulation(state, []).state;
  const snapshot = eko.createSnapshot(state);
  const restored = eko.restoreSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.deepEqual(restored.progression, state.progression);
  assert.deepEqual(restored.resources, state.resources);
  assert.equal(eko.checksumState(restored), eko.checksumState(state));
});

test('render snapshot exposes public progression/reward facts without private generation seed keys', () => {
  const state = phase6('phase6-public');
  const snapshot = eko.createRenderSnapshot(state);
  assert.equal(snapshot.progression.districtId, 'mainland-morning');
  assert.equal(snapshot.progression.cycle, 0);
  assert.equal(snapshot.resources.ekoTokens, 0);
  const text = JSON.stringify(snapshot);
  assert.equal(text.includes('seedKey'), false);
  assert.equal(text.includes('randomStreams'), false);
  assert.equal(text.includes(state.rootSeed), false);
});
