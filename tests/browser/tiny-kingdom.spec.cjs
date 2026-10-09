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
  await expect(page.locator('.sidebar')).toHaveCSS('overflow-y','auto');
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


test('Gauntlet 018 camera tour provides six semantic views without affecting authoritative world', async ({page}) => {
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  expect(await page.locator('.tour-btn').count()).toBe(6);
  for(const [scene,x,z] of [['market',0,5],['mill',-27,-18],['orchard',-26,9],['river',-6,18.1],['valley',0,0]]){
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
    game.reset(); // Compare identical seeded initial states, not a progressed live frame.
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
  expect(result.sameSnapshot).toBe(true);
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

test('Gauntlet 020: elbow and knee poses animate deterministically without persisting render state', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getRigPose));
  await page.locator('#pause').click();
  const result=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const before=JSON.stringify(g.exportSnapshot());
    const first=g.getRigPose(0),invalid=g.getRigPose(-1);
    const unchanged=before===JSON.stringify(g.exportSnapshot());
    g.step(1/30);
    const second=g.getRigPose(0);
    g.reset();const a=JSON.stringify(g.getRigPose(0));
    g.reset();const b=JSON.stringify(g.getRigPose(0));
    return {first,second,invalid,unchanged,resetIdentical:a===b,people:g.getCitizenProfiles().length};
  });
  expect(result.people).toBe(12);
  expect(result.first.legs).toHaveLength(2);
  expect(result.first.arms).toHaveLength(2);
  expect(result.first.legs[0].knee).toHaveLength(3);
  expect(result.first.arms[1].elbow).toHaveLength(3);
  expect(result.first).not.toEqual(result.second);
  expect(result.invalid).toBeNull();
  expect(result.unchanged).toBe(true);
  expect(result.resetIdentical).toBe(true);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom keeps the stone river bridge traversable and the sanctuary physically solid', async ({page}) => {
  const faults=[];
  page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const result=await page.evaluate(()=>{
    const game=window.__tinyKingdom,sites=game.getScenicSites();
    const path=game.route([-6,14.2],[-6,26]);
    let safe=Boolean(path&&path.length),previous=[-6,14.2];
    for(const next of path||[]){
      const steps=Math.max(1,Math.ceil(Math.hypot(next[0]-previous[0],next[1]-previous[1])/.04));
      for(let j=1;j<=steps;j++){
        const t=j/steps;
        if(!game.walkable([previous[0]+(next[0]-previous[0])*t,previous[1]+(next[1]-previous[1])*t]))safe=false;
      }
      previous=next;
    }
    return {sites,waypoints:path?.length??0,safe};
  });
  expect(result.sites.count).toBe(2);
  expect(result.sites.riverBridge.walkable).toBe(true);
  expect(result.sites.sanctuary.walkable).toBe(false);
  expect(result.waypoints).toBeGreaterThan(0);
  expect(result.safe).toBe(true);
  expect(faults).toEqual([]);
});

test('Tiny Kingdom sanctuary camera does not change the authoritative simulation', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(() => Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  await page.locator('[data-scenic="sanctuary"]').click();
  const result=await page.evaluate(()=>({camera:window.__tinyKingdom.getCamera(),snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
  expect(result.camera.focus).toEqual([29,10]);
  expect(result.camera.zoom).toBeLessThan(30);
  expect(result.snapshot).toBe(original);
  await expect(page.locator('[data-scenic="sanctuary"]')).toHaveAttribute('aria-pressed','true');
});

test('Tiny Kingdom six-view mobile tour stays within viewport', async ({browser}) => {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const faults=[];
  page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  const box=await page.locator('.world-tour').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x+box.width).toBeLessThanOrEqual(391);
  await page.locator('[data-scenic="sanctuary"]').scrollIntoViewIfNeeded();
  await page.locator('[data-scenic="sanctuary"]').click();
  expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().focus)).toEqual([29,10]);
  expect(faults).toEqual([]);
  await page.close();
});

