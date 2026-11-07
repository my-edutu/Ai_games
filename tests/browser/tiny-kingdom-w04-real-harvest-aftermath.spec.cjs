'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W04: actual work creates visible harvested stubble and a bounded physical
// grain witness. This checks correctness only, not commercial visual quality.
test('W04 completed real farmer work produces replay-safe, bounded harvest aftermath',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getHarvestAftermathAudit!=='function')return {failure:'missing harvest-after-work audit'};
  let event=null;
  for(let i=0;i<24000;i++){
   g.step(1/30);
   event=g.getWorkdayEvents().find(e=>e.job==='farmer'&&e.delta.food>0&&
    g.getHarvestAftermathAudit().sites.some(s=>s.eventId===e.id));
   if(event)break;
  }
  if(!event)return {failure:'no authentic farmer harvest after 800 simulated hours'};
  const before=JSON.stringify(g.exportSnapshot());
  const audit=g.getHarvestAftermathAudit();
  const frameBudget=[g.getSimulationFrameDelta(.5),g.getSimulationFrameDelta(1.2),
    g.getSimulationFrameDelta(-.2)];
  g.setCamera({focus:[event.x,event.z],zoom:13,pitch:.56,yaw:.74});
  return {event,audit,frameBudget,unchanged:JSON.stringify(g.exportSnapshot())===before};
 });
 expect(result.failure||'').toBe('');
 expect(result.event.delta.food).toBeGreaterThan(0);
 expect(result.audit.source).toBe('real-positive-food-work-events');
 expect(result.audit.visualOnly).toBe(true);
 expect(result.audit.sites.length).toBeGreaterThan(0);
 expect(result.audit.sites.length).toBeLessThanOrEqual(2);
 expect(result.audit.sites.some(s=>s.eventId===result.event.id)).toBe(true);
 expect(result.audit.sites.every(s=>s.foodEarned>0&&s.strength>0&&s.strength<=1)).toBe(true);
 expect(result.unchanged).toBe(true);
 expect(result.frameBudget).toEqual([.5,.75,0]);
 await page.waitForFunction(()=>window.__tinyKingdom.getHarvestAftermathAudit().lastRenderedSites>0,
  null,{timeout:60000});
 const rendered=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  return {audit:g.getHarvestAftermathAudit(),triangles:g.renderStats().lastFrameTriangles,
   error:gl?.getError()||0};
 });
 expect(rendered.audit.lastRenderedTriangles).toBeGreaterThan(0);
 // W05 increases one authentic cut site from six isolated stems to five
 // physical rows and tied sheaves. Preserve a strict bounded geometry gate.
 expect(rendered.audit.lastRenderedTriangles).toBeLessThan(1200);
 expect(rendered.triangles).toBeLessThan(160000);
 expect(rendered.error).toBe(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 expect(errors).toEqual([]);
});
