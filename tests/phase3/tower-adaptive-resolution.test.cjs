'use strict';
// CPU-bound renderer fixture: verifies honest adaptive framebuffer scaling,
// never confuses returned WebGL calls with presented hardware FPS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const sceneSource = fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');

function policy() {
  const start = sceneSource.indexOf('function createTowerResolutionPolicy(');
  const end = sceneSource.indexOf('export function createTowerScene(', start);
  assert.ok(start >= 0 && end > start, 'the shipped scene owns an adaptive resolution policy');
  const scope = vm.createContext({ Math, Number });
  return vm.runInContext(`(() => { ${sceneSource.slice(start, end)}; return createTowerResolutionPolicy; })()`, scope)();
}

test('two slow renderer calls shrink the framebuffer; consecutive overloads cannot over-shrink it', () => {
  const state = policy();
  assert.equal(state.scale, 1);
  assert.equal(state.record(900, true), false, 'one cold shader compile is insufficient to downscale');
  assert.equal(state.record(900, true), true, 'two sustained slow calls trigger one bounded step');
  assert.equal(state.scale, .8);
  for (let i = 0; i < 30; i++) state.record(900, true);
  assert.equal(state.scale, .6, 'quality never scales below the authored 60% framebuffer floor');
  assert.ok(state.adaptations >= 2);
});

test('hidden frames, clock anomalies and a single intermittent pause cannot trigger a change', () => {
  const state = policy();
  state.record(2000, false);
  state.record(-50, true);
  state.record(NaN, true);
  state.record(900, true);
  state.record(28, true);
  state.record(900, true);
  assert.equal(state.scale, 1);
  state.record(900, true);
  assert.equal(state.scale, .8);
  state.reset();
  assert.equal(state.scale, 1);
  assert.equal(state.adaptations, 0);
});

test('a long healthy render run progressively restores resolution; a lone fast callback cannot', () => {
  const state = policy();
  for (let i = 0; i < 20; i++) state.record(1000, true);
  assert.equal(state.scale, .6);
  state.record(12, true);
  assert.equal(state.scale, .6);
  for (let i = 0; i < 650; i++) state.record(12, true);
  assert.equal(state.scale, 1);
});

test('the real Tower scene uses adaptive backing resolution without downgrading its chosen graphics tier', async () => {
  const real = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const { createRenderProgress } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/render-progress.mjs')).href);
  const { createTowerFinale } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/finale.mjs')).href);
  let now = 0, duration = 900, scheduled = null, renderer;
  class Renderer {
    constructor() { renderer = this; this.pixelRatios = []; this.shadowMap = {}; this.xr = { enabled: false }; this.info = { render: {}, memory: {}, programs: [] }; }
    setPixelRatio(value) { this.pixelRatios.push(value); }
    setSize() {} dispose() {} getRenderTarget() { return null; } getActiveCubeFace() { return 0; } getActiveMipmapLevel() { return 0; } setRenderTarget() {}
    render() { now += duration; }
  }
  const actor = () => ({ group: new real.Group(), animate() {}, dispose() {} });
  const context = { THREE: { ...real, WebGLRenderer: Renderer, PMREMGenerator: class { fromEquirectangular() { throw new Error('fixture reflection unavailable'); } dispose() {} } },
    ...coordinates, createRenderProgress, createTowerFinale, snapshotVelocity: () => 0, createClimber: actor, createEnemy: actor,
    createTowerWorld: () => ({ group: new real.Group(), update() {}, revealGuardianSightlines() {}, diagnostics() { return {}; }, dispose() {} }),
    THEMES: { foundry: { sun: 0xffdfbc, ambient: 0xe8e0d3, fog: 0x99796d } },
    innerWidth: 1920, devicePixelRatio: 1.5, performance: { now: () => now },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    addEventListener() {}, removeEventListener() {}, ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { scheduled = fn; return 1; }, cancelAnimationFrame() {}, console: { warn() {}, error() {} },
  };
  vm.runInNewContext(sceneSource.replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  const canvas = { dataset: {}, getBoundingClientRect: () => ({ width: 1920, height: 1080 }), addEventListener() {}, removeEventListener() {} };
  const view = context.createTowerScene(canvas, { quality: 'low', reducedMotion: true });
  const snapshot = { runToken: 'resolution-test', revision: 1, publicChecksum: 'a', floor: 0, theme: 'foundry', tick: 1,
    chunkBaseY: 0, chunkHeight: 360000, worldWidth: 480000, platforms: [], hazards: [], enemies: [], pickups: [], projectiles: [], intent: {},
    player: { x: 240000, y: 28000, halfHeight: 14000, vx: 0, vy: 0, facing: 1, state: 'standing', health: 100 } };
  const frame = () => scheduled(now + 16);
  try {
    view.accept({ snapshot });
    assert.equal(renderer.pixelRatios.at(-1), 1);
    frame(); frame();
    assert.equal(renderer.pixelRatios.at(-1), 1, 'do not clear the successfully submitted second frame');
    frame();
    assert.equal(renderer.pixelRatios.at(-1), .8);
    assert.equal(view.diagnostics().quality, 'low');
    assert.equal(view.diagnostics().resolution.scale, .8);
    for (let i = 0; i < 16; i++) frame();
    assert.equal(view.diagnostics().resolution.scale, .6);
    assert.equal(renderer.pixelRatios.at(-1), .6);
    assert.equal(view.diagnostics().lighting.environmentReady, false);
    view.setQuality('high');
    assert.equal(renderer.pixelRatios.at(-1), 1.5, 'explicit user tier switch starts at native tier density');
    assert.equal(view.diagnostics().resolution.scale, 1);
    assert.equal(view.diagnostics().quality, 'high');
    duration = 12;
    for (let i = 0; i < 10; i++) frame();
    assert.equal(view.diagnostics().resolution.scale, 1, 'healthy frames cannot lower resolution');
  } finally { view.dispose(); }
});
