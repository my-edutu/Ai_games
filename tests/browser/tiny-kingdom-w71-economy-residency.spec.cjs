'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W71 rendering-spine contract. Keep all the original REAL market food,
// timber, treasury and granary on screen, even after changing the GPU
// presentation path. This is not a fictional stock or economy feature.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W71 authentic market+granary GPU residency preserves geometry at '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   return {snapshot:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    audit:g.getEconomyResidencyAudit(),market:g.getMarketStallStockAudit(),
    granary:g.getGranarySupplyAudit(),population:g.metrics().citizens};
  });
  expect(original.audit.source).toBe('real-inventory-geometry-residency');
  expect(original.audit.authoritativeStateChanged).toBe(false);
  expect(original.audit.maxBuffers).toBe(1);
  // Force the opt-in rendering path in software Chromium only for visual
  // regression coverage; ordinary software users keep the one-VBO path.
  const staged=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setEconomyResidencyForTesting(true);
   return {snapshot:JSON.stringify(g.exportSnapshot())};
  });
  expect(staged.snapshot).toBe(original.snapshot);
  await page.waitForFunction(()=>window.__tinyKingdom.getEconomyResidencyAudit().enabled &&
   window.__tinyKingdom.getEconomyResidencyAudit().drawCalls>0,null,{timeout:110000});
  const resident=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),tris:g.renderStats().lastFrameTriangles,
    audit:g.getEconomyResidencyAudit(),scene:g.getGeometryAudit(),
    market:g.getMarketStallStockAudit(),granary:g.getGranarySupplyAudit(),
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(resident.snapshot).toBe(original.snapshot);
  expect(resident.tris).toBe(original.triangles);
  expect(resident.audit.reusedUploads).toBeGreaterThanOrEqual(0);
  expect(resident.audit.gpuBufferFloats).toBe(resident.audit.cpuResidentFloats);
  expect(resident.audit.gpuBufferFloats%30).toBe(0);
  expect(resident.audit.capacityFloats).toBeGreaterThanOrEqual(resident.audit.gpuBufferFloats);
  expect(resident.audit.drawCalls).toBeGreaterThan(0);
  expect(resident.audit.buffers).toBe(1);
  expect(resident.market.lastRenderedSacks).toBe(original.market.lastRenderedSacks);
  expect(resident.market.lastRenderedLogs).toBe(original.market.lastRenderedLogs);
  expect(resident.market.lastRenderedCoffers).toBe(original.market.lastRenderedCoffers);
  expect(resident.granary.lastRenderedSacks).toBe(original.granary.lastRenderedSacks);
  expect(resident.scene.dynamic.invalidComponents).toBe(0);
  expect(resident.scene.static.invalidComponents).toBe(0);
  expect(resident.glError).toBe(0);
  expect(resident.overflow).toBeLessThanOrEqual(0);
  fs.mkdirSync('artifacts/tiny-kingdom-w71',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w71/'+viewport.width+'-resident-market.png'});
  const again=await page.evaluate(()=>{
   const g=window.__tinyKingdom,prior=g.getEconomyResidencyAudit();
   g.step(1/30);return {before:prior,snapshot:JSON.stringify(g.exportSnapshot())};
  });
  await page.waitForFunction(()=>window.__tinyKingdom.getEconomyResidencyAudit().reusedUploads>0,
   null,{timeout:110000});
  const afterStep=await page.evaluate(()=>({triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
    snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())}));
  const next=await page.evaluate(()=>window.__tinyKingdom.getEconomyResidencyAudit());
  expect(again.snapshot).not.toBe(original.snapshot);
  expect(next.buffers).toBeLessThanOrEqual(1);
  expect(next.cpuResidentFloats).toBeLessThanOrEqual(next.budgetFloats);
  // Return to single-stream fallback, still the exact same non-simulating world.
  await page.evaluate(()=>window.__tinyKingdom.setEconomyResidencyForTesting(false));
  await page.waitForFunction(()=>!window.__tinyKingdom.getEconomyResidencyAudit().enabled &&
    window.__tinyKingdom.getEconomyResidencyAudit().buffers===0,
    null,{timeout:110000});
  const fallback=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {tris:g.renderStats().lastFrameTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),market:g.getMarketStallStockAudit(),
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(fallback.glError).toBe(0);
  expect(fallback.snapshot).toBe(again.snapshot);
  expect(fallback.tris).toBe(afterStep.triangles);
  expect(pageErrors).toEqual([]);
  fs.writeFileSync('artifacts/tiny-kingdom-w71/'+viewport.width+'-resident-inventory.json',
   JSON.stringify({viewport,original,resident,after:next,fallback},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w71/'+viewport.width+'-fallback-market.png'});
 });
}
