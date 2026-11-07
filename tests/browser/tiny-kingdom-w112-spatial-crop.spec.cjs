'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W112 original harvest plots stay visible near the actual farmer, with independent LOD and bounded 2-VBO GPU residency '+viewport.width,async({page})=>{
  test.setTimeout(180000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const origin=await page.evaluate(()=>{
   const game=window.__tinyKingdom;game.setSpeed(0);
   return {snapshot:JSON.stringify(game.exportSnapshot()),citizens:game.metrics().citizens,
    renderer:game.renderer(),audit:game.getFarmFieldResidencyAudit()};
  });
  expect(origin.citizens).toBeGreaterThan(0);
  expect(origin.audit.plantedStems).toBe(668);
  expect(origin.audit.authorityModified).toBe(false);
  expect(origin.audit.maxBuffers).toBe(2);
  if(origin.renderer==='webgl'){
   expect(origin.audit.active).toBe(true);
   expect(origin.audit.buffers).toBe(2);
   expect(origin.audit.originalPlotCount).toBe(2);
   expect(origin.audit.plottedStems).toBe(668);
   expect(origin.audit.nearTriangles).toBeGreaterThan(origin.audit.farTriangles);
   await page.evaluate(()=>window.__tinyKingdom.setCamera({
    focus:[20,1],pitch:.5,yaw:0,zoom:12}));
   await page.waitForFunction(()=>window.__tinyKingdom.getFarmFieldResidencyAudit()
    .drawnPlots.some(plot=>plot.plot===0&&plot.mode==='near'),null,{timeout:40000});
   const west=await page.evaluate(()=>window.__tinyKingdom.getFarmFieldResidencyAudit());
   expect(west.buffers).toBe(2);
   expect(west.visiblePlots).toBeGreaterThanOrEqual(1);
   fs.mkdirSync('artifacts/tiny-kingdom-w112',{recursive:true});
   await page.screenshot({path:path.join('artifacts/tiny-kingdom-w112',
    'real-west-farm-'+viewport.width+'.png')});
   await page.evaluate(()=>window.__tinyKingdom.setCamera({
    focus:[29,1],pitch:.5,yaw:0,zoom:12}));
   await page.waitForFunction(()=>window.__tinyKingdom.getFarmFieldResidencyAudit()
    .drawnPlots.some(plot=>plot.plot===1&&plot.mode==='near'),null,{timeout:40000});
   const east=await page.evaluate(()=>window.__tinyKingdom.getFarmFieldResidencyAudit());
   expect(east.plottedStems).toBe(668);
   expect(east.buffers).toBe(2);
   await page.screenshot({path:path.join('artifacts/tiny-kingdom-w112',
    'real-east-farm-'+viewport.width+'.png')});
   await page.evaluate(()=>window.__tinyKingdom.setCamera({
    focus:[0,0],pitch:.95,yaw:0,zoom:75}));
   await page.waitForFunction(()=>window.__tinyKingdom.getFarmFieldResidencyAudit()
    .mode==='far',null,{timeout:40000});
   const overview=await page.evaluate(()=>window.__tinyKingdom.getFarmFieldResidencyAudit());
   expect(overview.plottedStems).toBe(668);
   expect(overview.buffers).toBe(2);
   expect(overview.visiblePlots+overview.culledPlots).toBe(2);
  }
  const finish=await page.evaluate(()=>{
   const game=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
   return {snapshot:JSON.stringify(game.exportSnapshot()),citizens:game.metrics().citizens,
    glError:gl?.getError()??0,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(finish.snapshot).toBe(origin.snapshot);
  expect(finish.citizens).toBe(origin.citizens);
  expect(finish.glError).toBe(0);
  expect(finish.overflow).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
 });
}
