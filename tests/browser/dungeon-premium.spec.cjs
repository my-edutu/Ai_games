'use strict';
const fs=require('node:fs');
const path=require('node:path');
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4189',artifacts=path.resolve(__dirname,'../../artifacts/dungeon-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

test('dungeon browser source serves the active UX revision stylesheet',async({page})=>{
  const response=await page.request.get(`${base}/dungeon/ux-v2.css`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('--color-bg');
});

test('low-quality reduced-motion mode preserves autonomous progress, objective meaning and captions',async({page})=>{
  const failures=[];
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
  page.on('pageerror',error=>failures.push(error.message));
  await page.setViewportSize({width:1280,height:720});
  await page.goto(`${base}/dungeon?quality=low&reducedMotion=1&muted=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__DUNGEON_PUBLIC_STATE__?.tick>=0);
  await expect(page.locator('body')).toHaveAttribute('data-quality','low');
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');
  await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
  await expect(page.getByTestId('captions')).not.toBeEmpty();
  const first=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.tick);
  const objective=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.objective.label);
  expect(objective.length).toBeGreaterThan(0);
  await page.waitForTimeout(650);
  const second=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__.tick);
  expect(second).toBeGreaterThan(first);
  await page.screenshot({path:path.join(artifacts,'low-reduced-motion.png'),fullPage:true});
  expect(failures).toEqual([]);
});
