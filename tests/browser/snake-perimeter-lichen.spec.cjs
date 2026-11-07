'use strict';
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const { restorePreR42Water, applyR42Water } = require('../helpers/snake-water-flow-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
const repo = path.resolve(__dirname, '../..');
const evidence = name => {
  const directory = path.join(repo, 'artifacts/phase3');
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, name);
};
const blobHash = source => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');

// This is a controlled synthetic public frame rendered through Chromium/WebGL,
// not autonomous gameplay footage, a device display-present FPS sample or an R5 test.
test('real WebGL 3D garden: living perimeter lichen versus verified original court, overview and detail', async ({ browser, baseURL }) => {
  test.setTimeout(120000);
  const frame = JSON.parse(fs.readFileSync(path.join(repo, 'docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  const immutable = JSON.stringify(frame);
  const current = fs.readFileSync(path.join(repo, 'public/snake-stream/world.mjs'), 'utf8');
  const begin = '      // BEGIN R35 PERIMETER LICHEN\n';
  const end = '      // END R35 PERIMETER LICHEN\n';
  const a = current.indexOf(begin), b = current.indexOf(end);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  expect(current.indexOf(begin, a + 1)).toBe(-1);
  const prior = current.slice(0, a) + current.slice(b + end.length);
  // R41 remains present equally in both R35 WebGL arms; strip for SHA only.
  const r41Begin = '      // BEGIN R41 COURTYARD ROOT CHANNELS\n';
  const r41End = '      // END R41 COURTYARD ROOT CHANNELS\n';
  const r41A = prior.indexOf(r41Begin), r41B = prior.indexOf(r41End);
  expect(r41A).toBeGreaterThan(-1);
  expect(r41B).toBeGreaterThan(r41A);
  const archivedPrior = prior.slice(0, r41A) + prior.slice(r41B + r41End.length);
  expect(blobHash(stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(archivedPrior)))))).toBe('bef069d6333c41aa3355144efa8e3d6457a955fe');
  const all = {};
  for (const mode of ['overview', 'detail']) {
    all[mode] = {};
    for (const [label, source] of [['before', prior], ['after', current]]) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.route('**/snapshot', route => route.fulfill({ json: frame }));
        // Identical current app, camera, serpent and public snapshot. Only the
        // original world bytes differ between the genuine WebGL renders.
        if (label === 'before') await page.route('**/world.mjs', route =>
          route.fulfill({ contentType: 'text/javascript', body: source }));
        await page.goto(baseURL + '/?camera=' + mode + '&quality=low', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
        const result = await page.evaluate(() => ({
          stats: window.__snakePresentation.stats(),
          glError: document.getElementById('game').getContext('webgl2').getError(),
        }));
        expect(result.stats.renderer).toBe('webgl');
        expect(result.stats.cameraMode).toBe(mode);
        expect(result.stats.world.staticMeshes).toBe(13);
        expect(result.stats.world.textures).toBe(4);
        expect(result.glError).toBe(0);
        expect(errors).toEqual([]);
        const png = await page.screenshot({ path: evidence('snake-perimeter-lichen-' + mode + '-' + label + '-synthetic.png') });
        all[mode][label] = { png, stats: result.stats };
      } finally { await page.close(); }
    }
    for (const key of ['staticMeshes', 'staticInstances', 'geometries', 'materials', 'textures', 'drawObjects'])
      expect(all[mode].after.stats.world[key]).toBe(all[mode].before.stats.world[key]);
    expect(Buffer.compare(all[mode].before.png, all[mode].after.png)).not.toBe(0);
  }
  expect(JSON.stringify(frame)).toBe(immutable);
});
