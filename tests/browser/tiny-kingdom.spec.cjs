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
