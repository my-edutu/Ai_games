'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { createRuntime } = require('../../scripts/serve-complete-runtime.cjs');
const publicRoot = path.resolve(__dirname, '../../public/complete-runtime');

function advanceToNextRun(runtime, limit = 5_000) {
  const startRun = runtime.authority.state.runIndex;
  for (let step = 0; step < limit && runtime.authority.state.runIndex === startRun; step += 1) runtime.advance();
  return runtime.authority.state.runIndex;
}

test('presentation event history and camera reset atomically at automatic tournament restart', () => {
  const runtime = createRuntime({
    seed: 'marble-presentation-run-boundary',
    config: { roundIntroTicks: 0, roundTimeoutTicks: 60, intermissionTicks: 1 },
  });

  const nextRun = advanceToNextRun(runtime);
  assert.equal(nextRun, 1, 'expected automatic restart into run 2');

  const snapshot = runtime.currentSnapshot();
  assert.equal(snapshot.runIndex, 1);
  assert.equal(snapshot.round.index, 0);
  assert.equal(snapshot.arena.archetype, 'seeding-sprint');
  assert.notEqual(snapshot.camera.directive.mode, 'victory');
  assert.equal(snapshot.events.some((event) => event.type === 'tournament-champion'), false);
  assert.equal(snapshot.events.some((event) => event.type === 'intermission-started'), false);
  assert.equal(snapshot.events.some((event) => event.type === 'round-started'), true);
});

test('HUD derives run and round identity from the same snapshot used for race state', () => {
  const app = fs.readFileSync(path.join(publicRoot, 'app.js'), 'utf8');
  assert.match(app, /next\.runIndex/);
  assert.match(app, /next\.round\.number/);
  assert.doesNotMatch(app, /health\.runIndex/);
  assert.doesNotMatch(app, /health\.roundNumber/);
});
