'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ARCHETYPES,
  ROUND_DEFINITIONS,
  INFLUENCE_CATALOGUE,
  createRoster,
  buildArena,
  observeMarble,
  chooseMarbleAction,
  runCampaign,
  replayCampaign,
  createPublicSnapshot,
  layoutForViewport,
  semanticAudioCues,
  isFreshSnapshot,
  InfluenceQueue,
  SnapshotRing,
  classifyHealth,
  OperatorController,
  runChaosSuite,
  validateReleaseEvidence,
} = require('../../complete/game7.cjs');

test('phase 1: roster is deterministic, complete, and archetype-balanced', () => {
  const first = createRoster('foundation');
  const second = createRoster('foundation');
  assert.deepEqual(first, second);
  assert.equal(first.length, 32);
  assert.equal(new Set(first.map((marble) => marble.id)).size, 32);
  for (const archetype of ARCHETYPES) {
    assert.equal(first.filter((marble) => marble.archetype === archetype).length, 8);
  }
  assert.equal(new Set(first.map((marble) => marble.pattern)).size, 4);
});

test('phase 1: every arena is bounded and the championship is mirrored', () => {
  for (const round of ROUND_DEFINITIONS) {
    const arena = buildArena(round.id, 'arena-seed');
    assert.ok(arena.width > 0 && arena.height > 0);
    assert.ok(arena.features.length > 0);
    for (const feature of arena.features) {
      assert.ok(feature.x >= 0 && feature.x <= arena.width);
      assert.ok(feature.y >= 0 && feature.y <= arena.height);
    }
  }
  const championship = buildArena('championship', 'arena-seed');
  assert.equal(championship.symmetric, true);
  for (const feature of championship.features.filter((entry) => !entry.id.endsWith('-mirror'))) {
    const mirror = championship.features.find((entry) => entry.id === `${feature.id}-mirror`);
    assert.ok(mirror);
    assert.equal(feature.x + mirror.x, championship.width);
    assert.equal(feature.y, mirror.y);
    assert.equal(feature.type, mirror.type);
  }
});

test('phase 2: local observation AI emits only legal bounded actions', () => {
  const roster = createRoster('ai');
  const arena = buildArena('hazard-gauntlet', 'ai');
  for (const marble of roster) {
    const observation = observeMarble(marble, arena, 36, roster.length);
    const action = chooseMarbleAction(marble, observation, arena.id, 'ai');
    assert.ok(Number.isInteger(action.steer));
    assert.ok(action.steer >= -2 && action.steer <= 2);
    assert.ok(Number.isInteger(action.thrust));
    assert.ok(action.thrust >= 0 && action.thrust <= 3);
    assert.ok(['advance', 'avoid', 'boost', 'contest', 'stabilise'].includes(action.intent));
  }
});

test('phase 2: campaign enforces the exact five-round elimination bracket', () => {
  const campaign = runCampaign('bracket');
  assert.equal(campaign.validation.valid, true);
  assert.deepEqual(campaign.rounds.map((round) => round.entrants.length), [32, 16, 8, 4, 2]);
  assert.deepEqual(campaign.rounds.map((round) => round.qualified.length), [16, 8, 4, 2, 1]);
  assert.equal(campaign.rounds.at(-1).qualified[0], campaign.champion.id);
});

test('phase 2: replay checksum is stable for the same seed', () => {
  const campaign = runCampaign('replay-42');
  const replay = replayCampaign(campaign);
  assert.equal(replay.stable, true);
  assert.equal(replay.actualChecksum, replay.expectedChecksum);
});

test('phase 2: deterministic corpus permits every archetype to become champion', () => {
  const winners = new Set();
  for (let index = 0; index < 192; index += 1) {
    winners.add(runCampaign(`balance-${index}`).champion.archetype);
  }
  assert.deepEqual([...winners].sort(), [...ARCHETYPES].sort());
});

test('phase 3: public snapshot is bounded and does not leak authority seed or operator state', () => {
  const campaign = runCampaign('private-seed');
  const snapshot = createPublicSnapshot(campaign, { roundIndex: 1, tick: 40 });
  const serialized = JSON.stringify(snapshot);
  assert.equal(snapshot.marbles.length, 16);
  assert.ok(snapshot.leaderboard.length <= 8);
  assert.equal(serialized.includes('private-seed'), false);
  assert.equal(serialized.includes('operator'), false);
  assert.equal(serialized.includes('rng'), false);
});

test('phase 3: desktop, mobile, and clean broadcast layouts are explicit', () => {
  assert.equal(layoutForViewport(1920, 1080).mode, 'desktop');
  assert.equal(layoutForViewport(390, 844).mode, 'mobile');
  assert.equal(layoutForViewport(1920, 1080, true).mode, 'clean');
  assert.equal(layoutForViewport(1920, 1080, true).hud, false);
});

test('phase 3: semantic audio is allow-listed and capped', () => {
  const events = Array.from({ length: 12 }, (_, index) => ({ id: index, type: index === 2 ? 'unknown' : 'near-miss' }));
  const cues = semanticAudioCues(events);
  assert.equal(cues.length, 6);
  assert.equal(cues.some((cue) => cue.type === 'unknown'), false);
});

test('phase 3: stale snapshots are rejected', () => {
  assert.equal(isFreshSnapshot({ tick: 90 }, 100, 15), true);
  assert.equal(isFreshSnapshot({ tick: 80 }, 100, 15), false);
  assert.equal(isFreshSnapshot(null, 100, 15), false);
});

