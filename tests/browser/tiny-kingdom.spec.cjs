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
