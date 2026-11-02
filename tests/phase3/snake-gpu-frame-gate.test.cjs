'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
const context = { performance: { now: () => 0 } };
vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\nthis.factory = typeof createGpuFrameGate === "function" ? createGpuFrameGate : null;', context);

function setup(options = {}) {
  assert.equal(typeof context.factory, 'function', 'renderer must expose the bounded GPU gate');
  let now = 0, lost = false, nullFence = false, status = 1, next = 0, polls = 0, flushes = 0;
  const live = new Set(), deleted = [];
  const gl = {
    SYNC_GPU_COMMANDS_COMPLETE: 0, TIMEOUT_EXPIRED: 1, ALREADY_SIGNALED: 2, CONDITION_SATISFIED: 3, WAIT_FAILED: 4,
    isContextLost: () => lost,
    fenceSync(condition, flags) { assert.equal(condition, 0); assert.equal(flags, 0); if (nullFence) return null; const sync = ++next; live.add(sync); return sync; },
    clientWaitSync(sync, flags, timeout) { assert(live.has(sync)); assert.equal(flags, 0); assert.equal(timeout, 0, 'must never block the browser thread'); polls++; return status; },
    flush() { flushes++; },
    deleteSync(sync) { assert(live.delete(sync), 'delete each sync exactly once'); deleted.push(sync); },
  };
  const gate = context.factory(gl, { now: () => now, ...options });
  return { gate, gl, live, deleted, setNow: value => { now = value; }, setStatus: value => { status = value; },
    lose: () => { lost = true; }, nullFence: () => { nullFence = true; }, polls: () => polls, flushes: () => flushes };
}

test('bounds pending GPU work at two frames without waiting or retaining snapshots', () => {
  const f = setup();
  assert.equal(f.gate.canDraw(), true); f.gate.submitted();
  assert.equal(f.gate.canDraw(), true); f.gate.submitted();
  for (let i = 0; i < 100; i++) assert.equal(f.gate.canDraw(), false);
  assert.equal(f.live.size, 2);
  assert.equal(f.gate.stats().pending, 2);
  assert.equal(f.gate.stats().skipped, 100);
  assert.equal(f.flushes(), 2);
  assert(f.polls() <= 101, 'only the oldest pending fence needs polling');
});

test('releases signaled fences and resumes with a bounded queue', () => {
  const f = setup(); f.gate.submitted(); f.gate.submitted();
  f.setNow(50); f.setStatus(f.gl.CONDITION_SATISFIED);
  assert.equal(f.gate.canDraw(), true);
  assert.equal(f.live.size, 0);
  assert.equal(f.gate.stats().completed, 2);
  assert.equal(f.gate.stats().maxObservedLatencyMs, 50);
  f.gate.submitted(); assert.equal(f.live.size, 1);
  f.gate.dispose(); assert.equal(f.live.size, 0);
  assert.equal(f.gate.canDraw(), false);
  f.gate.dispose(); assert.equal(f.deleted.length, 3);
});

test('already signaled work is accepted even after a long hidden-tab pause', () => {
  const f = setup(); f.gate.submitted(); f.setNow(100000); f.setStatus(f.gl.ALREADY_SIGNALED);
  assert.equal(f.gate.canDraw(), true);
  assert.equal(f.gate.stats().completed, 1);
});

test('a stalled fence fails explicitly rather than adding an unbounded backlog', () => {
  const f = setup({ timeoutMs: 100 }); f.gate.submitted(); f.setNow(101);
  assert.throws(() => f.gate.canDraw(), /timed out/i);
  assert.equal(f.live.size, 0);
  assert.equal(f.gate.stats().failed, true);
  assert.equal(f.gate.canDraw(), false);
});

test('WAIT_FAILED releases all owned syncs and stays failed', () => {
  const f = setup(); f.gate.submitted(); f.gate.submitted(); f.setStatus(f.gl.WAIT_FAILED);
  assert.throws(() => f.gate.canDraw(), /wait failed/i);
  assert.equal(f.live.size, 0); assert.equal(f.deleted.length, 2);
  assert.equal(f.gate.canDraw(), false);
});

test('null fences do not silently disable backpressure', () => {
  const f = setup(); f.nullFence();
  assert.throws(() => f.gate.submitted(), /fence/i);
  assert.equal(f.gate.stats().failed, true);
  assert.equal(f.gate.canDraw(), false);
});

test('lost context clears invalid ownership and refuses new draws', () => {
  const f = setup(); f.gate.submitted(); f.lose();
  assert.equal(f.gate.canDraw(), false);
  assert.equal(f.gate.stats().pending, 0);
  assert.equal(f.deleted.length, 0, 'do not query or delete invalid lost-context syncs');
  f.gate.dispose(); assert.equal(f.gate.canDraw(), false);
});

test('maximum queue depth is enforced even when a caller forgets canDraw', () => {
  const f = setup(); f.gate.submitted(); f.gate.submitted();
  assert.throws(() => f.gate.submitted(), /capacity/i);
  assert.equal(f.live.size, 0);
});

test('capability absence is explicit, while disposal still disables drawing', () => {
  assert.equal(typeof context.factory, 'function');
  const gate = context.factory({ isContextLost: () => false });
  assert.equal(gate.stats().supported, false);
  assert.equal(gate.canDraw(), true); gate.submitted();
  assert.equal(gate.stats().pending, 0);
  gate.dispose(); assert.equal(gate.canDraw(), false);
});

test('rejects unbounded or invalid queue options', () => {
  assert.equal(typeof context.factory, 'function');
  for (const maxFrames of [0, -1, 3, 1.5, Infinity, NaN]) assert.throws(() => context.factory({}, { maxFrames }), /maxFrames/);
  for (const timeoutMs of [0, -1, Infinity, NaN]) assert.throws(() => context.factory({}, { timeoutMs }), /timeoutMs/);
});
