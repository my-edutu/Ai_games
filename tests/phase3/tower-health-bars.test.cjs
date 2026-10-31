'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');
const ROOT = path.resolve(__dirname, '../..');

test('enemy health fill is drawn after its background and retains the actual remaining fraction', async () => {
  const url = file => pathToFileURL(path.join(ROOT, file)).href;
  const real = await import(url('node_modules/three/build/three.module.js'));
  const { WebGLRenderList } = await import(url('node_modules/three/src/renderers/webgl/WebGLRenderLists.js'));
  const coordinates = await import(url('public/infinite-tower-climb/visuals/coordinates.mjs'));
  const { createRenderProgress } = await import(url('public/infinite-tower-climb/visuals/render-progress.mjs'));
  let callback, renderedScene, renderedCamera;
  class Renderer {
    constructor() { this.shadowMap = {}; this.xr = {}; this.info = { render: {}, memory: {}, programs: [] }; }
    setSize() {} setPixelRatio() {} dispose() {} setRenderTarget() {}
    getRenderTarget() { return null; } getActiveCubeFace() { return 0; } getActiveMipmapLevel() { return 0; }
    render(scene, camera) { renderedScene = scene; renderedCamera = camera; }
  }
  const actor = () => ({ group: new real.Group(), animate() {}, dispose() {} });
  const context = { THREE: { ...real, WebGLRenderer: Renderer, PMREMGenerator: class { fromEquirectangular() { throw new Error('CPU fixture'); } dispose() {} } },
    ...coordinates, createRenderProgress, snapshotVelocity: () => 0, createClimber: actor, createEnemy: actor,
    createTowerWorld: () => ({ group: new real.Group(), update() {}, dispose() {} }),
    THEMES: { foundry: { sun: 0xffdfbc, ambient: 0xe8e0d3, fog: 0x99796d } },
    innerWidth: 960, devicePixelRatio: 1, performance: { now: () => 100 },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    addEventListener() {}, removeEventListener() {}, ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { callback = fn; return 1; }, cancelAnimationFrame() {}, console: { warn() {}, error() {} },
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  const canvas = { dataset: {}, getBoundingClientRect: () => ({ width: 960, height: 600 }), addEventListener() {}, removeEventListener() {} };
  const view = context.createTowerScene(canvas, { quality: 'low', reducedMotion: true });
  const snapshot = { runToken: 'bar-regression', floor: 0, theme: 'foundry', tick: 1, revision: 1, publicChecksum: 'full', lifecycle: 'running',
    chunkBaseY: 0, chunkHeight: 360000, worldWidth: 480000, platforms: [], hazards: [], pickups: [], projectiles: [], intent: {},
    player: { x: 240000, y: 28000, halfHeight: 14000, halfWidth: 9000, health: 5, state: 'standing', facing: -1, vx: 0 },
    enemies: [{ id: 'sentinel', kind: 'sentinel', x: 220000, y: 24000, halfWidth: 9000, halfHeight: 12000, health: 3, maxHealth: 3, active: true, facing: 1 }],
  };
  try {
    for (const health of [3, 1]) {
      view.accept({ snapshot: { ...snapshot, tick: health, revision: health, publicChecksum: `health-${health}`, enemies: [{ ...snapshot.enemies[0], health }] } });
      callback(100);
      const bar = renderedScene.children.find(object => object.isGroup && object.children.length === 2 && object.children.every(child => child.geometry?.type === 'PlaneGeometry'));
      assert.ok(bar, 'inspect the actual shipped health-bar meshes');
      const [background, fill] = bar.children, list = new WebGLRenderList();
      list.push(background, background.geometry, background.material, 0, .1, null, renderedCamera);
      list.push(fill, fill.geometry, fill.material, 0, .2, null, renderedCamera);
      list.sort();
      const drawOrder = [...list.opaque, ...list.transmissive, ...list.transparent].map(item => item.object);
      assert.ok(drawOrder.indexOf(fill) > drawOrder.indexOf(background), 'the transparent background must not cover the colored fill');
      assert.equal(fill.scale.x / background.scale.x, health / 3);
      assert.equal(fill.material.depthWrite, false, 'overlay fills must not write phantom scene depth');
    }
  } finally { view.dispose(); }
});
