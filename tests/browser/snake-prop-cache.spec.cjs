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
  async function settle() {
    const lastPoll = polls, count = (await stats()).frameCount;
    await expect.poll(() => polls).toBeGreaterThan(lastPoll + 1);
    await page.waitForFunction(n => window.__snakePresentation.stats().frameCount >= n + 3, count);
    return stats();
  }
  current.snapshot.hazards[0].phase = 2;
  const countdown = await settle();
  expect(countdown.staticCache.builds).toBe(initial.staticCache.builds);
  expect(countdown.triangles).toBe(initial.triangles);
  current.snapshot.hazards[0].active = true;
  const active = await settle();
  expect(active.staticCache.builds).toBe(initial.staticCache.builds);
  expect(active.triangles).not.toBe(initial.triangles);
  current.snapshot.obstacles = [18, 24];
  current.snapshot.portals = [{ entry: 46, exit: 380 }];
  const added = await settle();
  expect(added.staticCache.builds).toBe(active.staticCache.builds + 1);
  expect(added.world.obstacles).toBe(2);
  expect(added.world.portalEnds).toBe(2);
  current.snapshot.obstacles = [];
  current.snapshot.portals = [];
  const removed = await settle();
  expect(removed.staticCache.builds).toBe(added.staticCache.builds + 1);
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
