'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
const evidence = name => {
  const directory = path.resolve(__dirname, '../../artifacts/phase3');
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, name);
};

function lifecycleFrames() {
  const { SnakeRuntime } = require('../../dist/games/autonomous-snake/src/runtime/run.js');
  const { buildRenderSnapshot } = require('../../dist/games/autonomous-snake/src/presentation/snapshot.js');
  const { BroadcastExperience } = require('../../dist/games/autonomous-snake/src/presentation/experience.js');
  const runtime = SnakeRuntime.create({ width: 8, height: 8, targetLength: 4, initialLength: 3, intermissionTicks: 2, profile: 'open', hazardCount: 0, hazardPeriod: 8, hazardActiveTicks: 8, specialFoodEvery: 4, specialFoodLifetime: 30, noProgressTicks: 80 }, '3d-lifecycle-browser-check');
  const experience = new BroadcastExperience({ replayCapacity: 30, bestLength: 0, maxActiveVfx: 32, maxAudioVoices: 8, muted: true });
  experience.accept(buildRenderSnapshot(runtime.state), runtime.events);
  let cursor = runtime.events.length;
  const frames = { initial: experience.frame() };
  for (let i = 0; i < 200 && !frames.restarted; i++) {
    runtime.step();
    experience.accept(buildRenderSnapshot(runtime.state), runtime.events.slice(cursor));
    cursor = runtime.events.length;
    const frame = experience.frame();
    if (frame.scene === 'result') frames.result = frame;
    if (frame.scene === 'intermission') frames.intermission = frame;
    if (frame.snapshot.runToken !== frames.initial.snapshot.runToken) frames.restarted = frame;
  }
  if (!frames.result || !frames.intermission || !frames.restarted) throw new Error('Real runtime did not produce a complete lifecycle');
  return frames;
}

test('real WebGL scene advances and camera controls preserve the authoritative run', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({ baseURL, recordVideo: { dir: path.dirname(evidence('character-motion.webm')), size: { width: 1280, height: 960 } } });
  let video;
  try {
  const page = await context.newPage();
  video = page.video();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-renderer', 'webgl');
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount > 4);
  const before = await page.evaluate(() => window.__snakePresentation.stats());
  expect(before.triangles).toBeGreaterThan(2000);
  await page.locator('[data-control="camera"]').click();
  await expect(page.locator('[data-control="camera"]')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(() => window.__snakePresentation.stats().cameraMode === 'follow');
  await expect(page.locator('#board-overview')).toBeVisible();
  await page.locator('[data-control="camera"]').click();
  await page.waitForFunction(() => window.__snakePresentation.stats().cameraMode === 'detail');
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: evidence('character-current.png') });
  // Retain actual motion for the independent critic, including turns and the
  // character's live reactions. Save the actual video alongside the stills.
  await page.waitForTimeout(3500);
  await page.locator('#board-overview').click();
  await page.waitForFunction(() => window.__snakePresentation.stats().cameraMode === 'overview');
  const after = await page.evaluate(() => window.__snakePresentation.stats());
  expect(after.frameCount).toBeGreaterThan(before.frameCount);
  expect(after.geometries).toBeLessThan(90);
  expect(after.textures).toBeLessThan(24);
  expect(errors).toEqual([]);
  } finally {
    await context.close();
    if (video) {
      const original = await video.path();
      const saved = evidence('character-motion.webm');
      await video.saveAs(saved);
      if (original !== saved) fs.unlinkSync(original);
    }
  }
});

test('WebGL failure presents a working safety view while snapshots keep advancing', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (String(type).startsWith('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-renderer', 'canvas-fallback');
  await expect(page.locator('#primary')).toContainText('LENGTH');
  const first = await page.evaluate(async () => (await (await fetch('/snapshot')).json()).tick);
  await page.waitForFunction(async first => (await (await fetch('/snapshot')).json()).tick !== first, first);
  await expect(page.locator('#game')).toBeVisible();
});

