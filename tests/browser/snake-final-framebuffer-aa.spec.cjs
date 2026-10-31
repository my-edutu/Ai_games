'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
const root = path.resolve(__dirname, '../..');
const oldLine = "  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });\n";
const block = /^.*\/\/ BEGIN R40 FINAL FRAMEBUFFER SAMPLES\n[\s\S]*?^.*\/\/ END R40 FINAL FRAMEBUFFER SAMPLES\n/gm;
const blob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const evidence = name => {
  const dir = path.join(root, 'artifacts/phase3');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
};

test('real Chromium/WebGL: single-sample final canvas preserves original world, serpent, and accessible cues', async ({ browser, baseURL }) => {
  test.setTimeout(140000);
  const current = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
  expect((current.match(block) || []).length).toBe(1);
  const prior = current.replace(block, oldLine);
  expect(blob(prior)).toBe('dce31f68dcc0a28b5792a502f6575e7939f6289d');
  const marker = '    const time = timestamp / 1000;';
  expect(current.split(marker).length).toBe(2);
  const frame = JSON.parse(fs.readFileSync(path.join(root, 'docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  frame.snapshot.dangerLevel = 0; // synthetic fixture only; retain real danger in production.
  const snapshot = JSON.stringify(frame);
  const result = [];
  const captures = {};
  for (const mode of ['overview', 'detail']) {
    captures[mode] = {};
    for (const [label, source, expectedAA] of [['before', prior, true], ['after', current, false]]) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.route('**/snapshot', route => route.fulfill({ json: frame }));
        const controlled = source.replace(marker, '    const time = 0; // R40 synthetic frozen PUBLIC visual clock');
        await page.route('**/renderer.mjs', route => route.fulfill({ contentType: 'text/javascript', body: controlled }));
        await page.goto(baseURL + '/?camera=' + mode + '&quality=low', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 5);
        const state = await page.evaluate(() => {
          const gl = document.getElementById('game').getContext('webgl2');
          return {
            nativeAA: gl.getContextAttributes().antialias, glError: gl.getError(),
            stats: window.__snakePresentation.stats(),
            caption: document.getElementById('caption')?.textContent,
            primary: document.getElementById('primary')?.textContent,
          };
        });
        expect(state.nativeAA).toBe(expectedAA);
        expect(state.glError).toBe(0);
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(0);
        expect(state.stats.drawCalls).toBeGreaterThan(0);
        expect(state.stats.staticCache.samples).toBeGreaterThan(0);
        expect(state.caption?.trim().length).toBeGreaterThan(0);
        expect(state.primary).toContain('LENGTH');
        expect(errors).toEqual([]);
        const png = await page.screenshot({ path: evidence('snake-r40-final-aa-' + mode + '-' + label + '-synthetic.png') });
        expect(png.length).toBeGreaterThan(10000);
        captures[mode][label] = png;
        result.push({ mode, label, nativeAA: state.nativeAA, glError: state.glError,
          cache: state.stats.staticCache, drawCalls: state.stats.drawCalls,
          triangles: state.stats.triangles, buffer: state.stats.drawingBuffer,
          serpent: state.stats.serpent, world: state.stats.world, imageBytes: png.length });
      } finally { await page.close(); }
    }
    const [a,b] = result.slice(-2);
    expect(b.drawCalls).toBe(a.drawCalls);
    expect(b.triangles).toBe(a.triangles);
    expect(b.buffer).toEqual(a.buffer);
    for (const key of ['geometries','materials','textures','paths','bodyRings','bodyTriangles','bufferBytes'])
      expect(b.serpent[key]).toBe(a.serpent[key]);
    for (const key of ['geometries','materials','textures','staticMeshes','drawObjects'])
      expect(b.world[key]).toBe(a.world[key]);
  }
  fs.writeFileSync(evidence('snake-r40-final-aa-meta.json'), JSON.stringify({
    exactPriorRendererGitBlob: 'dce31f68dcc0a28b5792a502f6575e7939f6289d',
    syntheticPublicFixture: true, sameStaticWorldMSAA: true,
    originalNativeAA: true, newNativeAA: false,
    screenshotByteChanges: Object.fromEntries(Object.entries(captures).map(([mode, png]) => [mode, Buffer.compare(png.before, png.after) !== 0])),
    noCausalFpsClaim: true, noDevicePresentedFpsClaim: true, noIndependentVisualApproval: true,
    strictDesktopGateUnchanged: true, result
  }, null, 2) + '\n');
  expect(JSON.stringify(frame)).toBe(snapshot);
});
