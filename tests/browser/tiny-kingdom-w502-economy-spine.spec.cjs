'use strict';
// W502 Phase 1: market inventory is the SAME real grain credited by the
// farmer -> loaded courier -> market -> home chain, not an invented prop.
// Compare exact saved-world identity, stock/geometry and actual drawn frames
// between original CPU fallback and resident software WebGL at both lenses.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});

for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W502 original market and granary GPU scene, real CPU fallback '+viewport.width,
 async ({page},info)=>{
  test.setTimeout(300000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const g=()=>window.__tinyKingdom;
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   g.setCamera({focus:[29,-7.6],yaw:.64,pitch:.6,zoom:19});
   return {snapshot:g.exportSnapshot(),people:g.metrics().citizens};
  });
  const awaitFrame=async()=>{
   const before=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
   await page.waitForFunction(v=>window.__tinyKingdom.getFrameProfile().totalFrames>v,
    before,{timeout:125000});
  };
  await awaitFrame();
  const read=()=>page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    population:g.metrics().citizens,
    geometry:g.getGeometryAudit().totalTriangles,
    submitted:g.renderStats().lastFrameTriangles,
    stock:g.getMarketStallStockAudit(),
    granary:g.getGranarySupplyAudit(),
    resident:g.getEconomyResidencyAudit(),
    cpu:g.getEconomyCpuCacheAudit(),
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    mobileOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  const gpu=await read();
  expect(gpu.resident.enabled).toBe(true);
  expect(gpu.resident.softwareWebGL).toBe(true);
  expect(gpu.resident.softwareDefaultResident).toBe(true);
  expect(gpu.resident.active).toBe(true);
  expect(gpu.resident.buffers).toBe(1);
  expect(gpu.resident.gpuBufferFloats).toBeGreaterThan(0);
  expect(gpu.resident.gpuBufferFloats%30).toBe(0);
  expect(gpu.resident.gpuBufferFloats).toBeLessThanOrEqual(gpu.resident.budgetFloats);
  expect(gpu.cpu.enabled).toBe(false);
  expect(gpu.stock.staticInventedFood).toBe(0);
  expect(gpu.stock.staticInventedUnsimulatedGoods).toBe(0);
  expect(gpu.glError).toBe(0);
  expect(gpu.mobileOverflow).toBeLessThanOrEqual(0);
  await info.attach('w502-real-market-resident-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});

  await page.evaluate(()=>window.__tinyKingdom.setEconomyResidencyForTesting(false));
  await awaitFrame();
  const original=await read();
  expect(original.resident.enabled).toBe(false);
  expect(original.resident.buffers).toBe(0);
  expect(original.cpu.enabled).toBe(true);
  expect(original.snapshot).toBe(gpu.snapshot);
  expect(original.population).toBe(gpu.population);
  expect(original.geometry).toBe(gpu.geometry);
  expect(original.submitted).toBe(gpu.submitted);
  expect(original.stock.lastRenderedSacks).toBe(gpu.stock.lastRenderedSacks);
  expect(original.granary.lastRenderedSacks).toBe(gpu.granary.lastRenderedSacks);
  expect(original.glError).toBe(0);
  await info.attach('w502-real-market-original-cpu-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});

  const runAuthenticTicks=async mode=>{
   await page.evaluate(({snapshot,mode})=>{
    const g=window.__tinyKingdom;
    g.setSpeed(0);g.restoreSnapshot(snapshot);
    g.setEconomyResidencyForTesting(mode);
   },{snapshot:first.snapshot,mode});
   const moments=[];
   for(let i=0;i<6;i++){
    const before=await page.evaluate(()=>{
     const g=window.__tinyKingdom,b=g.getFrameProfile().totalFrames;
     g.step(1/30);return b;
    });
    await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
     before,{timeout:125000});
    const sample=await read();
    expect(sample.glError).toBe(0);
    expect(sample.submitted).toBeLessThan(160000);
    moments.push({checksum:JSON.parse(sample.snapshot).checksum,
     stock:sample.stock.lastRenderedSacks,
     granary:sample.granary.lastRenderedSacks,
     submitted:sample.submitted,
     drawCalls:sample.resident.drawCalls,
     residentFloats:sample.resident.gpuBufferFloats});
   }
   return {snapshot:(await read()).snapshot,moments};
  };
  const cpuMotion=await runAuthenticTicks(false);
  const residentMotion=await runAuthenticTicks(null);
  expect(residentMotion.snapshot).toBe(cpuMotion.snapshot);
  expect(residentMotion.moments.map(m=>m.checksum)).toEqual(
   cpuMotion.moments.map(m=>m.checksum));
  expect(residentMotion.moments.map(m=>m.submitted)).toEqual(
   cpuMotion.moments.map(m=>m.submitted));
  expect(residentMotion.moments.map(m=>m.stock)).toEqual(
   cpuMotion.moments.map(m=>m.stock));
  expect(residentMotion.moments.map(m=>m.granary)).toEqual(
   cpuMotion.moments.map(m=>m.granary));
  const ending=await read();
  expect(ending.resident.enabled).toBe(true);
  expect(ending.resident.reusedUploads).toBeGreaterThan(0);
  expect(ending.resident.avoidedDynamicFloats).toBeGreaterThan(0);
  expect(ending.resident.allocationFallbacks).toBe(0);
  expect(ending.glError).toBe(0);
  expect(pageErrors).toEqual([]);
  await info.attach('w502-real-market-progress-'+viewport.width,
   {body:Buffer.from(JSON.stringify({viewport,gpu,original,
     cpuMotion,residentMotion,ending},null,2)),contentType:'application/json'});
  await info.attach('w502-real-market-final-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
