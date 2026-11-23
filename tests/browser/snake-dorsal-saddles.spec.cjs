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

test('true WebGL frozen-frame A/B: body saddles taper while public game and resources remain fixed', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  // Synthetic five-cell visibility fixture, NOT a live autonomous/FPS sample.
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  frame.snapshot.snake = frame.snapshot.snake.slice(0, 5).map((segment, i) => ({ ...segment, cell: 8 + 28 * i }));
  const immutableFrame = JSON.stringify(frame);
  const latest = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/serpent.mjs'), 'utf8');
  const oldAtlas = "        const saddle = isHead\n          ? Math.max(smooth(0.60, 0.85, along) * 0.94, Math.exp(-Math.pow((around - 0.25) * 22, 2)) * smooth(0.08, 0.3, along) * (1 - smooth(0.58, 0.80, along)) * 0.80) * (1 - underside)\n          : (1 - smooth(0.105, 0.145, bandDistance + mottling * 0.009)) * (1 - underside);\n        const border = isHead ? 0 : (1 - smooth(0.145, 0.180, bandDistance)) * (1 - saddle) * (1 - underside);";
  const newAtlas = "        // Original gold leaf saddles are broad over the sunlit spine, then\n        // taper into darker green shoulders instead of encircling the serpent\n        // as flat toy-like horizontal stripes. All pigment stays in the\n        // existing seamless atlas; the head map and normal relief are untouched.\n        const dorsalSweep = smooth(-0.32, 0.83, Math.sin(around * Math.PI * 2));\n        const saddleWidth = 0.045 + 0.116 * dorsalSweep;\n        const feather = 0.014 + 0.015 * (1 - dorsalSweep);\n        const saddle = isHead\n          ? Math.max(smooth(0.60, 0.85, along) * 0.94, Math.exp(-Math.pow((around - 0.25) * 22, 2)) * smooth(0.08, 0.3, along) * (1 - smooth(0.58, 0.80, along)) * 0.80) * (1 - underside)\n          : (1 - smooth(saddleWidth - feather, saddleWidth + feather, bandDistance + mottling * 0.009))\n            * (0.18 + 0.82 * dorsalSweep) * (1 - underside);\n        const border = isHead ? 0 : (1 - smooth(saddleWidth + feather, saddleWidth + feather + 0.036, bandDistance))\n          * (1 - saddle) * (1 - underside) * (0.38 + 0.62 * dorsalSweep);";
  expect(latest).toContain(newAtlas);
  const beforeSource = latest.replace(newAtlas, oldAtlas);
  expect(beforeSource).not.toEqual(latest);
  const shots = [];
  for (const [label, updated] of [['before', false], ['after', true]]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/snapshot', route => route.fulfill({ json: frame }));
      if (!updated) await page.route('**/serpent.mjs', route => route.fulfill({ contentType: 'text/javascript', body: beforeSource }));
      await page.goto(`${baseURL}/?camera=detail&quality=low`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
      const metrics = await page.evaluate(() => {
        const stats = window.__snakePresentation.stats();
        return { stats, glError: document.getElementById('game').getContext('webgl2').getError() };
      });
      expect(metrics.stats.renderer).toBe('webgl');
      expect(metrics.stats.cameraMode).toBe('detail');
      expect(metrics.stats.serpent.textures).toBe(4);
      expect(metrics.stats.serpent.paths).toBeGreaterThan(0);
      expect(metrics.glError).toBe(0);
      expect(errors).toEqual([]);
      const png = await page.screenshot({ path: evidence(`snake-dorsal-leaf-saddles-${label}-synthetic.png`) });
      shots.push({ png, stats: metrics.stats });
    } finally { await page.close(); }
  }
  expect(shots[0].stats.serpent.geometries).toBe(shots[1].stats.serpent.geometries);
  expect(shots[0].stats.serpent.materials).toBe(shots[1].stats.serpent.materials);
  expect(shots[0].stats.serpent.textures).toBe(shots[1].stats.serpent.textures);
  expect(shots[0].stats.serpent.bodyVertices).toBe(shots[1].stats.serpent.bodyVertices);
  expect(Buffer.compare(shots[0].png, shots[1].png)).not.toBe(0);
  expect(JSON.stringify(frame)).toBe(immutableFrame);
});
