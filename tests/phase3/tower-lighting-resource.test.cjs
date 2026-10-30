'use strict';
// Regression of real shadow/PMREM ownership failures, with CPU renderer boundaries.
// Browser context-recovery and visible-output tests remain separate gates.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { test } = require('node:test');
const root = path.resolve(__dirname, '../..');

async function main() {
  const real = await import(pathToFileURL(`${root}/node_modules/three/build/three.module.js`).href);
  const { createRenderProgress } = await import(pathToFileURL(`${root}/public/infinite-tower-climb/visuals/render-progress.mjs`).href);
  const source = fs.readFileSync(`${root}/public/infinite-tower-climb/visuals/scene.mjs`, 'utf8');
  function events() {
    const listeners = new Map();
    return {
      addEventListener(k, cb) { if (!listeners.has(k)) listeners.set(k, new Set()); listeners.get(k).add(cb); },
      removeEventListener(k, cb) { listeners.get(k)?.delete(cb); },
      dispatch(k, e = {}) { for (const cb of listeners.get(k) || []) cb(e); },
    };
  }
  function harness(failEnvironment = false) {
    const lights = [], raf = new Map(), logs = [], statuses = [], targets = [];
    let now = 0, sequence = 0, renderCount = 0, pmremCalls = 0, generatorDisposes = 0;
    const canvas = { ...events(), dataset: {}, getBoundingClientRect: () => ({ width: 640, height: 360 }) };
    const document = { ...events(), visibilityState: 'visible' };
    class Renderer {
      constructor() { this.shadowMap = {}; this.xr = { enabled: false }; this.autoClear = true; this.target = null; this.info = { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 }, programs: [] }; }
      setPixelRatio() {} setSize() {} dispose() {}
      getRenderTarget() { return this.target; } getActiveCubeFace() { return 0; } getActiveMipmapLevel() { return 0; }
      setRenderTarget(target) { this.target = target; }
      render() { renderCount++; }
    }
    class DirectionalLight extends real.DirectionalLight { constructor(...args) { super(...args); lights.push(this); } }
    class PMREMGenerator {
      fromEquirectangular() {
        pmremCalls++;
        if (failEnvironment) throw new Error('Injected PMREM conversion failure');
        const target = new real.WebGLRenderTarget(336, 256);
        target.disposeCount = 0;
        target.addEventListener('dispose', () => target.disposeCount++);
        targets.push(target);
        return target;
      }
      dispose() { generatorDisposes++; }
    }
    const THREE = { ...real, WebGLRenderer: Renderer, DirectionalLight, PMREMGenerator };
    const actor = () => ({ group: new real.Group(), animate() {}, dispose() {} });
    const world = () => ({ group: new real.Group(), update() {}, dispose() {}, diagnostics: () => ({}) });
    const context = {
      THREE, createRenderProgress, createTowerWorld: world, createClimber: actor, createEnemy: actor,
      THEMES: { foundry: { sun: 0xffdfbc, ambient: 0xe8e0d3, fog: 0x99796d } },
      SCALE: 10000, pointFor: (x, y, base) => ({ x: 0, y: (y-base)/10000, z: 25, angle: 0 }), angleFor: () => 0, snapshotVelocity: () => 0,
      innerWidth: 640, devicePixelRatio: 1, document,
      ResizeObserver: class { observe() {} disconnect() {} },
      requestAnimationFrame: cb => { const id = ++sequence; raf.set(id, cb); return id; },
      cancelAnimationFrame: id => raf.delete(id),
      performance: { now: () => now },
      console: { error: (...args) => logs.push(args.map(String).join(' ')), warn: (...args) => logs.push(args.map(String).join(' ')) },
      ...events(),
    };
    context.window = context;
    vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context, { filename: 'shipped-scene.mjs' });
    const view = context.createTowerScene(canvas, { quality: 'high', onStatus: (...args) => statuses.push(args) });
    const snapshot = { runToken: 'resource-review', revision: 1, publicChecksum: 'a', floor: 0, theme: 'foundry', tick: 1,
      chunkBaseY: 0, chunkHeight: 360000, worldWidth: 480000, platforms: [], hazards: [], enemies: [], pickups: [], projectiles: [], intent: {},
      player: { x: 240000, y: 28000, halfHeight: 14000, vx: 0, vy: 0, facing: 1, state: 'standing', health: 100 } };
    return { lights, view, targets, statuses, logs, canvas, snapshot,
      frame(time) { now = time; const entry = raf.entries().next().value; assert.ok(entry, 'one scheduled frame'); raf.delete(entry[0]); entry[1](time); },
      counts: () => ({ renderCount, pmremCalls, generatorDisposes, scheduledFrames: raf.size }) };
  }

  const ordinary = harness();
  const sun = ordinary.lights.find(light => light.castShadow);
  const shadow = new real.WebGLRenderTarget(1024, 1024);
  const shadowPass = new real.WebGLRenderTarget(1024, 1024);
  let shadowDisposes = 0, shadowPassDisposes = 0;
  shadow.addEventListener('dispose', () => shadowDisposes++);
  shadowPass.addEventListener('dispose', () => shadowPassDisposes++);
  sun.shadow.map = shadow; // The owner is exactly what WebGLShadowMap installs on its first high-tier render.
  sun.shadow.mapPass = shadowPass;
  ordinary.view.accept({ snapshot: ordinary.snapshot });
  ordinary.frame(16);
  ordinary.view.dispose(); ordinary.view.dispose();
  const normalResult = { shadowDisposes, shadowPassDisposes, shadowCleared: sun.shadow.map === null && sun.shadow.mapPass === null, environmentDisposes: ordinary.targets.map(t => t.disposeCount), ...ordinary.counts() };

  const failure = harness(true);
  failure.view.accept({ snapshot: failure.snapshot });
  for (let frame = 1; frame <= 5; frame++) failure.frame(frame * 16);
  const failureResult = { ...failure.counts(), frames: failure.view.diagnostics().frames, renderErrors: failure.view.diagnostics().renderErrors, contextLost: failure.view.diagnostics().contextLost, lighting: failure.view.diagnostics().lighting, statuses: failure.statuses, logs: failure.logs };
  failure.view.setQuality('low'); failure.frame(96);
  failureResult.afterLowQuality = { ...failure.counts(), contextLost: failure.view.diagnostics().contextLost };
  failure.view.dispose();

  // Execute the actual PMREM implementation with a CPU renderer boundary that
  // throws only when its first conversion render starts, after target allocation.
  const convertSource = source.slice(source.indexOf('function createReflectionEnvironment'), source.indexOf('export function createTowerScene'));
  assert.equal(real.REVISION, '186', 'Recheck the narrow allocation ownership adapter when upgrading Three');
  const partialFailures = [];
  for (const failAt of [1, 2, 3]) {
    const allocations = [], originalAllocate = real.PMREMGenerator.prototype._allocateTargets;
    real.PMREMGenerator.prototype._allocateTargets = function (...args) {
      const target = originalAllocate.apply(this, args);
      for (const [kind, item] of [['output', target], ['scratch', this._pingPongRenderTarget]]) {
        const entry = { kind, disposes: 0 };
        item.addEventListener('dispose', () => entry.disposes++); allocations.push(entry);
      }
      return target;
    };
    const previous = new real.WebGLRenderTarget(16, 16);
    let previousDisposes = 0, activeTarget = previous, activeFace = 3, activeMip = 1, renderCalls = 0, sourceDisposes = 0;
    previous.addEventListener('dispose', () => previousDisposes++);
    class DataTexture extends real.DataTexture { constructor(...args) { super(...args); this.addEventListener('dispose', () => sourceDisposes++); } }
    const renderer = {
      xr: { enabled: true }, autoClear: true, toneMapping: real.ACESFilmicToneMapping,
      getRenderTarget: () => activeTarget, getActiveCubeFace: () => activeFace, getActiveMipmapLevel: () => activeMip,
      setRenderTarget(target, face = 0, mip = 0) { activeTarget = target; activeFace = face; activeMip = mip; },
      render() { if (++renderCalls === failAt) throw new Error('Injected renderer boundary failure'); },
    };
    try {
      const context = { THREE: { ...real, DataTexture }, TAU: Math.PI * 2, clamp: real.MathUtils.clamp };
      vm.runInNewContext(convertSource, context);
      assert.throws(() => context.createReflectionEnvironment(renderer, { sun: 0xffdfbc, ambient: 0xe8e0d3 }, { fill: 0x9cd4ed, bounce: 0xe28a50 }), /Injected renderer boundary failure/);
    } finally { real.PMREMGenerator.prototype._allocateTargets = originalAllocate; }
    partialFailures.push({ failAt, allocations, sourceDisposes, previousDisposes, restoredTarget: activeTarget === previous, activeFace, activeMip, xr: renderer.xr.enabled, autoClear: renderer.autoClear });
    previous.dispose();
  }
  test('final disposal releases exact-owned shadow targets and reflection once', () => {
    assert.equal(normalResult.shadowDisposes, 1);
    assert.equal(normalResult.shadowPassDisposes, 1);
    assert.equal(normalResult.shadowCleared, true);
    assert.deepEqual(normalResult.environmentDisposes, [1]);
    assert.equal(normalResult.scheduledFrames, 0);
  });
  test('optional reflection failure renders direct lighting and Low remains usable', () => {
    assert.equal(failureResult.renderCount, 5);
    assert.equal(failureResult.pmremCalls, 1);
    assert.equal(failureResult.contextLost, false);
    assert.equal(failureResult.renderErrors, 0);
    assert.equal(failureResult.afterLowQuality.renderCount, 6);
    assert.equal(failureResult.afterLowQuality.contextLost, false);
    assert.equal(failureResult.afterLowQuality.pmremCalls, 1);
    assert.equal(failureResult.lighting.environmentReady, false);
    assert.equal(failureResult.lighting.environmentFailures, 1);
    assert.match(failureResult.lighting.environmentLastError, /Injected PMREM conversion failure/);
  });
  for (const fault of partialFailures) test(`real PMREM boundary ${fault.failAt} releases partial outputs and restores caller state`, () => {
    assert.deepEqual(fault.allocations, [{ kind: 'output', disposes: 1 }, { kind: 'scratch', disposes: 1 }]);
    assert.equal(fault.sourceDisposes, 1);
    assert.equal(fault.previousDisposes, 0);
    assert.equal(fault.restoredTarget, true);
    assert.equal(fault.activeFace, 3);
    assert.equal(fault.activeMip, 1);
    assert.equal(fault.xr, true);
    assert.equal(fault.autoClear, true);
  });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
