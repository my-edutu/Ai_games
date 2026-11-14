'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('safety view renders a singleton portal tail at its occupied cell', async () => {
  const { createFallbackRenderer } = await import('../../public/snake-stream/fallback.mjs');
  const circles = [];
  const context = new Proxy({ arc: (...args) => circles.push(args) }, { get(target, name) { return target[name] || (() => {}); } });
  const canvas = { width: 528, height: 328, clientWidth: 528, clientHeight: 328, dataset: {}, getContext: () => context };
  const snapshot = { width: 10, height: 6, runToken: 'run', movementStep: 1, snake: [45, 44, 11].map((cell, id) => ({ cell, id })), food: null, obstacles: [], hazards: [], portals: [] };
  createFallbackRenderer(canvas).draw({ snapshot }, null, 1, 0, {});
  // 50px cells with a14px inset: cell11 must remain visible despite the portal split.
  assert.ok(circles.some(([x, y, radius]) => x === 89 && y === 89 && radius > 10));
});
