'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G068: a fixed inspection camera must not be silently overwritten by the
// live citizen-follow or cinematic orbit modes. This is a presentation-only
// contract for genuine, reproducible before/after screenshot comparisons.
test('G068 inspection camera locks its focus and orbit without changing the kingdom',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.metrics().citizens===12);
 await page.locator('#pause').click();
 const authority=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#focus').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.37,pitch:.74,zoom:25,focus:[7,-5]}));
 let camera=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 expect(camera).toMatchObject({yaw:.37,pitch:.74,zoom:25,focus:[7,-5],follow:false,cinematic:false});
 expect(await page.locator('#focus').getAttribute('aria-pressed')).toBe('false');
 expect(await page.locator('#focus').evaluate(el=>el.classList.contains('active'))).toBe(false);
 await page.locator('#camera').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().cinematic)).toBe(true);
 await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:-.18,pitch:.61,zoom:31,focus:[-9,6]}));
 camera=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 expect(camera).toMatchObject({yaw:-.18,pitch:.61,zoom:31,focus:[-9,6],follow:false,cinematic:false});
 expect(await page.locator('#camera').evaluate(el=>el.classList.contains('active'))).toBe(false);
 await page.waitForTimeout(400);
 const after=await page.evaluate(()=>({
   camera:window.__tinyKingdom.getCamera(),
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   mesh:window.__tinyKingdom.getGeometryAudit(),
   glError:document.querySelector('#world').getContext('webgl')?.getError()||0
 }));
 expect(after.camera).toMatchObject({yaw:-.18,pitch:.61,zoom:31,focus:[-9,6],follow:false,cinematic:false});
 expect(after.snapshot).toBe(authority);
 expect(after.mesh.totalTriangles).toBeLessThan(160000);
 expect(after.glError).toBe(0);
 expect(errors).toEqual([]);
});
