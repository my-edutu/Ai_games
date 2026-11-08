'use strict';
const {test,expect}=require('@playwright/test');

// Real unmodified autonomous authority, local Three.js and genuine canvas.
// This is visual evidence and a performance/resource gate, NOT an A/B win.
test('live dungeon uses bounded environmental look maps, readable light and no new render passes',async({page,request})=>{
 test.setTimeout(150000);
 const module=await request.get('/dungeon/environment-look-plan.js');
 expect(module.ok()).toBe(true);
 expect(module.headers()['content-type']).toContain('text/javascript');
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.environmentLook??null),{timeout:60000}).not.toBeNull();
 const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const look=diag.environmentLook;
 expect(diag.webgl).toBe(true);
 expect(diag.renderedState.floor).toBeGreaterThanOrEqual(1);
 expect(diag.drawCalls).toBeGreaterThan(0);
 expect(diag.triangles).toBeGreaterThan(0);
 expect(look.materialRoles).toEqual(['masonry','floorStone','carvedStone']);
 expect(look.preset).toMatch(/CRYPT|CATHEDRAL|VAULT|SANCTUM/);
 expect(look.detailTextureCount).toBeLessThanOrEqual(5);
 expect([0,5]).toContain(look.detailTextureCount);
 expect(look.detailTextureRawBytes).toBeLessThanOrEqual(look.detailTextureBudgetBytes);
 expect(look.additionalLights).toBe(0);
 expect(look.additionalShadowMaps).toBe(0);
 expect(look.fogDensity).toBeGreaterThan(.012);
 expect(look.fogDensity).toBeLessThan(.021);
 if(look.detailTextureCount===5){
  expect(look.normalMapsEnabled).toBe(true);
  expect(look.roughnessMapsEnabled).toBe(true);
 }else{
  expect(look.normalMapsEnabled).toBe(false);
  expect(look.roughnessMapsEnabled).toBe(false);
 }
 expect(diag.wallMasonry.mapped).toBe(true);
 expect(errors).toEqual([]);
 // One genuine live WebGL canvas, never a generated mockup or a second,
 // redundant full-page screenshot (software rasterizer may be very slow).
 await page.locator('#world').screenshot({path:'artifacts/dungeon-session6-environment-look-real-webgl.png',timeout:60000});
 await test.info().attach('environment-look-live-receipt',{
  body:Buffer.from(JSON.stringify({renderedState:diag.renderedState,look,drawCalls:diag.drawCalls,
   triangles:diag.triangles,composition:diag.composition,visibility:diag.visibility,
   wallMasonry:diag.wallMasonry},null,2)),contentType:'application/json'
 });
});
