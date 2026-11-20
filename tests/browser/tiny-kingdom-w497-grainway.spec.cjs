'use strict';
// Test the genuine running settlement, route and 3D presentation, not mocks.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const out=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w497');
fs.mkdirSync(out,{recursive:true});
test.use({video:'on'});
for(const width of [1024,390]){
 test('W497 genuine living freight verge at '+width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:90000});
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toContainText('Resume');
  await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.44,pitch:.65,zoom:50,focus:[12,1]}));
  await page.waitForFunction(()=>window.__tinyKingdom.getPresentedCameraFrame()?.eye?.length===3,null,{timeout:90000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),audit:g.getFarmMarketStreetAudit(),
    people:g.metrics().citizens,buildings:g.metrics().buildings,
    triangles:g.renderStats().lastFrameFullSceneTriangles,
    eye:g.getPresentedCameraFrame().eye};
  });
  expect(before.audit.connected).toBe(true);
  expect(before.audit.hedgerow?.shrubs,'original route has rooted 3D verge').toBeGreaterThan(0);
  expect(before.audit.hedgerow.triangles).toBeGreaterThan(0);
  expect(before.audit.hedgerow.triangles).toBeLessThanOrEqual(2800);
  expect(before.audit.hedgerow.extraGpuBuffers).toBe(0);
  expect(before.audit.hedgerow.authorityModified).toBe(false);
  expect(before.triangles).toBeLessThan(160000);
  await page.screenshot({path:path.join(out,'grainway-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.59,pitch:.65,zoom:50,focus:[12,1]}));
  await page.waitForFunction(eye=>{
   const p=window.__tinyKingdom.getPresentedCameraFrame()?.eye;
   return p&&Math.hypot(...p.map((v,i)=>v-eye[i]))>.05;
  },before.eye,{timeout:60000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),audit:g.getFarmMarketStreetAudit(),
    people:g.metrics().citizens,buildings:g.metrics().buildings,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth};
  });
  await page.screenshot({path:path.join(out,'orbit-'+width+'.png'),fullPage:true});
  expect(after.snapshot).toBe(before.snapshot);
  expect(after.people).toBe(before.people);
  expect(after.buildings).toBe(before.buildings);
  expect(after.audit.hedgerow).toEqual(before.audit.hedgerow);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(width);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({source:'W497 authentic settled freight route',width,
   people:after.people,buildings:after.buildings,hedgerow:after.audit.hedgerow,
   fullSceneTriangles:before.triangles,hardwareFPS:'NOT MEASURED',
   lookFeelPlay:'NOT PROVEN'}));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(out,'grainway-'+width+'.webm'));
 });
}
