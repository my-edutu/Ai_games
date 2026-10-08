'use strict';
const path=require('node:path');
const fs=require('node:fs');
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4174';
const artifacts=path.resolve(__dirname,'../../artifacts/maze-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('real 3D maze scene uses only public snapshots with a safe 2D fallback',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'/maze',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__MAZE_PUBLIC_STATE__));
  await page.waitForTimeout(1000);
  const value=await page.evaluate(()=>{
    const state=window.__MAZE_PUBLIC_STATE__;
    return {
      rendered3d:Boolean(window.__MAZE_3D_READY__),
      webglCanvas:document.querySelectorAll('#maze-3d canvas').length,
      fallbackCanvas:document.querySelector('#maze')?.getContext('2d')!==null,
      publicOnly:state&&state.seed===undefined&&state.runId===undefined&&state.world===undefined
    };
  });
  expect(value.fallbackCanvas).toBe(true);
  expect(value.publicOnly).toBe(true);
  if(value.rendered3d)expect(value.webglCanvas).toBe(1);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-first-round.png'),fullPage:true});
  expect(pageErrors).toEqual([]);
});

test('Gauntlet progress is live, honest about visual bar and linked to the game',async({page,request})=>{
  const manifest=await request.get(base+'/maze/gauntlet.json');
  expect(manifest.ok()).toBe(true);
  const review=await manifest.json();
  expect(review.rounds.length).toBeGreaterThan(0);
  expect(review.rounds.at(-1).visualBarMet).toBe(false);
  const vendor=await request.get(base+'/maze/vendor/three.module.js');
  expect(vendor.ok()).toBe(true);
  const core=await request.get(base+'/maze/vendor/three.core.js');
  expect(core.ok()).toBe(true);
  await page.goto(base+'/maze/progress',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#verdict')).toContainText('NOT YET PASSED');
  await expect(page.locator('#health')).toContainText('HEALTHY');
  const first=Number(await page.locator('#tick').textContent());
  await page.waitForTimeout(2400);
  const later=Number(await page.locator('#tick').textContent());
  expect(later).toBeGreaterThan(first);
  await expect(page.locator('#milestones li')).toHaveCount(review.milestones.length);
});
