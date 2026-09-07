'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadGame7() {
  return require('../../../../dist/games/marble-survival/src/index.js');
}

test('public presentation snapshot API is exported by the authoritative Game 7 package', () => {
  const game = loadGame7();
  assert.equal(typeof game.createMarblePublicSnapshot, 'function');
});
