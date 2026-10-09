'use strict';
// Actual Chrome gameplay captures. No composited mockups or synthetic images.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const ROOT='http://127.0.0.1:4177';
const DIR='artifacts/eko-gauntlet';
test.use({
  viewport:{width:1280,height:720},
  video:'on',
  trace:'retain-on-failure'
});
test('capture original 3D Lagos run, authored obstacle and mobile screenshot references',async({page},testInfo)=>{
  fs.mkdirSync(DIR,{recursive:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const reset=await page.request.post(ROOT+'/eko/control',{data:{resetPreview:true,mode:'player',outfit:'lagos-streetwear'}});
  expect(reset.ok()).toBeTruthy();
  await page.goto(ROOT+'/eko/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#connection')).toContainText('CONNECTED',{timeout:25000});
  await expect(page.locator('#state')).toHaveText('RUN LIVE');
  // Let any prior semantic-event toast settle so the screenshot is an honest
  // neutral idle frame, not an artificially styled screenshot.
  await expect.poll(async()=>Number(await page.locator('#event').evaluate(node=>getComputedStyle(node).opacity)),
    {timeout:9000,intervals:[250,400,600]}).toBeLessThan(.09);
  await page.screenshot({path:path.join(DIR,'gauntlet-opening-street.png'),fullPage:true});
  // Actual controller traffic can arrive late under Chromium software rendering,
  // resulting in unintended collision screenshots. Use the real 60Hz AI authority
  // for a reproducible no-cheat approaching-obstacle game frame.
  await page.locator('#mode').click();
  await expect(page.locator('#mode')).toContainText('SWITCH TO PLAYER');
  await expect.poll(async()=>{
    const data=await(await page.request.get(ROOT+'/eko/state')).json();
    return data.snapshot.player.position.x;
  },{timeout:15000,intervals:[150,200,300,450]}).toBeGreaterThanOrEqual(7);
  await expect(page.locator('#state')).toHaveText('RUN LIVE');
  await page.screenshot({path:path.join(DIR,'gauntlet-approaching-hazard.png'),fullPage:true});
  await page.locator('#outfit').selectOption('yoruba-agbada-fila');
  await expect.poll(async()=>page.evaluate(()=>window.__EKO_VISUAL_AUDIT__()?.character.outfit))
    .toBe('yoruba-agbada-fila');
  await page.screenshot({path:path.join(DIR,'gauntlet-tayo-outfit.png'),fullPage:true});
  const audit=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__?.());
  expect(audit.character.inFrame).toBe(true);
  expect(audit.character.safeHorizontalPadding).toBe(true);
  fs.writeFileSync(path.join(DIR,'gauntlet-visual-metrics.json'),JSON.stringify(audit,null,2));
  await page.locator('#camera').click();
  await expect(page.locator('#camera')).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(3400);
  await page.screenshot({path:path.join(DIR,'gauntlet-three-quarter-desktop.png'),fullPage:true});
  const cinematic=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__?.());
  expect(cinematic.camera.style).toBe('street-cinema');
  fs.writeFileSync(path.join(DIR,'gauntlet-three-quarter-desktop-metrics.json'),JSON.stringify(cinematic,null,2));
  expect(errors).toEqual([]);
});
test('capture real portrait visual reference without overlaid active AI controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.request.post(ROOT+'/eko/control',{data:{resetPreview:true,mode:'ai',outfit:'lagos-streetwear'}});
  await page.goto(ROOT+'/eko/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#connection')).toContainText('CONNECTED',{timeout:25000});
  await expect(page.locator('[data-control="Space"]')).toBeHidden();
  await expect.poll(async()=>page.evaluate(()=>window.__EKO_VISUAL_AUDIT__?.()?.character.inFrame),{timeout:17000}).toBe(true);
  await page.screenshot({path:path.join(DIR,'gauntlet-mobile-portrait.png'),fullPage:true});
  const audit=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__?.());
  expect(audit.character.inFrame).toBe(true);
  fs.writeFileSync(path.join(DIR,'gauntlet-mobile-visual-metrics.json'),JSON.stringify(audit,null,2));
  await page.evaluate(()=>window.__EKO_SET_FOCUS_VIEW__(true));
  await expect(page.locator('#hud-settings-toggle')).toBeHidden();
  await expect(page.locator('#focus-view-exit')).toBeVisible();
  await page.screenshot({path:path.join(DIR,'gauntlet-mobile-immersive.png'),fullPage:true});
  await page.evaluate(()=>window.__EKO_SET_FOCUS_VIEW__(false));

  await page.evaluate(()=>window.__EKO_SET_CAMERA_STYLE__('street-cinema'));
  await page.waitForTimeout(2900);
  await page.screenshot({path:path.join(DIR,'gauntlet-three-quarter-portrait.png'),fullPage:true});
  const cinematic=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__?.());
  expect(cinematic.camera.style).toBe('street-cinema');
  fs.writeFileSync(path.join(DIR,'gauntlet-three-quarter-portrait-metrics.json'),JSON.stringify(cinematic,null,2));
});
