'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../browser/snake-render-profile.spec.cjs');

function setup() {
  let time = 0, count = 0, calls = 0, queryCount = 0, deletedQueries = 0, wrapped;
  const noopTest = Object.assign(() => {}, { use() {} });
  const scope = {
    __dirname: path.dirname(file), module: { exports: {} }, window: {}, console,
    require(name) { return name === '@playwright/test' ? { test: noopTest, expect: {} } : require(name); },
    performance: { now: () => time }, setTimeout, clearTimeout,
    requestAnimationFrame(callback) { setImmediate(() => { time += 16; wrapped.draw({ snapshot: { revision: time } }); callback(time); }); },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), scope, { filename: file });
  const gl = {
    SYNC_GPU_COMMANDS_COMPLETE: 1, ALREADY_SIGNALED: 2, CONDITION_SATISFIED: 3,
    QUERY_RESULT_AVAILABLE: 4, QUERY_RESULT: 5,
    getExtension: () => ({ GPU_DISJOINT_EXT: 6, TIME_ELAPSED_EXT: 7 }),
    isContextLost: () => false, fenceSync: () => ({}), deleteSync() {}, flush() {},
    clientWaitSync: () => 2, getParameter: () => false,
    createQuery() { queryCount++; return {}; }, beginQuery() {}, endQuery() {},
    deleteQuery() { deletedQueries++; }, getQueryParameter: (q, what) => what === 4 ? true : 1e6,
    getError: () => 0, getContextAttributes: () => ({ antialias: true }),
  };
  const renderer = {
    draw() { calls++; if (calls % 2 === 0) return false; count++; return true; },
    stats: () => ({ frameCount: count, staticCache: { builds: 1 } }), resetTiming() {}, dispose() {},
  };
  wrapped = scope.module.exports.installProfiler({ getContext: () => gl }, renderer);
  return { wrapped, profiler: scope.window.__snakeRenderProfiler, helpers: scope.module.exports,
    queries: () => ({ created: queryCount, deleted: deletedQueries }) };
}

test('profiler keeps the last submitted public snapshot when a frame is skipped', () => {
  const f = setup(); const first = { snapshot: { revision: 1 } };
  f.wrapped.draw(first); assert.equal(f.profiler.snapshot(), first);
  f.wrapped.draw({ snapshot: { revision: 2 } });
  assert.equal(f.profiler.snapshot(), first);
});

test('profiler excludes skipped callbacks from CPU and GPU sample counts', async () => {
  const f = setup(); const report = await f.profiler.measure({ durationMs: 96 });
  assert.equal(report.cadence.callbacks, 6);
  assert.equal(report.cadence.actualDraws, 3);
  assert.equal(report.cpu.drawWallMs.count, 3);
  assert.equal(report.gpu.queriesIssued, 3);
  assert.equal(report.gpu.elapsedMs.count, 3);
  assert.equal(f.queries().created, f.queries().deleted);
});

test('all diagnostic source anchors still resolve on the actual renderer', () => {
  const f = setup();
  const renderer = fs.readFileSync(path.join(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
  const instrumented = f.helpers.buildDiagnosticSource(renderer);
  assert.match(instrumented, /createGpuFrameGate/);
  new vm.Script(instrumented.replace(/^import .*;\n/gm, '').replace(/^export /gm, ''));
});
