'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const battle = require('../../dist/games/ai-battle-royale/src/index.js');

function phase3Config(overrides = {}) {
  return battle.createBattleConfig({
    width: 24,
    height: 18,
    combatantCount: 12,
    lootCount: 24,
    maxTicks: 220,
    intermissionTicks: 8,
    zoneFirstShrinkTick: 36,
    zoneShrinkInterval: 32,
    supplyDropEvery: 50,
    noProgressTicks: 80,
    voteWindowEvery: 64,
    voteWindowTicks: 16,
    ...overrides,
  });
}

function runtime(seed = 'phase3') {
  return new battle.BattleRoyaleRuntime(phase3Config(), seed, `run-${seed}`);
}

function eliminateAllBut(state, survivorIds) {
  for (const combatant of state.combatants) {
    if (!survivorIds.includes(combatant.id)) {
      combatant.alive = false;
      combatant.health = 0;
      combatant.shield = 0;
      combatant.intent = 'eliminated';
      combatant.deathTick = state.tick;
    }
  }
}

test('render snapshots are deeply immutable, privacy-safe and authority-preserving', () => {
  const game = runtime('privacy');
  for (let index = 0; index < 12; index += 1) game.step();
  const before = battle.battleChecksum(game.state);
  const snapshot = battle.createBattleRenderSnapshot(game.state, game.state.events);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.combatants), true);
  assert.equal(Object.isFrozen(snapshot.arena.obstacles), true);
  const encoded = JSON.stringify(snapshot);
  for (const forbidden of ['"seed"', '"runId"', 'deterministicVersion', 'processedInputIds', 'actorHash', 'ballots', 'rng']) {
    assert.equal(encoded.includes(forbidden), false, forbidden);
  }
  assert.ok(Buffer.byteLength(encoded) < 1_500_000);
  assert.throws(() => { snapshot.goal.survivors = 99; }, TypeError);
  assert.equal(battle.battleChecksum(game.state), before);
});

test('public scenes, ten-second hierarchy and recovery copy remain truthful', () => {
  const game = runtime('scenes');
  const normal = battle.createBattleRenderSnapshot(game.state, game.state.events);
  assert.equal(normal.scene, 'battle');
  assert.equal(normal.goal.survivors, 12);
  assert.equal(normal.zone.ticksUntilShrink, 36);
  assert.ok(normal.focus && normal.focus.intent.length <= 96);
  eliminateAllBut(game.state, ['agent-01', 'agent-02', 'agent-03']);
  const finalCircle = battle.createBattleRenderSnapshot(game.state, []);
  assert.equal(finalCircle.scene, 'final-circle');
  eliminateAllBut(game.state, ['agent-01']);
  game.step();
  const result = battle.createBattleRenderSnapshot(game.state, game.state.events);
  assert.equal(result.scene, 'result');
  assert.equal(result.result.winnerId, 'agent-01');
  assert.ok(result.captions.length > 0);
  game.step();
  assert.equal(battle.createBattleRenderSnapshot(game.state, []).scene, 'intermission');
  const quarantined = structuredClone(game.state);
  quarantined.lifecycle = 'quarantined';
  const recovery = battle.createBattleRenderSnapshot(quarantined, [{ sequence: 999, tick: quarantined.tick, type: 'system-status', detail: 'secret operator token', importance: 5 }]);
  assert.equal(recovery.scene, 'recovery');
  assert.equal(JSON.stringify(recovery).includes('secret operator token'), false);
});

test('responsive layouts preserve arena, primary HUD, captions and clean feed', () => {
  const desktop = battle.computeBattleLayout(1920, 1080, false);
  const phone = battle.computeBattleLayout(640, 360, false);
  const clean = battle.computeBattleLayout(1280, 720, true);
  assert.equal(desktop.breakpoint, 'desktop');
  assert.ok(desktop.arena.width > desktop.hud.width);
  assert.ok(desktop.caption.height >= 48);
  assert.equal(phone.breakpoint, 'phone-landscape');
  assert.ok(phone.arena.width >= 400);
  assert.ok(phone.primaryFontPx >= 16);
  assert.ok(phone.caption.y + phone.caption.height <= 360);
  assert.equal(clean.cleanFeed, true);
  assert.equal(clean.hud.width, 0);
  assert.equal(clean.narrative.width, 0);
  assert.equal(clean.arena.width, 1280);
  assert.throws(() => battle.computeBattleLayout(0, 720, false), /width/);
});

