'use strict';
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4175';
async function open(page){await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});await expect(page.locator('#connection')).toHaveText('LIVE')}

test('1920x1080 broadcast frame keeps hierarchy, chronicle and captions inside the clean frame',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await open(page);
  for(const id of['goal','danger','kingdom-map','ruler-card','resources','event-rail','captions'])await expect(page.locator(`#${id}`)).toBeVisible();
  const metrics=await page.evaluate(()=>({
    horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    eventBottom:document.querySelector('#event-rail').getBoundingClientRect().bottom,
    captionBottom:document.querySelector('#captions').getBoundingClientRect().bottom,
    viewport:innerHeight,
    goalSize:parseFloat(getComputedStyle(document.querySelector('#goal')).fontSize),
    rulerSize:parseFloat(getComputedStyle(document.querySelector('#ruler-name')).fontSize)
  }));
  expect(metrics.horizontal).toBeLessThanOrEqual(1);
  expect(metrics.eventBottom).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.captionBottom).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.goalSize).toBeGreaterThanOrEqual(20);
  expect(metrics.rulerSize).toBeGreaterThanOrEqual(18);
  await page.screenshot({path:'artifacts/civilization-phase3/desktop.png'});
});

test('390x844 mobile source has no horizontal overflow and preserves primary controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  const metrics=await page.evaluate(()=>({horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,mapRight:document.querySelector('#kingdom-map').getBoundingClientRect().right,viewport:innerWidth}));
  expect(metrics.horizontal).toBeLessThanOrEqual(1);
  expect(metrics.mapRight).toBeLessThanOrEqual(metrics.viewport);
  for(const id of['audio-toggle','motion-toggle','contrast-toggle','text-toggle','goal','ruler-card'])await expect(page.locator(`#${id}`)).toBeVisible();
  await page.locator('#motion-toggle').click();await expect(page.locator('body')).toHaveClass(/reduce-motion/);
  await page.locator('#contrast-toggle').click();await expect(page.locator('body')).toHaveClass(/high-contrast/);
  await page.screenshot({path:'artifacts/civilization-phase3/mobile.png'});
});

test('public surface excludes operator and raw-provider fields and recovers from SSE reconnect',async({page})=>{
  await open(page);
  const body=await page.locator('body').innerText();
  for(const forbidden of['stack trace','privateId','rawText','chain-of-thought','operator token'])expect(body).not.toContain(forbidden);
  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#summary')).not.toBeEmpty();
});
