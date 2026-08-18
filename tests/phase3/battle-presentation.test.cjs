'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const {
  BattleRoyaleRuntime,
  createBattleConfig,
  createBattleRenderSnapshot,
  planBattleAudioCues,
  evaluateBattleOutputHealth,
} = require('../../dist/games/ai-battle-royale/src/index.js');

function runtime(seed = 'phase3-seed') {
  return new BattleRoyaleRuntime(createBattleConfig({
    combatantCount: 8,
    maxTicks: 220,
    zoneFirstShrinkTick: 28,
    zoneShrinkInterval: 24,
    noProgressTicks: 45,
    voteWindowEvery: 80,
    voteWindowTicks: 20,
  }), seed, `run-${seed}`);
}

test('render snapshots are deeply immutable, checksummed and free of authoritative secrets', () => {
  const game = runtime();
  for (let index = 0; index < 12; index += 1) game.step();
  const snapshot = createBattleRenderSnapshot(game.state, { cleanFeed: false, reducedMotion: false, highContrast: false });
  assert.equal(snapshot.gameId, 'ai-battle-royale');
  assert.equal(snapshot.survivors, game.state.combatants.filter((agent) => agent.alive).length);
  assert.match(snapshot.checksum, /^[0-9a-f]{8}$/);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.combatants), true);
  assert.equal(Object.isFrozen(snapshot.combatants[0]), true);
  const serialized = JSON.stringify(snapshot);
  assert.equal(serialized.includes('rng'), false);
  assert.equal(serialized.includes('seed'), false);
  assert.equal(serialized.includes('processedInputIds'), false);
  assert.equal(serialized.includes('actorHash'), false);
  assert.equal(serialized.includes('eliminatedBy'), false);
});

test('snapshot hierarchy exposes survivor, zone, focus, leaderboard, feed and accessibility truth', () => {
  const game = runtime('hierarchy');
  for (let index = 0; index < 40 && !game.state.result; index += 1) game.step();
  const snapshot = createBattleRenderSnapshot(game.state, { cleanFeed: false, reducedMotion: true, highContrast: true });
  assert.ok(snapshot.survivors >= 0 && snapshot.survivors <= game.state.config.combatantCount);
  assert.ok(snapshot.zone.ticksUntilShrink >= 0);
  assert.ok(snapshot.focus === null || snapshot.combatants.some((agent) => agent.id === snapshot.focus.id));
  assert.ok(snapshot.leaderboard.length <= 6);
  assert.ok(snapshot.killFeed.length <= 5);
  assert.equal(snapshot.accessibility.reducedMotion, true);
  assert.equal(snapshot.accessibility.highContrast, true);
  assert.equal(snapshot.accessibility.colorOnlyMeaning, false);
  assert.ok(snapshot.caption.length <= 120);
});

test('clean feed removes secondary cards without removing authoritative match truth', () => {
  const game = runtime('clean-feed');
  for (let index = 0; index < 8; index += 1) game.step();
  const full = createBattleRenderSnapshot(game.state, { cleanFeed: false });
  const clean = createBattleRenderSnapshot(game.state, { cleanFeed: true });
  assert.equal(clean.cleanFeed, true);
  assert.equal(clean.survivors, full.survivors);
  assert.deepEqual(clean.zone, full.zone);
  assert.equal(clean.vote, null);
  assert.deepEqual(clean.killFeed, []);
  assert.ok(clean.combatants.length > 0);
});

test('audio planner prioritizes terminal and elimination truth, deduplicates and respects voice limits', () => {
  const events = [
    { sequence: 1, tick: 10, type: 'move', importance: 1, actorId: 'agent-01' },
    { sequence: 2, tick: 10, type: 'hit', importance: 2, actorId: 'agent-02', targetId: 'agent-03', amount: 15 },
    { sequence: 3, tick: 10, type: 'elimination', importance: 5, targetId: 'agent-03' },
    { sequence: 4, tick: 10, type: 'match-result', importance: 5, actorId: 'agent-02', detail: 'last-standing' },
  ];
  const planned = planBattleAudioCues(events, { seenEventSequences: [2], maxVoices: 2, muted: false });
  assert.equal(planned.cues.length, 2);
  assert.equal(planned.cues[0].eventSequence, 4);
  assert.equal(planned.cues[1].eventSequence, 3);
  assert.ok(planned.cues.every((cue) => cue.caption.length > 0));
  assert.deepEqual(planned.seenEventSequences.slice(-2), [3, 4]);
  const muted = planBattleAudioCues(events, { seenEventSequences: [], maxVoices: 4, muted: true });
  assert.equal(muted.cues.length, 0);
  assert.ok(muted.captions.length >= 2);
});

test('output health distinguishes healthy, stale, frozen, black, wrong-scene and silent output', () => {
  const base = { expectedScene: 'running', actualScene: 'running', snapshotAgeMs: 80, frameCount: 20, changedFrameCount: 12, lumaPermille: 430, audioActive: true, audioExpected: true };
  assert.equal(evaluateBattleOutputHealth(base).status, 'healthy');
  assert.equal(evaluateBattleOutputHealth({ ...base, snapshotAgeMs: 4_500 }).status, 'stale');
  assert.equal(evaluateBattleOutputHealth({ ...base, changedFrameCount: 0 }).status, 'frozen');
  assert.equal(evaluateBattleOutputHealth({ ...base, lumaPermille: 0 }).status, 'black');
  assert.equal(evaluateBattleOutputHealth({ ...base, actualScene: 'result' }).status, 'wrong-scene');
  assert.equal(evaluateBattleOutputHealth({ ...base, audioActive: false }).status, 'silent');
});

test('snapshot reconstruction after renderer loss is deterministic and current-state exact', () => {
  const game = runtime('renderer-recovery');
  for (let index = 0; index < 35 && !game.state.result; index += 1) game.step();
  const first = createBattleRenderSnapshot(game.state, { reducedMotion: true });
  const restored = BattleRoyaleRuntime.restore(game.snapshot());
  const second = createBattleRenderSnapshot(restored.state, { reducedMotion: true });
  assert.deepEqual(second, first);
});

test('stream host self-test proves twin authority, presentation acceptance and autonomous restart', () => {
  const result = spawnSync(process.execPath, ['scripts/serve-battle-royale-stream.cjs', '--self-test'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 20_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.gameId, 'ai-battle-royale');
  assert.equal(report.authorityStable, true);
  assert.equal(report.presentationRejected, 0);
  assert.equal(report.rendererRecoveryVerified, true);
  assert.equal(report.autonomousRestartObserved, true);
});
