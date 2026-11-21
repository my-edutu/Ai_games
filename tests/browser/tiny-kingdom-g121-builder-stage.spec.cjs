'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G121: an actual builder's tool, bench and rising frame must occupy one
// physically oriented workplace. A pretty camera cut or status label cannot
// substitute for a real actor spatially aligned with their work. Render-only.
test('G121 real joinery stage faces the working builder and remains replay-neutral',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  // This advances authentic seeded AI, not a scripted builder or fake job.
  for(let i=0;i<30000&&!g.getActiveWorksites().some(w=>w.job==='builder');i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const builder=g.getActiveWorksites().find(w=>w.job==='builder');
  const stages=g.getBuilderStageAudit();
  return {before,builder,stages,after:JSON.stringify(g.exportSnapshot()),
   citizenCount:g.metrics().citizens,buildingCount:g.metrics().buildings};
 });
 expect(proof.builder).toBeTruthy();
 expect(proof.stages.length).toBeGreaterThan(0);
 expect(proof.after).toBe(proof.before);
 const site=proof.stages.find(s=>s.citizen===proof.builder.citizen);
 expect(site).toBeTruthy();
 expect(site.job).toBe('builder');
 expect(site.source).toBe('actual-autonomous-shift');
 expect(site.facingAlignment).toBeGreaterThan(.97);
 expect(site.benchDistance).toBeGreaterThan(.42);
 expect(site.benchDistance).toBeLessThan(.88);
 expect(site.frameBehind).toBeGreaterThan(.80);
 expect(site.contactGap).toBeLessThan(.45);
 expect(site.benchHeight).toBeGreaterThan(.50);
 expect(site.benchHeight).toBeLessThan(.95);
 // Repeated queries and actual viewport interaction cannot grant resources.
 const observe=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.setHudMode('full');
  return {stages:g.getBuilderStageAudit(),authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(observe.authority).toBe(proof.before);
 expect(observe.stages).toEqual(proof.stages);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().lastFrameTriangles>0);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const gl=document.querySelector('#world').getContext('webgl');
  return {scrollWidth:document.documentElement.scrollWidth,glError:gl?.getError()??0,
   triangles:g.renderStats().lastFrameTriangles,authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(mobile.scrollWidth).toBeLessThanOrEqual(390);
 expect(mobile.glError).toBe(0);
 expect(mobile.triangles).toBeLessThan(160000);
 expect(mobile.authority).toBe(proof.before);
 expect(errors).toEqual([]);
});
