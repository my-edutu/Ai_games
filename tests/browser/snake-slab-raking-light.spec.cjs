'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });
const evidence = name => {
  const directory = path.resolve(__dirname, '../../artifacts/phase3');
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, name);
};

test('real Chromium WebGL: directional slab relief versus exact prior world blob, frozen public frame', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const frame = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  const original = JSON.stringify(frame);
  const current = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/world.mjs'), 'utf8');
  const insert = [
    '      // Bake a directional grazing-light contour into each existing stone slab.',
    '      // It reveals its raised, unevenly worn lip without raising the playable',
    '      // surface, altering collision truth or adding a shader/texture/pass.',
    '      // The tiny mineral modulation keeps long rows from forming flat stripes.',
    '      const lipGrain=mineral-.5;',
    '      const rim=(distance,center,spread)=>Math.exp(-Math.pow((distance-center)/spread,2));',
    '      const grazingLight=(rim(u,.075,.052)*(.067+lipGrain*.014)',
    '        +rim(v,.075,.052)*(.056+lipGrain*.014)',
    '        -rim(u,.925,.054)*(.066-lipGrain*.012)',
    '        -rim(v,.925,.054)*(.059-lipGrain*.012));',
  ].join('\n') + '\n';
  const changed = 'const value=.795+slabTones[toneIndex]+(cloud-.5)*.135+(mineral-.5)*.055+(noise(x,y)-.5)*.007-recess+chalk-fracture+grazingLight;';
  const prior = changed.replace('+grazingLight;', ';');
  expect(current).toContain(insert);
  expect(current).toContain(changed);
  const baseline = current.replace(insert, '').replace(changed, prior);
  const gitBlob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
  expect(gitBlob(baseline)).toBe('97039edc7512080b8f369483c3b4800e7180625e');
  const capture = [];
  for (const [label, source] of [['before', baseline], ['after', current]]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/snapshot', route => route.fulfill({ json: frame }));
      if (label === 'before') await page.route('**/world.mjs', route => route.fulfill({ contentType: 'text/javascript', body: source }));
      await page.goto(baseURL + '/?camera=overview&quality=low', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
      const results = await page.evaluate(() => {
        const stats = window.__snakePresentation.stats();
        return { stats, glError: document.getElementById('game').getContext('webgl2').getError() };
      });
      expect(results.stats.renderer).toBe('webgl');
      expect(results.stats.cameraMode).toBe('overview');
      expect(results.stats.world.staticMeshes).toBe(13);
      expect(results.stats.world.textures).toBe(4);
      expect(results.glError).toBe(0);
      expect(errors).toEqual([]);
      const image = await page.screenshot({ path: evidence('snake-slab-raking-light-' + label + '-frozen.png') });
      capture.push({ image, stats: results.stats });
    } finally { await page.close(); }
  }
  for (const key of ['staticMeshes', 'geometries', 'materials', 'textures', 'drawObjects'])
    expect(capture[1].stats.world[key]).toBe(capture[0].stats.world[key]);
  expect(Buffer.compare(capture[0].image, capture[1].image)).not.toBe(0);
  expect(JSON.stringify(frame)).toBe(original);
});
