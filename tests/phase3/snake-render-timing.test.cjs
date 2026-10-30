'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const snapshot = {width:10,height:6,runToken:'one',revision:1,movementStep:1,snake:[45,44,11].map(cell=>({cell})),obstacles:[],hazards:[],portals:[],food:null,length:3,goal:30,occupancy:3,foodsCollected:0,dangerLevel:0};

test('resuming an intentionally skipped draw interval does not force permanent low quality', async () => {
  const Three = await import('three');
  const { buildMotion } = await import('../../public/snake-stream/motion.mjs');
  const { cameraComposition } = await import('../../public/snake-stream/camera.mjs');
  class NoGpuRenderer {
    shadowMap = {};
    extensions = { has: () => false };
    info = { render: { calls: 1, triangles: 1 }, memory: { geometries: 1, textures: 1 }, reset() {} };
    getContext() { return { getInternalformatParameter: () => [] }; }
    setPixelRatio() {} setSize() {} render() {} dispose() {}
  }
  const factory = () => ({ group: new Three.Group(), update() {}, dispose() {}, stats() { return {}; } });
  const context = vm.createContext({
    THREE: { ...Three, WebGLRenderer: NoGpuRenderer },
    createWorld: factory, createSerpent: factory, buildMotion, cameraComposition,
    window: { devicePixelRatio: 1 }, location: { search: '' }, URLSearchParams,
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  const source = fs.readFileSync(`${root}/public/snake-stream/renderer.mjs`, 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createSceneRenderer', 'function createSceneRenderer');
  vm.runInContext(source + '\nglobalThis.makeRenderer = createSceneRenderer;', context);
  const canvas = { clientWidth: 1000, clientHeight: 600, dataset: {}, addEventListener() {}, removeEventListener() {} };
  const renderer = context.makeRenderer(canvas);
  for (let frame = 0; frame < 12; frame++) renderer.draw({ snapshot }, null, 1, 1000 + frame * 1000 / 60);
  assert.equal(renderer.stats().quality, 'balanced');
  // app.js intentionally does not call draw while document.hidden. The next
  // visible RAF timestamp nevertheless includes the time hidden.
  renderer.resetTiming(); // production visibilitychange invokes this on return
  renderer.draw({ snapshot }, null, 1, 1000 + 12 * 1000 / 60 + 60000);
  const actual = renderer.stats();
  renderer.dispose();
  assert.equal(actual.quality, 'balanced', JSON.stringify(actual));
});
