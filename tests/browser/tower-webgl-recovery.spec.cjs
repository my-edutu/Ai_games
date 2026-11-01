'use strict';
const { test, expect } = require('@playwright/test');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerRenderSnapshot } = require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');

// Real deterministic snapshots make the floor change independent of wall-clock
// speed while the test still exercises the shipped scene and real WebGL driver.
function floorTransition() {
  const runtime = TowerRuntime.create({}, 'context-generation-regression');
  const before = createTowerRenderSnapshot(runtime.state);
  for (let steps = 0; runtime.state.floor === 0 && steps < 2000; steps++) runtime.step();
  if (runtime.state.floor !== 1) throw new Error('Recovery fixture did not reach the next floor');
  const after = createTowerRenderSnapshot(runtime.state);
  for (let steps = 0; runtime.state.floor === 1 && steps < 2000; steps++) runtime.step();
  if (runtime.state.floor !== 2) throw new Error('Recovery fixture did not reach the second floor');
  return { before, changes: [after, createTowerRenderSnapshot(runtime.state)] };
}

test('a floor change during WebGL loss restores frames without stale GPU handles', async ({ page }, testInfo) => {
  const snapshots = floorTransition();
  const graphicsErrors = [];
  page.on('pageerror', error => graphicsErrors.push(error.message));
  page.on('console', message => {
    if (/WebGL.*(?:INVALID_|too many errors)|THREE.*(?:Error|VALIDATE_STATUS)|Tower renderer:/i.test(message.text())) graphicsErrors.push(message.text());
  });
  await page.setViewportSize({ width: 640, height: 360 });
  await page.route('**/tower/recovery-harness', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{width:100%;height:100%;display:block}</style></head><body><canvas id="tower-canvas"></canvas></body></html>',
  }));
  await page.goto('/tower/recovery-harness');
  await page.evaluate(async snapshot => {
    const { createTowerScene } = await import('/tower/visuals/scene.mjs');
    window.recoveryView = createTowerScene(document.querySelector('canvas'), { quality: 'high', camera: 'overview', reducedMotion: true });
    window.recoveryView.accept({ snapshot });
  }, snapshots.before);
  await page.waitForFunction(() => window.recoveryView.diagnostics().frames > 5);
  const recoveries = [];
  for (const snapshot of snapshots.changes) {
    await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const extension = gl.getExtension('WEBGL_lose_context');
      if (!extension) throw new Error('Context-loss extension unavailable');
      window.restoreGraphics = () => extension.restoreContext();
      extension.loseContext();
    });
    await page.waitForFunction(() => window.recoveryView.diagnostics().contextLost);
    const stoppedFrames = await page.evaluate(snapshot => {
      window.recoveryView.accept({ snapshot });
      const state = window.recoveryView.diagnostics();
      if (state.floor !== snapshot.floor || !state.contextLost) throw new Error('New floor must be accepted while graphics remain interrupted');
      return state.frames;
    }, snapshot);
    await page.evaluate(() => window.restoreGraphics());
    await page.waitForFunction(({ frames, floor }) => {
      const state = window.recoveryView.diagnostics();
      return !state.contextLost && state.frames > frames + 2 && state.world.floor === floor;
    }, { frames: stoppedFrames, floor: snapshot.floor });
    const restored = await page.evaluate(() => window.recoveryView.diagnostics());
    expect(restored.camera).toBe('overview');
    expect(restored.quality).toBe('high');
    expect(restored.reducedMotion).toBe(true);
    expect(restored.tick).toBe(snapshot.tick);
    expect(restored.renderErrors).toBe(0);
    expect(restored.triangles).toBeGreaterThan(3000);
    recoveries.push({ stoppedFrames, restored });
  }
  await testInfo.attach('recovered-output', { body: await page.locator('canvas').screenshot(), contentType: 'image/png' });
  await testInfo.attach('recovery-frames', { body: JSON.stringify(recoveries, null, 2), contentType: 'application/json' });
  await page.evaluate(() => window.recoveryView.dispose());
  const glError = await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getError());
  expect(glError, 'Restoration and subsequent disposal must not touch old-context GPU handles').toBe(0);
  expect(graphicsErrors).toEqual([]);
});
