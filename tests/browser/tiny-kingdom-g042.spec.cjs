'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Gauntlet 042 world-first command HUD exposes the scene without hiding essential controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:900});
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#command-toggle').click();
 await expect(page.locator('body')).toHaveAttribute('data-command','world');
 await expect(page.locator('.sidebar')).toBeHidden();
 await expect(page.locator('.feed')).toBeHidden();
 await expect(page.locator('.atlas')).toBeHidden();
 await expect(page.locator('#world-ribbon')).toBeVisible();
 await expect(page.locator('#pause')).toBeVisible();
 const evidence=await page.evaluate(()=>{
  const bar=document.getElementById('world-ribbon').getBoundingClientRect();
  const world=document.getElementById('world').getBoundingClientRect();
  return {width:bar.width,viewport:innerWidth,worldWidth:world.width,
   food:document.getElementById('world-food').textContent,
   wood:document.getElementById('world-wood').textContent,
   gold:document.getElementById('world-gold').textContent,
   population:document.getElementById('world-population').textContent,
   command:window.__tinyKingdom.getCommandView()};
 });
 expect(evidence.command).toBe('world');
 expect(evidence.width).toBeLessThanOrEqual(evidence.viewport-16);
 expect(evidence.worldWidth).toBe(evidence.viewport);
 for(const key of ['food','wood','gold','population'])
  expect(Number(evidence[key])).toBeGreaterThan(0);
 await page.locator('#world-open-command').click();
 await expect(page.locator('body')).toHaveAttribute('data-command','command');
 await expect(page.locator('.sidebar')).toBeVisible();
 await expect(page.locator('.atlas')).toBeVisible();
 await expect(page.locator('.feed')).toBeVisible();
 await expect(page.locator('#world-ribbon')).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(before);
 expect(errors).toEqual([]);
});

test('Gauntlet 042 mobile world-first ribbon is bounded and keyboard/cinema states restore',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 await page.keyboard.press('u');
 await expect(page.locator('body')).toHaveAttribute('data-command','world');
 const dimensions=await page.evaluate(()=>({
  viewport:document.documentElement.clientWidth,
  document:document.documentElement.scrollWidth,
  ribbon:document.getElementById('world-ribbon').getBoundingClientRect().width,
  controls:document.getElementById('pause').getBoundingClientRect().width
 }));
 expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport+1);
 expect(dimensions.ribbon).toBeLessThanOrEqual(dimensions.viewport-12);
 expect(dimensions.controls).toBeGreaterThan(20);
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('cinema'));
 await expect(page.locator('#world-ribbon')).toBeHidden();
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
 await expect(page.locator('#world-ribbon')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('body')).toHaveAttribute('data-command','command');
 await expect(page.locator('.sidebar')).toBeVisible();
});
