'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../public/infinite-tower-climb');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = source('index.html')
  .replace('<link rel="stylesheet" href="/tower/styles.css"><link rel="stylesheet" href="/tower/ux-v2.css">',
    `<style>${source('styles.css')}</style><style>${source('ux-v2.css')}</style>`)
  .replace('<script src="/tower/app.js" type="module"></script>', '');
const script = source('visuals/hud.mjs').replace(/^export /gm, '');

for (const [size, width, height] of [
  ['desktop', 960, 600], ['mobile-portrait', 390, 844],
  ['small-mobile', 320, 568], ['short-landscape', 844, 390],
]) {
  test(`actual spectator HUD: one-button gameplay and accessible details (${size})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ content: `${script}\nwindow.__testHUD = createHUD({});` });
    const trigger = page.locator('#spectator-menu-toggle');
    const tray = page.locator('#spectator-control-tray');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(tray).toBeHidden();
    await expect(page.locator('#camera-overview')).toBeHidden();
    await trigger.click();
    await expect(tray).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#details-toggle').click();
    await expect(page.locator('#run-details')).toHaveAttribute('open', '');
    const box = await page.locator('.detail-content').boundingBox();
    expect(box).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(12);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 12);
    expect(box.y).toBeGreaterThanOrEqual(10);
    expect(box.y + box.height).toBeLessThan(height - 60);
    await page.keyboard.press('Escape');
    await expect(page.locator('#run-details')).not.toHaveAttribute('open', '');
    await expect(tray).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tray).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await page.locator('#camera-overview').click();
    await expect(page.locator('#camera-overview')).toHaveAttribute('aria-pressed', 'true');
    await expect(tray).toBeVisible();
    await page.locator('#tower-canvas').click({ position: { x: 10, y: Math.min(height - 20, height / 2) } });
    await expect(tray).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('clean broadcast feed does not expose spectator controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(html);
  await page.addScriptTag({ content: `${script}\nwindow.__testHUD = createHUD({});` });
  await page.evaluate(() => document.body.classList.add('clean-feed'));
  await expect(page.locator('#spectator-menu-toggle')).toBeHidden();
});
