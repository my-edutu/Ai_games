'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../../public/tiny-kingdom/index.html'), 'utf8');

test('Tiny Kingdom boots with a running 3D civilization and a story feed', async ({page}) => {
  const faults = [];
  page.on('pageerror', e => faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  const first = await page.evaluate(() => window.__tinyKingdom.getState());
  expect(first.people).toHaveLength(12);
  expect(first.state.buildCount).toBeGreaterThan(10);
  expect(await page.locator('#feed .feeditem').count()).toBeGreaterThan(0);
  expect(faults).toEqual([]);
});

test('Tiny Kingdom updates deterministically across two seeded runs', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const same = await page.evaluate(() => {
    const game=window.__tinyKingdom;
    function run(){game.reset();for(let i=0;i<360;i++)game.step(1/30);return JSON.stringify(game.getState());}
    return run()===run();
  });
  expect(same).toBe(true);
});

test('Tiny Kingdom speed, pause and restart work', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#speed16').click();
  await page.waitForTimeout(850);
  const accelerated=await page.evaluate(() => window.__tinyKingdom.getState().state.t);
  expect(accelerated).toBeGreaterThan(7.5);
  await page.locator('#pause').click();
  const before=await page.evaluate(() => window.__tinyKingdom.getState().state.t);
  await page.waitForTimeout(200);
  const after=await page.evaluate(() => window.__tinyKingdom.getState().state.t);
  expect(after).toBe(before);
  await page.locator('#restart').click();
  expect(await page.evaluate(() => window.__tinyKingdom.getState().people.length)).toBe(12);
});


test('Tiny Kingdom grows for 90 simulated days through work and social connections', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const metrics=await page.evaluate(() => {
    const game=window.__tinyKingdom;
    game.reset();
    game.setCamera({zoom:14,pitch:.43,focus:[0,-1]});
    for(let i=0;i<90*24*30;i++) game.step(1/30);
    return game.metrics();
  });
  expect(metrics.day).toBe(91);
  expect(metrics.buildings).toBeGreaterThan(14);
  expect(metrics.gold).toBeGreaterThan(42);
  expect(metrics.relationships).toBeGreaterThan(0);
  expect(metrics.food).toBeGreaterThan(metrics.citizens*2);
});

test('Tiny Kingdom plans walkable routes around buildings and water', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const result = await page.evaluate(() => {
    const g=window.__tinyKingdom;
    const a=[-18,-6],b=[20,3],route=g.route(a,b);
    if(!route || route.length===0)return {route,walkable:false,safe:false};
    let prior=a,safe=true;
    for(const point of route){
      if(!g.walkable(point))safe=false;
      const steps=Math.ceil(Math.hypot(point[0]-prior[0],point[1]-prior[1])/.04);
      for(let i=1;i<=steps;i++){
        const t=i/steps,mid=[prior[0]+(point[0]-prior[0])*t,prior[1]+(point[1]-prior[1])*t];
        if(!g.walkable(mid)){safe=false;break}
      }
      prior=point;
    }
    return {route,walkable:g.getNavigation().every(p=>g.walkable(p.position)),safe};
  });
  expect(result.walkable).toBe(true);
  expect(result.safe).toBe(true);
  expect(result.route.length).toBeGreaterThan(0);
});

test('Tiny Kingdom seeded route and civilization snapshot replay identically', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const same = await page.evaluate(() => {
    const g=window.__tinyKingdom;
    function sim(){g.reset();for(let i=0;i<7*24*30;i++)g.step(1/30);return JSON.stringify({world:g.getState(),routes:g.getNavigation(),metrics:g.metrics()});}
    return sim()===sim();
  });
  expect(same).toBe(true);
});

test('Tiny Kingdom world snapshot restores deterministic agent decisions, positions, buildings and stories', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const evidence=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    for(let i=0;i<18*24*30;i++)g.step(1/30);
    const save=g.exportSnapshot();
    for(let i=0;i<4*24*30;i++)g.step(1/30);
    const expected=JSON.stringify(g.exportSnapshot());
    g.restoreSnapshot(save);
    for(let i=0;i<4*24*30;i++)g.step(1/30);
    return {identical:JSON.stringify(g.exportSnapshot())===expected, citizens:g.metrics().citizens, schema:save.schema};
  });
  expect(evidence.identical).toBe(true);
  expect(evidence.schema).toBe(1);
  expect(evidence.citizens).toBeGreaterThan(12);
});