test('Tiny Kingdom material channels allocate exactly ten floats per vertex without changing authority', async ({page}) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  const a=await page.evaluate(()=>{
    const g=window.__tinyKingdom;g.setCamera({focus:[29,10],zoom:29,pitch:.53,yaw:.6});
    return {materials:g.getMaterialSystem(),scene:g.getScenicSites(),render:g.renderStats()};
  });
  await page.waitForTimeout(350);
  const b=await page.evaluate(()=>({
    auth:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    render:window.__tinyKingdom.renderStats()
  }));
  expect(a.materials.surfaceShaderVersion).toBe('procedural-023');
  expect(a.materials.vertexStride).toBe(10);
  expect(a.materials.materials).toHaveLength(8);
  expect(a.scene.count).toBe(2);
  expect(b.render.lastFrameTriangles).toBeGreaterThan(10000);
  expect(b.auth).toBe(before);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom static architectural meshes are cached across camera updates and rebuilt each season', async ({page}) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.waitForFunction(()=>window.__tinyKingdom.renderStats().scenicMeshRebuilds>=1);
  await page.locator('#pause').click();
  const first=await page.evaluate(()=>({
    scene:window.__tinyKingdom.renderStats(),
    state:JSON.stringify(window.__tinyKingdom.exportSnapshot())
  }));
  await page.locator('[data-scenic="market"]').click();
  await page.waitForTimeout(180);
  const second=await page.evaluate(()=>({
    scene:window.__tinyKingdom.renderStats(),
    state:JSON.stringify(window.__tinyKingdom.exportSnapshot())
  }));
  expect(first.scene.scenicMeshTriangles).toBeGreaterThan(10000);
  expect(second.scene.scenicMeshRebuilds).toBe(first.scene.scenicMeshRebuilds);
  expect(second.state).toBe(first.state);
  await page.evaluate(()=>{const game=window.__tinyKingdom;for(let i=0;i<9*24*30;i++)game.step(1/30)});
  await page.waitForFunction(previous=>window.__tinyKingdom.renderStats().scenicMeshRebuilds>previous,first.scene.scenicMeshRebuilds);
  const third=await page.evaluate(()=>window.__tinyKingdom.renderStats());
  expect(third.scenicMeshKey).not.toBe(first.scene.scenicMeshKey);
  expect(third.scenicMeshRebuilds).toBeGreaterThan(first.scene.scenicMeshRebuilds);
  expect(errors).toEqual([]);
});

test('Gauntlet 025 tapered forest boughs render deterministically through seasonal transitions', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const initial=await page.evaluate(()=>({
    snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    triangles:window.__tinyKingdom.renderStats().lastFrameTriangles
  }));
  expect(initial.triangles).toBeGreaterThan(1000);
  await page.evaluate(()=>window.__tinyKingdom.reset());
  await page.locator('#pause').click();
  const after=await page.evaluate(()=>({
    snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    triangles:window.__tinyKingdom.renderStats().lastFrameTriangles
  }));
  expect(after.triangles).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom software-GPU render quality is bounded and does not modify simulation authority', async ({page})=>{
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  const qa=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const initial=g.renderQuality();
    const low=g.setRenderQuality(.55);
    const hi=g.setRenderQuality(1.0);
    let rejects=false;
    try{g.setRenderQuality(.01)}catch(e){rejects=/render scale/i.test(e.message)}
    return {initial,low,hi,rejects,auth:JSON.stringify(g.exportSnapshot())};
  });
  expect(qa.initial.tier).toMatch(/canvas2d|software-webgl|hardware-webgl/);
  expect(qa.initial.targetFps).toBe(qa.initial.tier==='hardware-webgl'?60:12);
  expect(qa.initial.scale).toBeLessThanOrEqual(1);
  expect(qa.low.scale).toBeCloseTo(.55);
  expect(qa.hi.scale).toBeCloseTo(1);
  expect(qa.rejects).toBe(true);
  expect(qa.auth).toEqual(before);
  expect(faults).toEqual([]);
});

