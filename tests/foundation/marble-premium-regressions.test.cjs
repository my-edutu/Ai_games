'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  applyTournamentRules,
} = require('../../dist/games/marble-survival/src/index.js');

function twoMarbleState(seed = 'premium-finish-order') {
  const runtime = MarbleRuntime.create({
    rosterSize: 2,
    roundQuotas: [1, 1, 1, 1, 1],
    roundIntroTicks: 0,
    roundTimeoutTicks: 1_000,
  }, seed);
  runtime.state.lifecycle = 'active';
  runtime.state.roundIntroRemaining = 0;
  runtime.state.arena.obstacles = [];
  runtime.state.arena.bumpers = [];
  runtime.state.arena.hazards = [];
  runtime.state.arena.windZones = [];
  runtime.state.arena.sweepers = [];
  return runtime.state;
}

test('same-tick finishers are ranked by authoritative crossing fraction instead of marble id', () => {
  const state = twoMarbleState();
  const [lowerId, higherId] = state.marbles.slice().sort((a, b) => a.id - b.id);
  const finishPlane = state.arena.finishY + state.config.marbleRadius;

  lowerId.previousPosition = { x: lowerId.position.x, y: finishPlane + 100 };
  lowerId.position = { x: lowerId.position.x, y: finishPlane - 1 };
  lowerId.velocity = { x: 0, y: -101 };

  higherId.previousPosition = { x: higherId.position.x, y: finishPlane + 100 };
  higherId.position = { x: higherId.position.x, y: finishPlane - 100 };
  higherId.velocity = { x: 0, y: -200 };

  const result = applyTournamentRules(state, []);
  const resolved = result.state.roundResults.at(-1);

  assert.ok(resolved, 'the round should resolve when the one-slot quota is reached');
  assert.equal(
    resolved.qualifierIds[0],
    higherId.id,
    'the marble that crossed earlier within the tick must win the qualifying slot even when it has the larger id',
  );
  assert.equal(result.state.marbles.find((marble) => marble.id === higherId.id).finishRank, 1);
});
