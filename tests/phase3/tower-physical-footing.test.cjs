'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const match = source.match(/^function observedTowerFooting\(snapshot\) \{[\s\S]*?^\}/m);
assert.ok(match, 'test the real shipped source-derived footing function');
const footing = vm.runInNewContext(match[0] + '\nobservedTowerFooting', {});
const state = (overrides = {}) => ({
  runToken: 'real-run', floor: 3, tick: 12, lifecycle: 'running',
  worldWidth: 480000, chunkBaseY: 0,
  player: { x: 50000, y: 120000, halfHeight: 12000,
    halfWidth: 8000, state: 'standing', health: 5 },
  platforms: [{ id: 'deck-a', x: 20000, y: 88000, width: 80000, height: 20000 }],
  ...overrides,
});

test('physical footprint comes from the real overlapping support deck, not route intent', () => {
  const snapshot = state({ intent: { targetPlatformId: 'imaginary' } });
  const copy = JSON.stringify(snapshot);
  const result = footing(snapshot);
  assert.equal(result.platformId, 'deck-a');
  assert.equal(result.top, 108000);
  assert.equal(result.clearance, 0);
  assert.equal(result.grounded, true);
  assert.equal(JSON.stringify(snapshot), copy, 'renderer cannot change authority');
});

test('airborne source altitude softens the exact lower deck with no predicted contact', () => {
  const result = footing(state({ player: { x: 50000, y: 174000,
    halfHeight: 12000, halfWidth: 8000, state: 'airborne', health: 5 } }));
  assert.equal(result.clearance, 54000);
  assert.equal(result.grounded, false);
  assert.equal(footing(state({ player: { x: 170000, y: 174000,
    halfHeight: 12000, halfWidth: 8000, state: 'airborne', health: 5 } })), null,
    'off-deck airborne player must never get a fabricated landing footprint');
});

test('current moving deck position wins; upper decks and distant surfaces cannot cast', () => {
  const snapshot = state({
    platforms: [
      { id: 'upper', x: 20000, y: 112000, width: 80000, height: 20000 },
      { id: 'moving-now', x: 42000, y: 89000, width: 19000, height: 19000 },
      { id: 'too-low', x: 20000, y: -200000, width: 80000, height: 20000 },
    ],
  });
  assert.equal(footing(snapshot).platformId, 'moving-now');
  const shifted = state({ ...snapshot, platforms: [
    { id: 'moving-now', x: 240000, y: 89000, width: 19000, height: 19000 },
  ] });
  assert.equal(footing(shifted), null, 'moving deck cannot retain an old footprint');
});

test('never persist footprint through result, stale render, death, malformed data or restart', () => {
  for (const lifecycle of ['result', 'intermission', 'stopped'])
    assert.equal(footing(state({ lifecycle })), null);
  assert.equal(footing(state({ player: { ...state().player, health: 0 } })), null);
  assert.equal(footing(state({ platforms: [{ id: 'broken', x: NaN, y: 0, height: 1, width: 1 }] })), null);
  assert.equal(footing(state({ worldWidth: 0 })), null);
  assert.match(source, /observedFooting = !options\.stale \? observedTowerFooting\(snapshot\) : null/);
  assert.match(source, /footingShadow\.visible = false; observedFooting = null/);
});

test('rendered shade is one depth-tested, shader-only owned world mesh, with no HUD or authority writes', () => {
  assert.match(source, /footingShadow\.name = 'ObservedPhysicalDeckFooting'/);
  assert.match(source, /depthTest: true, depthWrite: false/);
  assert.match(source, /footingShadow\.material\.uniforms\.uOpacity\.value/);
  assert.match(source, /ownGeometry\(new THREE\.PlaneGeometry\(1, 1\)\)/);
  assert.match(source, /physicalFooting: observedFooting/);
});
