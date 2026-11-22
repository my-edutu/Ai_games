'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G127: a genuine carpenter in the grown settlement must be staged for a
// visible hand-tool scene; being mathematically front-facing is not enough.
// These are source/geometry safety checks, NOT a claim of visual excellence.
test('G127 real joiner has a lateral construction frame and reachable open workbench',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<30000&&!g.getActiveWorksites().some(w=>w.job==='builder');i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  const site=g.getBuilderStageAudit().find(w=>w.job==='builder');
  const pose=g.getWorkContactAudit().find(w=>w.job==='builder');
  g.setStreetWalk(true);
  const encounter=g.visitStreetWorker();
  return {site,pose,encounter,unchanged:before===JSON.stringify(g.exportSnapshot()),
   triangles:g.renderStats().lastFrameTriangles};
 });
 expect(result.site).toBeTruthy();
 expect(result.pose).toBeTruthy();
 expect(result.unchanged).toBe(true);
 expect(result.site.frameBehind).toBeGreaterThan(.8);
 expect(result.site.frameSide).toBeLessThan(-.65);
 expect(result.site.benchSide).toBeGreaterThan(.1);
 expect(result.site.benchHeight).toBeGreaterThan(.50);
 expect(result.site.benchHeight).toBeLessThan(.7);
 expect(result.site.contactGap).toBeLessThan(.45);
 expect(result.pose.targetError).toBeLessThan(.04);
 expect(result.encounter.moved).toBe(true);
 expect(result.encounter.realCitizen).toBe(true);
 expect(result.triangles).toBeLessThan(160000);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=390)).toBe(true);
 expect(await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
