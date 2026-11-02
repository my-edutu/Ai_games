'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const snapshot = {width:10,height:6,runToken:'one',revision:1,movementStep:1,snake:[45,44,11].map(cell=>({cell})),obstacles:[],hazards:[],portals:[],food:null,length:3,goal:30,occupancy:3,foodsCollected:0,dangerLevel:0};

async function makeHarness(search = '', dimensions = {width:1000,height:600}) {
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
    // The timing VM replaces GPU scene creation with a bounded stub. Include
    // T1's presentation-only garden; this harness measures no physical GPU.
    createWorld: factory, createSerpent: factory, createLivingGarden: factory, buildMotion, cameraComposition,
    window: { devicePixelRatio: 1 }, location: { search }, URLSearchParams,
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  // The VM executes a classic script, so remove every function export rather
  // than assuming createSceneRenderer is the module's only exported helper.
  const source = fs.readFileSync(`${root}/public/snake-stream/renderer.mjs`, 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export (?=function )/gm, '');
  vm.runInContext(source + '\nglobalThis.makeRenderer = createSceneRenderer;', context);
  const canvas = { clientWidth: dimensions.width, clientHeight: dimensions.height, dataset: {}, addEventListener() {}, removeEventListener() {} };
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

test('R51 bounded post-scale rescue refines persistent slow draws at most once', async () => {
  const { renderer, probe, advance } = await makeHarness();
  try {
    for (let n = 0; n < 12; n++) advance(62);
    const first = renderer.stats();
    assert.equal(first.quality, 'low');
    assert.ok(first.pixelRatio > 0.7 && first.pixelRatio < 0.76, 'initial measured raster adjustment');
    assert.equal(first.adaptiveRescue.settled, false, 'a new warmup follows the first adjustment');
    for (let n = 0; n < 20; n++) advance(62);
    const rescued = renderer.stats();
    assert.equal(rescued.adaptiveRescue.settled, true);
    assert.ok(Math.abs(rescued.adaptiveRescue.sampleFrameMs - 62) < 1e-5);
    assert.ok(rescued.pixelRatio < first.pixelRatio && rescued.pixelRatio >= 0.4,
      'continued pressure may reduce pixels, never below the existing floor');
    const changes = probe.ratioChanges.length;
    for (let n = 0; n < 140; n++) advance(62);
    assert.equal(probe.ratioChanges.length, changes, 'a rescued scene never oscillates/allocates every frame');
    assert.equal(probe.draws, 172, 'no simulated draw is skipped to manufacture performance');
  } finally { renderer.dispose(); }
});

test('R51 already-low raster floor and fast renderers never trigger another resize', async () => {
  const slow = await makeHarness('?quality=low');
  try {
    for (let n = 0; n < 36; n++) slow.advance(200);
    const stats = slow.renderer.stats();
    assert.equal(stats.adaptiveRescue.settled, true);
    assert.equal(stats.pixelRatio, 0.4);
    assert.equal(slow.probe.ratioChanges.length, 3,
      'native creation, explicit low startup and first measured drop only; no redundant rescue resize');
  } finally { slow.renderer.dispose(); }
  const fast = await makeHarness();
  try {
    for (let n = 0; n < 40; n++) fast.advance(1000/60);
    assert.equal(fast.renderer.stats().quality, 'balanced');
    assert.equal(fast.renderer.stats().adaptiveRescue.settled, false);
    assert.equal(fast.probe.getPixelRatio(), 1);
  } finally { fast.renderer.dispose(); }
});

test('R51 visibility resume forgets partial rescue samples, not established raster quality', async () => {
  const {renderer, probe, advance} = await makeHarness();
  try {
    for (let n = 0; n < 15; n++) advance(62);
    const ratio = probe.getPixelRatio();
    assert.equal(renderer.stats().quality, 'low');
    assert.equal(renderer.stats().adaptiveRescue.settled, false);
    assert.ok(renderer.stats().adaptiveRescue.pendingSamples > 0);
    renderer.resetTiming();
    assert.equal(renderer.stats().adaptiveRescue.pendingSamples, 0);
    assert.equal(renderer.stats().adaptiveRescue.warmupRemaining, 3);
    advance(60000);
    assert.equal(probe.getPixelRatio(), ratio, 'hidden time is not sampled as a slow draw');
    for (let n = 0; n < 8; n++) advance(62);
    assert.equal(renderer.stats().adaptiveRescue.settled, false);
    for (let n = 0; n < 3; n++) advance(62);
    assert.equal(renderer.stats().adaptiveRescue.settled, true);
  } finally { renderer.dispose(); }
});


test('R53 oversized canvas first submission is bounded without GPU queue or simulation changes', async () => {
  const large = await makeHarness('', {width:1840,height:840});
  const ordinary = await makeHarness('', {width:1000,height:600});
  try {
    large.advance(); ordinary.advance();
    const ratio=large.probe.getPixelRatio();
    assert.ok(ratio>0.6 && ratio<0.75,'large first draw avoids native 1.55m pixel flood');
    assert.equal(large.probe.width,1840);assert.equal(large.probe.height,840);
    assert.equal(ordinary.probe.getPixelRatio(),1,'ordinary UI keeps native sharpness');
    assert.equal(large.renderer.stats().frameCount,1,'one submitted draw, no fake extra frames');
    const initialChanges=large.probe.ratioChanges.length;
    for(let n=0;n<32;n++){large.advance();ordinary.advance();}
    assert.equal(large.renderer.stats().quality,'balanced');
    assert.equal(large.probe.ratioChanges.length,initialChanges,'bounded first paint does not rebuild each tick');
    assert.equal(large.probe.draws,33,'each real fake-render submission still counted');
    assert.equal(ordinary.probe.draws,33);
  } finally {large.renderer.dispose();ordinary.renderer.dispose();}
});
