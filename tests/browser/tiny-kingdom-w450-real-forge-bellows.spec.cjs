'use strict';
// W450: true autonomous smith, same exact source/snapshot, actual WebGL frames.
// No synthetic worker, forge phase, impact, resource, or transaction.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W450 same authentic smith workstation in resident vs original WebGL paths at 1024 and 390',async({page},info)=>{
 test.setTimeout(480000);
 const pageErrors=[];
 page.on('pageerror',err=>pageErrors.push(err.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:160000});
 await page.locator('#pause').click();
 // Move only the original deterministic simulator; witness a genuine smith
 // work shift. Do not create a substitute actor or alter profession state.
 const actual=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  let steps=0;
  while(!g.getForgeCraftCycleAudit().workers.length&&steps<36000){
   g.step(1/30);steps++;
  }
  return {steps,cycle:g.getForgeCraftCycleAudit(),source:g.metrics(),
   snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(actual.cycle.workers.length).toBeGreaterThan(0);
 const smith=actual.cycle.workers[0];
 const camera={focus:smith.position.slice(),yaw:.70,pitch:.33,zoom:15};
 async function measure(viewport,enabled){
  await page.setViewportSize(viewport);
  const prior=await page.evaluate(({enabled,camera})=>{
   const g=window.__tinyKingdom;
   g.setCamera(camera);
   g.setForgeBellowsResidencyForTesting(enabled);
   return g.getFrameProfile().totalFrames;
  },{enabled,camera});
  await page.waitForFunction(prior=>window.__tinyKingdom.getFrameProfile().totalFrames>prior,prior,{timeout:150000});
  const evidence=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const gl=document.getElementById('world').getContext('webgl');
   return {snap:JSON.stringify(g.exportSnapshot()),current:g.metrics(),
    actualWork:g.getForgeCraftCycleAudit(),
    bellows:g.getForgeBellowsResidentAudit(),geometry:g.getGeometryAudit(),
    glError:gl?.getError(),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await info.attach('W450-real-smith-'+viewport.width+'-'+(enabled?'resident':'original')+'.png',{
   body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W450-real-smith-'+viewport.width+'-'+(enabled?'resident':'original')+'.json',{
   body:Buffer.from(JSON.stringify({evidence,actualSource:actual.source,
    nativeHardwareFps:'NOT MEASURED',independentCritic:'UNAVAILABLE'},null,2)),
   contentType:'application/json'});
  expect(evidence.snap).toBe(actual.snapshot);
  expect(evidence.current.citizens).toBe(actual.source.citizens);
  expect(evidence.glError).toBe(0);
  expect(evidence.overflow).toBeLessThanOrEqual(0);
  expect(evidence.geometry.totalTriangles).toBeLessThan(160000);
  expect(evidence.bellows.active).toBe(enabled);
  if(enabled){
   expect(evidence.bellows.buffers).toBe(1);
   expect(evidence.bellows.capacityFloats).toBeLessThanOrEqual(8192);
   expect(evidence.bellows.compression).toBeCloseTo(smith.impact,6);
  }
  return evidence;
 }
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
  const resident=await measure(viewport,true),original=await measure(viewport,false);
  expect(resident.geometry.totalTriangles).toBe(original.geometry.totalTriangles);
  expect(resident.snap).toBe(original.snap);
 }
 expect(pageErrors).toEqual([]);
});
