'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G094 cross-system contract: observation must remain authentic at software
// graphics load, with a camera that actually clears walls, a compact 390px HUD,
// and no authoritative mutation. This is NOT a blind visual-quality verdict.
test('G094 inhabited working street is unobstructed, readable and truth-preserving',async({page})=>{
 test.setTimeout(170000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<20000&&g.getActiveWorksites().length<2;i++)g.step(1/30);
  return {count:g.getActiveWorksites().length,authority:JSON.stringify(g.exportSnapshot()),
   quality:g.renderQuality()};
 });
 expect(staged.count).toBeGreaterThanOrEqual(2);
 expect(staged.quality.materialNoise).toMatch(/bilinear-software|trilinear/);
 // This is a player-facing action. The shift is not a fake pose or status flag.
 await page.locator('#workday-live').click();
 const live=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const gl=document.querySelector('#world').getContext('webgl');
  return {authority:JSON.stringify(g.exportSnapshot()),
   shot:g.getCitizenCameraPlan(),view:g.getLiveWorkdayView(),
   camera:g.getCamera(),glError:gl?.getError()??0};
 });
 expect(live.authority).toBe(staged.authority);
 expect(live.view.active).toBe(true);
 expect(live.camera.follow).toBe(true);
 expect(live.shot.blockers).toBeLessThanOrEqual(live.shot.originalBlockers);
 expect(live.camera.zoom).toBeLessThan(8.2);
 expect(live.camera.pitch).toBeLessThan(.38);
 expect(live.glError).toBe(0);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();
   return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width}};
  return {tour:bounds('.world-tour'),ribbon:bounds('#world-ribbon'),
    header:bounds('.brand'),status:bounds('#workday-activity'),
    documentWidth:document.documentElement.scrollWidth,
    viewport:innerWidth,topHudHidden:getComputedStyle(document.querySelector('.top')).display==='none',realCitizen:g.getLiveWorkdayView().citizen,
    before:JSON.stringify(g.exportSnapshot()),
    glError:document.querySelector('#world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.documentWidth).toBeLessThanOrEqual(390);
 // The workday documentary deliberately hides the oversized masthead; its
 // navigation occupies the newly free top row instead of pushing into action.
 expect(mobile.topHudHidden).toBe(true);
 expect(mobile.tour.top).toBeGreaterThanOrEqual(8);
 expect(mobile.tour.top).toBeLessThanOrEqual(40);
 expect(mobile.tour.bottom).toBeLessThan(145);
 expect(mobile.ribbon.top).toBeGreaterThan(390);
 expect(mobile.ribbon.right).toBeLessThanOrEqual(393);
 expect(mobile.ribbon.left).toBeGreaterThanOrEqual(-3);
 expect(mobile.ribbon.bottom+8).toBeLessThan(mobile.status.top);
 expect(mobile.realCitizen).toBe(live.view.citizen);
 expect(mobile.glError).toBe(0);
 // The actual camera and HUD can be operated without awarding materials.
 const after=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  document.getElementById('world-open-command').click();
  return {command:g.getCommandView(),authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(after.authority).toBe(mobile.before);
 expect(after.command).toBe('command');
 expect(errors).toEqual([]);
});
