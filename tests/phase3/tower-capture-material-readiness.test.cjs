'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { waitForSettledTowerStone } = require('../../scripts/tower-capture-ready.cjs');

function frame(state, frames, overrides = {}) {
  return {
    frames, renderErrors: 0,
    world: { surfaceTexture: { state, width: state === 'ready' ? 1254 : 0,
      height: state === 'ready' ? 1254 : 0, ...overrides } },
  };
}

function fakePage(states) {
  let index = 0;
  const observations = [];
  const install = () => {
    globalThis.window = { __TOWER_RENDER_DIAGNOSTICS__: () => states[index] };
  };
  return {
    observations,
    async waitForFunction(fn, arg) {
      observations.push({ type: 'wait', start: index });
      while (index < states.length) {
        install();
        const value = fn(arg);
        if (value) return { jsonValue: async () => value, dispose: async () => {} };
        index++;
      }
      throw new Error('Timed out waiting for browser predicate');
    },
    async evaluate(fn) { install(); return fn(); },
  };
}

test('capture waits for loaded stone dimensions and two post-load rendered frames', async () => {
  const page = fakePage([frame('loading', 4), frame('loading', 5), frame('ready', 6),
    frame('ready', 7), frame('ready', 8)]);
  const final = await waitForSettledTowerStone(page);
  assert.equal(final.frames, 8);
  assert.equal(final.world.surfaceTexture.state, 'ready');
  assert.equal(page.observations.length, 2);
});

test('a failed stone decode is a failed evidence capture, not an untextured pass', async () => {
  await assert.rejects(waitForSettledTowerStone(fakePage([frame('loading', 4), frame('failed', 4)])),
    /stone.*failed/i);
});

test('a decoded but dimensionless stone texture cannot validate material quality', async () => {
  await assert.rejects(waitForSettledTowerStone(fakePage([frame('ready', 4, { width: 0 })])),
    /dimensions/i);
});

test('a source capture without new post-load frames cannot pass', async () => {
  await assert.rejects(waitForSettledTowerStone(fakePage([frame('ready', 4), frame('ready', 5)])),
    /Timed out/);
});

test('render errors after material upload block visual evidence', async () => {
  const bad = { ...frame('ready', 6), renderErrors: 1 };
  await assert.rejects(waitForSettledTowerStone(fakePage([frame('ready', 4), frame('ready', 5), bad])),
    /render errors/i);
});

test('capture cannot disable the post-upload render verification', async () => {
  await assert.rejects(waitForSettledTowerStone(fakePage([frame('ready', 4)]), { renderFrames: 0 }),
    /renderFrames/);
});
