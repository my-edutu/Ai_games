'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createRuntime } = require('../../games/marble-survival/scripts/serve-complete-runtime.cjs');

test('browser runtime snapshots are produced from the live MarbleRuntime authority', () => {
  const runtime = createRuntime({ seed: 'server-authority' });

  assert.ok(runtime.authority, 'server runtime must expose its authoritative MarbleRuntime instance for operations/testing');
  const first = runtime.currentSnapshot();
  assert.equal(first.version, 1);
  assert.equal(first.tick, runtime.authority.state.tick);
  assert.equal(first.lifecycle, runtime.authority.state.lifecycle);
  assert.equal(JSON.stringify(first).includes('server-authority'), false, 'presentation snapshot must not leak the authority seed');

  for (let index = 0; index < 12; index += 1) runtime.advance();
  const second = runtime.currentSnapshot();

  assert.equal(second.tick, runtime.authority.state.tick, 'browser tick must be the authority tick, not a synthetic presentation counter');
  assert.equal(second.round.index, runtime.authority.state.roundIndex);
  assert.equal(second.round.number, runtime.authority.state.roundNumber);
  assert.deepEqual(
    second.marbles.map((marble) => marble.id).sort((a, b) => a - b),
    runtime.authority.state.marbles.map((marble) => marble.id).sort((a, b) => a - b),
  );
});

test('browser runtime does not advance authority while paused and resumes without fabricating round events', () => {
  const runtime = createRuntime({ seed: 'server-pause' });
  const before = runtime.authority.state.tick;

  runtime.state.paused = true;
  for (let index = 0; index < 5; index += 1) runtime.advance();
  assert.equal(runtime.authority.state.tick, before);

  runtime.state.paused = false;
  for (let index = 0; index < 5; index += 1) runtime.advance();
  assert.equal(runtime.currentSnapshot().tick, runtime.authority.state.tick);
  assert.equal(runtime.events.some((event) => event.type === 'near-miss' && event.synthetic === true), false);
});

test('server attaches one deterministic camera directive to the presentation snapshot', () => {
  const runtime = createRuntime({ seed: 'server-camera' });
  const first = runtime.currentSnapshot();

  assert.ok(first.camera.directive, 'presentation snapshot must carry the tested camera directive');
  assert.equal(first.camera.directive.mode, 'overview');
  assert.ok(Array.isArray(first.camera.directive.focusIds));
  assert.equal(first.camera.directive.issuedAtTick, first.tick);

  const repeated = runtime.currentSnapshot();
  assert.deepEqual(repeated.camera.directive, first.camera.directive, 're-reading the same authority tick must not thrash the shot');

  runtime.advance();
  const next = runtime.currentSnapshot();
  assert.ok(['overview', 'cut-line', 'danger', 'finish', 'victory'].includes(next.camera.directive.mode));
  assert.ok(next.camera.directive.holdUntilTick >= next.camera.directive.issuedAtTick);
});
