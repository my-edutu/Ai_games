'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G083: reference screenshots must contain only the world pixels. Ordinary
// cinematic play still needs a visible, keyboard-accessible restore control.
// No authoritative simulation, camera position or GPU mesh may be changed.
test('G083 camera-matched reference capture hides ONLY the cinematic exit overlay, with H/Escape recovery',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>({
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  geometry:window.__tinyKingdom.getGeometryAudit(),
  camera:window.__tinyKingdom.getCamera()
 }));
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('cinema'));
 await expect(page.locator('#cinema-exit')).toBeVisible();
 await page.evaluate(()=>window.__tinyKingdom.setReferenceCapture(true));
 await expect(page.locator('#cinema-exit')).toBeHidden();
 await expect(page.locator('.sidebar')).toBeHidden();
 expect(await page.evaluate(()=>document.body.dataset.referenceCapture)).toBe('on');
 await page.keyboard.press('h');
 expect(await page.evaluate(()=>window.__tinyKingdom.getHudMode())).toBe('full');
 expect(await page.evaluate(()=>document.body.dataset.referenceCapture)).toBe('off');
 await page.evaluate(()=>window.__tinyKingdom.setHudMode('cinema'));
 await expect(page.locator('#cinema-exit')).toBeVisible();
 await page.evaluate(()=>window.__tinyKingdom.setReferenceCapture(true));
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>window.__tinyKingdom.getHudMode())).toBe('full');
 expect(await page.evaluate(()=>document.body.dataset.referenceCapture)).toBe('off');
 const final=await page.evaluate(()=>({
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  geometry:window.__tinyKingdom.getGeometryAudit(),
  camera:window.__tinyKingdom.getCamera(),
  glError:document.getElementById('world').getContext('webgl')?.getError()||0
 }));
 expect(final.authority).toBe(initial.authority);
 expect(final.camera).toEqual(initial.camera);
 expect(final.geometry.totalTriangles).toBe(initial.geometry.totalTriangles);
 expect(final.geometry.totalTriangles).toBeLessThan(160000);
 expect(final.glError).toBe(0);
 expect(errors).toEqual([]);
});
