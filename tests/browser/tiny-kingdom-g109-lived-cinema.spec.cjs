'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G109: read the actual moving occupational performance at human scale.
// Camera/director actions are presentation-only and may never create a shift,
// complete production, alter receipts or change a deterministic save.
test('G109 close live-labour director follows genuine continuous work without inventing jobs',async({page})=>{
 test.setTimeout(190000);
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const opening=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  g.reset();
  let sites=[];
  for(let i=0;i<36000;i++){
   g.step(1/30);sites=g.getActiveWorksites();
   if(sites.length>=2)break;
  }
  const before=JSON.stringify(g.exportSnapshot());
  const opening=g.watchLiveWorkday();
  return {sites,opening,camera:g.getCamera(),
   shot:g.getCitizenCameraPlan(),
   director:g.getLiveWorkDirectorStats?.()||null,
   stateUnchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(opening.sites.length).toBeGreaterThanOrEqual(2);
 expect(opening.opening.active).toBe(true);
 expect(opening.stateUnchanged).toBe(true);
 expect(opening.camera.follow).toBe(true);
 expect(opening.camera.zoom).toBeGreaterThanOrEqual(4.5);
 expect(opening.camera.zoom).toBeLessThan(6.1);
 expect(opening.shot.bodyVisibleFraction).toBeGreaterThan(.4);
 expect(opening.director,'Real labor director telemetry').toBeTruthy();
 expect(opening.director.active).toBe(true);
 expect(opening.director.transitions).toBe(0);
 const handoff=await page.evaluate(()=>{
  const g=window.__tinyKingdom,original=g.getSelectedCitizen();
  let stage=null;
  for(let i=0;i<70000;i++){
   g.step(1/30);
   const current=g.getLiveWorkdayView(),work=g.getActiveWorksites();
   if(current.citizen===original&&!current.active&&
      work.some(p=>p.citizen!==original)){
    stage={original,available:work.map(p=>p.citizen)};
    break;
   }
  }
  if(!stage)return {failure:'no genuine handoff opportunity in deterministic workday'};
  const before=JSON.stringify(g.exportSnapshot());
  const switched=g.advanceLiveWorkdayDirector();
  const after=JSON.stringify(g.exportSnapshot());
  return {...stage,switched,readOnly:before===after,
   selected:g.getSelectedCitizen(),
   view:g.getLiveWorkdayView(),
   director:g.getLiveWorkDirectorStats()};
 });
 expect(handoff.failure||'').toBe('');
 expect(handoff.switched).toBe(true);
 expect(handoff.readOnly).toBe(true);
 expect(handoff.selected).not.toBe(handoff.original);
 expect(handoff.available).toContain(handoff.selected);
 expect(handoff.view.active).toBe(true);
 expect(handoff.director.transitions).toBe(1);
 const remaining=await page.evaluate(()=>({
  state:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  gl:document.getElementById('world').getContext('webgl')?.getError()??0
 }));
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
  view:window.__tinyKingdom.getLiveWorkdayView(),
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  status:document.getElementById('workday-activity').textContent,
  gl:document.getElementById('world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.snapshot).toBe(remaining.state);
 expect(mobile.view.citizen).toBe(handoff.selected);
 expect(mobile.gl).toBe(0);
 expect(remaining.gl).toBe(0);
 expect(pageErrors).toEqual([]);
});
