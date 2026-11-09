'use strict';
// W162 — actual Chromium bootstrap regression. No mocked game or renderer.
// Prior to this fix the responsive HUD read undefined people before start().
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const html = fs.readFileSync(path.resolve('public/tiny-kingdom/index.html'), 'utf8');
const viewports = [{ width: 1024, height: 640 }, { width: 390, height: 844 }];
(async () => {
  const browser = await chromium.launch({ headless: true, args: [
    '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'
  ] });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.stack || error.message));
      await page.setContent(html, { waitUntil: 'load' });
      await page.waitForFunction(() =>
        window.__tinyKingdom?.renderStats().lastFrameTriangles > 0,
      null, { timeout: 90000 });
      const check = await page.evaluate(() => {
        const game = window.__tinyKingdom;
        const saved = game.exportSnapshot();
        const restored = game.restoreSnapshot(saved);
        return {
          visibleTriangles: game.renderStats().lastFrameTriangles,
          renderer: game.renderer(),
          command: game.getCommandView(),
          population: game.metrics().citizens,
          buildings: game.metrics().buildings,
          roundtrip: restored === true && game.exportSnapshot().checksum === saved.checksum
        };
      });
      assert.equal(check.command, 'world', 'world HUD boots without uninitialized model');
      assert.equal(check.population, 12, 'founding citizens preserved');
      assert(check.buildings >= 14, 'founding village remains occupied');
      assert(check.visibleTriangles > 0 && check.visibleTriangles < 160000,
        'founding rendered view stays inside strict triangle budget');
      assert.equal(check.roundtrip, true, 'original save/restore still roundtrips');
      if (viewport.width === 390) {
        const toggle = page.locator('#camera-disclosure');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await toggle.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      }
      assert.deepEqual(errors, [], 'no uncaught initialization or camera-page errors');
      console.log('W162 real Chromium boot', JSON.stringify({ viewport, check }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
