'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');

async function crownObserver() {
  const source = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  const start = source.indexOf('function observeTowerCrown(');
  const end = source.indexOf('function ledgeContactPoint(', start);
  assert.ok(start > 0 && end > start, 'shipped game includes source-bound summit observation');
  const coordinates = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const context = vm.createContext({
    Number, Array, Math, SCALE: coordinates.SCALE,
    guardianGateAnchorX: coordinates.guardianGateAnchorX,
    clamp: Math.max.bind(Math), // replaced below: true finite clamping
  });
  context.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  return vm.runInContext('(' + source.slice(start, end).replace(/^function observeTowerCrown/,
    'function') + ')', context);
}

function snapshot() {
  return {
    runToken: 'run-1', floor: 2, tick: 18, lifecycle: 'running',
    worldWidth: 480000, chunkBaseY: 0,
    player: { x: 240000, y: 300000, health: 5 },
    platforms: [
      { id: 'f2:cap', x: 160000, y: 380000, width: 160000, height: 12000 },
      { id: 'f2:lower', x: 195000, y: 285000, width: 80000, height: 15000 },
    ],
    enemies: [],
  };
}

test('summit architecture follows only the actual current-floor cap', async () => {
  const observe = await crownObserver();
  const source = snapshot();
  const value = observe(source);
  assert.equal(value.capId, 'f2:cap');
  assert.equal(value.anchorX, 240000);
  assert.equal(value.top, 392000);
  assert.equal(value.guardianId, null);
  assert.equal(value.guardianHealthRatio, null);
  assert.ok(value.distance > 9 && value.distance < 10);
  assert.equal(observe({ ...source, floor: 3 }), null);
  assert.equal(observe({ ...source, platforms: [] }), null);
  assert.equal(observe({ ...source, lifecycle: 'intermission' }), null);
  assert.equal(observe({ ...source, player: { ...source.player, health: 0 } }), null);
  assert.equal(observe({ ...source, player: { ...source.player, y: -500000 } }), null);
});

test('summit follows observed guardian health and never implies an invented victory', async () => {
  const observe = await crownObserver();
  const source = snapshot();
  const withGuardian = {
    ...source, enemies: [{ id: 'genuine-guardian', kind: 'guardian',
      active: true, health: 4, maxHealth: 8, telegraph: true,
      y: 325000, halfHeight: 20000 }],
  };
  const observed = observe(withGuardian);
  assert.equal(observed.guardianId, 'genuine-guardian');
  assert.equal(observed.guardianHealthRatio, .5);
  assert.equal(observed.telegraph, true);
  assert.equal(observe({ ...withGuardian, enemies: [{ ...withGuardian.enemies[0], active: false }] }).guardianId, null);
  assert.equal(observe({ ...withGuardian, enemies: [{ ...withGuardian.enemies[0], health: NaN }] }).guardianId, null);
});

test('original crown is in real Three scene, bounded and recoverable', () => {
  const scene = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  const audio = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/audio.mjs'), 'utf8');
  assert.match(scene, /ObservedCurrentFloorSummitCrown/);
  // Original native guardian footage and retained triangle owners proved the
  // *foreground* "ActualCapNavigationHalo", not the three far decorative gears,
  // was covering combat. The objective must be a real open architectural crest
  // behind the physical hero/guardian, not a complete eight-spoked near-camera
  // disc. Read only the crown stage, not a coincidental other InstancedMesh.
  const start = scene.indexOf("const crownStage = new THREE.Group()");
  const end = scene.indexOf("let observedCrown = null", start);
  const crest = scene.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.match(crest, /new THREE\.TorusGeometry\(1\.95, \.11, 7, 32, Math\.PI \* 1\.36\)/);
  assert.match(crest, /new THREE\.InstancedMesh\([\s\S]*?, 4\)/);
  assert.doesNotMatch(crest, /new THREE\.TorusGeometry\(2\.85, \.18/);
  assert.match(scene, /observedCrown\.width, 22\.72\)/);
  assert.doesNotMatch(scene, /observedCrown\.width, 28\.85\)/);
  assert.match(scene, /crownRing\.rotation\.z = options\.reducedMotion \? -Math\.PI \* \.18/);
  assert.match(scene, /depthTest: true, depthWrite: true/);
  assert.match(scene, /crownStage\.visible = false; observedCrown = null/);
  assert.match(scene, /observedCrown = !options\.stale \? observeTowerCrown\(snapshot\) : null/);
  assert.match(scene, /objectiveNotVictory: true/);
  assert.match(audio, /crownDistance > 90000 && distanceToCap <= 90000/);
  assert.match(audio, /crownHeard !== capKey/);
});
