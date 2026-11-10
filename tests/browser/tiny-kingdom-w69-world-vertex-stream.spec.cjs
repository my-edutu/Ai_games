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


// W185 deterministic navigation spatial spine: RED on the prior source
// (there is no home-collision broadphase audit), with no mocked homes.
for (const viewport of [{width:1024,height:640},{width:390,height:844}]) {
  test('W185 actual cottages preserve footprint and save/restore navigation at '+viewport.width+'px', async ({page})=>{
    test.setTimeout(180000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize(viewport);await page.setContent(html);
    await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
      null,{timeout:110000});
    const check=await page.evaluate(()=>{
      const g=window.__tinyKingdom;
      g.setSpeed(0);
      const snapshot=g.exportSnapshot(),homes=snapshot.payload.city;
      const points=[];
      // Exact real roof-footprint margins, corners and both outside edges.
      for(const [hx,hz,k] of homes){
        const rx=(2.4+k*.42)*.5+.39,rz=(2.1+k*.18)*.5+.39;
        for(const dx of [-rx,-rx+.0001,0,rx-.0001,rx])
          for(const dz of [-rz,-rz+.0001,0,rz-.0001,rz])
            points.push([hx+dx,hz+dz]);
      }
      for(let x=-39;x<=39;x+=2.75)for(let z=-39;z<=39;z+=2.75)
        points.push([x,z]);
      const before=points.map(point=>g.walkable(point));
      // Every point strictly INSIDE any real home footprint must stay blocked,
      // even when other genuine static colliders are also present.
      const missed=points.filter((p,i)=>homes.some(([x,z,k])=>
        Math.abs(p[0]-x)<(2.4+k*.42)*.5+.39 &&
        Math.abs(p[1]-z)<(2.1+k*.18)*.5+.39) && before[i]);
      const beforeAudit=g.getHomeNavigationIndexAudit();
      g.restoreSnapshot(snapshot);
      const after=points.map(point=>g.walkable(point));
      const afterAudit=g.getHomeNavigationIndexAudit();
      return {population:g.metrics().citizens,homes:homes.length,
        missed,identical:before.every((value,i)=>value===after[i]),
        snapshotUnchanged:JSON.stringify(g.exportSnapshot())===JSON.stringify(snapshot),
        beforeAudit,afterAudit,probes:points.length,
        gl:document.querySelector('#world').getContext('webgl')?.getError()};
    });
    expect(check.missed).toEqual([]);
    expect(check.identical).toBe(true);
    expect(check.snapshotUnchanged).toBe(true);
    expect(check.beforeAudit.indexedHomes).toBe(check.homes);
    expect(check.afterAudit.indexedHomes).toBe(check.homes);
    expect(check.afterAudit.rebuilds).toBeGreaterThan(check.beforeAudit.rebuilds);
    expect(check.beforeAudit.candidateChecks).toBeLessThan(
      check.beforeAudit.queries*check.homes);
    expect(check.beforeAudit.bounded).toBe(true);
    expect(check.beforeAudit.authorityChanged).toBe(false);
    expect(check.probes).toBeGreaterThan(1000);
    expect(check.gl).toBe(0);expect(errors).toEqual([]);
    fs.mkdirSync('artifacts/tiny-kingdom-w69',{recursive:true});
    fs.writeFileSync('artifacts/tiny-kingdom-w69/'+viewport.width+'-w185-navigation.json',
      JSON.stringify(check,null,2));
  });
}
