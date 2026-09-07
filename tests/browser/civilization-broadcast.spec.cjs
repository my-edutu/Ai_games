'use strict';
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4175';
async function open(page){await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});await expect(page.locator('#connection')).toHaveText('LIVE')}

test('1920x1080 broadcast frame is world-first, truthful and exposes inspectable real buildings',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await open(page);
  for(const id of['goal','danger','kingdom-map','ruler-card','resources','event-rail','captions','quality-select','volume-control','representation-note','tile-inspector'])await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-ux-revision','3');
  await expect(page.locator('#representation-note')).toContainText(/aggregate/i);
  const metrics=await page.evaluate(()=>({
    horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    worldWidth:document.querySelector('.world-panel').getBoundingClientRect().width,
    realmWidth:document.querySelector('.realm-panel').getBoundingClientRect().width,
    eventBottom:document.querySelector('#event-rail').getBoundingClientRect().bottom,
    captionBottom:document.querySelector('#captions').getBoundingClientRect().bottom,
    viewport:innerHeight,
    goalSize:parseFloat(getComputedStyle(document.querySelector('#goal')).fontSize),
    rulerSize:parseFloat(getComputedStyle(document.querySelector('#ruler-name')).fontSize),
    buildingCount:document.querySelectorAll('#kingdom-map .building-model').length,
    tileCount:document.querySelectorAll('#kingdom-map .tile').length
  }));
  expect(metrics.horizontal).toBeLessThanOrEqual(1);
  expect(metrics.worldWidth).toBeGreaterThan(metrics.realmWidth*1.55);
  expect(metrics.eventBottom).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.captionBottom).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.goalSize).toBeGreaterThanOrEqual(20);
  expect(metrics.rulerSize).toBeGreaterThanOrEqual(18);
  expect(metrics.buildingCount).toBeGreaterThan(0);
  expect(metrics.tileCount).toBeGreaterThan(0);
  await page.screenshot({path:'artifacts/civilization-phase3/desktop.png'});

  const building=page.locator('#kingdom-map .tile[data-building-type]:not([data-building-type="none"])').first();
  await expect(building).toBeVisible();
  const buildingLabel=await building.getAttribute('data-building-label');
  await building.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#tile-inspector')).toHaveAttribute('data-open','true');
  await expect(page.locator('#tile-inspector')).toContainText(buildingLabel);
  await expect(page.locator('#tile-inspector .inspector-preview .building-miniature')).toBeVisible();
  await page.screenshot({path:'artifacts/civilization-phase3/selected-building.png'});

  const economicTile=page.locator('#kingdom-map .tile:has(.cohort-activity)').first();
  await expect(economicTile).toBeVisible();await economicTile.click();
  await expect(page.locator('#tile-inspector')).toContainText(/aggregate/i);
  await page.screenshot({path:'artifacts/civilization-phase3/economic-activity.png'});

  await expect.poll(async()=>page.locator('#kingdom-map .building-model').count(),{timeout:15_000}).toBeGreaterThanOrEqual(4);
  await page.screenshot({path:'artifacts/civilization-phase3/demanding-aggregate-scene.png'});
});

test('presentation quality presets and volume are local presentation controls',async({page})=>{
  await page.setViewportSize({width:1280,height:800});await open(page);
  const quality=page.locator('#quality-select');
  await expect(quality.locator('option')).toHaveCount(4);
  const before=await page.locator('#kingdom-map .tile').count();
  for(const preset of['low','balanced','high','ultra']){
    await quality.selectOption(preset);
    await expect(page.locator('body')).toHaveAttribute('data-quality',preset);
    await expect(page.locator('#kingdom-map .tile')).toHaveCount(before);
  }
  const volume=page.locator('#volume-control');await volume.fill('0.3');await expect(volume).toHaveValue('0.3');
});

test('390x844 mobile source keeps the world before secondary scorecards without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  const metrics=await page.evaluate(()=>({
    horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    mapRight:document.querySelector('#kingdom-map').getBoundingClientRect().right,
    viewport:innerWidth,
    worldTop:document.querySelector('.world-panel').getBoundingClientRect().top,
    realmTop:document.querySelector('.realm-panel').getBoundingClientRect().top
  }));
  expect(metrics.horizontal).toBeLessThanOrEqual(1);
  expect(metrics.mapRight).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.worldTop).toBeLessThan(metrics.realmTop);
  for(const id of['audio-toggle','volume-control','motion-toggle','contrast-toggle','text-toggle','quality-select','goal','ruler-card','kingdom-map'])await expect(page.locator(`#${id}`)).toBeVisible();
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
