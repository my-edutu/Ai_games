'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ROOT = 'http://127.0.0.1:4177';
test.describe('Eko Run 3D Gauntlet slice', () => {
  test('desktop: renders real WebGL gameplay from advancing authority', async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.goto(ROOT + '/eko/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#connection')).toContainText('CONNECTED', { timeout: 20000 });
    await expect(page.locator('#state')).toHaveText('RUN LIVE');
    const first = (await (await page.request.get(ROOT + '/eko/state')).json()).snapshot.tick;
    await page.waitForTimeout(1800);
    const second = (await (await page.request.get(ROOT + '/eko/state')).json()).snapshot.tick;
    expect(second).toBeGreaterThan(first + 20);
    const info = await page.locator('canvas').evaluate(canvas => ({
      width: canvas.width,
      height: canvas.height,
      gl: !!canvas.getContext('webgl2') || !!canvas.getContext('webgl')
    }));
    expect(info.gl).toBeTruthy();
    expect(info.width).toBeGreaterThan(800);
    expect(info.height).toBeGreaterThan(400);
    expect(failures).toEqual([]);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'desktop.png'), fullPage: true });
  });

  test('mobile: displays 3D scene and touch controls without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROOT + '/eko/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#connection')).toContainText('CONNECTED', { timeout: 20000 });
    await expect(page.locator('[data-control="Space"]')).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: innerWidth,
      body: document.body.scrollWidth,
      html: document.documentElement.scrollWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport+1);
    expect(widths.html).toBeLessThanOrEqual(widths.viewport+1);
    await page.locator('#mode').click();
    await expect(page.locator('#mode')).toContainText('SWITCH TO AI');
    await page.locator('[data-control="Space"]').dispatchEvent('pointerdown', {pointerId:1});
    await page.locator('[data-control="Space"]').dispatchEvent('pointerup', {pointerId:1});
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'mobile.png'), fullPage: true });
  });

  test('progress dashboard shows grounded claims and live authority', async ({ page }) => {
    await page.goto(ROOT+'/eko/progress');
    await expect(page.locator('#iterations')).toHaveText('3');
    await expect(page.locator('#open')).not.toHaveText('—');
    await expect(page.locator('#tick')).not.toHaveText('—');
    await expect(page.locator('#rounds .card')).toHaveCount(3);
    await expect(page.locator('#status')).toContainText('Iteration');
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet','progress.png'), fullPage:true });
  });
});
