const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');
const character = require('../../dist/games/eko-street-run/src/presentation/character/index.js');

function snapshot(tick, vx, facing = 1) {
  const config = eko.createDefaultConfig({ seed: 'phase3-review1' });
  const state = eko.createInitialState(config);
  state.tick = tick;
  state.player.velocity.x = vx;
  state.player.facing = facing;
  state.player.movementState = 'grounded';
  return eko.createRenderSnapshot(state, []);
}

test('presentation contract carries facing so renderers do not need a second authority read', () => {
  const right = character.createCharacterPresentation(snapshot(20, 5, 1));
  const left = character.createCharacterPresentation(snapshot(20, 5, -1));
  assert.equal(right.facing, 1);
  assert.equal(left.facing, -1);
  assert.equal(left.pose.landmarks.head.x, -right.pose.landmarks.head.x);
  assert.equal(left.pose.lean, -right.pose.lean);
});

test('previous public snapshot makes acceleration and braking explicit without hidden state', () => {
  const slow = snapshot(30, 1);
  const fast = snapshot(31, 4);
  const slowing = snapshot(32, 2);
  assert.equal(character.resolveCharacterFrame(fast, slow).animation, 'acceleration');
  assert.equal(character.resolveCharacterFrame(slowing, fast).animation, 'brake');
});

test('presentation facing remains collision-neutral and cannot change authoritative checksum', () => {
  const config = eko.createDefaultConfig({ seed: 'phase3-review1-authority' });
  const state = eko.createInitialState(config);
  const baseline = eko.checksumState(state);
  const publicSnapshot = eko.createRenderSnapshot(state, []);
  character.createCharacterPresentation(publicSnapshot, { outfitId: 'igbo-isi-agu-red-cap' });
  assert.equal(eko.checksumState(state), baseline);
});
