'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerRenderSnapshot } = require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const { platformAtTick } = require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');

test('rendered moving platforms use the same tick positions as collision without mutating authority', () => {
  const runtime = TowerRuntime.create({ launchFloor: 1 }, 'moving-platform-visual-truth');
  const platform = runtime.state.chunks.find(c => c.floor === 1).platforms.find(p => p.motion);
  assert.ok(platform, 'fixture includes a moving platform');
  for (const tick of [3, 11, 23, 39]) {
    runtime.state.tick = tick;
    const before = checksum(runtime.state);
    const snapshot = createTowerRenderSnapshot(runtime.state);
    const visible = snapshot.platforms.find(p => p.id === platform.id);
    const expected = platformAtTick(platform, tick);
    assert.equal(visible.x, expected.x, `X matches collision at tick ${tick}`);
    assert.equal(visible.y, expected.y, `Y matches collision at tick ${tick}`);
    assert.equal(checksum(runtime.state), before, 'presentation leaves authority unchanged');
    assert.ok(Object.isFrozen(visible));
  }
});

test('public action cues preserve authoritative facing and attack timing', () => {
  const runtime = TowerRuntime.create({ launchFloor: 2 }, 'visible-action-truth');
  runtime.state.player.attackCooldown = runtime.state.config.attackCooldownTicks;
  runtime.state.ai.targetPlatformId = 'f2:p2';
  const enemy = runtime.state.enemies.find(e => e.floor === runtime.state.floor);
  assert.ok(enemy);
  enemy.facing = -1;
  enemy.cooldown = 19;
  const before = checksum(runtime.state);
  const snapshot = createTowerRenderSnapshot(runtime.state);
  assert.equal(snapshot.player.attacking, true);
  assert.equal(snapshot.intent.targetPlatformId, 'f2:p2');
  const visible = snapshot.enemies.find(e => e.id === enemy.id);
  assert.equal(visible.facing, enemy.facing);
  assert.equal(visible.attackCooldown, enemy.cooldown);
  assert.equal(checksum(runtime.state), before);
  runtime.state.player.attackCooldown = 0;
  assert.equal(createTowerRenderSnapshot(runtime.state).player.attacking, false);
});