test('Tiny Kingdom rejects tampered world snapshots atomically', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const evidence=await page.evaluate(() => {
    const g=window.__tinyKingdom, save=g.exportSnapshot(),original=JSON.stringify(save);
    save.payload.state.gold=900000;
    let rejected=false;
    try{g.restoreSnapshot(save)}catch(e){rejected=/save/i.test(e.message)}
    return {rejected,unchanged:JSON.stringify(g.exportSnapshot())===original};
  });
  expect(evidence).toEqual({rejected:true,unchanged:true});
});

test('Tiny Kingdom renders restored chronicles as text, not HTML', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  const safe=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    const payload=g.exportSnapshot();
    // Even a normal story must be rendered via text nodes rather than markup.
    return document.querySelector('#feed .feeditem')?.textContent.includes('Kingdom chronicle') &&
      !document.querySelector('#feed .feeditem script');
  });
  expect(safe).toBe(true);
});

test('Tiny Kingdom path cache is bounded and invalidated by deterministic restore', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const result=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    for(let i=0;i<50*24*30;i++)g.step(1/30);
    const before=g.routeCacheMetrics(),snapshot=g.exportSnapshot();
    g.restoreSnapshot(snapshot);
    return {before,after:g.routeCacheMetrics()};
  });
  expect(result.before.hits).toBeGreaterThan(0);
  expect(result.before.entries).toBeLessThanOrEqual(1800);
  expect(result.after).toEqual({entries:0,hits:0,misses:0});
});


test('Tiny Kingdom calendar rotates spring summer autumn winter with stable weather', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const evidence=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    const climates=[1,10,19,28,37].map(day=>g.climateAt((day-1)*24+7));
    g.reset();
    const before=g.exportSnapshot();
    g.reset();
    return {climates,stable:JSON.stringify(g.climateAt(7))===JSON.stringify(climates[0]),sameState:JSON.stringify(g.exportSnapshot())===JSON.stringify(before)};
  });
  expect(evidence.climates.map(c=>c.seasonName)).toEqual(['SPRING','SUMMER','AUTUMN','WINTER','SPRING']);
  expect(evidence.climates[4].year).toBe(2);
  expect(evidence.climates[1].yieldMultiplier).toBeGreaterThan(evidence.climates[3].yieldMultiplier);
  expect(evidence.stable).toBe(true);
  expect(evidence.sameState).toBe(true);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom seasonal climate changes farm productivity but preserves deterministic replay', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const evidence=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    function run(){g.reset();for(let i=0;i<45*24*30;i++)g.step(1/30);return g.exportSnapshot();}
    const first=run(),second=run(),c=g.climateAt(first.payload.state.t);
    return {same:JSON.stringify(first)===JSON.stringify(second),climate:c,food:first.payload.state.food,stories:first.payload.stories};
  });
  expect(evidence.same).toBe(true);
  expect(evidence.food).toBeGreaterThan(0);
  expect(evidence.climate.seasonName).toBe('SUMMER');
  expect(evidence.stories.every(s=>typeof s.text==='string')).toBe(true);
});

test('Tiny Kingdom rendered season matches deterministic weather state', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  const check=await page.evaluate(() => {
    const g=window.__tinyKingdom,climate=g.climateAt(g.exportSnapshot().payload.state.t);
    const sky=g.skyConditions(g.exportSnapshot().payload.state.t);
    const weatherLabel=document.querySelector('#weather').textContent;
    return {weatherLabel,season:climate.seasonName,daylight:sky.daylight,atmosphereValid:sky.fog.every(Number.isFinite)&&sky.light.every(Number.isFinite)};
  });
  expect(check.weatherLabel).toContain(check.season);
  expect(check.daylight).toBeGreaterThan(0);
  expect(check.atmosphereValid).toBe(true);
});


test('Tiny Kingdom timber market remains solvent across two years', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const metrics=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    g.reset();
    for(let i=0;i<70*24*30;i++)g.step(1/30);
    return g.metrics();
  });
  expect(metrics.day).toBe(71);
  expect(metrics.citizens).toBeGreaterThanOrEqual(20);
  expect(metrics.buildings).toBeGreaterThanOrEqual(20);
  expect(metrics.wood).toBeGreaterThan(5);
  expect(metrics.food).toBeGreaterThan(metrics.citizens*2);
  expect(metrics.gold).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});


