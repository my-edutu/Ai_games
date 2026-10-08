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
