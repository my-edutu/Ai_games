'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDefaultConfig,
  createInitialState,
  compareCommands,
  validateCommand,
  stepSimulation,
  ValidationError,
} = require('../../dist/games/eko-street-run/src/index.js');

function command(runId, tick, sourceId, sequence, priority, axis = 1) {
  return { schemaVersion: 1, runId, targetTick: tick, priority, sourceId, sourceSequence: sequence, type: 'move', payload: { axis } };
}

test('commands have a stable total ordering independent of input array order', () => {
  const state = createInitialState(createDefaultConfig({ seed: 'eko-command-order' }));
  const commands = [
    command(state.runId, 0, 'z-controller', 2, 10, -1),
    command(state.runId, 0, 'a-controller', 3, 10, 1),
    command(state.runId, 0, 'a-controller', 2, 5, 1),
  ];
  const ordered = commands.map(item => validateCommand(item, state)).sort(compareCommands);
  assert.deepEqual(ordered.map(item => [item.priority, item.sourceId, item.sourceSequence]), [
    [5, 'a-controller', 2],
    [10, 'a-controller', 3],
    [10, 'z-controller', 2],
  ]);
});

test('invalid axis and wrong run are rejected before mutation', () => {
  const state = createInitialState(createDefaultConfig({ seed: 'eko-command-invalid' }));
  assert.throws(() => validateCommand(command(state.runId, 0, 'controller', 0, 10, 2), state), error => error instanceof ValidationError && error.code === 'INVALID_AXIS');
  assert.throws(() => validateCommand(command('wrong-run', 0, 'controller', 0, 10, 1), state), error => error instanceof ValidationError && error.code === 'RUN_MISMATCH');
});

test('duplicates and stale commands apply at most once with typed rejection events', () => {
  let state = createInitialState(createDefaultConfig({ seed: 'eko-command-dedupe' }));
  const first = command(state.runId, 0, 'controller', 1, 10, 1);
  let out = stepSimulation(state, [first, structuredClone(first)]);
  state = out.state;
  assert.equal(out.acceptedCommands.length, 1);
  assert.equal(out.rejectedCommands.length, 1);
  assert.equal(out.rejectedCommands[0].reason, 'DUPLICATE');

  const stale = command(state.runId, 0, 'controller', 2, 10, 1);
  out = stepSimulation(state, [stale]);
  assert.equal(out.acceptedCommands.length, 0);
  assert.equal(out.rejectedCommands[0].reason, 'STALE_TICK');
  assert.equal(out.events.some(event => event.type === 'command.rejected'), true);
});
