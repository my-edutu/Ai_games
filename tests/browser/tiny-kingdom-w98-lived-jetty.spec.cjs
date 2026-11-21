'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../public/tiny-kingdom/index.html'), 'utf8');

// W98: real upper-storey mass replaces (not overlays) the old shallow prop.
// These shots are evidence candidates; a passing test is never a visual A/B
// or sustained hardware-performance verdict.
for (const viewport of [
  { width: 1024, height: 640 },
  { width: 390, height: 844 }
]) {
  test('W98 inhabited grown-town upper rooms remain real and bounded at '+viewport.width+'px', async ({page}) => {
    test.setTimeout(300000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.setContent(html);
    await page.waitForFunction(() => window.__tinyKingdom?.renderStats()?.lastFrameTriangles > 0,
      null, { timeout: 110000 });
    const initial = await page.evaluate(() => {
      const g = window.__tinyKingdom; g.setSpeed(0);
      return { world: JSON.stringify(g.exportSnapshot()), metrics: g.metrics(),
        roof: g.getRoofCoursingAudit() };
    });
    const grown = await page.evaluate(() => {
      const g = window.__tinyKingdom;
      // Exactly the genuine fixed-step 120-day simulation, never staged lots.
      for (let i=0; i<120*24*30; i++) g.step(1/30);
      const snapshot = JSON.stringify(g.exportSnapshot());
      const firstFrames = g.getFrameProfile().totalFrames;
      g.setCamera({ yaw: .66, pitch: .61, zoom: 46, focus: [0, 0] });
      return { snapshot, firstFrames };
    });
    await page.waitForFunction(n => window.__tinyKingdom.getFrameProfile().totalFrames > n,
      grown.firstFrames, { timeout: 110000 });
    const candidate = await page.evaluate(() => {
      const g = window.__tinyKingdom;
      return { world: JSON.stringify(g.exportSnapshot()), metrics: g.metrics(),
        morphology: g.getStreetMorphologyStats(), roofs: g.getRoofCoursingAudit(),
        geometry: g.getGeometryAudit(), frame: g.renderStats(),
        gl: document.getElementById('world').getContext('webgl')?.getError(),
        horizontalOverflow: document.documentElement.scrollWidth-innerWidth };
    });
    expect(candidate.world).toBe(grown.snapshot);
    expect(candidate.metrics.citizens).toBeGreaterThanOrEqual(initial.metrics.citizens);
    expect(candidate.metrics.buildings).toBeGreaterThan(initial.metrics.buildings);
    expect(candidate.morphology.upperJetties).toBeGreaterThan(0);
    expect(candidate.morphology.highStreetFronts)
      .toBe(candidate.metrics.buildings-2);
    // W81 real roof tiles remain on EVERY lot. A new massing should not
    // silently remove detailed or compact homes to rescue a budget.
    expect(candidate.roofs.detailedHomes+candidate.roofs.compactHomes)
      .toBe(candidate.metrics.buildings-2);
    expect(candidate.roofs.compactCourses)
      .toBe(candidate.roofs.compactHomes*6);
    expect(candidate.geometry.static.invalidComponents).toBe(0);
    expect(candidate.geometry.dynamic.invalidComponents).toBe(0);
    expect(candidate.geometry.totalTriangles).toBeLessThan(160000);
    expect(candidate.frame.lastFrameTriangles).toBeLessThan(160000);
    expect(candidate.gl).toBe(0);
    expect(candidate.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
    const dest = 'artifacts/tiny-kingdom-w98';
    fs.mkdirSync(dest,{recursive:true});
    fs.writeFileSync(dest+'/'+viewport.width+'-day120-jetty-audit.json',
      JSON.stringify({source:'W98 true occupied upper-storey geometry',viewport,
        initial:initial.metrics, candidate},null,2));
    await page.screenshot({path:dest+'/'+viewport.width+'-grown-town.png'});
  });
}