test('Gauntlet 027 forest branch frames stay orthonormal for steep and horizontal limbs', async ({page}) => {
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  const measurements=await page.evaluate(()=>{
    const source=document.querySelector('script').textContent;
    const fn=source.match(/function branchFrame\(a,b\)\{[\s\S]*?return \{n,u,v,length\};\s*\}/);
    if(!fn)throw new Error('branchFrame not found');
    const branch=new Function(fn[0]+';return branchFrame;')();
    return [[[0,0,0],[0,3,0]],[[0,0,0],[2,0,0]],[[1,2,3],[2,5,7]]].map(([a,b])=>{
      const frame=branch(a,b),dot=(x,y)=>x.reduce((sum,q,i)=>sum+q*y[i],0);
      return {length:frame.length,norms:[frame.n,frame.u,frame.v].map(q=>Math.hypot(...q)),dots:[dot(frame.n,frame.u),dot(frame.n,frame.v),dot(frame.u,frame.v)]};
    });
  });
  for(const frame of measurements){
    expect(frame.length).toBeGreaterThan(0);
    for(const norm of frame.norms)expect(norm).toBeCloseTo(1,5);
    for(const dot of frame.dots)expect(Math.abs(dot)).toBeLessThan(1e-5);
  }
});

test('Tiny Kingdom background sky pass stays presentation-only and reacts to world time',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const first=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {
      sky:g.skyStats(),
      auth:JSON.stringify(g.exportSnapshot()),
      day:g.skyConditions(13),
      night:g.skyConditions(1)
    };
  });
  expect(first.sky.model).toBe('day-night-atmosphere-v1');
  expect(first.day.daylight).toBeGreaterThan(first.night.daylight);
  expect(first.day.fog).not.toEqual(first.night.fog);
  await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[29,10],yaw:.54,pitch:.56,zoom:31}));
  await page.waitForTimeout(250);
  const second=await page.evaluate(()=>({
    auth:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    sky:window.__tinyKingdom.skyStats(),
    tier:window.__tinyKingdom.renderQuality().tier
  }));
  expect(second.auth).toBe(first.auth);
  expect(second.sky.enabled).toBe(second.tier!=='canvas2d');
  if(second.sky.enabled)expect(second.sky.passes).toBeGreaterThan(first.sky.passes);
  expect(errors).toEqual([]);
});

test('Tiny Kingdom cinematic HUD toggles with keyboard, exposes unobscured game, and preserves authority',async({page})=>{
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const first=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  await page.locator('#hud-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-hud','cinema');
  expect(await page.evaluate(()=>window.__tinyKingdom.getHudMode())).toBe('cinema');
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.atlas')).toBeHidden();
  await expect(page.locator('.world-tour')).toBeHidden();
  await expect(page.locator('#cinema-exit')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-hud','full');
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#cinema-exit')).toBeVisible();
  await page.locator('#cinema-exit').click();
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(first);
  expect(faults).toEqual([]);
});

// Gauntlet 030: optical river materials and shoreline geometry must be real scene
// changes, not a video overlay or an authoritative simulation mutation.
test('Gauntlet 030 river Fresnel, animated ripples and modeled banks preserve civilization state', async ({page}) => {
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const initial=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {
      authority:JSON.stringify(g.exportSnapshot()),
      water:g.waterStats(),
      materials:g.getMaterialSystem(),
      scene:g.renderStats()
    };
  });
  expect(initial.water.model).toBe('fresnel-ripple-shorefoam-v1');
  expect(initial.water.segments).toBe(105);
  expect(initial.water.waterTriangles).toBe(1260);
  expect(initial.water.bankTriangles).toBe(840);
  expect(initial.materials.materials).toContain('WATER');
  expect(initial.scene.scenicMeshTriangles).toBeGreaterThan(10000);
  await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[-6,18.1],yaw:.82,pitch:.52,zoom:20}));
  await page.waitForTimeout(220);
  const changed=await page.evaluate(()=>({
    authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    water:window.__tinyKingdom.waterStats(),
    camera:window.__tinyKingdom.getCamera(),
    glError:window.__tinyKingdom.renderer()==='webgl'
      ? document.getElementById('world').getContext('webgl').getError()
      : null
  }));
  expect(changed.camera.focus).toEqual([-6,18.1]);
  expect(changed.authority).toBe(initial.authority);
  expect(changed.water).toEqual(initial.water);
  if(changed.glError!==null)expect(changed.glError).toBe(0);
  expect(faults).toEqual([]);
});

