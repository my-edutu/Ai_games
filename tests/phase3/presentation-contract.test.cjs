'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const { SnakeRuntime } = require('../../dist/games/autonomous-snake/src/runtime/run.js');
const { buildRenderSnapshot } = require('../../dist/games/autonomous-snake/src/presentation/snapshot.js');
const { PresentationHost } = require('../../dist/games/autonomous-snake/src/presentation/host.js');
const { EntityRegistry } = require('../../dist/games/autonomous-snake/src/presentation/entities.js');
const { buildHud, deriveScene } = require('../../dist/games/autonomous-snake/src/presentation/scene.js');
const { calculateBroadcastLayout } = require('../../dist/games/autonomous-snake/src/presentation/layout.js');

function runtime(seed = 'phase3-contract') {
  return SnakeRuntime.create({
    width: 16,
    height: 12,
    targetLength: 28,
    profile: 'portals',
    hazardCount: 2,
    noProgressTicks: 240,
  }, seed);
}

test('render snapshots are immutable, deterministic and privacy-safe', () => {
  const run = runtime();
  const first = buildRenderSnapshot(run.state);
  const second = buildRenderSnapshot(run.state);

  assert.equal(first.checksum, second.checksum);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.snake), true);
  assert.equal(Object.isFrozen(first.snake[0]), true);
  assert.equal(Object.isFrozen(first.ai), true);
  assert.equal('seed' in first, false);
  assert.equal('runId' in first, false);
  assert.equal('recentHashes' in first.ai, false);
  assert.equal(JSON.stringify(first).includes(run.seed), false);
});

test('presentation host is idempotent and rejects stale or divergent snapshots', () => {
  const run = runtime('host');
  const host = new PresentationHost();
  const first = buildRenderSnapshot(run.state);

  assert.deepEqual(host.accept(first), { accepted: true, reason: 'ok' });
  assert.deepEqual(host.accept(first), { accepted: true, reason: 'duplicate' });

  const divergent = { ...first, checksum: 'ffffffff' };
  assert.deepEqual(host.accept(divergent), { accepted: false, reason: 'divergent-same-tick' });

  run.step();
  const next = buildRenderSnapshot(run.state);
  assert.deepEqual(host.accept(next), { accepted: true, reason: 'ok' });
  assert.deepEqual(host.accept(first), { accepted: false, reason: 'stale' });
});

test('entity registry creates, updates and removes bounded visual entities', () => {
  const run = runtime('entities');
  const registry = new EntityRegistry();
  const initial = buildRenderSnapshot(run.state);
  const firstDelta = registry.apply(initial);

  assert.equal(firstDelta.created.length, initial.snake.length + initial.obstacles.length + initial.hazards.length + initial.portals.length * 2 + 1);
  assert.equal(registry.size(), firstDelta.created.length);

  run.step();
  const next = buildRenderSnapshot(run.state);
  const secondDelta = registry.apply(next);
  assert.ok(secondDelta.updated.length >= next.snake.length);
  assert.equal(registry.size() <= next.snake.length + next.obstacles.length + next.hazards.length + next.portals.length * 2 + 1, true);
  assert.equal(new Set(registry.values().map(entity => entity.id)).size, registry.size());
});

test('HUD and scene models preserve the ten-second hierarchy', () => {
  const run = runtime('hud');
  const normal = buildRenderSnapshot(run.state);
  const hud = buildHud(normal, { bestLength: 44, cleanFeed: false });

  assert.equal(hud.goal, normal.goal);
  assert.equal(hud.length, normal.length);
  assert.equal(hud.primaryLabel, `LENGTH ${normal.length} / ${normal.goal}`);
  assert.equal(hud.recordLabel, 'BEST 44');
  assert.equal(hud.intent.length <= 96, true);
  assert.equal(deriveScene(normal), 'normal');

  const danger = { ...normal, ai: { ...normal.ai, mode: 'escape-hazard' } };
  assert.equal(deriveScene(danger), 'danger');
  assert.equal(buildHud(danger, { bestLength: 44 }).danger, true);

  const result = { ...normal, lifecycle: 'result', result: { reason: 'hazard-collision', score: 9, length: 12 } };
  assert.equal(deriveScene(result), 'result');
  assert.equal(buildHud(result, { bestLength: 44 }).resultLabel, 'HAZARD COLLISION');
});

test('responsive layout protects gameplay, captions and mobile legibility', () => {
  const full = calculateBroadcastLayout(1920, 1080, { captionLines: 2 });
  const phone = calculateBroadcastLayout(640, 360, { captionLines: 2 });

  for (const layout of [full, phone]) {
    assert.equal(layout.board.width > 0 && layout.board.height > 0, true);
    assert.equal(layout.hud.fontPx >= 18, true);
    assert.equal(layout.caption.height > 0, true);
    assert.equal(layout.caption.y >= layout.board.y + layout.board.height, true);
    assert.equal(layout.safe.left < layout.safe.right, true);
    assert.equal(layout.safe.top < layout.safe.bottom, true);
  }
});

test('different presentation frame schedules cannot change authority', () => {
  const fast = runtime('frame-schedule');
  const sparse = runtime('frame-schedule');
  const host = new PresentationHost();

  for (let tick = 0; tick < 160 && !fast.state.result && !sparse.state.result; tick++) {
    fast.step();
    sparse.step();
    host.accept(buildRenderSnapshot(fast.state));
    if (tick % 5 === 0) buildRenderSnapshot(sparse.state);
  }

  assert.equal(checksum(fast.state), checksum(sparse.state));
  assert.equal(fast.state.result?.reason, sparse.state.result?.reason);
});
