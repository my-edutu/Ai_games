'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

/*
 * Experience workstream — continuous lived-in work, not a post-hoc work icon.
 * This source-bound regression demands a real multi-frame working phase,
 * resource consequences from the authoritative work() completion and a
 * small, independently bounded physical worksite visible in real WebGL.
 * It does NOT certify commercial art quality or an independent A/B win.
 */
test('G091 villagers visibly dwell at their actual jobs before authoritative delivery',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();

 const activity=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getActiveWorksites!=='function')return {failure:'missing active-worksite inspection API'};
  let before=null;
  for(let i=0;i<18000;i++){
   g.step(1/30);
   const active=g.getActiveWorksites();
   const found=active.find(w=>['farmer','forester','gatherer'].includes(w.job)&&w.progress>=.2&&w.progress<=.4);
   if(found){before=found;break}
  }
  if(!before)return {failure:'no continuous working phase observed during 600 simulated hours'};
  const initialCompleted=g.getWorkdayEvents().filter(e=>e.citizen===before.citizen).map(e=>e.id);
  const preCamera=JSON.stringify(g.exportSnapshot());
  g.setCamera({focus:[before.x,before.z],zoom:15,pitch:.56,yaw:.73});
  const postCamera=JSON.stringify(g.exportSnapshot());
  for(let i=0;i<14;i++)g.step(1/30);
  const after=g.getActiveWorksites().find(w=>w.citizen===before.citizen);
  const prematurelyCompleted=g.getWorkdayEvents().filter(e=>e.citizen===before.citizen&&!initialCompleted.includes(e.id));
  let completion=null;
  for(let i=0;i<360&&completion===null;i++){
   g.step(1/30);
   completion=g.getWorkdayEvents().find(e=>e.citizen===before.citizen&&!initialCompleted.includes(e.id))||null;
  }
  const stateAfter=g.exportSnapshot();
  return {before,after,prematurelyCompleted,completion,
   cameraAuthorityUnchanged:preCamera===postCamera,
   finalSnapshotChecksum:stateAfter.checksum,
   maxObservedActive:g.getActiveWorksites().length};
 });
 expect(activity.failure||'').toBe('');
 expect(activity.cameraAuthorityUnchanged).toBe(true);
 expect(activity.before.progress).toBeGreaterThan(.19);
 expect(activity.before.progress).toBeLessThan(.41);
 expect(activity.before.remaining).toBeGreaterThan(0);
 expect(activity.before.activity).not.toMatch(/Traveling to|Exploring/);
 expect(activity.after).toBeTruthy();
 expect(activity.after.progress).toBeGreaterThan(activity.before.progress);
 expect(activity.prematurelyCompleted).toEqual([]);
 expect(activity.completion).toBeTruthy();
 expect(activity.completion.citizen).toBe(activity.before.citizen);
 expect(activity.completion.job).toBe(activity.before.job);
 expect(Object.values(activity.completion.delta).every(Number.isFinite)).toBe(true);

 // A later scene frame must represent the active laborer with meaningful
 // 3D tools/working surfaces rather than only the old 1.5-hour delivery marker.
 const renderCheck=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  let active=null;
  for(let i=0;i<18000;i++){
   g.step(1/30);
   const match=g.getActiveWorksites().find(w=>['farmer','forester','gatherer'].includes(w.job)&&w.progress>.20&&w.progress<.55);
   if(match){active=match;break}
  }
  if(!active)return null;
  g.setCamera({focus:[active.x,active.z],zoom:15,pitch:.6,yaw:.7});
  return {active,authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(renderCheck).toBeTruthy();
 await page.waitForFunction(()=>window.__tinyKingdom.getWorkdayRenderStats().activeTriangles>0,
   null,{timeout:50000});
 const drawing=await page.evaluate(previous=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {render:g.getWorkdayRenderStats(),triangles:g.renderStats().lastFrameTriangles,
   glError:gl?.getError()||0,
   authorityUnchanged:previous.authority===JSON.stringify(g.exportSnapshot())};
 },renderCheck);
 expect(drawing.render.activeWorksites).toBeGreaterThan(0);
 expect(drawing.render.activeTriangles).toBeGreaterThan(0);
 expect(drawing.render.activeTriangles).toBeLessThan(1600);
 expect(drawing.triangles).toBeLessThan(160000);
 expect(drawing.glError).toBe(0);
 expect(drawing.authorityUnchanged).toBe(true);

 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>window.innerWidth,
  watch:document.getElementById('workday-watch').getAttribute('aria-label')
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.watch).toMatch(/villager|work/i);
 expect(errors).toEqual([]);
});