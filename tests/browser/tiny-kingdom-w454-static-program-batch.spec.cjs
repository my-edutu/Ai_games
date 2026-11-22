'use strict';
// W454: actual settled farm/market/occupied-home renderer, not simulated
// pictures. Running WebGL screenshots/videos are separate from this contract.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W454 batched genuine static material submission retains original world and GL order at 1024px/390px',async({page},info)=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:160000});
 await page.locator('#pause').click();
 const world=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 async function record(width,height,specialist){
  await page.setViewportSize({width,height});
  const before=await page.evaluate(specialist=>{
   const g=window.__tinyKingdom;
   g.setResidentHomeShaderForTesting(specialist);
   g.setCamera({focus:[0,3],yaw:.85,pitch:.52,zoom:23});
   return g.getFrameProfile().totalFrames;
  },specialist);
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,before,{timeout:150000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:JSON.stringify(g.exportSnapshot()),scene:g.renderStats(),
    geo:g.getGeometryAudit(),visibility:g.getScenicVisibilityStats(),
    shaders:g.getResidentHomeShaderAudit(),
    webglError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  await info.attach('W454-real-'+width+'-'+(specialist?'resident':'full')+'.png',
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W454-real-'+width+'-'+(specialist?'resident':'full')+'.json',
   {body:Buffer.from(JSON.stringify({result,physicalHardwareFps:'NOT MEASURED',
    independentBlindReview:'UNAVAILABLE',G088Control:'NOT PROVEN'},null,2)),
    contentType:'application/json'});
  expect(result.world).toBe(world);
  expect(result.webglError).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(result.geo.totalTriangles).toBeLessThan(160000);
  expect(result.shaders.staticMaterialBatch.currentBatchOpen).toBe(false);
  expect(result.shaders.staticMaterialBatch.fullShaderRestoredAfterBatch).toBe(true);
  if(specialist){
   expect(result.shaders.enabled).toBe(true);
   expect(result.shaders.staticMaterialBatch.batches).toBeGreaterThan(0);
   expect(result.shaders.staticMaterialBatch.uniformUploads).toBeGreaterThan(0);
   // Reusing the one frame's eye/time/lantern uniforms must not change state.
   expect(result.shaders.staticMaterialBatch.uniformReuses).toBeGreaterThan(0);
   expect(result.shaders.staticMaterialBatch.programSwitches)
    .toBeLessThan(result.shaders.staticMaterialBatch.specialistDrawCalls*2+4);
  }
  return result;
 }
 for(const [width,height] of [[1024,640],[390,844]]){
  const full=await record(width,height,false);
  const specialist=await record(width,height,true);
  expect(specialist.geo.totalTriangles).toBe(full.geo.totalTriangles);
  expect(specialist.visibility.totalSubmittedTriangles)
   .toBe(full.visibility.totalSubmittedTriangles);
  expect(specialist.visibility.totalIssuedTriangles)
   .toBe(full.visibility.totalIssuedTriangles);
 }
 expect(errors).toEqual([]);
});
