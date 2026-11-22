'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W40 Living Valley: honest screen-space character detail, not a missing-person LOD.
// The entire original autonomous population must stay physically rendered. The
// camera should reserve costly facial/anatomical detail for humans actually
// large enough to read in the viewport while keeping the followed worker
// detailed during a real Day-120 shift at both desktop and portrait size.
// This is a render-safety and camera-composition contract, NOT a LOOK PASS.
test.use({video:'on'});
test('W40 real Day-120 workday spends character triangles on visible people without losing a citizen',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 // The morning immediately after accelerating 120 days can contain only
 // authentic commuters. Wait through bounded real fixed-step decisions until
 // a worker physically reaches a site. Never manufacture or teleport work.
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  for(let i=0;i<86400;i++)g.step(1/30);
  let extraTicks=0;
  while(g.getActiveWorksites().length===0&&extraTicks<2880){
   g.step(1/30);extraTicks++;
  }
  const sites=g.getActiveWorksites();
  const observed=sites.length?g.watchLiveWorkday():null;
  return {day:g.metrics().day,extraTicks,siteCount:sites.length,
   observed:observed?.active===true,citizen:observed?.citizen??null};
 });
 console.log('W40 genuine workday staging',JSON.stringify(staged));
 expect(staged.day).toBeGreaterThanOrEqual(120);
 expect(staged.siteCount,'Day-120 populated world must produce genuine on-site labor').toBeGreaterThan(0);
 expect(staged.observed,'Workday camera must select a genuine on-site worker').toBe(true);
 const before=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,before,{timeout:85000});
 const desktop=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const snapshot=JSON.stringify(g.exportSnapshot());
  return {projection:typeof g.getCitizenDetailProjectionAudit==='function'?
     g.getCitizenDetailProjectionAudit():null,
   lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
   population:g.metrics().citizens,buildings:g.metrics().buildings,
   active:g.getLiveWorkdayView(),camera:g.getCamera(),
   authorityUnchanged:snapshot===JSON.stringify(g.exportSnapshot()),
   snapshot,gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(desktop.projection,'actual camera-space character audit is required').toBeTruthy();
 expect(desktop.projection.source).toBe('real-viewport-actor-detail');
 expect(desktop.projection.population).toBe(desktop.population);
 expect(desktop.projection.anchorDetailed).toBe(true);
 expect(desktop.projection.fullDetailCount).toBeLessThanOrEqual(5);
 expect(desktop.projection.fullDetailCount+desktop.projection.compactCount).toBe(desktop.population);
 expect(desktop.projection.offscreenFullDetail).toBeLessThanOrEqual(1);
 expect(desktop.projection.visibleCandidates).toBeGreaterThan(0);
 expect(desktop.lod.detailedCitizens+desktop.lod.compactCitizens).toBe(desktop.population);
 expect(desktop.active.active).toBe(true);
 expect(desktop.buildings).toBeGreaterThanOrEqual(37);
 expect(desktop.geometry.totalTriangles).toBeLessThan(160000);
 expect(desktop.authorityUnchanged).toBe(true);
 expect(desktop.gl).toBe(0);
 fs.mkdirSync('artifacts/tiny-kingdom-w40',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w40/day120-workday-desktop.png'});

 await page.setViewportSize({width:390,height:844});
 const frame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,frame,{timeout:85000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const projection=g.getCitizenDetailProjectionAudit();
  return {projection,geom:g.getGeometryAudit(),camera:g.getCamera(),
    scrollWidth:document.documentElement.scrollWidth,
    snapshot:JSON.stringify(g.exportSnapshot()),
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.projection.source).toBe('real-viewport-actor-detail');
 expect(mobile.projection.anchorDetailed).toBe(true);
 expect(mobile.projection.fullDetailCount+mobile.projection.compactCount).toBe(desktop.population);
 expect(mobile.projection.offscreenFullDetail).toBeLessThanOrEqual(1);
 expect(mobile.projection.fullDetailCount).toBeLessThanOrEqual(5);
 expect(mobile.scrollWidth).toBeLessThanOrEqual(390);
 expect(mobile.snapshot).toBe(desktop.snapshot);
 expect(mobile.geom.totalTriangles).toBeLessThan(160000);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w40/day120-workday-390px.png'});
 console.log('W40 ACTUAL PROJECTION/CHARACTER-BUDGET AUDIT',JSON.stringify({
  desktop:{projection:desktop.projection,triangles:desktop.geometry.totalTriangles},
  mobile:{projection:mobile.projection,triangles:mobile.geom.totalTriangles},
  citizens:desktop.population,buildings:desktop.buildings}));
});
