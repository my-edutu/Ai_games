'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const snapshot = {width:10,height:6,runToken:'one',revision:1,movementStep:1,snake:[45,44,11].map(cell=>({cell})),obstacles:[],hazards:[],portals:[],food:null,length:3,goal:30,occupancy:3,foodsCollected:0,dangerLevel:0};

async function makeHarness(search = '') {
  const Three = await import('three');
  const { buildMotion } = await import('../../public/snake-stream/motion.mjs');
  const { cameraComposition } = await import('../../public/snake-stream/camera.mjs');
  class NoGpuRenderer {
    constructor() { context.rendererProbe = this; }
    pixelRatio = 1; width = 1; height = 1; ratioChanges = []; draws = 0;
    shadowMap = {};
    extensions = { has: () => false };
    info = { render: { calls: 1, triangles: 1 }, memory: { geometries: 1, textures: 1 }, reset() {} };
    getContext() { return { getInternalformatParameter: () => [] }; }
    setPixelRatio(value) { this.pixelRatio = value; this.ratioChanges.push(value); }
    getPixelRatio() { return this.pixelRatio; }
    getDrawingBufferSize(target) { return target.set(Math.floor(this.width * this.pixelRatio), Math.floor(this.height * this.pixelRatio)); }
    setSize(width, height) { this.width = width; this.height = height; }
    render() { this.draws++; } dispose() {}
  }
  const factory = () => ({ group: new Three.Group(), update() {}, dispose() {}, stats() { return {}; } });
  const context = vm.createContext({
    THREE: { ...Three, WebGLRenderer: NoGpuRenderer },
    createWorld: factory, createSerpent: factory, buildMotion, cameraComposition,
    window: { devicePixelRatio: 1 }, location: { search }, URLSearchParams,
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  // The VM executes a classic script, so remove every function export rather
  // than assuming createSceneRenderer is the module's only exported helper.
  const source = fs.readFileSync(`${root}/public/snake-stream/renderer.mjs`, 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export (?=function )/gm, '');
  vm.runInContext(source + '\nglobalThis.makeRenderer = createSceneRenderer;', context);
  const canvas = { clientWidth: 1000, clientHeight: 600, dataset: {}, addEventListener() {}, removeEventListener() {} };
  const renderer = context.makeRenderer(canvas);
  let time = 1000;
  return { renderer, probe: context.rendererProbe, advance(delta = 1000 / 60) { time += delta; renderer.draw({ snapshot }, null, 1, time); } };
}

test('resuming an intentionally skipped draw interval does not force permanent low quality', async () => {
  const { renderer, advance } = await makeHarness();
  for (let frame = 0; frame < 12; frame++) advance();
  assert.equal(renderer.stats().quality, 'balanced');
  // app.js intentionally does not call draw while document.hidden. The next
  // visible RAF timestamp nevertheless includes the time hidden.
  renderer.resetTiming(); // production visibilitychange invokes this on return
  advance(60000);
  const actual = renderer.stats();
  renderer.dispose();
  assert.equal(actual.quality, 'balanced', JSON.stringify(actual));
  assert.ok(actual.frameMs.p99 < 100, 'Hidden time must not become visible frame cost');
});

test('a capable device retains native quality despite one isolated long frame', async () => {
  const { renderer, probe, advance } = await makeHarness();
  try {
    for (let frame = 0; frame < 24; frame++) advance(frame === 6 ? 900 : 1000 / 60);
    assert.equal(renderer.stats().quality, 'balanced');
    assert.equal(probe.getPixelRatio(), 1);
    assert.equal(probe.draws, 24);
  } finally { renderer.dispose(); }
});

test('sustained slow draws reduce raster cost once while retaining every draw', async () => {
  const { renderer, probe, advance } = await makeHarness();
  try {
    for (let frame = 0; frame < 24; frame++) advance(200);
    assert.equal(renderer.stats().quality, 'low');
    const ratio = probe.getPixelRatio();
    assert.ok(ratio >= 0.4 && ratio <= 0.5, `Expected a measured reduction for 200ms frames, got ${ratio}`);
    const changes = probe.ratioChanges.length;
    for (let frame = 0; frame < 120; frame++) advance(200);
    assert.equal(probe.getPixelRatio(), ratio);
    assert.equal(probe.ratioChanges.length, changes, 'Stable quality must not rebuild resolution every frame');
    assert.equal(probe.draws, 144, 'Quality adaptation must not fake cadence by skipping draw submission');
  } finally { renderer.dispose(); }
});

test('an explicitly low tier also responds when its initial resolution is too expensive', async () => {
  const { renderer, probe, advance } = await makeHarness('?quality=low');
  try {
    for (let frame = 0; frame < 24; frame++) advance(200);
    assert.equal(renderer.stats().quality, 'low');
    assert.ok(probe.getPixelRatio() >= 0.4 && probe.getPixelRatio() < 0.6);
    assert.equal(probe.draws, 24);
  } finally { renderer.dispose(); }
});