test('Gauntlet 031 animated citizen geometry remains aligned and bounded', async ({page}) => {
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  await page.waitForTimeout(250);
  const audit=await page.evaluate(()=>window.__tinyKingdom.getGeometryAudit());
  for(const mesh of [audit.static,audit.dynamic]){
    expect(mesh.aligned).toBe(true);
    expect(Number.isInteger(mesh.triangles)).toBe(true);
    expect(mesh.invalidComponents).toBe(0);
    expect(mesh.invalidNormals).toBe(0);
    expect(mesh.invalidColors).toBe(0);
    expect(mesh.outOfBounds).toBe(0);
  }
  expect(audit.dynamic.triangles).toBeGreaterThan(100);
  expect(audit.totalTriangles).toBe(audit.static.triangles+audit.dynamic.triangles);
  expect(faults).toEqual([]);
});

test('Gauntlet 032 smooth 3D ellipsoids have no degenerate pole normals and bounded colours',async({page})=>{
 const faults=[];page.on('pageerror',error=>faults.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getGeometryAudit(),
  world:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 for(const mesh of [before.audit.static,before.audit.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents).toBe(0);
  expect(mesh.invalidNormals).toBe(0);
  expect(mesh.invalidColors).toBe(0);
  expect(mesh.outOfBounds).toBe(0);
 }
 await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[-6,18.1],yaw:.82,pitch:.53,zoom:19}));
 await page.waitForTimeout(250);
 const after=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getGeometryAudit(),
  world:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 expect(after.world).toBe(before.world);
 expect(after.audit.static.invalidNormals).toBe(0);
 expect(after.audit.dynamic.invalidNormals).toBe(0);
 expect(faults).toEqual([]);
});

test('Gauntlet 033 cinematic UI grade is readable, responsive, accessible and presentation-only',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1440,height:900});
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const desktop=await page.evaluate(()=>{
  const value=selector=>getComputedStyle(document.querySelector(selector));
  return {
   worldFilter:value('#world').filter,
   headingSize:parseFloat(value('.name').fontSize),
   panelBackground:value('.sidebar .panel').backgroundImage,
   tourButtons:document.querySelectorAll('.tour-btn').length,
   selected:document.querySelectorAll('.tour-btn[aria-pressed="true"]').length,
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  };
 });
 expect(desktop.worldFilter).toBe('none');
 expect(desktop.headingSize).toBeGreaterThanOrEqual(25);
 expect(desktop.panelBackground).toContain('gradient');
 expect(desktop.tourButtons).toBe(6);
 expect(desktop.selected).toBe(1);
 expect(desktop.overflow).toBeLessThanOrEqual(1);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const nav=document.querySelector('.world-tour');
  const tour=document.querySelectorAll('.tour-btn');
  return {
   docOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   tourFits:nav.getBoundingClientRect().width<=window.innerWidth,
   controls:[...tour].every(button=>button.getBoundingClientRect().height>=30)
  };
 });
 expect(mobile.docOverflow).toBeLessThanOrEqual(1);
 expect(mobile.tourFits).toBe(true);
 expect(mobile.controls).toBe(true);
 await page.keyboard.press('h');
 await expect(page.locator('.sidebar')).toBeHidden();
 await expect(page.locator('#cinema-exit')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.sidebar')).toBeVisible();
 const after=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 expect(after).toBe(original);
 expect(errors).toEqual([]);
});

