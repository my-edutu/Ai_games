const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  if (process.env.FLOORS_TEST_QUALITY === 'low') {
    // Exercise the real supported low tier on software-only hosts. High-tier
    // visual review is a separate capture, not an inferred performance pass.
    await page.addInitScript(() => localStorage.setItem('thousand-floors-settings-v1', JSON.stringify({quality:'low',qualityManual:true})));
  }
});

async function openCampaign(page) {
  await page.goto('/floors/');
  // Begin at the product's explicit ready state, not during its loader.
  await expect(page.locator('#loading-state')).toBeHidden({ timeout: 20000 });
  await expect(page.locator('#pause-button')).toBeEnabled();
}

test('real 3D autonomous campaign progresses and transport controls work', async ({ page }) => {
  const faults = [];
  page.on('pageerror', error => faults.push(error.message));
  await openCampaign(page);
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__?.()?.snapshot?.tick ?? 0)).toBeGreaterThan(10);
  await page.locator('#pause-button').click();
  await expect(page.locator('#pause-button')).toHaveAccessibleName(/resume/i);
  const stopped = await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().snapshot.tick);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().snapshot.tick)).toBe(stopped);
  await page.locator('#pause-button').click();
  await page.locator('#speed-button').click();
  await expect(page.locator('#speed-button')).toContainText('2');
  await page.locator('#camera-button').click();
  await page.locator('#sound-button').click();
  expect(await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().camera)).toBe('wide');
  expect(await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().audio.enabled)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().snapshot.tick)).toBeGreaterThan(stopped + 10);
  expect(faults).toEqual([]);
});

test('verified progress restores after reload', async ({ page }) => {
  await openCampaign(page);
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__?.()?.snapshot?.tick ?? 0)).toBeGreaterThan(30);
  await page.locator('#pause-button').click();
  await expect(page.locator('#pause-button')).toHaveAccessibleName(/resume/i);
  const prior = await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().snapshot.tick);
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('thousand-floors-save-v1')))).toBe(true);
  await page.reload();
  await expect(page.locator('#loading-state')).toBeHidden({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__?.()?.snapshot?.tick ?? 0)).toBeGreaterThanOrEqual(prior);
});

test('mobile settings remain accessible without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCampaign(page);
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__?.()?.snapshot?.tick ?? 0)).toBeGreaterThan(0);
  await page.locator('#settings-button').click();
  await expect(page.locator('#settings-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

test('progress page reports the current benchmark verdict honestly', async ({ page }) => {
  await page.goto('/floors/progress');
  await expect(page.locator('#verdict')).toContainText(/not passed|not yet passed|in progress/i);
  await expect(page.locator('#references a')).toHaveCount(3);
  await expect(page.locator('#iterations article')).not.toHaveCount(0);
});

test('corrupt progress is kept until the viewer explicitly starts fresh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('thousand-floors-save-v1', 'invalid-preserved-fixture'));
  await page.goto('/floors/');
  await expect(page.locator('#fresh-button')).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => localStorage.getItem('thousand-floors-save-v1'))).toBe('invalid-preserved-fixture');
  await page.locator('#fresh-button').click();
  await expect(page.locator('#loading-state')).toBeHidden({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => window.__FLOORS_DIAGNOSTICS__?.()?.snapshot?.tick ?? 0)).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('thousand-floors-save-v1'))).not.toBe('invalid-preserved-fixture');
});

test('later-floor scene review leaves the normal saved expedition untouched', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('thousand-floors-save-v1', 'normal-progress-preserved'));
  await page.goto('/floors/?review=11');
  await expect(page.locator('#loading-state')).toBeHidden({ timeout: 20000 });
  await expect(page.locator('#save-note')).toContainText('progress is not saved');
  expect(await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().review)).toBe(true);
  expect(await page.evaluate(() => window.__FLOORS_DIAGNOSTICS__().snapshot.floor)).toBeGreaterThanOrEqual(11);
  expect(await page.evaluate(() => localStorage.getItem('thousand-floors-save-v1'))).toBe('normal-progress-preserved');
});
