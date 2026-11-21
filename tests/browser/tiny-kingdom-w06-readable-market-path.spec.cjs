'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W06 RED: actual Day-120 filmed market visitor gave a "portraitSafe"
// result although 55.6% of the camera was obstructed by cottage facades.
// The experience must SHOW authentic stalls, not claim a success from one
// clear ray or move/remake citizens, commerce or architecture.
test('W06 market visitor chooses a genuinely readable Day-120 aisle on desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:90000});
 await page.locator('#pause').click();
 await page.evaluate(()=>window.__tinyKingdom.reset());
 for(let left=120*24*30+5*30;left>0;left-=7200){
  await page.evaluate(n=>{for(let j=0;j<n;j++)window.__tinyKingdom.step(1/30)},
    Math.min(left,7200));
 }
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#market-visit').click();
 const audit=await page.evaluate(()=>{
  const g=window.__tinyKingdom,visit=g.getMarketVisitAudit();
  return {visit,plan:g.getMarketVisitPlanningAudit(),
   after:JSON.stringify(g.exportSnapshot()),error:document.querySelector('#world')
    .getContext('webgl')?.getError()??-1};
 });
 expect(audit.visit.active&&audit.visit.safe).toBe(true);
 expect(audit.visit.architecture?.portraitSafe).toBe(true);
 expect(audit.visit.architecture?.interveningRoofs).toBe(0);
 expect(audit.visit.architecture?.totalForegroundCover).toBeLessThan(.38);
 expect(audit.visit.architecture?.posts.centralCover).toBeLessThan(.22);
 expect(audit.visit.composition?.grade).toBe('open-aisle');
 expect(audit.visit.stallDistance).toBeLessThan(10);
 expect(audit.plan.openAisleCandidates).toBeGreaterThan(0);
 expect(audit.after).toBe(before);
 expect(audit.error).toBe(0);
 await page.screenshot({path:test.info().outputPath('w06-market-day120-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(600);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom,visit=g.getMarketVisitAudit();
  return {visit,snapshot:JSON.stringify(g.exportSnapshot()),
   overflow:document.documentElement.scrollWidth>innerWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.visit.active).toBe(true);
 expect(mobile.visit.architecture.totalForegroundCover).toBeLessThan(.38);
 expect(mobile.visit.composition?.grade).toBe('open-aisle');
 expect(mobile.snapshot).toBe(before);
 expect(mobile.overflow).toBe(false);
 expect(mobile.gl).toBe(0);
 await page.screenshot({path:test.info().outputPath('w06-market-day120-mobile.png')});
 expect(errors).toEqual([]);
});
