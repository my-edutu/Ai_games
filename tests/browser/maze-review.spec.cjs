'use strict';

const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4174';

test('maze camera focuses the discovered public map instead of the full hidden grid', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MAZE_PUBLIC_STATE__ && window.__MAZE_VIEW__);
  const value = await page.evaluate(() => ({ state: window.__MAZE_PUBLIC_STATE__, view: window.__MAZE_VIEW__ }));
  expect(value.view.widthCells).toBeGreaterThanOrEqual(6);
  expect(value.view.heightCells).toBeGreaterThanOrEqual(5);
  expect(value.view.widthCells).toBeLessThanOrEqual(value.state.width);
  expect(value.view.heightCells).toBeLessThanOrEqual(value.state.height);
  if (value.state.progressPermille < 600) {
    expect(value.view.widthCells < value.state.width || value.view.heightCells < value.state.height).toBe(true);
  }
  expect(value.view.containsCurrentCell).toBe(true);
});

test('slow state responses never create overlapping browser-source polls', async ({ page }) => {
  let active = 0;
  let maximum = 0;
  await page.route('**/maze/state*', async route => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 420));
    active -= 1;
    await route.continue();
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1450);
  expect(maximum).toBe(1);
});
