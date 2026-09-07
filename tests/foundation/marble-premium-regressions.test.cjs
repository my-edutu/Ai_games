'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarbleRuntime,
  applyTournamentRules,
  stepMarblePhysics,
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

function idleActions(state) {
  return state.marbles
    .filter((marble) => marble.status === 'active' && marble.roundStatus === 'racing')
    .map((marble) => ({
      marbleId: marble.id,
      steerX: 0,
      steerY: 0,
      boostPermille: 1_000,
      intent: 'holding-line',
      confidence: 'medium',
    }));
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

test('moving sweepers transfer their authoritative motion into a stationary marble', () => {
  const state = twoMarbleState('premium-sweeper-motion');
  const marble = state.marbles[0];
  const spectator = state.marbles[1];

  spectator.status = 'eliminated';
  spectator.roundStatus = 'out';
  state.activeIds = [marble.id];
  marble.position = { x: 10_250, y: 8_000 };
  marble.velocity = { x: 0, y: 0 };
  state.tick = 0;
  state.arena.sweepers = [{
    id: 'momentum-sweeper',
    kind: 'sweeper',
    baseX: 9_000,
    baseY: 7_600,
    width: 1_200,
    height: 800,
    axis: 'x',
    amplitude: 1_000,
    periodTicks: 40,
    phaseTicks: 10,
    restitutionPermille: 900,
  }];

  const result = stepMarblePhysics(state, idleActions(state));
  const resolved = result.state.marbles.find((candidate) => candidate.id === marble.id);

  assert.ok(result.contacts.some((contact) => contact.kind === 'sweeper'), 'the sweeper should make contact');
  assert.ok(resolved.velocity.x > 0, 'a right-moving sweeper must push a stationary marble to the right');
});

test('fast moving sweepers cannot tunnel through a stationary marble between tick endpoints', () => {
  const state = twoMarbleState('premium-sweeper-tunnelling');
  const marble = state.marbles[0];
  const spectator = state.marbles[1];

  spectator.status = 'eliminated';
  spectator.roundStatus = 'out';
  state.activeIds = [marble.id];
  marble.position = { x: 10_500, y: 8_000 };
  marble.velocity = { x: 0, y: 0 };
  state.tick = 0;
  state.arena.sweepers = [{
    id: 'fast-sweeper',
    kind: 'sweeper',
    baseX: 9_000,
    baseY: 7_600,
    width: 400,
    height: 800,
    axis: 'x',
    amplitude: 3_000,
    periodTicks: 4,
    phaseTicks: 1,
    restitutionPermille: 900,
  }];

  const result = stepMarblePhysics(state, idleActions(state));

  assert.ok(
    result.contacts.some((contact) => contact.kind === 'sweeper' && contact.colliderId === 'fast-sweeper'),
    'a sweeper whose path crosses the marble during the tick must register contact even when neither endpoint overlaps',
  );
});

test('shield recovery uses a bounded recovery impulse instead of teleporting the marble', () => {
  const state = twoMarbleState('premium-shield-recovery');
  const marble = state.marbles[0];
  const spectator = state.marbles[1];

  spectator.status = 'eliminated';
  spectator.roundStatus = 'out';
  state.activeIds = [marble.id];
  marble.position = { x: 12_000, y: 7_000 };
  marble.velocity = { x: 30, y: -140 };
  marble.shieldCharges = 1;
  state.tick = 200;
  state.arena.hazards = [{
    id: 'shield-pit',
    kind: 'pit',
    x: 11_000,
    y: 6_500,
    width: 2_000,
    height: 1_000,
  }];
  const before = { ...marble.position };

  const result = applyTournamentRules(state, []);
  const recovered = result.state.marbles.find((candidate) => candidate.id === marble.id);
  const recoveryEvent = result.events.find((event) => event.type === 'shield-recovery');

  assert.deepEqual(recovered.position, before, 'shield activation must not teleport the marble out of the hazard');
  assert.equal(recovered.shieldCharges, 0);
  assert.equal(recovered.status, 'active');
  assert.ok(recovered.velocity.y > 0, 'shield recovery should apply a bounded impulse away from the hazard approach direction');
  assert.ok(recovered.recoveryUntilTick > state.tick, 'recovery should have a short explicit grace window');
  assert.equal(recoveryEvent?.data?.recoveryUntilTick, recovered.recoveryUntilTick);

  result.state.tick += 1;
  const graceResult = applyTournamentRules(result.state, []);
  const duringGrace = graceResult.state.marbles.find((candidate) => candidate.id === marble.id);
  assert.equal(duringGrace.status, 'active', 'remaining inside the hazard during the recovery grace window must not immediately eliminate the marble');
});
