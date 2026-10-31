'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../games/marble-survival/public/complete-runtime/identity-overlay.js'), 'utf8');

async function harness() {
  const calls = { text: [], clears: 0, fetches: 0 };
  const ctx = new Proxy({
    clearRect() { calls.clears++; calls.text = []; },
    fillText(text, x, y) { calls.text.push({ text, x, y }); },
    measureText(text) { return { width: text.length * 6 }; },
  }, { get: (target, key) => target[key] || (() => {}) });
  const canvas = { width: 1000, height: 600, getContext: () => ctx };
  const rect = { width: 1000, height: 600 };
  let ready = true;
  const shell = { dataset: {}, classList: { contains: () => ready } };
  const marble = { id: 1, number: 2, name: 'Sol', x: 500, y: 500,
    elevation: 0, palette: 'gold', status: 'racing' };
  const snapshot = { version: 1, tick: 10, arena: { id: 'arena-1', width: 1000, height: 1000 },
    round: { index: 0, remaining: 32 }, leaderboard: [{ id: 1 }],
    marbles: [marble], camera: { directive: { mode: 'overview', focusIds: [] }, championId: null } };
  const frame = { snapshot, arenaId: snapshot.arena.id, marbles: [marble], renderedAt: 100,
    viewProjection: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
  const queue = [];
  const window = { devicePixelRatio: 1, marbleRenderFrame: frame,
    addEventListener() {}, matchMedia: () => ({ matches: true }) };
  const document = { hidden: false, querySelector: () => shell,
    getElementById: id => id === 'arena-identity-overlay' ? canvas : { getBoundingClientRect: () => rect },
    addEventListener() {} };
  const sandbox = { window, document, performance: { now: () => 100 },
    setInterval() {}, requestAnimationFrame: cb => queue.push(cb),
    fetch: async () => { calls.fetches++; return { ok: true,
      json: async () => ({ ...snapshot, tick: 99, marbles: [{ ...marble, x: 900 }] }) }; } };
  vm.runInNewContext(source, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return { calls, shell, rect, window, frame, setReady: value => { ready = value; },
    render: now => { assert.ok(queue.length); queue.shift()(now); } };
}

for (const age of [0, 250, 1000]) {
  test(`identity uses the displayed WebGL frame after ${age}ms, not a newer independent camera`, async () => {
    const h = await harness(); h.render(100 + age);
    assert.equal(h.shell.dataset.identitySource, 'webgl-frame');
    assert.equal(h.shell.dataset.identityTick, '10');
    assert.equal(h.calls.text[0]?.text, '2');
    assert.equal(h.calls.text[0]?.x, 500);
  });
}
test('identity overlay does not poll authority separately from the renderer', async () => {
  const h = await harness(); h.render(100);
  assert.equal(h.calls.fetches, 0);
});
test('no rendered frame means no guessed competitor labels', async () => {
  const h = await harness(); h.window.marbleRenderFrame = null; h.render(300);
  assert.equal(h.calls.text.length, 0);
  assert.equal(h.shell.dataset.identitySource, 'unavailable');
});
test('mismatched arena or invalid clip matrix fails closed', async () => {
  for (const invalid of ['arena', 'matrix']) {
    const h = await harness();
    if (invalid === 'arena') h.frame.arenaId = 'other-arena';
    else h.frame.viewProjection[0] = NaN;
    h.render(100);
    assert.equal(h.calls.text.length, 0);
    assert.equal(h.shell.dataset.identitySource, 'unavailable');
  }
});
test('unchanged frame reuses labels, but a resized overlay is redrawn', async () => {
  const h = await harness(); h.render(100);
  const clears = h.calls.clears;
  h.render(350); assert.equal(h.calls.clears, clears, 'no redundant redraw for frozen WebGL frame');
  h.rect.width = 500; h.render(400);
  assert.equal(h.calls.text[0]?.x, 250);
});
test('WebGL context loss clears identity tags until a new frame is available', async () => {
  const h = await harness(); h.render(100); h.setReady(false); h.render(120);
  assert.equal(h.calls.text.length, 0);
  assert.equal(h.shell.dataset.identitySource, 'unavailable');
});
