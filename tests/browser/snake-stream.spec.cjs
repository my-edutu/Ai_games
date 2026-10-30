'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const artifactDir = path.resolve(__dirname, '../../artifacts/phase3');

function recordConsoleFailures(page) {
  const failures = [];
  page.on('console', message => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('pageerror', error => failures.push(error.message));
  return failures;
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(artifactDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

async function measureCadence(page) {
  return page.evaluate(() => new Promise(resolve => {
    const frameTimes = [];
    const initialDraws = window.__snakePresentation.stats().frameCount;
    const started = performance.now();
    function step(now) {
      frameTimes.push(now);
      if (now - started >= 1000) {
        const gaps = frameTimes.slice(1).map((value, index) => value - frameTimes[index]);
        resolve({ frames: frameTimes.length, elapsedMs: now - started,
          maxGapMs: gaps.length ? Math.max(...gaps) : 0,
          averageFps: frameTimes.length / ((now - started) / 1000),
          actualDraws: window.__snakePresentation.stats().frameCount - initialDraws });
      } else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }));
}

test.beforeAll(() => {
  fs.mkdirSync(artifactDir, { recursive: true });
});

test('desktop broadcast source is readable, animated and privacy-safe', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#primary')).toContainText('LENGTH');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#caption')).not.toHaveText('');
  await expect(page.locator('#integrity')).toHaveText('INTEGRITY: VERIFIED');
  await expect(page.locator('.controls')).toBeHidden();

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

  // Measure the working 3D scene after its first uploads and shader compilation,
  // rather than accidentally timing an empty loading canvas.
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 20, {}, { timeout: 40000 });
  expect((await page.evaluate(() => window.__snakePresentation.stats())).renderer).toBe('webgl');
  const animation = await measureCadence(page);

  // Retain the actual scene/cadence evidence even when the performance gate fails.
  const presentation = await page.evaluate(() => window.__snakePresentation.stats());
  writeJson('desktop-metrics.json', { layout, animation, presentation, scene: snapshot.scene, tick: snapshot.tick });
  console.log('SNAKE_DESKTOP_METRICS', JSON.stringify({ animation, presentation }));
  await page.screenshot({ path: path.join(artifactDir, 'desktop-1920x1080.png'), fullPage: true });

  if (animation.averageFps < 17) {
    // Controlled diagnostics only: these modified-source runs never satisfy the
    // production gate below. They isolate raster scale and dynamic shadow cost.
    const frame = await page.evaluate(async () => (await fetch('/snapshot')).json());
    const source = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
    const diagnostics = [];
    await page.route('**/snapshot', route => route.fulfill({ json: frame }));
    for (const shadows of [true, false]) {
      let body = source.replace('renderer.setPixelRatio(pixelRatio);', 'renderer.setPixelRatio(0.4);');
      if (!shadows) body = body.replaceAll('object.castShadow = false;', 'object.castShadow = false; object.receiveShadow = false;');
      await page.unroute('**/renderer.mjs');
      await page.route('**/renderer.mjs', route => route.fulfill({ contentType: 'text/javascript', body }));
      await page.goto('/?quality=low');
      await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 20, {}, { timeout: 25000 });
      const cadence = await measureCadence(page);
      const state = await page.evaluate(() => window.__snakePresentation.stats());
      const result = { diagnosticOnly: true, fixedPixelRatio: 0.4, dynamicShadowReception: shadows, cadence, state };
      diagnostics.push(result);
      console.log('SNAKE_RENDER_DIAGNOSTIC', JSON.stringify(result));
    }
    writeJson('desktop-render-diagnostics.json', diagnostics);
  }

  // Headless Chromium on shared CI is CPU-throttled; this gate detects a frozen or
  // severely starved presentation while recording the measured cadence for review.
  expect(animation.frames).toBeGreaterThanOrEqual(18);
  expect(animation.averageFps).toBeGreaterThanOrEqual(17);
  expect(animation.actualDraws).toBeGreaterThanOrEqual(17);
  expect(animation.maxGapMs).toBeLessThan(250);
  expect(failures).toEqual([]);
});

test('phone-size landscape retains goal, progress, gameplay and captions', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#primary')).toContainText('LENGTH');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#caption')).toBeVisible();
  await expect(page.locator('.controls')).toBeHidden();

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
  writeJson('phone-metrics.json', measurements);

  await page.screenshot({ path: path.join(artifactDir, 'phone-640x360.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('reduced-motion, muted and clean-feed controls preserve the game view', async ({ page }) => {
  const failures = recordConsoleFailures(page);
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?controls=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#primary')).toContainText('LENGTH');

  const reduced = page.locator('[data-control="reduced-motion"]');
  const muted = page.locator('[data-control="muted"]');
  const clean = page.locator('[data-control="clean-feed"]');
  await expect(page.locator('.controls')).toBeVisible();
  await expect(reduced).toHaveAttribute('aria-pressed', 'true');
  await expect(muted).toHaveAttribute('aria-pressed', 'true');
  await clean.click();
  await expect(clean).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#broadcast')).toHaveClass(/clean-feed/);
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('.controls')).toBeHidden();

  await page.screenshot({ path: path.join(artifactDir, 'clean-feed-1280x720.png'), fullPage: true });
  expect(failures).toEqual([]);
});
