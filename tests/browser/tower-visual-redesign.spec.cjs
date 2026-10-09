'use strict';
const fs=require('node:fs'),path=require('node:path'),{test,expect}=require('@playwright/test');
const {analyzePng,assertVisualMinimum}=require('../../scripts/tower-image-metrics.cjs');
const ROOT='http://127.0.0.1:4176/tower/volumetric';
const folder=path.resolve(__dirname,'../../artifacts/tower-gauntlet-ui');
test.use({launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test.beforeAll(()=>fs.mkdirSync(folder,{recursive:true}));
test('redesigned cinematic 3D HUD has legible hero floor and unobstructed central game scene',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1600,height:900});
 await page.goto(ROOT+'?seed=42&captureFloor=24',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live'&&window.__TOWER_VOLUMETRIC_RENDER_METRICS__?.frames>0,null,{timeout:30000});
 await expect(page.locator('body')).toHaveAttribute('data-biome','clockwork');
 await expect(page.locator('#biome')).toHaveText('CLOCKWORK');
 await expect(page.locator('#floor')).toHaveText(/24|25/);
 const measurements=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
   const floor=document.querySelector('#floor'),biome=document.querySelector('#biome');
   return {titleSize:parseFloat(getComputedStyle(floor).fontSize),
     biomeSize:parseFloat(getComputedStyle(biome).fontSize),
     accent:getComputedStyle(document.body).getPropertyValue('--accent').trim(),
     left:rect('.hero-panel'),right:rect('.right-rail'),scene:rect('#volumetric-canvas')};
 });
 expect(measurements.titleSize).toBeGreaterThan(48);
 expect(measurements.biomeSize).toBeGreaterThan(24);
 expect(measurements.accent).toBe('#ffe078');
 expect(measurements.left.x+measurements.left.width).toBeLessThan(measurements.right.x);
 expect(measurements.scene.width).toBeGreaterThan(1500);
 const png=await page.screenshot({path:path.join(folder,'cinematic-hud-desktop.png'),fullPage:true});
 const metrics=assertVisualMinimum(analyzePng(png));
 fs.writeFileSync(path.join(folder,'desktop-measurements.json'),JSON.stringify({measurements,metrics,errors},null,2));
 expect(errors).toEqual([]);
});
test('redesigned HUD works on a small touch viewport with accessible movement controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto(ROOT+'?manual=1&seed=42',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
 await expect(page.locator('body')).toHaveAttribute('data-manual','true');
 await expect(page.locator('[data-tower-control="jump"]')).toBeVisible();
 await expect(page.locator('#floor')).toBeVisible();
 await expect(page.locator('#biome')).toBeVisible();
 await expect(page.locator('#game-mode')).toContainText('RETURN TO AUTONOMY');
 const sizes=await page.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
   hero:document.querySelector('.hero-panel').getBoundingClientRect().toJSON(),
   right:document.querySelector('.right-rail').getBoundingClientRect().toJSON()}));
 expect(sizes.scroll).toBeLessThanOrEqual(sizes.w);
 expect(sizes.hero.right).toBeLessThan(sizes.right.left);
 const screenshot=await page.screenshot({path:path.join(folder,'cinematic-hud-mobile.png'),fullPage:true});
 assertVisualMinimum(analyzePng(screenshot,{region:[0,.03,1,.88],stride:2}));
 expect(errors).toEqual([]);
});
