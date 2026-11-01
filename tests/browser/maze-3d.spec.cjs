'use strict';
const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4174';

test('the autonomous maze renders a real 3D world from public knowledge', async ({ page }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/maze`);
  await expect(page.locator('#maze')).toHaveAttribute('data-renderer', 'webgl');
  await page.waitForFunction(() => window.__MAZE_3D__?.frames > 2);
  const before = await page.evaluate(() => ({tick: window.__MAZE_PUBLIC_STATE__.tick, token: window.__MAZE_PUBLIC_STATE__.runToken}));
  await page.waitForFunction(({tick, token}) => window.__MAZE_PUBLIC_STATE__.runToken !== token || window.__MAZE_PUBLIC_STATE__.tick > tick, before);
  const evidence = await page.evaluate(() => ({
    render: window.__MAZE_3D__,
    known: window.__MAZE_PUBLIC_STATE__.discoveredCells,
    state: window.__MAZE_PUBLIC_STATE__,
  }));
  expect(evidence.render.triangles).toBeGreaterThan(1000);
  expect(evidence.render.characterCount).toBeGreaterThanOrEqual(1);
  expect(evidence.render.renderedCells.every(cell => evidence.known.includes(cell))).toBe(true);
  for (const forbidden of ['world', 'passages', 'seed', 'runId', 'shortestSolutionLength']) {
    expect(evidence.state[forbidden]).toBeUndefined();
  }
  expect(failures).toEqual([]);
});

test('camera and accessibility controls change presentation while the AI continues', async ({ page }) => {
  await page.goto(`${base}/maze`);
  await expect(page.locator('#maze')).toHaveAttribute('data-renderer', 'webgl');
  const tick = await page.locator('[data-testid="tick"]').textContent();
  await page.locator('#camera-toggle').click();
  await expect(page.locator('#camera-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#settings-panel summary').click();
  await page.locator('#motion-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  await page.locator('#contrast-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-high-contrast', 'true');
  await page.locator('#settings-panel summary').click();
  await expect(page.locator('[data-testid="tick"]')).not.toHaveText(tick);
  await expect(page.locator('[data-testid="objective"]')).toBeVisible();
});

test('portrait layout keeps the scene and controls usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/maze`);
  await expect(page.locator('#maze')).toHaveAttribute('data-renderer', 'webgl');
  const layout = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    scene: document.getElementById('maze').getBoundingClientRect().toJSON(),
  }));
  expect(layout.scroll).toBe(layout.viewport);
  expect(layout.scene.width).toBeGreaterThan(320);
  expect(layout.scene.height,'The actual WebGL stage fills the phone instead of stopping above prose').toBeGreaterThan(810);
  await expect(page.locator('#camera-toggle')).toBeVisible();
  await expect(page.locator('[data-testid="captions"]')).toBeVisible();
});

test('the progress page exposes real evidence and does not claim an unreviewed win', async ({ page }) => {
  await page.goto(`${base}/maze/progress`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/From a map\s*to a living world\./);
  const response = await page.request.get(`${base}/maze/progress.json`);
  expect(response.ok()).toBe(true);
  const progress = await response.json();
  expect(JSON.stringify(progress)).toContain('Captain Toad');
  expect(JSON.stringify(progress)).not.toContain('100%');
  await expect(page.locator('#reviews')).toContainText(progress.reviews[0].status || progress.reviews[0].verdict);
});

test('a lost graphics context keeps a live map and can restore the 3D view', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto(`${base}/maze`);
  await page.waitForFunction(() => window.__MAZE_3D__?.frames > 2);
  const before = await page.evaluate(() => {
    window.lostContext = document.getElementById('maze').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.lostContext.loseContext();
    return window.__MAZE_PUBLIC_STATE__.tick;
  });
  await expect(page.locator('#maze-fallback')).toBeVisible();
  await expect(page.locator('#retry-3d')).toBeVisible();
  await page.waitForFunction(tick => window.__MAZE_PUBLIC_STATE__.tick !== tick, before);
  await page.evaluate(() => window.lostContext.restoreContext());
  await expect(page.locator('#maze')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('#maze-fallback')).toHaveCount(0);
  await page.waitForFunction(() => window.__MAZE_3D__?.contextLost === false);
});

