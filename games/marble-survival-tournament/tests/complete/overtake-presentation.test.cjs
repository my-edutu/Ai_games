'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const { MarbleRuntime, createMarblePresentationSnapshot } = require(runtimePath);
const appPath = path.resolve(__dirname, '../../public/complete-runtime/app.js');

test('presentation: overtake count and event are sanitized into broadcast state', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-overtake-presentation');
  const marble = runtime.state.marbles[0];
  marble.overtakes = 3;
  const snapshot = createMarblePresentationSnapshot(runtime.state, [{
    seq: 77,
    tick: runtime.state.tick,
    type: 'marble-overtake',
    data: {
      marbleId: marble.id,
      passedMarbleId: runtime.state.marbles[1].id,
      overtakes: 3,
      rootSeed: 'must-not-leak',
    },
  }]);

  const presented = snapshot.marbles.find((candidate) => candidate.id === marble.id);
  assert.ok(presented);
  assert.equal(presented.overtakes, 3);
  assert.equal(snapshot.events.length, 1);
  assert.deepEqual(snapshot.events[0].data, {
    marbleId: marble.id,
    passedMarbleId: runtime.state.marbles[1].id,
    overtakes: 3,
  });
  assert.equal(JSON.stringify(snapshot).includes('must-not-leak'), false);
});

test('presentation: broadcast feed recognizes official overtake events', () => {
  const app = fs.readFileSync(appPath, 'utf8');
  assert.match(app, /'marble-overtake'/);
  assert.match(app, /passedMarbleId/);
});
