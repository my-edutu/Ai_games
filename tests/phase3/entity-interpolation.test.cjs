'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EntityRegistry } = require('../../dist/games/autonomous-snake/src/presentation/entities.js');

function snapshot(tick, cell) {
  return {
    version: 1,
    runToken: 'portal-run',
    revision: tick,
    tick,
    width: 10,
    height: 10,
    snake: [{ id: 'snake-0', cell, role: 'head' }],
    food: null,
    obstacles: [],
    hazards: [],
    portals: [],
  };
}

test('shared entity interpolation snaps discontinuous portal-sized jumps', () => {
  const registry = new EntityRegistry();
  registry.apply(snapshot(1, 10));
  registry.apply(snapshot(2, 89));

  assert.deepEqual(registry.interpolate('snake-0', 0.49, 10), { x: 0, y: 1 });
  assert.deepEqual(registry.interpolate('snake-0', 0.51, 10), { x: 9, y: 8 });
});

test('shared entity interpolation remains smooth for adjacent grid movement', () => {
  const registry = new EntityRegistry();
  registry.apply(snapshot(1, 10));
  registry.apply(snapshot(2, 11));
  assert.deepEqual(registry.interpolate('snake-0', 0.5, 10), { x: 0.5, y: 1 });
});