test('unavailable WebGL retains the real result and a usable retry action', async ({ page }) => {
  const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
  const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
  const { MazePresentationController } = require('../../dist/games/ai-maze-escape/src/presentation/controller.js');
  const runtime = MazeRuntime.create({ width: 7, height: 7, profile: 'tree', keyCount: 0, trapCount: 0, threatCount: 0 }, 'graphics-result');
  for (let i = 0; i < 1000 && !runtime.state.result; i++) runtime.step();
  expect(runtime.state.result?.reason).toBe('escape');
  const presentation = new MazePresentationController();
  presentation.accept(buildMazeRenderSnapshot(runtime.state), runtime.events);
  const frame = presentation.frame(640, 480);
  await page.setViewportSize({ width: 640, height: 480 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  let sourceAvailable = true;
  await page.route('**/maze/state*', route => sourceAvailable ? route.fulfill({ json: frame }) : route.abort('failed'));
  await page.goto(`${base}/maze`);
  await expect(page.locator('#maze')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('#maze-fallback')).toBeVisible();
  await expect(page.locator('#scene-title')).toHaveText('ESCAPED');
  await expect(page.locator('#retry-3d')).toBeVisible();
  await expect(page.locator('#integrity')).toHaveText('Live view connected');
  await expect(page.locator('#run-phase')).toHaveText('JOURNEY COMPLETE');
  await expect(page.locator('#intent-label')).toHaveText('Result');
  await expect(page.locator('#progress')).toHaveText(`${Math.floor(frame.snapshot.discoveredCells.length * 100 / (frame.snapshot.width * frame.snapshot.height))}%`);
  const map = page.locator('#map-panel');
  await expect(map).not.toHaveAttribute('open', '');
  await map.locator('summary').click();
  await expect(page.locator('#minimap')).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.getElementById('minimap');
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels.some((value, index) => index % 4 === 3 && value > 0);
  });
  await page.keyboard.press('Escape');
  await expect(map).not.toHaveAttribute('open', '');
  await expect(map.locator('summary')).toBeFocused();
  const notes = page.locator('#intent-details');
  await notes.locator('summary').click();
  await expect(page.locator('#intent-copy')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(notes).not.toHaveAttribute('open', '');
  await expect(notes.locator('summary')).toBeFocused();
  sourceAvailable = false;
  await expect(page.locator('#run-phase')).toHaveText('RECONNECTING');
  await expect(page.locator('#scene-title')).toHaveText('ESCAPED');
  sourceAvailable = true;
  await expect(page.locator('#run-phase')).toHaveText('JOURNEY COMPLETE');
  await page.setViewportSize({width: 844, height: 390});
  await notes.locator('summary').click();
  const expanded = await page.evaluate(() => ({
    copy: document.querySelector('.intent-explanation').getBoundingClientRect().toJSON(),
    captions: document.getElementById('captions').getBoundingClientRect().toJSON(),
    viewport: {width: innerWidth, height: innerHeight},
  }));
  expect(expanded.copy.top).toBeGreaterThanOrEqual(0);
  expect(expanded.copy.bottom).toBeLessThanOrEqual(expanded.captions.top);
  expect(expanded.copy.left).toBeGreaterThanOrEqual(0);
  expect(expanded.copy.right).toBeLessThanOrEqual(expanded.viewport.width);
});

test('sound starts through a user action and mute suspends the audio context', async ({ page }) => {
  await page.setViewportSize({width: 640, height: 480});
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); window.testAudioContext = this; }
    };
  });
  await page.goto(`${base}/maze`);
  expect(await page.evaluate(() => window.testAudioContext)).toBeUndefined();
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(() => window.testAudioContext?.state === 'running');
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.waitForFunction(() => window.testAudioContext?.state === 'suspended');
});

test('six real run transitions release old character resources and keep the explorer visible', async ({ page }) => {
  const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
  const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
  const { MazePresentationController } = require('../../dist/games/ai-maze-escape/src/presentation/controller.js');
  const frames = [];
  for (let run = 0; run < 6; run++) {
    const runtime = MazeRuntime.create({width: 11, height: 9, profile: 'loops', visibilityRadius: 3, keyCount: 1, threatCount: 1}, `browser-resources-${run}`);
    const controller = new MazePresentationController();
    controller.accept(buildMazeRenderSnapshot(runtime.state), runtime.events);
    frames.push({...controller.frame(640, 480), stepDurationMs: 360});
    for (let tick = 0; tick < 12 && !runtime.state.result; tick++) runtime.step();
    controller.accept(buildMazeRenderSnapshot(runtime.state), runtime.events);
    frames.push({...controller.frame(640, 480), stepDurationMs: 360});
  }
  let active = frames[0];
  const errors = [], samples = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 640, height: 480});
  await page.route('**/maze/state*', route => route.fulfill({json: active}));
  await page.goto(`${base}/maze?reducedMotion=1`);
  for (const frame of frames) {
    active = frame;
    await page.waitForFunction(({token, tick}) => window.__MAZE_3D__?.runToken === token && window.__MAZE_3D__?.tick === tick, {token:frame.snapshot.runToken,tick:frame.snapshot.tick});
    const sample = await page.evaluate(() => window.__MAZE_3D__);
    samples.push(sample);
    expect(sample.explorerInFrame).toBe(true);
    expect(sample.characterCount).toBe(1 + frame.snapshot.threats.length);
    expect(sample.geometries).toBeLessThan(100);
    expect(sample.textures).toBeLessThanOrEqual(4);
    expect(sample.world.renderedCells).toEqual(frame.snapshot.cells.map(cell => cell.cell));
  }
  const starts = samples.filter((_, index) => index % 2 === 0);
  expect(Math.max(...starts.map(s => s.geometries)) - Math.min(...starts.map(s => s.geometries))).toBeLessThanOrEqual(8);
  expect(errors).toEqual([]);
});

test('320px portrait retains every presentation control with usable hit targets', async ({ page }) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(`${base}/maze`);
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    controls: [...document.querySelectorAll('.presentation-controls > button, .presentation-controls summary')].map(element => {const rect = element.getBoundingClientRect(); return {width:rect.width,height:rect.height,left:rect.left,right:rect.right};}),
  }));
  expect(layout.width).toBe(320);
  const sceneHeight=await page.locator('#maze').evaluate(el=>el.getBoundingClientRect().height);
  expect(sceneHeight,'the smallest phone also receives a full-height game stage').toBeGreaterThan(700);
  expect(layout.controls).toHaveLength(4);
  for (const rect of layout.controls) {
    expect(rect.width).toBeGreaterThanOrEqual(40);
    expect(rect.height).toBeGreaterThanOrEqual(40);
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(320);
  }
});