test('camera and audio derive bounded semantic feedback without mutating authority', () => {
  const game = runtime('feedback');
  for (let index = 0; index < 8; index += 1) game.step();
  const before = battle.battleChecksum(game.state);
  const snapshot = battle.createBattleRenderSnapshot(game.state, [
    { sequence: 91, tick: game.state.tick, type: 'elimination', targetId: 'agent-02', detail: 'zone-phase-1', importance: 5 },
    { sequence: 92, tick: game.state.tick, type: 'zone-warning', detail: 'Zone closes soon', importance: 3 },
  ]);
  const camera = battle.deriveBattleCamera(snapshot, null);
  const cues = battle.deriveBattleAudioCues(snapshot, null);
  assert.ok(['overview', 'focus', 'final-circle', 'result', 'recovery'].includes(camera.mode));
  assert.ok(camera.zoom >= 0.8 && camera.zoom <= 2);
  assert.ok(camera.impulse >= 0 && camera.impulse <= 1);
  assert.ok(cues.length <= 8);
  assert.ok(cues.every((cue) => cue.priority >= 1 && cue.priority <= 5 && cue.caption.length > 0));
  assert.equal(battle.battleChecksum(game.state), before);
});

test('presentation controller rejects stale and divergent snapshots and restores accepted truth', () => {
  const game = runtime('controller');
  const controller = new battle.BattlePresentationController();
  const first = battle.createBattleRenderSnapshot(game.state, game.state.events);
  assert.equal(controller.accept(first).status, 'accepted');
  game.step();
  const second = battle.createBattleRenderSnapshot(game.state, game.state.events);
  assert.equal(controller.accept(second).status, 'accepted');
  assert.equal(controller.accept(first).status, 'rejected-stale');
  const divergent = structuredClone(second);
  divergent.goal.survivors -= 1;
  assert.equal(controller.accept(divergent).status, 'rejected-divergent');
  assert.deepEqual(controller.recover(), second);
  controller.clear();
  assert.equal(controller.recover(), null);
});

test('output health distinguishes stale, frozen, black, silent and wrong-scene faults', () => {
  const healthy = { nowMs: 10_000, lastSnapshotMs: 9_900, lastProgressMs: 9_900, frameLuma: 0.35, pixelHash: 'a', previousPixelHash: 'b', audioExpected: true, audioLevel: 0.2, expectedScene: 'battle', actualScene: 'battle' };
  assert.equal(battle.classifyBattleOutputHealth(healthy).status, 'healthy');
  assert.equal(battle.classifyBattleOutputHealth({ ...healthy, lastSnapshotMs: 5_000 }).status, 'stale');
  assert.equal(battle.classifyBattleOutputHealth({ ...healthy, lastProgressMs: 4_000, pixelHash: 'x', previousPixelHash: 'x' }).status, 'frozen');
  assert.equal(battle.classifyBattleOutputHealth({ ...healthy, frameLuma: 0 }).status, 'black');
  assert.equal(battle.classifyBattleOutputHealth({ ...healthy, audioLevel: 0 }).status, 'silent');
  assert.equal(battle.classifyBattleOutputHealth({ ...healthy, actualScene: 'result' }).status, 'wrong-scene');
});

test('stream host self-test proves deterministic authority, privacy, assets and restart', () => {
  const result = spawnSync(process.execPath, ['scripts/serve-battle-royale-stream.cjs', '--self-test'], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.ok, true);
  assert.equal(report.authorityStable, true);
  assert.equal(report.snapshotPrivacySafe, true);
  assert.equal(report.browserAssets, true);
  assert.equal(report.restartObserved, true);
  assert.ok(report.acceptedSnapshots >= 200);
});
