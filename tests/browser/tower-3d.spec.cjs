'use strict';
const { test, expect } = require('@playwright/test');

async function ready(page, query = '') {
  await page.goto(`/tower${query}`);
  await expect(page.locator('#tower-canvas')).toHaveAttribute('data-renderer', 'three-webgl');
  await page.waitForFunction(() => window.__TOWER_RENDER_DIAGNOSTICS__?.().frames > 5);
}

test('the live tower is rendered in WebGL with animated characters and real geometry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await ready(page);
  const first = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
  expect(first.triangles).toBeGreaterThan(3000);
  expect(first.characters).toBeGreaterThan(0);
  await page.waitForFunction(previous => window.__TOWER_PUBLIC_STATE__.tick !== previous.tick
    && window.__TOWER_RENDER_DIAGNOSTICS__().frames > previous.frames, first);
  const second = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
  expect(second.frames).toBeGreaterThan(first.frames);
  expect(second.renderErrors).toBe(0);
  expect(errors).toEqual([]);
});

test('camera and quality buttons affect the real renderer and keyboard focus is visible', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Overview camera' }).click();
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().camera)).toBe('overview');
  await page.getByRole('button', { name: /quality/i }).click();
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().quality)).toBe('low');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(focus).not.toBe('none');
});

test('portrait keeps floor, intent and sound controls reachable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await expect(page.locator('[data-testid="floor"]')).toBeVisible();
  await expect(page.locator('[data-testid="ai-intent"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /sound/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a context loss leaves simulation running and restores the 3D view', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' || /WebGL.*(?:INVALID_|too many errors)/i.test(message.text())) errors.push(message.text());
  });
  await ready(page);
  const before = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
  await page.evaluate(() => {
    const canvas = document.querySelector('#tower-canvas');
    const gl = canvas.getContext('webgl2');
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable in browser');
    window.__TOWER_TEST_RESTORE_CONTEXT__ = () => extension.restoreContext();
    extension.loseContext();
  });
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().contextLost)).toBe(true);
  await page.waitForFunction(old => window.__TOWER_PUBLIC_STATE__.tick !== old, before.tick);
  const stoppedFrames = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().frames);
  await page.evaluate(() => window.__TOWER_TEST_RESTORE_CONTEXT__());
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().contextLost)).toBe(false);
  await page.waitForFunction(frames => window.__TOWER_RENDER_DIAGNOSTICS__().frames > frames, stoppedFrames);
  expect(await page.evaluate(() => document.querySelector('#tower-canvas').getContext('webgl2').getError())).toBe(0);
  expect(errors).toEqual([]);
  await expect(page.locator('#tower-canvas')).toBeVisible();
});

test('a lost state connection visibly recovers while the authoritative run continues', async ({ page, request }) => {
  await ready(page, '?quality=low');
  const before = await page.evaluate(() => window.__TOWER_PUBLIC_STATE__.tick);
  await page.route('**/tower/state**', route => route.abort());
  await expect(page.locator('#recovery-card')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().stale)).toBe(true);
  await expect.poll(async () => (await (await request.get('/tower/state')).json()).snapshot.tick).not.toBe(before);
  await page.unroute('**/tower/state**');
  await expect(page.locator('#recovery-card')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__().stale)).toBe(false);
});

test('high-density phones keep the WebGL drawing buffer at one pixel per CSS pixel', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4176', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  try {
    const page = await context.newPage();
    await ready(page, '?quality=high');
    const size = await page.locator('#tower-canvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height, css: canvas.getBoundingClientRect().toJSON() }));
    expect(size.width).toBe(Math.round(size.css.width));
    expect(size.height).toBe(Math.round(size.css.height));
  } finally { await context.close(); }
});

test('progress is a separate page with references and evidence, outside the game HUD', async ({ page }) => {
  const response = await page.goto('/tower/gauntlet');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /Gauntlet/i }).first()).toBeVisible();
  await expect(page.locator('a[href*="rising-heat"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="iteration-log"]')).not.toBeEmpty();
});