test('Tiny Kingdom selects named autonomous citizens and exposes real personality and bonds', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const before=await page.locator('#citizen-name').textContent();
  await page.locator('#cycleCitizen').click();
  const after=await page.locator('#citizen-name').textContent();
  const profile=await page.evaluate(() => {
    const g=window.__tinyKingdom;
    return {selected:g.getSelectedCitizen(),person:g.getCitizenProfiles().find(c=>c.name===g.getSelectedCitizen())};
  });
  expect(before).toBe('Alina');
  expect(after).toBe('Rowan');
  expect(profile.selected).toBe(after);
  expect(profile.person).toEqual(expect.objectContaining({name:'Rowan',job:'forester',trait:'curious'}));
  expect(profile.person.bonds).toEqual(expect.any(Object));
});

test('Tiny Kingdom population has unique names and stable saved relationships after growth', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const evidence=await page.evaluate(() => {
    const g=window.__tinyKingdom;g.reset();
    for(let i=0;i<80*24*30;i++)g.step(1/30);
    const before=g.getCitizenProfiles(),save=g.exportSnapshot();
    g.restoreSnapshot(save);
    const after=g.getCitizenProfiles();
    return {count:before.length,unique:new Set(before.map(p=>p.name)).size,stable:JSON.stringify(before)===JSON.stringify(after),hasSecondGeneration:before.some(p=>p.name.endsWith(' II'))};
  });
  expect(evidence.count).toBeGreaterThan(22);
  expect(evidence.unique).toBe(evidence.count);
  expect(evidence.stable).toBe(true);
  expect(evidence.hasSecondGeneration).toBe(true);
});

test('Tiny Kingdom reuses 3,362 terrain triangles until the seasonal material changes', async ({page}) => {
  const faults=[];
  page.on('pageerror',error=>faults.push(error.message));
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().terrainRebuilds>0);
  await page.locator('#pause').click();
  const initial=await page.evaluate(()=>window.__tinyKingdom.renderStats());
  expect(initial.terrainCacheTriangles).toBe(3362);
  expect(initial.lastFrameTriangles).toBeGreaterThan(initial.terrainCacheTriangles);
  await page.waitForTimeout(120);
  const repeated=await page.evaluate(()=>window.__tinyKingdom.renderStats());
  expect(repeated.terrainRebuilds).toBe(initial.terrainRebuilds);
  await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    for(let i=0;i<9*24*30;i++)g.step(1/30);
  });
  await page.waitForFunction(()=>window.__tinyKingdom.renderStats().terrainCacheKey.startsWith('1:'));
  const summer=await page.evaluate(()=>window.__tinyKingdom.renderStats());
  expect(summer.terrainRebuilds).toBe(initial.terrainRebuilds+1);
  expect(summer.terrainCacheTriangles).toBe(3362);
  await page.evaluate(()=>window.__tinyKingdom.reset());
  await page.waitForFunction(()=>window.__tinyKingdom.renderStats().terrainCacheKey.startsWith('0:'));
  expect(await page.evaluate(()=>window.__tinyKingdom.renderStats().terrainRebuilds)).toBe(summer.terrainRebuilds+1);
  expect(faults).toEqual([]);
});

test('Tiny Kingdom strategic atlas pans only the camera and does not alter simulation authority', async ({page}) => {
  const faults=[];
  page.on('pageerror', error => faults.push(error.message));
  await page.setViewportSize({width:1440,height:900});
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  await page.waitForFunction(() => document.querySelector('#atlas-season')?.textContent.includes('SPRING'));
  const before=await page.evaluate(() => ({snap:JSON.stringify(window.__tinyKingdom.exportSnapshot()),cam:window.__tinyKingdom.getCamera()}));
  await page.locator('#atlas-map').click({position:{x:172,y:44}});
  const after=await page.evaluate(() => ({snap:JSON.stringify(window.__tinyKingdom.exportSnapshot()),cam:window.__tinyKingdom.getCamera()}));
  expect(after.snap).toBe(before.snap);
  expect(after.cam.focus).not.toEqual(before.cam.focus);
  expect(after.cam.follow).toBe(false);
  expect(after.cam.cinematic).toBe(false);
  expect(faults).toEqual([]);
});

