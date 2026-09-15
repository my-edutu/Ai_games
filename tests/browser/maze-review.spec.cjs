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

test('2.5d renderer keeps the playable world locally framed and inspectable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MAZE_RENDER_STATS__ && window.__MAZE_PUBLIC_STATE__);
  const value = await page.evaluate(() => ({ stats: window.__MAZE_RENDER_STATS__, state: window.__MAZE_PUBLIC_STATE__ }));
  expect(value.stats.mode).toBe('webgl2');
  expect(value.stats.cameraDistance).toBeGreaterThanOrEqual(5.9);
  expect(value.stats.cameraDistance).toBeLessThanOrEqual(6.5);
  expect(value.stats.cells).toBeLessThanOrEqual(35);
  expect(value.stats.currentCellVisible).toBe(true);
  expect(value.stats.theme).toBe('lost-facility-ruins');
  expect(value.stats.cutawayMode).toBe('camera-facing');
  expect(value.stats.focusLight).toBe(true);
});

test('maze visual language uses layered ruins and a restrained explorer material', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MAZE_RENDER_STATS__ && window.__MAZE_RENDER_STATS__.cells >= 6);
  const stats = await page.evaluate(() => window.__MAZE_RENDER_STATS__);
  expect(stats.wallConstruction).toBe('layered-ruin-facility');
  expect(stats.wallLayerCount).toBeGreaterThanOrEqual(3);
  expect(stats.materialFamilyCount).toBeGreaterThanOrEqual(5);
  expect(stats.detailPrimitivesPerCell).toBeGreaterThanOrEqual(4);
  expect(stats.detailPrimitivesPerCell).toBeLessThanOrEqual(14);
  expect(stats.explorerMaterial).toBe('muted-field-suit');
  expect(stats.explorerHighlightStrength).toBeLessThanOrEqual(0.72);
});

test('production polish stays deterministic, bounded and presentation-only', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MAZE_POLISH_STATS__ && window.__MAZE_PUBLIC_STATE__);
  const value = await page.evaluate(() => {
    const overlay = document.getElementById('maze-atmosphere');
    const maze = document.getElementById('maze');
    return {
      stats: window.__MAZE_POLISH_STATS__,
      overlay: overlay ? getComputedStyle(overlay) : null,
      mazeFilter: maze ? getComputedStyle(maze).filter : '',
      publicStateFrozen: Object.isFrozen(window.__MAZE_PUBLIC_STATE__),
    };
  });
  expect(value.stats.profile).toBe('cinematic-balanced');
  expect(value.stats.authorityTouched).toBe(false);
  expect(value.stats.randomSource).toBe('deterministic-hash');
  expect(value.stats.particleCount).toBeGreaterThanOrEqual(24);
  expect(value.stats.particleCount).toBeLessThanOrEqual(64);
  expect(value.stats.maxOverlayOpacity).toBeLessThanOrEqual(0.38);
  expect(value.stats.devicePixelRatioCap).toBeLessThanOrEqual(1.5);
  expect(value.overlay).not.toBeNull();
  expect(value.overlay.pointerEvents).toBe('none');
  expect(value.overlay.position).toBe('absolute');
  expect(value.mazeFilter).not.toBe('none');
  expect(value.publicStateFrozen).toBe(true);
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
