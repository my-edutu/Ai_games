'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const load = async () => (await import(
  '../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs'
)).createSightlineMatrixEpochCache;

function root() {
  return {
    isGroup: true,
    worldMatrixRefreshes: 0,
    updateWorldMatrix(updateParents, updateChildren) {
      assert.equal(updateParents, true);
      assert.equal(updateChildren, true);
      this.worldMatrixRefreshes++;
    },
  };
}

test('first Floor9 ray candidate synchronizes each genuine mesh owner once, then reuses the same matrices', async () => {
  const make = await load();
  const cache = make();
  const floor9 = root(), oldGate = root(), oldCap = root(), oldGallery = root();
  const incomingShaft = root();
  cache.beginFrame();
  for (let candidate = 0; candidate < 8; candidate++) {
    for (const realOwner of [floor9, oldGate, oldCap, oldGallery, incomingShaft]) {
      assert.equal(cache.sync(realOwner), candidate === 0);
    }
  }
  for (const realOwner of [floor9, oldGate, oldCap, oldGallery, incomingShaft])
    assert.equal(realOwner.worldMatrixRefreshes, 1,
      'eight alternate cameras must not trigger eight recursive mesh traversals');
});

test('next actual world frame resynchronizes moving decks even if authoritative source tick repeats', async () => {
  const make = await load();
  const cache = make(), movingDeck = root();
  cache.beginFrame();
  assert.equal(cache.sync(movingDeck), true);
  assert.equal(cache.sync(movingDeck), false);
  cache.beginFrame(); // May be the same 20Hz source snapshot at 25+ render fps.
  assert.equal(cache.sync(movingDeck), true);
  assert.equal(cache.sync(movingDeck), false);
  assert.equal(movingDeck.worldMatrixRefreshes, 2);
});

test('a new World, late-arriving root or graphics-recovery epoch cannot inherit stale matrix ownership', async () => {
  const make = await load();
  const old = make(), restored = make(), originalRoot = root();
  old.beginFrame();
  assert.equal(old.sync(originalRoot), true);
  restored.beginFrame();
  assert.equal(restored.sync(originalRoot), true,
    'fresh renderer/world must resynchronize shared source-owned meshes');
  const newBearing = root();
  assert.equal(old.sync(newBearing), true);
  assert.equal(old.sync(newBearing), false);
  old.beginFrame();
  assert.equal(old.sync(newBearing), true);
  assert.equal(old.sync(null), false);
  assert.equal(originalRoot.worldMatrixRefreshes, 2);
});
