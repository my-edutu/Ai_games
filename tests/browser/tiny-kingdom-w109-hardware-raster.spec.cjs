'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W109 real hardware raster policy never fakes GPU evidence '+viewport.width,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const record=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const policy=g.getHardwareResolutionAudit();
   const quality=g.renderQuality();
   const gpu=g.getGpuFrameTimerAudit();
   const gl=document.getElementById('world').getContext('webgl');
   return {before,after:JSON.stringify(g.exportSnapshot()),
    policy,quality,gpu,people:g.metrics().citizens,
    glError:gl?.getError(),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(record.people).toBeGreaterThan(0);
  expect(record.policy.noGpuQueryMeansNoQualityGuess).toBe(true);
  expect(record.policy.authorityModified).toBe(false);
  expect(record.policy.pendingSamples).toBeLessThanOrEqual(24);
  expect(record.quality.scale).toBeGreaterThanOrEqual(.35);
  expect(record.quality.scale).toBeLessThanOrEqual(1.5);
  expect(record.before).toBe(record.after);
  expect(record.glError).toBe(0);
  expect(record.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
 });
}
