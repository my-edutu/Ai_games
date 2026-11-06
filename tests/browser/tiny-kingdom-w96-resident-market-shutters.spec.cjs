'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W96 authentic clock-driven shutters are never decorative fake inventory:
// same citizen positions, real market stock, economy snapshot, geometry and
// original four market stalls in a 1024px and 390px playable WebGL frame.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W96 original market shutters true-clock CPU/GPU parity '+viewport.width,
 async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   g.setCamera({focus:[-.5,5],zoom:17,yaw:.37,pitch:.50});
   g.setMarketShutterResidencyForTesting(false);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(prev=>
   window.__tinyKingdom.getFrameProfile().totalFrames>prev,
   before,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;return {
    snapshot:JSON.stringify(g.exportSnapshot()),geometric:g.getGeometryAudit(),
    presented:g.renderStats().lastFrameTriangles,
    operating:g.getMarketOperatingAudit(),shader:g.getMarketShutterResidencyAudit()
   };
  });
  expect(original.shader.active).toBe(false);
  expect(original.operating.stalls).toBe(4);
  expect(original.operating.doorLeaves).toBe(8);
  const previous=await page.evaluate(()=>{
   const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
   g.setMarketShutterResidencyForTesting(true);return n;
  });
  await page.waitForFunction(prev=>{
   const g=window.__tinyKingdom,a=g.getMarketShutterResidencyAudit();
   return g.getFrameProfile().totalFrames>prev&&a.active&&a.triangles>0;
  },previous,{timeout:110000});
  const updated=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    geometric:g.getGeometryAudit(),presented:g.renderStats().lastFrameTriangles,
    operating:g.getMarketOperatingAudit(),shader:g.getMarketShutterResidencyAudit(),
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  expect(updated.shader.requested).toBe(true);
  expect(updated.shader.buffers).toBe(1);
  expect(updated.shader.maxBuffers).toBe(1);
  expect(updated.shader.meshFloats).toBeGreaterThan(0);
  expect(updated.shader.meshFloats).toBeLessThanOrEqual(updated.shader.floatBudget);
  expect(updated.shader.builds).toBe(1);
  expect(updated.shader.authorityModified).toBe(false);
  expect(updated.shader.opening).toBe(updated.operating.openFraction);
  expect(updated.operating).toEqual(original.operating);
  expect(updated.snapshot).toBe(original.snapshot);
  expect(updated.geometric).toEqual(original.geometric);
  expect(updated.presented).toBe(original.presented);
  expect(updated.glError).toBe(0);
  expect(updated.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await testInfo.attach('W96-original-clock-driven-trading-square-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
