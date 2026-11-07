'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../public/tiny-kingdom/index.html'), 'utf8');

// W69 RED contract: repeated real simulation steps must not create a new
// million-element JavaScript vertex Array on every displayed citizen frame.
// The optimized renderer must retain ALL real people and their exact geometry.
for (const viewport of [{width: 1024, height: 640}, {width: 390, height: 844}]) {
  test('W69 bounded citizen-mesh allocation and truthful frame stages at ' + viewport.width + 'px', async ({page}) => {
    test.setTimeout(240000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.setContent(html);
    await page.waitForFunction(() =>
      window.__tinyKingdom?.renderStats()?.lastFrameTriangles > 0,
      null, {timeout: 110000});

    const before = await page.evaluate(() => {
      const g = window.__tinyKingdom;
      const snapshot = JSON.stringify(g.exportSnapshot());
      const pool = g.getDynamicVertexPoolAudit();
      return {snapshot, pool};
    });
    expect(before.pool.kind).toBe('bounded-reusable-world-vertices');
    expect(before.pool.allocations).toBeGreaterThanOrEqual(1);

    // Advance the AUTHENTIC deterministic citizen simulation. We neither
    // teleport villagers nor replace jobs with a screenshot-only animation.
    await page.evaluate(() => {
      const g = window.__tinyKingdom;
      g.setSpeed(0);
      for (let i = 0; i < 3; i++) g.step(1 / 30);
    });
    await page.waitForFunction(() => {
      const g = window.__tinyKingdom;
      return g.getDynamicVertexPoolAudit().reusedBuilds >= 1 &&
        g.getFrameProfile().samples >= 2;
    }, null, {timeout: 110000});

    const after = await page.evaluate(() => {
      const g = window.__tinyKingdom;
      const profile = g.getFrameProfile();
      const pool = g.getDynamicVertexPoolAudit();
      const snapshot = JSON.stringify(g.exportSnapshot());
      return {
        pool, profile, snapshot, beforeWasChanged: snapshot === undefined,
        triangles: g.renderStats().lastFrameTriangles,
        population: g.metrics().citizens,
        invalid: g.getGeometryAudit(),
        glError: document.querySelector('#world').getContext('webgl')?.getError(),
        overflow: document.documentElement.scrollWidth - innerWidth
      };
    });
    expect(after.pool.allocations).toBeLessThanOrEqual(2);
    expect(after.pool.reusedBuilds).toBeGreaterThanOrEqual(1);
    expect(after.pool.maxLiveArrays).toBeLessThanOrEqual(1);
    expect(after.pool.budgetFloats).toBeGreaterThan(0);
    expect(after.pool.overBudgetReleases).toBeGreaterThanOrEqual(0);
    for(const key of ['worksiteGeometry', 'householdGeometry', 'citizenGeometry',
                      'weatherGeometry', 'gpuUpload']) {
      expect(after.profile.stages[key].p95).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(after.profile.stages[key].worst)).toBe(true);
    }
    expect(after.population).toBeGreaterThan(0);
    expect(after.triangles).toBeGreaterThan(0);
    expect(after.triangles).toBeLessThan(160000);
    expect(after.invalid.static.invalidComponents).toBe(0);
    expect(after.invalid.dynamic.invalidComponents).toBe(0);
    expect(after.glError).toBe(0);
    expect(after.overflow).toBeLessThanOrEqual(0);
    expect(after.beforeWasChanged).toBe(false);
    expect(before.snapshot).not.toBe(after.snapshot);
    expect(errors).toEqual([]);

    fs.mkdirSync('artifacts/tiny-kingdom-w69', {recursive:true});
    fs.writeFileSync('artifacts/tiny-kingdom-w69/' + viewport.width + '-frame-profile.json',
      JSON.stringify({source: 'actual-rendered-WebGL', viewport, pool: after.pool,
        profile: after.profile, triangles: after.triangles, population: after.population}, null, 2));
    await page.screenshot({path: 'artifacts/tiny-kingdom-w69/' + viewport.width + '-living-village.png'});
  });
}
