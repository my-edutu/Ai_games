'use strict';
const { test, expect } = require('@playwright/test');

for (const viewport of [
  { width: 960, height: 600 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`transformation verdict is about gameplay, not build history at ${viewport.width}x${viewport.height}`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/tower/gauntlet', { waitUntil:'domcontentloaded' });
    const gate = page.locator('#transformation-status');
    await expect(gate).toHaveText('NOT EVALUATED', {timeout:15000});
    await expect(page.locator('.pillar-grid article')).toHaveCount(3);
    await expect(page.locator('#transformation-scenes .transformation-scene')).toHaveCount(3);
    await expect(page.locator('.transformation-clip span')).toHaveCount(6);
    await expect(page.locator('#pillar-looks-status')).toHaveText('Not independently evaluated');
    await expect(page.locator('#pillar-feels-status')).toHaveText('Not independently evaluated');
    await expect(page.locator('#pillar-plays-status')).toHaveText('Not independently evaluated');
    await expect(page.locator('#transformation-evidence')).toContainText('not yet established');
    const shape = await page.evaluate(() => ({ scrollWidth:document.documentElement.scrollWidth, innerWidth }));
    expect(shape.scrollWidth).toBeLessThanOrEqual(shape.innerWidth+1);
    expect(errors).toEqual([]);
  });
}
