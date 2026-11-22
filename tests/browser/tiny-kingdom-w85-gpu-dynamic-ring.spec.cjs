'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W85 test-first contract: multiple bounded GPU storage slots must preserve
// the entire authoritative scene; no actor/cargo/geometry may be hidden.
// A software WebGL PASS tests correctness only, NEVER physical GPU FPS.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W85 GPU dynamic mesh ring retains entire workday '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const snap=JSON.stringify(g.exportSnapshot());
   const initial=g.getDynamicGpuRingAudit();
   const plans=[
    g.planDynamicGpuRing(0,false,120000),
    g.planDynamicGpuRing(1,false,120000),
    g.planDynamicGpuRing(2,false,120000),
    g.planDynamicGpuRing(2,true,120000),
    g.planDynamicGpuRing(2,false,960001)
   ];
   return {initial,plans,unchanged:snap===JSON.stringify(g.exportSnapshot()),
    city:g.metrics(),triangles:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(audit.plans.map(x=>x.slot)).toEqual([1,2,0,2,0]);
  expect(audit.plans.map(x=>x.ringEligible)).toEqual([true,true,true,true,false]);
  expect(audit.initial.maxSlots).toBe(3);
  expect(audit.initial.activeSlot).toBeGreaterThanOrEqual(0);
  expect(audit.initial.activeSlot).toBeLessThan(3);
  expect(audit.initial.totalCapacityFloats).toBeLessThanOrEqual(
   audit.initial.maxSlots*audit.initial.maxNormalFloats+audit.initial.overflowFloats);
  expect(audit.initial.maxBuffers).toBe(3);
  expect(audit.unchanged).toBe(true);
  expect(audit.city.citizens).toBeGreaterThan(0);
  expect(audit.triangles).toBeGreaterThan(0);
  expect(audit.triangles).toBeLessThan(160000);
  expect(audit.geometry.static.invalidComponents).toBe(0);
  expect(audit.geometry.dynamic.invalidComponents).toBe(0);
  expect(audit.overflow).toBeLessThanOrEqual(0);
  expect(audit.gl).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w85',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w85/'+viewport.width+'-dynamic-ring.json',
   JSON.stringify({viewport,audit},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w85/'+viewport.width+'-dynamic-ring.png'});
 });
}
