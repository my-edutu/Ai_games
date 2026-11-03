'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W05: a producer's actual completed harvest must visibly change a PATCH of
// cultivated land; no simulated labor, invented resources, or save mutations.
test('W05 genuine harvest creates bounded planted-row aftermath and cut sheaves',async({page})=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(!g.getHarvestAftermathAudit)return {fail:'audit missing'};
  let event=null;
  for(let i=0;i<24000;i++){
   g.step(1/30);
   event=g.getWorkdayEvents().find(e=>e.job==='farmer'&&e.delta.food>0&&
    g.getHarvestAftermathAudit().sites.some(s=>s.eventId===e.id));
   if(event)break;
  }
  if(!event)return {fail:'no real farmer harvest'};
  const before=JSON.stringify(g.exportSnapshot());
  g.setCamera({focus:[event.x,event.z],yaw:.74,pitch:.56,zoom:13});
  return {event,sites:g.getHarvestAftermathAudit().sites,
   unchanged:JSON.stringify(g.exportSnapshot())===before};
 });
 expect(result.fail||'').toBe('');
 expect(result.unchanged).toBe(true);
 expect(result.sites.length).toBeGreaterThan(0);
 expect(result.sites.length).toBeLessThanOrEqual(2);
 expect(result.sites.every(s=>s.foodEarned>0&&s.provenance==='completed-authoritative-farm-work')).toBe(true);
 await page.waitForFunction(()=>{
  const a=window.__tinyKingdom.getHarvestAftermathAudit();
  return a.lastRenderedSites>0&&a.lastRenderedRows>0&&a.lastRenderedSheaves>0;
 },null,{timeout:60000});
 const rendered=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {audit:g.getHarvestAftermathAudit(),
   source:JSON.stringify(g.exportSnapshot()),
   tris:g.renderStats().lastFrameTriangles,
   glError:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(rendered.audit.lastRenderedStubble).toBeGreaterThanOrEqual(20);
 expect(rendered.audit.lastRenderedRows).toBeGreaterThanOrEqual(3);
 expect(rendered.audit.lastRenderedSheaves).toBeGreaterThan(0);
 expect(rendered.audit.lastRenderedTriangles).toBeLessThan(1200);
 expect(rendered.tris).toBeLessThan(160000);
 expect(rendered.glError).toBe(0);
 await page.screenshot({path:test.info().outputPath('real-farmer-cut-field.png')});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 expect(errors).toEqual([]);
});