test('portrait layout and viewer settings retain accessible controls and progression', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?controls=1');
  await expect(page.locator('#primary')).toContainText('LENGTH');
  await expect(page.locator('[data-control="reduced-motion"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-control="muted"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('#captions')).toBeVisible();
  const viewer = await page.locator('.viewer-tools').boundingBox();
  const operator = await page.locator('.controls').boundingBox();
  expect(viewer.y + viewer.height).toBeLessThan(operator.y);
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount > 2);
  await page.screenshot({ path: evidence('portrait-390x844.png') });
});

test('unavailable drawing contexts retain the recovery explanation across successful polls', async ({ page }) => {
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  let polls = 0;
  page.on('response', response => { if (response.url().endsWith('/snapshot') && response.ok()) polls++; });
  await page.goto('/');
  await expect(page.locator('#scene-copy')).toContainText('cannot draw');
  await expect.poll(() => polls).toBeGreaterThan(3);
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'recovery');
  await expect(page.locator('#scene-copy')).toBeVisible();
});

test('real runtime result, intermission, restart and reconnect frames retain a working view', async ({ page }) => {
  const frames = lifecycleFrames();
  let current = frames.initial, disconnected = false;
  await page.route('**/snapshot', route => disconnected ? route.abort() : route.fulfill({ json: current }));
  await page.setViewportSize({ width: 960, height: 640 });
  await page.goto('/');
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount > 2);
  current = frames.result;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'result');
  await expect(page.locator('#scene-title')).toBeVisible();
  current = frames.intermission;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'intermission');
  current = frames.restarted;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'normal');
  await expect(page.locator('#primary')).toContainText('LENGTH 3 / 4');
  disconnected = true;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'recovery');
  disconnected = false;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'normal');
  await expect(page.locator('#game')).toHaveAttribute('data-renderer', 'webgl');
  expect((await page.evaluate(() => window.__snakePresentation.stats())).textures).toBeLessThan(30);
});

test('adaptive quality retains a valid shadow map and visible 3D after resizing', async ({ page }) => {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => request(time => setTimeout(() => callback(performance.now()), 45));
  });
  await page.setViewportSize({width:640,height:360});
  await page.goto('/');
  await page.waitForFunction(() => window.__snakePresentation?.stats().quality === 'low', {}, {timeout:40000});
  const frames = await page.evaluate(() => window.__snakePresentation.stats().frameCount);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(frames => window.__snakePresentation.stats().frameCount > frames + 3, frames);
  const error = await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError());
  expect(error).toBe(0);
  expect((await page.evaluate(() => window.__snakePresentation.stats())).textures).toBeGreaterThanOrEqual(8);
});

test('progress page and local renderer dependencies are available with safe MIME types', async ({ request, page }) => {
  for (const route of ['/renderer.mjs', '/serpent.mjs', '/world.mjs', '/camera.mjs', '/overview.mjs', '/view-copy.mjs', '/vendor/three.module.js', '/vendor/three.core.js']) {
    const response = await request.get(route);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('javascript');
  }
  const progress = await request.get('/progress');
  expect(progress.ok()).toBeTruthy();
  expect(await progress.text()).toContain('Gauntlet');
  expect((await request.get('/vendor/package.json')).status()).toBe(404);
  const motionClip = await request.get('/progress/evidence/round-7-motion.mp4');
  expect(motionClip.ok()).toBeTruthy();
  expect(motionClip.headers()['content-type']).toContain('video/mp4');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/progress');
  await expect(page.locator('#status-title')).not.toHaveText('Loading progress');
  await expect(page.locator('#rounds li')).not.toHaveCount(0);
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: evidence('progress-page.png') });
});

test('static cache retains depth and dynamic geometry through resize and context loss', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto('/?quality=low');
  await page.waitForFunction(() => window.__snakePresentation?.stats().staticCache?.hits >= 2);
  const before = await page.evaluate(() => window.__snakePresentation.stats());
  expect(before.staticCache.active).toBe(true);
  expect(before.triangles).toBeGreaterThan(2000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(builds => window.__snakePresentation.stats().staticCache.builds > builds, before.staticCache.builds);
  const after = await page.evaluate(() => window.__snakePresentation.stats());
  expect(after.textures).toBeLessThanOrEqual(before.textures + 2);
  expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
  await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#game')).toHaveAttribute('data-renderer', 'canvas-fallback');
});

