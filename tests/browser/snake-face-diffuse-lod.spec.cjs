'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
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
const blobHash = text => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(text) + '\0').update(text).digest('hex');

test('real WebGL: diffuse distance face retains sculpt and PBR close-up against SHA-verified parent', async ({ browser, baseURL }) => {
  test.setTimeout(120000);
  const originalFrame = JSON.parse(fs.readFileSync(path.join(repo, 'docs/reviews/snake-gauntlet/round-4-public-frame.json'), 'utf8'));
  const immutableFrame = JSON.stringify(originalFrame);
  const source = restorePreR45(fs.readFileSync(path.join(repo, 'public/snake-stream/serpent.mjs'), 'utf8'));
  // Frozen R33 visual A/B: exclude later R45 fork from BOTH historical arms; R45 owns separate real-WebGL evidence.
  const marker = '  // The overview shows the face at a few dozen pixels';
  const restoreAt = '  let ringCount = 0, indexCount = 0, pathCount = 0, truncated = false;';
  const materialSwitch = '      for (const [mesh, detailed, overview] of faceMaterialBindings)\n        mesh.material = lowDetail ? overview : detailed;\n';
  const start = source.indexOf(marker), end = source.indexOf(restoreAt, start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  expect(source.split(marker).length).toBe(2);
  expect(source.split(materialSwitch).length).toBe(2);
  const priorSource = (source.slice(0, start) + source.slice(end)).replace(materialSwitch, '');
  // R34's valid new attention gesture must be present in BOTH R33 visual
  // comparison branches. Remove it ONLY for the exact historical R33 parent
  // SHA guard, so future expression cannot taint this old material review.
  const attentionBegin = '    // BEGIN R34 PUBLIC FOOD ATTENTION\n';
  const attentionEnd = '    // END R34 PUBLIC FOOD ATTENTION\n';
  const attentionStart = priorSource.indexOf(attentionBegin);
  const attentionFinish = priorSource.indexOf(attentionEnd);
  expect(attentionStart).toBeGreaterThan(0);
  expect(attentionFinish).toBeGreaterThan(attentionStart);
  const oldAttentionDeclaration = '  let gazeX = 0, gazeY = 0, previousRunToken;';
  const newAttentionDeclaration = '  let gazeX = 0, gazeY = 0, previousRunToken, focusYaw = 0;';
  const historicalPrior = (priorSource.slice(0, attentionStart)
    + priorSource.slice(attentionFinish + attentionEnd.length))
    .replace(newAttentionDeclaration, oldAttentionDeclaration);
  // Keep all later body-upload improvements in BOTH rendered R33 comparisons.
  // Remove R36 additions only for the exact archived R33 predecessor Git hash.
  const r36Blocks = /^[ \t]*\/\/ BEGIN R36 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R36 [^\n]*\n/gm;
  expect((historicalPrior.match(r36Blocks) || []).length).toBe(7);
  const r37Blocks = /^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
  const r39Blocks = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
  expect((historicalPrior.match(r39Blocks) || []).length).toBe(3);
  expect((historicalPrior.match(r37Blocks) || []).length).toBe(2);
  expect(blobHash(historicalPrior.replace(r36Blocks, '').replace(r37Blocks, '').replace(r39Blocks, ''))).toBe('5a4d1c1e3f6fd2874c8984313fc24de190e608d5');
  const captures = {};
  for (const mode of ['overview', 'detail']) {
    captures[mode] = {};
    for (const [label, content] of [['before', priorSource], ['after', source]]) {
      const page = await browser.newPage({ viewport: { width: 960, height: 640 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.route('**/snapshot', route => route.fulfill({ json: originalFrame }));
        // Historical R33 material A/B deliberately routes BOTH archived arms.
        // Current R48 public-danger acting is covered by its own real WebGL A/B;
        // it must not contaminate the old close-up pixel-equality contract.
        await page.route('**/serpent.mjs', route =>
          route.fulfill({ contentType: 'text/javascript', body: content }));
        await page.goto(baseURL + '/?camera=' + mode + '&quality=low', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 3);
        const data = await page.evaluate(() => ({
          stats: window.__snakePresentation.stats(),
          glError: document.getElementById('game').getContext('webgl2').getError(),
        }));
        expect(data.stats.renderer).toBe('webgl');
        expect(data.stats.cameraMode).toBe(mode);
        expect(data.stats.serpent.paths).toBeGreaterThan(0);
        expect(data.stats.serpent.textures).toBe(4);
        expect(data.glError).toBe(0);
        expect(errors).toEqual([]);
        const png = await page.screenshot({ path: evidence('snake-face-diffuse-' + mode + '-' + label + '-frozen.png') });
        captures[mode][label] = { png, stats: data.stats };
      } finally { await page.close(); }
    }
    for (const key of ['textures', 'geometries', 'bodyVertices', 'bufferBytes'])
      expect(captures[mode].after.stats.serpent[key]).toBe(captures[mode].before.stats.serpent[key]);
    expect(captures[mode].after.stats.serpent.materials).toBeGreaterThan(captures[mode].before.stats.serpent.materials);
    expect(captures[mode].after.stats.serpent.materials - captures[mode].before.stats.serpent.materials).toBeLessThanOrEqual(12);
  }
  expect(Buffer.compare(captures.overview.before.png, captures.overview.after.png)).not.toBe(0);
  // Close camera still binds the exact previous PBR meshes and textures.
  expect(Buffer.compare(captures.detail.before.png, captures.detail.after.png)).toBe(0);
  expect(JSON.stringify(originalFrame)).toBe(immutableFrame);
});