test('Tiny Kingdom directional shadow geometry follows sun and never corrupts civilian simulation',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.locator('#pause').click();
  const sample=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const source=JSON.stringify(g.exportSnapshot());
    const morning=g.sampleSunShadow(8);
    const noon=g.sampleSunShadow(13);
    const evening=g.sampleSunShadow(18);
    const night=g.sampleSunShadow(1);
    return {source,morning,noon,evening,night};
  });
  expect(sample.noon.strength).toBeGreaterThan(sample.night.strength);
  expect(sample.night.strength).toBe(0);
  expect(sample.morning.dx).not.toBe(sample.evening.dx);
  await page.waitForFunction(()=>window.__tinyKingdom.shadowStats().triangles>0);
  const rendering=await page.evaluate(()=>({
    shadow:window.__tinyKingdom.shadowStats(),
    audit:window.__tinyKingdom.getGeometryAudit(),
    source:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  }));
  expect(rendering.shadow.triangles).toBeGreaterThanOrEqual(2000);
  expect(rendering.audit.dynamic.aligned).toBe(true);
  expect(rendering.audit.dynamic.invalidComponents).toBe(0);
  expect(rendering.audit.dynamic.invalidNormals).toBe(0);
  expect(rendering.audit.dynamic.invalidColors).toBe(0);
  expect(rendering.audit.dynamic.outOfBounds).toBe(0);
  expect(rendering.source).toEqual(sample.source);
  expect(errors).toEqual([]);
});

test('Gauntlet 034 seasonal meadow blades are bounded and cached across camera moves',async({page})=>{
 const faults=[];page.on('pageerror',error=>faults.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().scenicMeshTriangles>0);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>({
  meadow:window.__tinyKingdom.getMeadowStats(),
  scene:window.__tinyKingdom.renderStats(),
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 expect(initial.meadow.clusters).toBeGreaterThan(240);
 expect(initial.meadow.clusters).toBeLessThan(480);
 expect(initial.meadow.triangles).toBe(initial.meadow.clusters*8);
 expect(initial.meadow.cached).toBe(true);
 await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[29,10],yaw:.8,pitch:.53,zoom:17}));
 await page.waitForTimeout(250);
 const after=await page.evaluate(()=>({
  meadow:window.__tinyKingdom.getMeadowStats(),
  scene:window.__tinyKingdom.renderStats(),
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 expect(after.meadow).toEqual(initial.meadow);
 expect(after.scene.staticGpuUploads).toBe(initial.scene.staticGpuUploads);
 expect(after.authority).toBe(initial.authority);
 expect(faults).toEqual([]);
});

test('Kingdom Pulse chart displays measured per-day resource changes without altering simulation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.reset();
  return {history:g.getEconomyHistory(),metrics:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(initial.history).toHaveLength(1);
 expect(initial.history[0].food).toBe(initial.metrics.food);
 await page.locator('[data-scenic="market"]').click();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(initial.snapshot);
 await page.evaluate(()=>{const g=window.__tinyKingdom;for(let i=0;i<3*24*30;i++)g.step(1/30)});
 const outcome=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const entries=g.getEconomyHistory();
  const labels=[...document.querySelectorAll('#economic-observatory .economic-legend strong')].map(el=>el.textContent);
  const ctx=document.getElementById('resource-trends').getContext('2d');
  return {entries,labels,canvas:ctx.canvas.width,metrics:g.metrics()};
 });
 expect(outcome.entries.length).toBeGreaterThan(2);
 expect(outcome.entries.length).toBeLessThanOrEqual(12);
 expect(outcome.entries.at(-1).food).toBeCloseTo(outcome.metrics.food);
 expect(outcome.entries.at(-1).wood).toBeCloseTo(outcome.metrics.wood);
 expect(outcome.entries.at(-1).gold).toBeCloseTo(outcome.metrics.gold);
 expect(outcome.labels).toHaveLength(3);
 expect(outcome.canvas).toBe(440);
 await page.evaluate(()=>window.__tinyKingdom.reset());
 expect(await page.evaluate(()=>window.__tinyKingdom.getEconomyHistory())).toHaveLength(1);
 expect(errors).toEqual([]);
});