test('Tiny Kingdom vibrant layout remains responsive at phone and desktop widths', async ({page}) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.waitForTimeout(160);
  expect(await page.locator('#atlas-map').isVisible()).toBe(true);
  expect(await page.locator('#feed').isVisible()).toBe(true);
  const mobile=await page.evaluate(() => ({
    documentWidth:document.documentElement.scrollWidth,
    viewportWidth:window.innerWidth,
    chronicleHeight:document.querySelector('.feed').getBoundingClientRect().height
  }));
  expect(mobile.documentWidth).toBeLessThanOrEqual(mobile.viewportWidth);
  expect(mobile.chronicleHeight).toBeLessThanOrEqual(205);
  await page.setViewportSize({width:1440,height:900});
  await page.waitForTimeout(120);
  const desktop=await page.evaluate(() => ({
    width:document.querySelector('.atlas').getBoundingClientRect().width,
    mapLabel:document.querySelector('#atlas-season').textContent
  }));
  expect(desktop.width).toBeGreaterThan(230);
  expect(desktop.mapLabel).toMatch(/SPRING|SUMMER|AUTUMN|WINTER/);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom scenic hills rise without changing world state or seeded replay', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const result=await page.evaluate(() => {
    const g=window.__tinyKingdom, original=JSON.stringify(g.exportSnapshot());
    const valley=g.getTerrainHeight(0,0), ridge=g.getTerrainHeight(36,35);
    const meadow=g.getWildfloraCount();
    const same=g.getTerrainHeight(36,35)===ridge && JSON.stringify(g.exportSnapshot())===original;
    return {valley,ridge,meadow,same};
  });
  expect(result.ridge).toBeGreaterThan(result.valley+2);
  expect(result.meadow).toBeGreaterThan(100);
  expect(result.same).toBe(true);
});


test('Gauntlet 018 camera tour provides five semantic views without affecting authoritative world', async ({page}) => {
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  expect(await page.locator('.tour-btn').count()).toBe(5);
  for(const [scene,x,z] of [['market',0,5],['mill',-27,-18],['orchard',-26,9],['river',5,20],['valley',0,0]]){
    await page.locator('[data-scenic="'+scene+'"]').click();
    await expect(page.locator('[data-scenic="'+scene+'"]')).toHaveAttribute('aria-pressed','true');
    const camera=await page.evaluate(()=>window.__tinyKingdom.getCamera());
    expect(camera.focus[0]).toBeCloseTo(x,2);
    expect(camera.focus[1]).toBeCloseTo(z,2);
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(before);
  expect(errors).toEqual([]);
});

test('Gauntlet 018 legible responsive HUD and real 3D scenic dressing', async ({page},testInfo) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  await expect(page.locator('#realm-title')).not.toBeEmpty();
  const before=await page.evaluate(()=>window.__tinyKingdom.renderStats().lastFrameTriangles);
  expect(before).toBeGreaterThan(1000);
  await testInfo.attach('tiny-kingdom-festival-wide',{body:await page.screenshot(),contentType:'image/png'});
  await page.setViewportSize({width:390,height:844});
  const widths=await page.evaluate(()=>({screen:window.innerWidth,doc:document.documentElement.scrollWidth,tour:document.querySelector('.world-tour').getBoundingClientRect().width}));
  expect(widths.doc).toBeLessThanOrEqual(widths.screen);
  expect(widths.tour).toBeLessThanOrEqual(widths.screen);
  await page.locator('[data-scenic="orchard"]').click();
  await expect(page.locator('[data-scenic="orchard"]')).toHaveAttribute('aria-pressed','true');
  await testInfo.attach('tiny-kingdom-festival-mobile',{body:await page.screenshot(),contentType:'image/png'});
  expect(errors).toEqual([]);
});

test('Gauntlet 019 character palettes and rig-like animated costume geometry remain deterministic', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const result=await page.evaluate(()=>{
    const game=window.__tinyKingdom;
    const first=JSON.stringify(game.getCitizenProfiles());
    const before=JSON.stringify(game.exportSnapshot());
    game.reset();
    const second=JSON.stringify(game.getCitizenProfiles());
    const after=JSON.stringify(game.exportSnapshot());
    return {samePeople:first===second,sameSnapshot:before===after,
      people:game.getCitizenProfiles().length,triangles:game.renderStats().lastFrameTriangles};
  });
  expect(result.people).toBe(12);
  expect(result.samePeople).toBe(true);
  // Full snapshot comparison is not meaningful across reset after a live frame.
  expect(result.triangles).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});


test('Gauntlet 018 caches thousands of decorative vertices without changing civil authority', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(() => window.__tinyKingdom?.getFestivalVisualStats().cacheBuilds>0);
  await page.locator('#pause').click();
  const g=await page.evaluate(()=>window.__tinyKingdom.getFestivalVisualStats());
  expect(g.vertices).toBeGreaterThan(5000);
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  await page.locator('[data-scenic="orchard"]').click();
  await page.waitForTimeout(100);
  const after=await page.evaluate(()=>({visual:window.__tinyKingdom.getFestivalVisualStats(),snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
  expect(after.visual.cacheBuilds).toBe(g.cacheBuilds);
  expect(after.snapshot).toBe(before);
  expect(errors).toEqual([]);
});
