'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../../public/tiny-kingdom/index.html'), 'utf8');

// W75 browser RED contract: completed REAL work leaves temporary physical
// evidence. On a hardware WebGL path that genuine debris should live in one
// bounded renderer-owned GPU buffer while its real event is still visible.
// No fake jobs, production, citizens, changed RNG, missing props or save state.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W75 preserves actual short-lived production traces on '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const reached=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   for(let i=0;i<6000;i++){
    g.step(1/30);
    const t=g.getState().state.t;
    if(g.getWorkdayEvents().some(e=>t>=e.time&&t-e.time<=1.5))return true;
   }
   return false;
  });
  expect(reached).toBe(true);
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),visible:g.getWorkdayEvents()
    .filter(e=>g.getState().state.t>=e.time&&g.getState().state.t-e.time<=1.5).length};
  });
  expect(before.visible).toBeGreaterThan(0);
  await page.evaluate(()=>window.__tinyKingdom.setRecordedWorkResidencyForTesting(true));
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   const a=g.getRecordedWorkResidencyAudit();
   return a.active&&a.visibleEvents>0&&a.meshBuilds>=1;
  },null,{timeout:110000});
  const on=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getRecordedWorkResidencyAudit(),tris:g.getGeometryAudit().totalTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),render:g.renderStats(),
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(on.audit.source).toBe('true-completed-work-resident-mesh');
  expect(on.audit.maxBuffers).toBe(1);
  expect(on.audit.buffers).toBe(1);
  expect(on.audit.visibleEvents).toBe(before.visible);
  expect(on.audit.meshFloats).toBeGreaterThan(0);
  expect(on.audit.meshFloats).toBeLessThanOrEqual(on.audit.floatBudget);
  expect(on.audit.authorityModified).toBe(false);
  expect(on.glError).toBe(0);
  expect(on.snapshot).toBe(before.snapshot);
  fs.mkdirSync('artifacts/tiny-kingdom-w75',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w75/'+viewport.width+'-resident-work.png'});
  const previousFrames=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setRecordedWorkResidencyForTesting(false));
  await page.waitForFunction(previous=>{
   const g=window.__tinyKingdom;
   return g.getFrameProfile().totalFrames>previous &&
    !g.getRecordedWorkResidencyAudit().active;
  },previousFrames,{timeout:110000});
  const off=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {tris:g.getGeometryAudit().totalTriangles,
    snapshot:JSON.stringify(g.exportSnapshot()),render:g.renderStats(),
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(off.tris).toBe(on.tris);
  expect(off.snapshot).toBe(before.snapshot);
  expect(off.glError).toBe(0);
  expect(off.overflow).toBeLessThanOrEqual(0);
  expect(off.render.lastFrameTriangles).toBe(on.render.lastFrameTriangles);
  expect(off.render.lastFrameTriangles).toBeLessThan(160000);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w75',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w75/'+viewport.width+'-audit.json',
   JSON.stringify({viewport,source:'real-autonomous-production',resident:on.audit,
    triangles:on.tris,snapshotUnchanged:true},null,2));
 });
}