test('matched real replay frames record cached and direct 3D output for independent review', async ({ browser, baseURL }) => {
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  const source = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
  for (const cached of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
    try {
      await page.route('**/snapshot', route => route.fulfill({ json: frame }));
      if (!cached) await page.route('**/renderer.mjs', route => route.fulfill({ contentType: 'text/javascript', body: source.replace("const cacheSupported = renderer.extensions.has('EXT_color_buffer_float');", 'const cacheSupported = false;') }));
      await page.goto(`${baseURL}/?quality=low`);
      await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
      const stats = await page.evaluate(() => window.__snakePresentation.stats());
      expect(stats.renderer).toBe('webgl');
      expect(stats.staticCache.active).toBe(cached);
      expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
      const name = cached ? 'cache-after' : 'cache-before';
      await page.screenshot({ path: evidence(`${name}.png`) });
      fs.writeFileSync(evidence(`${name}-metrics.json`), JSON.stringify(stats, null, 2));
    } finally { await page.close(); }
  }
});

test('real WebGL close camera captures a near-head fruit occlusion stress fixture', async ({ browser, baseURL }) => {
  // Presentation-only frozen-frame stress case, not a claim of real gameplay:
  // move only the food in an existing public snapshot one cell ahead of its
  // existing head to exercise a visually plausible but difficult sightline.
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  expect(frame.snapshot.snake[0].cell).toBe(250);
  expect(frame.snapshot.snake[1].cell).toBe(222);
  frame.snapshot.food = { ...frame.snapshot.food, cell: 278 };
  const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/snapshot', route => route.fulfill({ json: frame }));
    await page.goto(`${baseURL}/?camera=detail&quality=low`);
    await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
    const stats = await page.evaluate(() => window.__snakePresentation.stats());
    expect(stats.renderer).toBe('webgl');
    expect(stats.cameraMode).toBe('detail');
    expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
    await page.screenshot({ path: evidence('character-fruit-sightline-stress.png') });
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

test('real WebGL eyes aim at opposite public-fruit locations without altering the snake path', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  // Deliberately synthetic presentation fixture. The head, grid, run and
  // position stream are frozen; only public fruit changes sides. These are
  // not live-autonomous-performance samples or separately authenticated runs.
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  expect(frame.snapshot.snake[0].cell).toBe(250);
  expect(frame.snapshot.snake[1].cell).toBe(222);
  const originalSnake = JSON.stringify(frame.snapshot.snake);
  frame.snapshot.food = { ...frame.snapshot.food, cell: 249 };
  // R48 urgent public danger correctly interrupts fruit pursuit. The gaze
  // direction test intentionally uses a SAFE public snapshot; R48 owns the
  // separate urgent-danger real WebGL and original-source comparisons.
  frame.snapshot.dangerLevel = 0;
  const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/snapshot', route => route.fulfill({ json: frame }));
    await page.goto(`${baseURL}/?camera=detail&quality=low`);
    await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
    await expect.poll(async () => (await page.evaluate(() => window.__snakePresentation.stats())).serpent.gaze.horizontal,
      { timeout: 20000 }).toBeLessThan(-0.018);
    const west = await page.evaluate(() => window.__snakePresentation.stats());
    expect(west.cameraMode).toBe('detail');
    expect(west.serpent.paths).toBeGreaterThan(0);
    await page.screenshot({ path: evidence('character-public-fruit-west-synthetic.png') });

    frame.snapshot = { ...frame.snapshot, revision: frame.snapshot.revision + 1,
      food: { ...frame.snapshot.food, cell: 251 } };
    await expect.poll(async () => (await page.evaluate(() => window.__snakePresentation.stats())).serpent.gaze.horizontal,
      { timeout: 20000 }).toBeGreaterThan(0.018);
    const east = await page.evaluate(() => window.__snakePresentation.stats());
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes'])
      expect(east.serpent[key]).toBe(west.serpent[key]);
    expect(east.serpent.paths).toBe(west.serpent.paths);
    expect(JSON.stringify(frame.snapshot.snake)).toBe(originalSnake);
    expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
    await page.screenshot({ path: evidence('character-public-fruit-east-synthetic.png') });
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});
