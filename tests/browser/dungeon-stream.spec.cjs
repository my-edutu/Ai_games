'use strict';const {test,expect}=require('@playwright/test');const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('actual 3D autonomous dungeon scene renders and advances',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
 await expect(page.getByTestId('floor')).not.toBeEmpty();
 await expect(page.getByTestId('intent')).not.toBeEmpty();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 const hasWebGL=await page.evaluate(()=>{const c=document.getElementById('world');return Boolean(c?.getContext('webgl2')||c?.getContext('webgl'))});expect(hasWebGL).toBe(true);
 const snapshot=await page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__);
 expect(snapshot.map.length).toBe(19);expect(snapshot.units.length).toBeGreaterThan(3);expect(snapshot.seed).toBeUndefined();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.triangles??0),{timeout:15000}).toBeGreaterThan(100);
 await page.screenshot({path:'artifacts/dungeon-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('Gauntlet page exposes live health and honest quality gates',async({page})=>{
 await page.goto('/dungeon/gauntlet');await expect(page.locator('h1')).toContainText('Dungeon Gauntlet');
 await expect.poll(()=>page.locator('#health').textContent(),{timeout:15000}).toBe('HEALTHY');
 await expect(page.locator('body')).toContainText('NOT AAA CERTIFIED');
});
test('mobile viewport retains usable 3D scene',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/dungeon');
 await expect(page.getByTestId('dungeon-canvas')).toBeVisible();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 const width=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);expect(width).toBe(true);
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.activeUnits??0),{timeout:15000}).toBeGreaterThan(0);
 await page.screenshot({path:'artifacts/dungeon-mobile.png',fullPage:true});
});

test('redesigned command centre exposes vivid UI, tactical radar and independent scene dressing',async({page,request})=>{
 const shader=await request.get('/dungeon/environment.js');expect(shader.ok()).toBe(true);
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-visual-revision="4"]')).toBeVisible();
 await expect(page.getByTestId('dungeon-minimap')).toBeVisible();
 await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#party-count')).toContainText('3');
 await expect(page.locator('#theme')).not.toBeEmpty();
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.decorInstances??0),{timeout:15000}).toBeGreaterThan(80);
 const colors=await page.locator('.gauntlet-link').evaluate(el=>({bg:getComputedStyle(el).backgroundImage,color:getComputedStyle(el).color}));
 expect(colors.bg).toContain('linear-gradient');
 expect(colors.color).not.toBe('rgb(0, 0, 0)');
 await page.locator('#audio-toggle').click();
 await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','true');
 await page.locator('#audio-toggle').click();
 await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
});
test('compact mobile viewport preserves full controls and semantic minimap',async({page})=>{
 await page.setViewportSize({width:360,height:740});await page.goto('/dungeon');
 await expect(page.getByTestId('dungeon-minimap')).toBeVisible();
 await expect.poll(async()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick??0),{timeout:15000}).toBeGreaterThan(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/dungeon-mobile-compact.png',fullPage:true});
});