test('phase 4: influence catalogue has exactly six fixed families', () => {
  assert.equal(Object.keys(INFLUENCE_CATALOGUE).length, 6);
  for (const choices of Object.values(INFLUENCE_CATALOGUE)) {
    assert.ok(Array.isArray(choices));
    assert.ok(choices.length >= 3);
    assert.equal(new Set(choices).size, choices.length);
  }
});

test('phase 4: viewer influence enforces eligibility, idempotency, cooldown, and queue bounds', () => {
  const queue = new InfluenceQueue({ queueCap: 2, cooldownMs: 100, globalRateCap: 10 });
  assert.equal(queue.submit({ id: 'a', userId: 'u1', family: 'wind-vote', option: 'north', at: 1000 }).accepted, true);
  assert.equal(queue.submit({ id: 'a', userId: 'u2', family: 'wind-vote', option: 'south', at: 1001 }).reason, 'duplicate');
  assert.equal(queue.submit({ id: 'b', userId: 'u1', family: 'wind-vote', option: 'south', at: 1020 }).reason, 'cooldown');
  assert.equal(queue.submit({ id: 'c', userId: 'u2', family: 'wind-vote', option: 'east', at: 1100 }).accepted, true);
  assert.equal(queue.submit({ id: 'd', userId: 'u3', family: 'wind-vote', option: 'west', at: 1101 }).reason, 'queue-full');
  assert.equal(queue.submit({ id: 'e', userId: 'u4', family: 'wind-vote', option: 'invalid', at: 1102 }).reason, 'invalid-choice');
  assert.equal(queue.submit({ id: 'f', userId: 'u5', family: 'wind-vote', option: 'north', at: 1103, eligible: false }).reason, 'ineligible');
});

test('phase 4: influence tie resolution is deterministic', () => {
  const queue = new InfluenceQueue({ cooldownMs: 0 });
  queue.submit({ id: '1', userId: '1', family: 'wind-vote', option: 'north', at: 1 });
  queue.submit({ id: '2', userId: '2', family: 'wind-vote', option: 'south', at: 2 });
  const result = queue.resolve('wind-vote');
  assert.equal(result.winner, 'north');
  assert.equal(result.votes, 2);
  assert.equal(queue.size(), 0);
});

test('phase 5: corrupt latest snapshot falls back to the previous checksummed snapshot', () => {
  const campaign = runCampaign('recovery');
  const ring = new SnapshotRing(3);
  ring.write(createPublicSnapshot(campaign, { tick: 10 }));
  ring.write(createPublicSnapshot(campaign, { tick: 20 }));
  ring.corruptLatest();
  const result = ring.latestValid();
  assert.ok(result);
  assert.equal(result.recovered, true);
  assert.equal(result.snapshot.tick, 10);
});

test('phase 5: health classification and operator authentication are bounded', () => {
  assert.equal(classifyHealth({ authorityRunning: true, snapshotAvailable: true, tickLag: 0, streamConnected: true }).status, 'healthy');
  assert.equal(classifyHealth({ authorityRunning: true, snapshotAvailable: true, tickLag: 45, streamConnected: true }).status, 'degraded');
  assert.equal(classifyHealth({ authorityRunning: false, snapshotAvailable: false, tickLag: 0, streamConnected: true }).status, 'unhealthy');

  const controller = new OperatorController('secret', 2);
  assert.equal(controller.execute({ token: 'wrong', command: 'pause', actor: 'tester', at: 1 }).status, 401);
  assert.equal(controller.execute({ token: 'secret', command: 'delete-all', actor: 'tester', at: 2 }).status, 400);
  assert.equal(controller.execute({ token: 'secret', command: 'pause', actor: 'tester', at: 3 }).ok, true);
  controller.execute({ token: 'secret', command: 'resume', actor: 'tester', at: 4 });
  controller.execute({ token: 'secret', command: 'restart', actor: 'tester', at: 5 });
  assert.equal(controller.history().length, 2);
});

test('phase 5: declared chaos suite passes', () => {
  const result = runChaosSuite('chaos-verification');
  assert.equal(result.passed, true);
  assert.equal(Object.values(result.checks).every(Boolean), true);
});

test('phase 6: software evidence can reach R4 without falsely claiming R5', () => {
  const result = validateReleaseEvidence({
    build: true,
    unitTests: true,
    campaignCorpus: true,
    serverSelfTest: true,
    chaosSuite: true,
    browserSmoke: true,
    releaseReport: true,
  });
  assert.equal(result.softwareCandidate, true);
  assert.equal(result.readiness, 'R4');
  assert.equal(result.productionReady, false);
  assert.ok(result.missingR5.includes('endurance72h'));
  assert.ok(result.missingR5.includes('canary7d'));
});

test('phase 6: R5 requires every genuine external proof', () => {
  const result = validateReleaseEvidence({
    build: true,
    unitTests: true,
    campaignCorpus: true,
    serverSelfTest: true,
    chaosSuite: true,
    browserSmoke: true,
    releaseReport: true,
    endurance72h: true,
    canary7d: true,
    credentialedProviderSession: true,
    independentSecurityReview: true,
    independentAccessibilityReview: true,
    witnessedRecoveryDrill: true,
    productionCapacityProof: true,
  });
  assert.equal(result.readiness, 'R5');
  assert.equal(result.productionReady, true);
  assert.deepEqual(result.missingR5, []);
});
