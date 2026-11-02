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

test('actual WebGL character remains framed when the rear arch would cross the close-camera sightline', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  // Synthetic, clearly labelled presentation stress fixture: the same public
  // schema and authoritatively frozen frame, with a five-cell continuous body
  // beside the existing rear pillar. This is NOT live gameplay/FPS evidence.
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  frame.snapshot.snake = frame.snapshot.snake.slice(0, 5).map((segment, i) => ({ ...segment, cell: 8 + 28 * i }));
  const immutableSnake = JSON.stringify(frame.snapshot.snake);
  const currentCamera = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/camera.mjs'), 'utf8');
  const call = '    outward = avoidForegroundOcclusion(outward, distance, head, food, occluders);';
  expect(currentCamera).toContain(call);
  const oldCamera = currentCamera.replace(call, '');
  const args = { width: 28, height: 16, aspect: 960 / 640, mode: 'detail',
    head: { x: -5.5, z: -7.5 }, direction: { x: 0, z: -1 },
    occluders: [{ x: -4.8, y: 1.25, z: -10.05, radius: 1.05 },
      { x: 1.4, y: 1.25, z: -10.05, radius: 1.05 }] };
  const captures = [];
  for (const [name, guarded] of [['without', false], ['with', true]]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/snapshot', route => route.fulfill({ json: frame }));
      if (!guarded) await page.route('**/camera.mjs', route => route.fulfill({ contentType: 'text/javascript', body: oldCamera }));
      await page.goto(`${baseURL}/?camera=detail&quality=low`);
      await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
      const metrics = await page.evaluate(async values => {
        const { cameraComposition, cameraOcclusionCost } = await import('/camera.mjs');
        const plan = cameraComposition(values);
        const dist = Math.hypot(...Object.values(plan.offset));
        const unit = Object.fromEntries(Object.entries(plan.offset).map(([key, value]) => [key, value / dist]));
        return { cost: cameraOcclusionCost(unit, dist, values.head, values.occluders),
          target: plan.target, distance: dist, stats: window.__snakePresentation.stats() };
      }, args);
      expect(metrics.stats.renderer).toBe('webgl');
      expect(metrics.stats.cameraMode).toBe('detail');
      expect(metrics.stats.textures).toBeLessThan(30);
      expect(await page.locator('#game').evaluate(canvas => canvas.getContext('webgl2').getError())).toBe(0);
      expect(errors).toEqual([]);
      const png = await page.screenshot({ path: evidence(`character-rear-arch-${name}-synthetic.png`) });
      captures.push({ png, metrics });
    } finally { await page.close(); }
  }
  const [oldView, newView] = captures;
  expect(oldView.metrics.cost).toBeGreaterThan(.35);
  expect(newView.metrics.cost).toBeLessThan(oldView.metrics.cost * .25);
  expect(newView.metrics.target).toEqual(oldView.metrics.target);
  expect(newView.metrics.distance).toBeCloseTo(oldView.metrics.distance, 8);
  expect(Buffer.compare(newView.png, oldView.png)).not.toBe(0);
  expect(JSON.stringify(frame.snapshot.snake)).toBe(immutableSnake);
});
