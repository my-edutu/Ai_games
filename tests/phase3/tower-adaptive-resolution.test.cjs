'use strict';
// CPU-bound renderer fixture: verifies honest adaptive framebuffer scaling,
// never confuses returned WebGL calls with presented hardware FPS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { shippedSceneNamedBindings, fillMissingBindings } = require('./tower-scene-vm-bindings.cjs');
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

test('source-observed 390px recording overload adapts its 3D framebuffer without shrinking DOM or over-blurring the actor', () => {
  const state = policy();
  assert.equal(state.setCompact(true), true);
  assert.equal(state.compact, true);
  assert.equal(state.minimumScale, .78);
  state.record(216, true);
  assert.equal(state.record(596, true), true);
  assert.equal(state.scale, .8);
  for (let i = 0; i < 40; i++) state.record(596, true);
  assert.equal(state.scale, .78, 'keep at least 78% linear resolution on portrait');
  const held = state.adaptations;
  state.record(2500, false);
  assert.equal(state.adaptations, held, 'hidden frames cannot compound overload');
  assert.equal(state.setCompact(false), true);
  assert.equal(state.scale, 1, 'rotate back to desktop at full resolution');
  assert.equal(state.minimumScale, .6);
  assert.equal(state.setCompact(false), false);
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


test('sustained visible callback starvation adapts when individual WebGL calls are fast; pauses and hidden tabs do not', () => {
  const state = policy();
  state.setCompact(true);
  assert.equal(state.record(19, true, 298), false);
  assert.equal(state.record(20, true, 298), false);
  assert.equal(state.scale, 1, 'do not treat two isolated rAF stalls as sustained overload');
  assert.equal(state.record(19, true, 298), true);
  assert.equal(state.scale, .8);
  for (let i = 0; i < 12; i++) state.record(18, true, 300);
  assert.equal(state.scale, .78, 'real phone image remains above its clarity floor');
  assert.equal(state.lastCallbackGapMs, 300);
  assert.equal(state.lastSubmissionMs, 18);
  const adaptationCount = state.adaptations;
  state.record(12, true, 2700);
  state.record(12, true, 2700);
  state.record(12, false, 300);
  assert.equal(state.adaptations, adaptationCount, 'hidden/resume periods never trigger new downscales');
  assert.equal(state.lastCallbackGapMs, null);
  for (let i = 0; i < 92; i++) state.record(13, true, 16.7);
  assert.ok(state.scale > .78, 'actual sustained healthy callback pace restores resolution');
  state.clearPacing();
  assert.equal(state.lastCallbackGapMs, null);
  state.reset();
  assert.equal(state.scale, 1);
});

test('the real Tower scene uses adaptive backing resolution without downgrading its chosen graphics tier', async () => {
  const real = await import(pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href);
  const coordinates = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const { createRenderProgress } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/render-progress.mjs')).href);
  const { createTowerFinale } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/finale.mjs')).href);
  const { createTowerRouteIntent } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/route-intent.mjs')).href);
  const { createTowerLandingApproach } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/landing-approach.mjs')).href);
  const { createTowerMovingDeckSuspension } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/moving-deck-suspension.mjs')).href);
  const { createTowerHazardPressure } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/hazard-pressure.mjs')).href);
  const { observedHealthRecovery, createTowerRecoveryTransfer } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/recovery-transfer.mjs')).href);
  const { witnessedHealthPickup } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/route-intent.mjs')).href);
  const { guardianFramePressure, guardianCameraRecoveryBlend, acceptGuardianCameraRescue } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-camera-safety.mjs')).href);
  const { createTowerAtmosphere } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/atmosphere.mjs')).href);
  const { createTowerGuardianShotStage } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-shot-stage.mjs')).href);
  const { createObservedGuardianGuardStage } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-guard-stage.mjs')).href);
  const { createObservedMovingDeckRide } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/moving-deck-ride.mjs')).href);
  const { createTowerGuardianCircuit, observedGuardianCircuit, observedGuardianLockStage } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-circuit.mjs')).href);
  const { observedGuardianPassage, observedUnlockedGuardianCap, createTowerGuardianPassage } = await import(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  let now = 0, duration = 900, scheduled = null, renderer;
  class Renderer {
    constructor(options) { renderer = this; this.options = options; this.pixelRatios = []; this.shadowMap = {}; this.xr = { enabled: false }; this.info = { render: {}, memory: {}, programs: [] }; }
    setPixelRatio(value) { this.pixelRatios.push(value); }
    setSize() {} dispose() {} getRenderTarget() { return null; } getActiveCubeFace() { return 0; } getActiveMipmapLevel() { return 0; } setRenderTarget() {}
    render() { now += duration; }
  }
  const actor = () => ({ group: new real.Group(), animate() {}, dispose() {} });
  const context = { THREE: { ...real, WebGLRenderer: Renderer, PMREMGenerator: class { fromEquirectangular() { throw new Error('fixture reflection unavailable'); } dispose() {} } },
    ...coordinates, createRenderProgress, createTowerFinale, createTowerRouteIntent, createTowerLandingApproach, createTowerMovingDeckSuspension, createTowerHazardPressure, witnessedHealthPickup, createTowerAtmosphere, createTowerGuardianShotStage, createObservedGuardianGuardStage, createObservedMovingDeckRide, observedHealthRecovery, createTowerRecoveryTransfer, guardianFramePressure, guardianCameraRecoveryBlend, acceptGuardianCameraRescue, createTowerGuardianCircuit, observedGuardianCircuit, observedGuardianLockStage, observedGuardianPassage, observedUnlockedGuardianCap, createTowerGuardianPassage, snapshotVelocity: () => 0, createClimber: actor, createEnemy: actor,
    createTowerWorld: () => ({ group: new real.Group(), update() {}, revealGuardianSightlines() {}, protectRouteSightlines() {}, diagnostics() { return {}; }, dispose() {} }),
    THEMES: { foundry: { sun: 0xffdfbc, ambient: 0xe8e0d3, fog: 0x99796d } },
    innerWidth: 1920, devicePixelRatio: 1.5, performance: { now: () => now },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    addEventListener() {}, removeEventListener() {}, ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { scheduled = fn; return 1; }, cancelAnimationFrame() {}, console: { warn() {}, error() {} },
  };
  fillMissingBindings(context, await shippedSceneNamedBindings(sceneSource));
  vm.runInNewContext(sceneSource.replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  let viewportWidth = 1920;
  const canvas = { dataset: {}, getBoundingClientRect: () => ({ width: viewportWidth, height: viewportWidth < 700 ? 844 : 1080 }), addEventListener() {}, removeEventListener() {} };
  const view = context.createTowerScene(canvas, { quality: 'low', reducedMotion: true });
  const snapshot = { runToken: 'resolution-test', revision: 1, publicChecksum: 'a', floor: 0, theme: 'foundry', tick: 1,
    chunkBaseY: 0, chunkHeight: 360000, worldWidth: 480000, platforms: [], hazards: [], enemies: [], pickups: [], projectiles: [], intent: {},
    player: { x: 240000, y: 28000, halfHeight: 14000, vx: 0, vy: 0, facing: 1, state: 'standing', health: 100 } };
  const frame = () => scheduled(now + 16);
  try {
    view.accept({ snapshot });
    assert.equal(renderer.options.antialias, false, 'low-tier tower never allocates unnecessary multisample buffers');
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
    // Retain the same real 3D scene, source snapshot and WebGL instance
    // across a desktop-to-phone CSS layout change, without a new simulation.
    viewportWidth = 390;
    view.setQuality('low');
    assert.equal(view.diagnostics().resolution.compact, true);
    assert.equal(view.diagnostics().resolution.minimumScale, .78);
    assert.equal(renderer.pixelRatios.at(-1), 1);
    // The previous film showed very small individual render calls but starved
    // requestAnimationFrame callbacks. Exercise the ORIGINAL scene frame loop.
    duration = 12;
    // The original mock renderer advances performance.now() by only 12ms.
    // A scheduled(now + 240) call alone does NOT emulate a delayed rAF: the
    // next callback would still arrive just 12ms after the preceding one.
    // Advance BOTH the wall clock and callback timestamp by 240ms, leaving
    // each actual WebGL scene call at 12ms, as witnessed in the phone film.
    let callbackAt = now;
    for (let i = 0; i < 10; i++) {
      callbackAt += 240;
      now = callbackAt;
      scheduled(callbackAt);
    }
    assert.equal(view.diagnostics().renderFault.state, 'live',
      'the original scene must submit live real 3D frames after graphic tier/orientation changes: ' +
      JSON.stringify(view.diagnostics().renderFault));
    assert.equal(view.diagnostics().resolution.scale, .78,
      'real portrait rAF starvation now adapts even when WebGL calls are short; observed: ' +
      JSON.stringify({ resolution: view.diagnostics().resolution,
        renderFault: view.diagnostics().renderFault,
        submitted: view.diagnostics().renderProgress }));
    assert.ok(view.diagnostics().resolution.callbackGapMs >= 240);
    duration = 596;
    for (let i = 0; i < 12; i++) frame();
    assert.equal(view.diagnostics().resolution.scale, .78);
    assert.equal(renderer.pixelRatios.at(-1), .78);
    assert.equal(view.diagnostics().quality, 'low');
    viewportWidth = 1920;
    view.setQuality('high');
    assert.equal(view.diagnostics().resolution.compact, false);
    assert.equal(view.diagnostics().resolution.scale, 1);
    assert.equal(renderer.pixelRatios.at(-1), 1.5);
  } finally { view.dispose(); }
});
