'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BattleRoyaleRuntime,
  assertBattleInvariants,
  battleChecksum,
  createBattleConfig,
  createInitialBattleState,
  validateBattleConfig,
} = require('../../dist/games/ai-battle-royale/src/index.js');

function reachableCells(arena) {
  const blocked = new Set(arena.obstacles);
  const start = arena.spawnCells[0];
  const queue = [start];
  const visited = new Set([start]);
  const width = arena.width;
  const height = arena.height;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const cell = queue[cursor];
    const x = cell % width;
    const y = Math.floor(cell / width);
    const candidates = [];
    if (y > 0) candidates.push(cell - width);
    if (x > 0) candidates.push(cell - 1);
    if (x + 1 < width) candidates.push(cell + 1);
    if (y + 1 < height) candidates.push(cell + width);
    for (const next of candidates) {
      if (!blocked.has(next) && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

test('default battle configuration is valid and rejects unsafe dimensions', () => {
  const config = createBattleConfig();
  assert.equal(config.combatantCount, 24);
  assert.equal(validateBattleConfig(config), config);
  assert.throws(() => validateBattleConfig({ ...config, width: 8 }), /width must be between 24 and 80/);
  assert.throws(() => validateBattleConfig({ ...config, combatantCount: 60 }), /combatantCount must not exceed walkable spawn capacity/);
});

test('initial state is deterministic for a seed and varies across seeds', () => {
  const config = createBattleConfig();
  const first = createInitialBattleState(config, 'battle-seed-alpha', 'run-a');
  const repeat = createInitialBattleState(config, 'battle-seed-alpha', 'run-a');
  const different = createInitialBattleState(config, 'battle-seed-beta', 'run-b');
  assert.equal(battleChecksum(first), battleChecksum(repeat));
  assert.deepEqual(first.arena, repeat.arena);
  assert.notEqual(battleChecksum(first), battleChecksum(different));
  assert.notDeepEqual(first.arena.obstacles, different.arena.obstacles);
});

test('generated arenas are connected, bounded and provide unique legal spawns across 100 seeds', () => {
  const config = createBattleConfig();
  for (let index = 0; index < 100; index += 1) {
    const state = createInitialBattleState(config, `foundation-corpus-${index}`, `run-${index}`);
    const arena = state.arena;
    const blocked = new Set(arena.obstacles);
    const reachable = reachableCells(arena);
    assert.equal(arena.spawnCells.length, config.combatantCount, `seed ${index} spawn count`);
    assert.equal(new Set(arena.spawnCells).size, config.combatantCount, `seed ${index} unique spawns`);
    for (const cell of arena.spawnCells) {
      assert.equal(blocked.has(cell), false, `seed ${index} spawn ${cell} is walkable`);
      assert.equal(reachable.has(cell), true, `seed ${index} spawn ${cell} is connected`);
    }
    for (const loot of arena.loot) {
      assert.equal(blocked.has(loot.cell), false, `seed ${index} loot ${loot.id} is walkable`);
      assert.equal(reachable.has(loot.cell), true, `seed ${index} loot ${loot.id} is reachable`);
    }
    assert.equal(assertBattleInvariants(state).length, 0, `seed ${index} invariants`);
    assert.ok(state.events.length <= config.maxRecentEvents, `seed ${index} event bound`);
  }
});

test('authoritative state owns a validated configuration copy', () => {
  const config = createBattleConfig();
  const runtime = new BattleRoyaleRuntime(config, 'config-copy-seed', 'config-copy-run');
  config.width = 70;
  config.maxRecentEvents = 16;
  assert.equal(runtime.state.config.width, 36);
  assert.equal(runtime.state.config.maxRecentEvents, 96);
  assert.equal(assertBattleInvariants(runtime.state).length, 0);
});

test('runtime snapshot restore matches uninterrupted foundation ticks', () => {
  const config = createBattleConfig({ maxTicks: 120, zoneFirstShrinkTick: 40, zoneShrinkInterval: 30, supplyDropEvery: 30, noProgressTicks: 60, voteWindowEvery: 80, voteWindowTicks: 20 });
  const uninterrupted = new BattleRoyaleRuntime(config, 'restore-seed', 'restore-run');
  const source = new BattleRoyaleRuntime(config, 'restore-seed', 'restore-run');
  for (let index = 0; index < 11; index += 1) uninterrupted.step();
  for (let index = 0; index < 5; index += 1) source.step();
  const restored = BattleRoyaleRuntime.restore(source.snapshot());
  for (let index = 0; index < 6; index += 1) restored.step();
  assert.equal(uninterrupted.state.tick, 11);
  assert.equal(restored.state.tick, 11);
  assert.equal(uninterrupted.checksum(), restored.checksum());
  assert.deepEqual(uninterrupted.state.rng, restored.state.rng);
  assert.equal(assertBattleInvariants(restored.state).length, 0);
});