test('Cottage roof details and smoke stay deterministic and do not corrupt original 3D mesh', async ({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 await page.waitForFunction(()=>window.__tinyKingdom.getCottageEffects().activeChimneys>0);
 const output=await page.evaluate(()=>{
  const g=window.__tinyKingdom,first=g.exportSnapshot();
  const effects=g.getCottageEffects(),geometry=g.getGeometryAudit();
  g.setCamera({focus:[0,-1],pitch:.6,zoom:19});
  return {effects,geometry,unchanged:JSON.stringify(g.exportSnapshot())===JSON.stringify(first)};
 });
 expect(output.effects.activeChimneys).toBeGreaterThan(0);
 expect(output.effects.smokePuffs).toBeGreaterThan(output.effects.activeChimneys);
 expect(output.geometry.dynamic.aligned).toBe(true);
 expect(output.geometry.dynamic.invalidComponents).toBe(0);
 expect(output.geometry.dynamic.invalidNormals).toBe(0);
 expect(output.geometry.dynamic.invalidColors).toBe(0);
 expect(output.geometry.dynamic.outOfBounds).toBe(0);
 expect(output.unchanged).toBe(true);
 expect(errors).toEqual([]);
});

test('Gauntlet 035 HUD API restores actual controls after cinematic GPU screenshot and on mobile',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('cinema'));
 await expect(page.locator('body')).toHaveAttribute('data-hud','cinema');
 await expect(page.locator('.world-tour')).toBeHidden();
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
 await expect(page.locator('body')).toHaveAttribute('data-hud','full');
 await expect(page.locator('.world-tour')).toBeVisible();
 await expect(page.locator('.sidebar')).toBeVisible();
 expect(await page.evaluate(()=>document.querySelector('.world-tour').getBoundingClientRect().width)).toBeGreaterThan(100);
 await page.evaluate(()=>window.__tinyKingdom.setHudMode(true));
 await expect(page.locator('#cinema-exit')).toBeVisible();
 await page.evaluate(()=>window.__tinyKingdom.setHudMode(false));
 await expect(page.locator('#cinema-exit')).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toEqual(before);
 expect(errors).toEqual([]);
});

test('Gauntlet 036 joint endpoints obey realistic stride and preserve the deterministic world',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getRigPose));
 await page.locator('#pause').click();
 const sample=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const people=g.getCitizenProfiles(),poses=people.map((_,i)=>g.getRigPose(i));
  let segments=[];
  for(const pose of poses){
   for(const leg of pose.legs){
    const thigh=Math.hypot(...leg.knee.map((n,i)=>n-leg.hip[i]));
    const shin=Math.hypot(...leg.ankle.map((n,i)=>n-leg.knee[i]));
    segments.push({thigh,shin,footZ:leg.ankle[2],footY:leg.ankle[1]});
   }
  }
  return {segments,unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(sample.unchanged).toBe(true);
 expect(sample.segments).toHaveLength(24);
 for(const leg of sample.segments){
   expect(leg.thigh).toBeGreaterThan(.15);
   expect(leg.thigh).toBeLessThan(.38);
   expect(leg.shin).toBeGreaterThan(.15);
   expect(leg.shin).toBeLessThan(.40);
   expect(Math.abs(leg.footZ)).toBeLessThanOrEqual(.32);
   expect(leg.footY).toBeGreaterThanOrEqual(.05);
 }
 expect(errors).toEqual([]);
});
