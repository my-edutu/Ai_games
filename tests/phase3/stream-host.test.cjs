'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { OutputHealthMonitor } = require('../../dist/games/autonomous-snake/src/presentation/health.js');
const { BroadcastController } = require('../../dist/games/autonomous-snake/src/presentation/controller.js');
const { SnakeRuntime } = require('../../dist/games/autonomous-snake/src/runtime/run.js');
const { buildRenderSnapshot } = require('../../dist/games/autonomous-snake/src/presentation/snapshot.js');

test('output health distinguishes healthy, degraded and unsafe states', () => {
  const monitor = new OutputHealthMonitor({ staleAfterMs: 1000, frozenAfterMs: 1500, silenceAfterMs: 2000 });
  const healthy = monitor.check({
    nowMs: 3000,
    lastSnapshotMs: 2500,
    lastFrameChangeMs: 2500,
    luma: 0.4,
    expectedScene: 'normal',
    actualScene: 'normal',
    lastAudioMs: 1500,
    intendedSilence: true,
  });
  assert.deepEqual(healthy, { status: 'healthy', reasons: [], action: 'none' });

  const degraded = monitor.check({
    nowMs: 3000,
    lastSnapshotMs: 1500,
    lastFrameChangeMs: 2500,
    luma: 0.4,
    expectedScene: 'normal',
    actualScene: 'normal',
    lastAudioMs: 2900,
    intendedSilence: false,
  });
  assert.equal(degraded.status, 'degraded');
  assert.deepEqual(degraded.reasons, ['stale']);
  assert.equal(degraded.action, 'rebuild');

  const unsafe = monitor.check({
    nowMs: 5000,
    lastSnapshotMs: 1000,
    lastFrameChangeMs: 1000,
    luma: 0,
    expectedScene: 'result',
    actualScene: 'normal',
    lastAudioMs: 1000,
    intendedSilence: false,
  });
  assert.equal(unsafe.status, 'unsafe');
  assert.equal(unsafe.action, 'safe-slate');
  assert.deepEqual(unsafe.reasons, ['stale', 'black', 'frozen', 'wrong-scene', 'silent']);
});

test('broadcast controller restores a coherent public frame from the latest snapshot', () => {
  const run = SnakeRuntime.create({ width: 18, height: 12, targetLength: 32, profile: 'rings' }, 'broadcast-controller');
  const controller = new BroadcastController({ replayCapacity: 64, bestLength: 40 });
  const initial = controller.accept(buildRenderSnapshot(run.state));
  assert.equal(initial.accepted, true);
  assert.equal(controller.publicFrame().scene, 'normal');

  for (let i = 0; i < 15 && !run.state.result; i++) {
    run.step();
    controller.accept(buildRenderSnapshot(run.state));
  }

  controller.failRenderer('context-lost: internal detail');
  const failed = controller.publicFrame();
  assert.equal(failed.scene, 'recovery');
  assert.equal(JSON.stringify(failed).includes('internal detail'), false);
  assert.equal(failed.publicStatus, 'Restoring verified game view');

  const restored = controller.rebuildFromLatest();
  assert.equal(restored.recovered, true);
  assert.equal(controller.publicFrame().tick, run.state.tick);
  assert.equal(controller.publicFrame().scene === 'normal' || controller.publicFrame().scene === 'danger' || controller.publicFrame().scene === 'milestone', true);
});

test('presentation accepts a new run at tick zero and clears run-scoped replay', () => {
  const run = SnakeRuntime.create({ width: 8, height: 8, targetLength: 4, intermissionTicks: 1 }, 'presentation-restart');
  const controller = new BroadcastController({ replayCapacity: 64 });
  const firstToken = buildRenderSnapshot(run.state).runToken;
  controller.accept(buildRenderSnapshot(run.state));

  run.state.food = run.state.snake.body[0] + 1;
  run.step();
  controller.accept(buildRenderSnapshot(run.state));
  assert.equal(controller.publicFrame().scene, 'result');
  run.step();
  controller.accept(buildRenderSnapshot(run.state));
  run.step();
  const restarted = buildRenderSnapshot(run.state);
  assert.notEqual(restarted.runToken, firstToken);
  assert.equal(restarted.tick, 0);
  assert.deepEqual(controller.accept(restarted), { accepted: true, reason: 'ok' });
  assert.equal(controller.publicFrame().tick, 0);
  assert.equal(controller.publicFrame().replayAvailable, 1);
});

test('stream host self-test validates assets, snapshots, restart and authority isolation', () => {
  const result = spawnSync(process.execPath, ['scripts/serve-snake-stream.cjs', '--self-test'], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    timeout: 20000,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.ok, true);
  assert.equal(report.authorityStable, true);
  assert.equal(report.browserAssets, true);
  assert.equal(report.snapshotPrivacySafe, true);
  assert.equal(report.recoveryVerified, true);
  assert.equal(report.restartObserved, true);
});

test('browser source is dependency-free, bounded and contains accessibility controls', () => {
  const root = path.resolve(__dirname, '../..', 'public/snake-stream');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  assert.match(html, /<canvas[^>]+aria-label=/);
  assert.match(html, /data-control="reduced-motion"/);
  assert.match(html, /data-control="muted"/);
  assert.match(html, /data-control="clean-feed"/);
  assert.match(css, /@media\s*\(prefers-reduced-motion/);
  assert.match(app, /requestAnimationFrame/);
  assert.match(app, /MAX_PARTICLES\s*=\s*240/);
  assert.equal(/https?:\/\//.test(app), false);
  assert.equal(/innerHTML\s*=/.test(app), false);
});
