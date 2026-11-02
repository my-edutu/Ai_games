'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
const repo = path.resolve(__dirname, '../..');
const evidence = name => {
  const dir = path.join(repo, 'artifacts/phase3');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
};
const round39 = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
const blob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');

test('real Chromium/WebGL: original jaw anticipates nearby public fruit in unchanged garden without new GPU resources', async ({ browser, baseURL }) => {
  test.setTimeout(145000);
  // A deliberately synthetic, frozen PUBLIC presentation frame. This is not
  // autonomous gameplay, sustained throughput, GPU-present or device FPS.
  const frame = JSON.parse(fs.readFileSync(path.join(repo, 'docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  expect(frame.snapshot.width).toBe(28);
  frame.snapshot.snake = frame.snapshot.snake.slice(0, 8).map((part, i) =>
    ({ ...part, cell: 14 + 28 * (8 - i) }));
  frame.snapshot.food = { ...frame.snapshot.food, cell: 15 + 28 * 10 };
  frame.snapshot.dangerLevel = 0;
  const frozen = JSON.stringify(frame);
  const source = restorePreR45(fs.readFileSync(path.join(repo, 'public/snake-stream/serpent.mjs'), 'utf8'));
  // Frozen R39 jaw A/B excludes R45's separate public-tongue gesture from BOTH historical arms.
  expect((source.match(round39) || []).length).toBe(3);
  const predecessor = source.replace(round39, '');
  expect(blob(predecessor)).toBe('8e96f08c3fca80484d69c9476a6d9993cfc4af63');
  const rendererSource = fs.readFileSync(path.join(repo, 'public/snake-stream/renderer.mjs'), 'utf8');
  const clockAnchor = '    const time = timestamp / 1000;';
  expect(rendererSource.split(clockAnchor).length).toBe(2);
  const fixedRenderer = rendererSource.replace(clockAnchor,
    '    const time = 1.25; // synthetic R39 fixed visual clock, not production');
  const rows = [];
  const captures = {};
  for (const mode of ['detail', 'overview']) {
    captures[mode] = {};
    for (const [label, characterSource] of [['prior', predecessor], ['current', source]]) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 },
        reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.route('**/snapshot', route => route.fulfill({ json: frame }));
        await page.route('**/renderer.mjs', route => route.fulfill({
          contentType: 'text/javascript', body: fixedRenderer }));
        // Both historical visual arms use exact pre-R45 sources.
        await page.route('**/serpent.mjs', route => route.fulfill({
          contentType: 'text/javascript', body: characterSource }));
        await page.goto(baseURL + '/?camera=' + mode + '&quality=low', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 5);
        const state = await page.evaluate(() => ({
          stats: window.__snakePresentation.stats(),
          glError: document.getElementById('game').getContext('webgl2').getError(),
        }));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.serpent.paths).toBe(1);
        expect(state.glError).toBe(0);
        expect(errors).toEqual([]);
        const png = await page.screenshot({ path: evidence('snake-r39-feeding-' + mode + '-' + label + '-synthetic.png') });
        captures[mode][label] = { png, stats: state.stats };
        rows.push({ mode, label, frameCount: state.stats.frameCount, drawCalls: state.stats.drawCalls,
          world: state.stats.world, serpent: state.stats.serpent,
          gpuQueue: state.stats.gpuQueue, glError: state.glError });
      } finally { await page.close(); }
    }
    const a = captures[mode].prior.stats, b = captures[mode].current.stats;
    for (const key of ['geometries', 'materials', 'textures', 'bufferBytes',
      'bodyRings', 'bodyVertices', 'bodyTriangles', 'paths']) {
      expect(b.serpent[key]).toBe(a.serpent[key]);
    }
    for (const key of ['geometries', 'materials', 'textures', 'drawObjects', 'staticMeshes']) {
      expect(b.world[key]).toBe(a.world[key]);
    }
    expect(b.drawCalls).toBe(a.drawCalls);
    expect(b.triangles).toBe(a.triangles);
  }
  expect(Buffer.compare(captures.detail.prior.png, captures.detail.current.png)).not.toBe(0);
  fs.writeFileSync(evidence('snake-r39-feeding-capture-meta.json'), JSON.stringify({
    exactPredecessorGitBlob: '8e96f08c3fca80484d69c9476a6d9993cfc4af63',
    syntheticPublicFixture: true, fixedClockSeconds: 1.25, motionAndAIGameplayUnmodified: true,
    noDevicePresentFpsClaim: true, noCausalPerformanceClaim: true,
    independentCommercialVisualApproval: false, rows
  }, null, 2) + '\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
