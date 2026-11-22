'use strict';
// W452: the actual original daylight town, 1024px and 390px, uses exactly
// the SAME authoritative snapshot/geometry with the static landscape program.
// SwiftShader runs with explicit test override only; physical GPU FPS absent.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W452 complete original season landscape is identical when GPU static vertex tier is enabled',async({page},info)=>{
 test.setTimeout(300000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:160000});
 await page.locator('#pause').click();
 const snapshot=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 async function capture(width,height,enabled){
  await page.setViewportSize({width,height});
  const before=await page.evaluate(({enabled})=>{
   const g=window.__tinyKingdom;
   g.setResidentHomeShaderForTesting(enabled);
   g.setCamera({focus:[0,3],yaw:.85,pitch:.52,zoom:23});
   return g.getFrameProfile().totalFrames;
  },{enabled});
  await page.waitForFunction(before=>window.__tinyKingdom.getFrameProfile().totalFrames>before,before,{timeout:150000});
  const evidence=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snap:JSON.stringify(g.exportSnapshot()),scene:g.renderStats(),
    geom:g.getGeometryAudit(),shader:g.getResidentHomeShaderAudit(),
    view:g.getScenicVisibilityStats(),
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  await info.attach('W452-'+width+'-'+(enabled?'static':'full')+'.png',
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W452-'+width+'-'+(enabled?'static':'full')+'.json',
   {body:Buffer.from(JSON.stringify({evidence,hardwareFps:'NOT MEASURED',
    G088Parity:'NOT PROVEN',independentCritic:'UNAVAILABLE'},null,2)),contentType:'application/json'});
  expect(evidence.snap).toBe(snapshot);
  expect(evidence.glError).toBe(0);
  expect(evidence.overflow).toBeLessThanOrEqual(0);
  expect(evidence.geom.totalTriangles).toBeLessThan(160000);
  expect(evidence.shader.linked).toBe(true);
  expect(evidence.shader.enabled).toBe(enabled);
  // The original landscape and authentic animated districts have separate
  // admission counters. An unsafe market mesh must use the complete shader,
  // not fail a valid terrain pass or disappear from the live picture.
  expect(evidence.shader.landscapeUnsafeMeshes+evidence.shader.districtUnsafeMeshes)
   .toBe(evidence.shader.allUnsafeStaticMeshes);
  if(enabled){
   expect(evidence.shader.landscapeShaderEligibleFrames).toBeGreaterThan(0);
   expect(evidence.shader.landscapeUnsafeMeshes).toBe(0);
   expect(evidence.view.landscape.visibleTriangles).toBeGreaterThan(0);
  }
  return evidence;
 }
 for(const [width,height] of [[1024,640],[390,844]]){
  const full=await capture(width,height,false);
  const stat=await capture(width,height,true);
  expect(stat.geom.totalTriangles).toBe(full.geom.totalTriangles);
  expect(stat.view.totalSubmittedTriangles).toBe(full.view.totalSubmittedTriangles);
  expect(stat.view.landscape.visibleTriangles).toBe(full.view.landscape.visibleTriangles);
 }
 expect(errors).toEqual([]);
});
