'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W111 same original 668-root crop field LOD remains authentic and playable '+viewport.width,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    audit:g.getFarmFieldResidencyAudit(),renderer:g.renderer(),
    citizens:g.metrics().citizens};
  });
  expect(first.citizens).toBeGreaterThan(0);
  expect(first.audit.plantedStems).toBe(668);
  expect(first.audit.authorityModified).toBe(false);
  expect(first.audit.maxBuffers).toBe(2);
  if(first.renderer==='webgl'){
   expect(first.audit.active).toBe(true);
   expect(first.audit.buffers).toBe(2);
   expect(first.audit.farTriangles).toBeLessThan(first.audit.nearTriangles);
   expect(first.audit.nearTriangles-first.audit.farTriangles).toBeGreaterThan(5000);
   expect(first.audit.buffers).toBeLessThanOrEqual(first.audit.maxBuffers);
   expect(first.audit.nearTriangles-first.audit.farTriangles).toBeGreaterThan(5000);
   await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[23,1],pitch:.52,yaw:0,zoom:13}));
   await page.waitForFunction(()=>window.__tinyKingdom.getFarmFieldResidencyAudit().mode==='near',
    null,{timeout:25000});
   await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[0,0],pitch:.95,yaw:0,zoom:75}));
   await page.waitForFunction(()=>window.__tinyKingdom.getFarmFieldResidencyAudit().mode==='far',
    null,{timeout:25000});
  }
  const last=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    audit:g.getFarmFieldResidencyAudit(),people:g.metrics().citizens,
    glError:gl?.getError()??0,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(last.snapshot).toBe(first.snapshot);
  expect(last.people).toBe(first.citizens);
  expect(last.overflow).toBeLessThanOrEqual(0);
  expect(last.glError).toBe(0);expect(errors).toEqual([]);
 });
}
