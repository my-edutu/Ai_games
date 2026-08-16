'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const artifactDir = path.resolve(__dirname, '../../artifacts/phase3');

function recordConsoleFailures(page) {
  const failures = [];
  page.on('console', message => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('pageerror', error => failures.push(error.message));
  return failures;
}

test.beforeAll(() => {
  fs.mkdirSync(artifactDir, { recursive: true });
});

test('desktop broadcast source is readable, animated and privacy-safe', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#primary')).toContainText('LENGTH');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#caption')).not.toHaveText('');
  await expect(page.locator('#integrity')).toHaveText('INTEGRITY: VERIFIED');

  const snapshot = await page.evaluate(async () => (await fetch('/snapshot', { cache: 'no-store' })).json());
  const serialized = JSON.stringify(snapshot);
  expect(snapshot.snapshot.version).toBe(1);
  expect(snapshot.snapshot.authorityChecksum).toMatch(/^[0-9a-f]{8}$/);
  expect(serialized).not.toContain('stream-reference-seed');
  expect(serialized).not.toContain('recentHashes');
  expect(serialized).not.toContain('nodeExpansions');

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    canvas: document.getElementById('game').getBoundingClientRect().toJSON(),
    primary: document.getElementById('primary').getBoundingClientRect().toJSON(),
  }));
  expect(layout.scrollWidth).toBe(layout.viewportWidth);
  expect(layout.canvas.width).toBeGreaterThan(1000);
  expect(layout.canvas.height).toBeGreaterThan(500);
  expect(layout.primary.height).toBeGreaterThanOrEqual(20);

  const animation = await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const started = performance.now();
    function step(now) {
      frames += 1;
      if (now - started >= 1000) resolve({ frames, elapsedMs: now - started });
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }));
  expect(animation.frames).toBeGreaterThanOrEqual(30);

  await page.screenshot({ path: path.join(artifactDir, 'desktop-1920x1080.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('phone-size landscape retains goal, progress, gameplay and captions', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#primary')).toContainText('LENGTH');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#caption')).toBeVisible();

  const measurements = await page.evaluate(() => {
    const canvas = document.getElementById('game').getBoundingClientRect();
    const primary = document.getElementById('primary').getBoundingClientRect();
    const caption = document.getElementById('captions').getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      primaryHeight: primary.height,
      captionHeight: caption.height,
    };
  });
  expect(measurements.scrollWidth).toBe(measurements.viewportWidth);
  expect(measurements.canvasWidth).toBeGreaterThan(580);
  expect(measurements.canvasHeight).toBeGreaterThan(150);
  expect(measurements.primaryHeight).toBeGreaterThanOrEqual(18);
  expect(measurements.captionHeight).toBeGreaterThanOrEqual(30);

  await page.screenshot({ path: path.join(artifactDir, 'phone-640x360.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('reduced-motion, muted and clean-feed controls preserve the game view', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#primary')).toContainText('LENGTH');

  const reduced = page.locator('[data-control="reduced-motion"]');
  const muted = page.locator('[data-control="muted"]');
  const clean = page.locator('[data-control="clean-feed"]');
  await expect(reduced).toHaveAttribute('aria-pressed', 'true');
  await expect(muted).toHaveAttribute('aria-pressed', 'true');
  await clean.click({ force: true });
  await expect(clean).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#broadcast')).toHaveClass(/clean-feed/);
  await expect(page.locator('#game')).toBeVisible();

  await page.screenshot({ path: path.join(artifactDir, 'clean-feed-1280x720.png'), fullPage: true });
  expect(failures).toEqual([]);
});
