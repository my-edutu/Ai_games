'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/*
 * G093 integrated workday — distinguish real body acting and camera blocking
 * from tiny prop edits or progress-bar activity. This is NOT a visual-quality
 * certification: matched screenshots/video and fresh blind critics are separate.
 */
test('G093 worker poses express different real occupations without rewriting the world',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getOccupationalPerformance!=='function')
   return {failure:'missing production occupational performance API'};
  let actors=[];
  for(let tick=0;tick<18000;tick++){
   g.step(1/30);
   actors=g.getActiveWorksites();
   if(actors.some(w=>w.job==='farmer')&&actors.some(w=>w.job==='forester'))break;
  }
  if(!actors.some(w=>w.job==='farmer')||!actors.some(w=>w.job==='forester'))
   return {failure:'actual field and forestry workers never overlapped'};
  const roster=g.getState().people;
  const farmer=roster.findIndex(p=>actors.some(w=>w.citizen===p.name&&w.job==='farmer'));
  const forester=roster.findIndex(p=>actors.some(w=>w.citizen===p.name&&w.job==='forester'));
  const before=JSON.stringify(g.exportSnapshot());
  const farmA=g.getOccupationalPerformance(farmer);
  const woodA=g.getOccupationalPerformance(forester);
  const afterInspect=JSON.stringify(g.exportSnapshot());
  for(let i=0;i<12;i++)g.step(1/30);
  const farmB=g.getOccupationalPerformance(farmer);
  const woodB=g.getOccupationalPerformance(forester);
  return {farmA,woodA,farmB,woodB,readOnly:before===afterInspect,
   sitesA:actors,sitesB:g.getActiveWorksites(),
   remaining:g.getActiveWorksites().length};
 });
 expect(staged.failure||'').toBe('');
 expect(staged.readOnly).toBe(true);
 expect(staged.farmA.active).toBe(true);
 expect(staged.woodA.active).toBe(true);
 expect(staged.farmA.action).toBe('harvest');
 expect(staged.woodA.action).toBe('chop');
 expect(staged.farmA.lean).toBeGreaterThan(.2);
 expect(staged.woodA.lean).toBeLessThan(.3);
 expect(staged.farmA.crouch).toBeGreaterThan(staged.woodA.crouch);
 expect(staged.farmA.focus).toHaveLength(2);
 expect(staged.woodA.focus).toHaveLength(2);
 expect(staged.farmB.beat).not.toBe(staged.farmA.beat);
 expect(staged.woodB.beat).not.toBe(staged.woodA.beat);
 // Visible prop impacts must use the SAME real actor rhythm as the body,
 // not a separate decorative work-progress sine clock.
 for(const actor of [staged.farmA,staged.woodA]){
  const site=staged.sitesA.find(w=>w.citizen===actor.citizen);
  expect(site).toBeTruthy();
  expect(site.impact).toBeCloseTo(actor.beat,10);
 }
 expect(staged.sitesB.some(w=>w.impact>0&&w.impact<=1)).toBe(true);

 const entered=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const before=JSON.stringify(g.exportSnapshot());
  const view=g.watchLiveWorkday();
  return {view,camera:g.getCamera(),shot:g.getCitizenCameraPlan(),
    readOnly:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(entered.readOnly).toBe(true);
 expect(entered.view.active).toBe(true);
 expect(entered.camera.follow).toBe(true);
 expect(entered.camera.zoom).toBeGreaterThan(4.5);
 expect(entered.camera.zoom).toBeLessThan(8.2);
 expect(entered.camera.pitch).toBeGreaterThan(.12);
 expect(entered.camera.pitch).toBeLessThan(.38);
 expect(entered.shot.blockers).toBeGreaterThanOrEqual(0);
 await page.waitForFunction(()=>window.__tinyKingdom.getWorkdayRenderStats().activeTriangles>0,
  null,{timeout:55000});
 const painted=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {act:g.getWorkdayRenderStats(),geometry:g.getGeometryAudit(),
   glError:gl?.getError()??0};
 });
 expect(painted.act.activeWorksites).toBeGreaterThan(0);
 expect(painted.act.activeTriangles).toBeLessThan(1600);
 expect(painted.geometry.totalTriangles).toBeLessThan(160000);
 expect(painted.glError).toBe(0);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>innerWidth,
  liveName:document.getElementById('workday-live').getAttribute('aria-label'),
  status:document.getElementById('workday-activity').textContent
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.liveName).toMatch(/working|workday/i);
 expect(mobile.status).toContain(entered.view.citizen);
 expect(errors).toEqual([]);
});
