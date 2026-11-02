'use strict';
const {stripR52Canopy,reapplyR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone,reapplyR50Stone} = require('../helpers/snake-stone-archive.cjs');
const {stripR44Fruit,reapplyR44Fruit}=require('../helpers/snake-fruit-archive.cjs');
const { restorePreR42Water, applyR42Water } = require('../helpers/snake-water-flow-archive.cjs');
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
  // Isolate later R41 for archived SHA only, preserve it in both visual arms.
  const r41Begin = '      // BEGIN R41 COURTYARD ROOT CHANNELS\n';
  const r41End = '      // END R41 COURTYARD ROOT CHANNELS\n';
  const r41A = current.indexOf(r41Begin), r41B = current.indexOf(r41End);
  expect(r41A).toBeGreaterThan(-1);
  expect(r41B).toBeGreaterThan(r41A);
  const r41Block = current.slice(r41A, r41B + r41End.length);
  const historicalSource = stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(current.slice(0, r41A) + current.slice(r41B + r41End.length)))));
  // Later R35 foliage tint must not contaminate historic R31/R32 source SHAs,
  // but must remain equally present on both A/B rendered visual candidates.
  const lichenBegin='      // BEGIN R35 PERIMETER LICHEN\n';
  const lichenEnd='      // END R35 PERIMETER LICHEN\n';
  const lichenA=historicalSource.indexOf(lichenBegin),lichenB=historicalSource.indexOf(lichenEnd);
  expect(lichenA).toBeGreaterThan(-1);expect(lichenB).toBeGreaterThan(lichenA);
  const historicWorld=historicalSource.slice(0,lichenA)+historicalSource.slice(lichenB+lichenEnd.length);
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
  // Later Round32 changed real corner geometry. Reconstruct the exact
  // Round31 source first so this older light-only A/B remains strictly
  // isolated rather than attributing later sculpted geometry to its pigment.
  const cornerStart = '          // BEGIN R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const cornerEnd = '          // END R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const a = historicWorld.indexOf(cornerStart), b = historicWorld.indexOf(cornerEnd);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  const sculptNormals = '\n    if (sourceMaterial === tileMat) merged.computeVertexNormals();';
  expect(historicWorld.split(sculptNormals).length).toBe(2);
  const round31 = (historicWorld.slice(0,a) + historicWorld.slice(b + cornerEnd.length)).replace(sculptNormals,'');
  const baseline = round31.replace(insert, '').replace(changed, prior);
  const gitBlob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
  expect(gitBlob(round31)).toBe('4c50160ffb9c78b822cf2cb8d670e29baf994fea');
  expect(gitBlob(baseline)).toBe('97039edc7512080b8f369483c3b4800e7180625e');
  const matchedLichen = historicalSource.slice(lichenA,lichenB+lichenEnd.length);
  const insertLichen = source => reapplyR52Canopy(reapplyR50Stone(reapplyR44Fruit(applyR42Water(source.replace('      data[i+3]=255;\n', '      data[i+3]=255;\n' + matchedLichen + r41Block)),current),current),current);
  const capture = [];
  for (const [label, source] of [['before', insertLichen(baseline)], ['after', insertLichen(round31)]]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/snapshot', route => route.fulfill({ json: frame }));
      await page.route('**/world.mjs', route => route.fulfill({ contentType: 'text/javascript', body: source }));
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
