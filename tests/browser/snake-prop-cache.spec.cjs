'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

// Public presentation fixtures only; no alternate simulation or performance gate.
test('cached portals and obstacles refresh on visible changes while trap countdowns stay live', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 960, height: 640 });
  const current = await (await request.get('/snapshot')).json();
  current.snapshot.obstacles = [];
  current.snapshot.portals = [];
  current.snapshot.hazards = [{ cell: 33, active: false, phase: 1 }];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let polls = 0;
  await page.route('**/snapshot', route => { polls++; return route.fulfill({ json: current }); });
  await page.goto('/?quality=low');
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 24);
  const stats = () => page.evaluate(() => window.__snakePresentation.stats());
  const initial = await stats();
  expect(initial.staticCache.active).toBe(true);
  // The renderer can make its one permitted adaptive resolution adjustment
  // while these live snapshots are being exercised. A resolution change must
  // rebuild the stationary-scene cache once independently of prop topology.
  // Keep the *exactly one* topology rebuild gate; attribute an additional
  // build only to a separately observed, bounded render-scale transition.
  function expectTopologyCacheBuilds(before, after, topologyChanges) {
    expect(before.renderScale.adjusted && !after.renderScale.adjusted).toBe(false);
    const scaled = !before.renderScale.adjusted && after.renderScale.adjusted;
    if (scaled) {
      expect(after.pixelRatio).toBeLessThan(before.pixelRatio);
      expect(after.drawingBuffer.width).toBeLessThan(before.drawingBuffer.width);
    } else {
      expect(after.pixelRatio).toBe(before.pixelRatio);
      expect(after.drawingBuffer).toEqual(before.drawingBuffer);
    }
    expect(after.staticCache.builds).toBe(before.staticCache.builds + topologyChanges + Number(scaled));
  }
  async function settle(expectedProps = null) {
    const lastPoll = polls, count = (await stats()).frameCount;
    await expect.poll(() => polls).toBeGreaterThan(lastPoll + 1);
    // A routed request may begin before the app consumes its returned public
    // snapshot; GPU backpressure can keep drawing the preceding topology.
    // Observe the requested props in the actual rendered world before
    // enforcing the unchanged exactly-one cache-rebuild requirement.
    await expect.poll(async () => {
      const visible = await stats();
      return visible.frameCount >= count + 3 &&
        (!expectedProps || (visible.world.obstacles === expectedProps.obstacles &&
          visible.world.portalEnds === expectedProps.portalEnds));
    }, { timeout: 20000 }).toBe(true);
    return stats();
  }
  current.snapshot.hazards[0].phase = 2;
  const countdown = await settle();
  expectTopologyCacheBuilds(initial, countdown, 0);
  expect(countdown.triangles).toBe(initial.triangles);
  current.snapshot.hazards[0].active = true;
  const active = await settle();
  expectTopologyCacheBuilds(countdown, active, 0);
  expect(active.triangles).not.toBe(initial.triangles);
  current.snapshot.obstacles = [18, 24];
  current.snapshot.portals = [{ entry: 46, exit: 380 }];
  const added = await settle({ obstacles: 2, portalEnds: 2 });
  expectTopologyCacheBuilds(active, added, 1);
  expect(added.world.obstacles).toBe(2);
  expect(added.world.portalEnds).toBe(2);
  current.snapshot.obstacles = [];
  current.snapshot.portals = [];
  const removed = await settle({ obstacles: 0, portalEnds: 0 });
  expectTopologyCacheBuilds(added, removed, 1);
  expect(removed.world.obstacles).toBe(0);
  expect(removed.world.portalEnds).toBe(0);
  expect(removed.textures).toBe(added.textures);
  expect(removed.renderer).toBe('webgl');
  expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
  expect(errors).toEqual([]);
  const artifact = path.resolve(__dirname, '../../artifacts/phase3/prop-cache-lifecycle.json');
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, JSON.stringify({ initial, countdown, active, added, removed, errors }, null, 2));
});
