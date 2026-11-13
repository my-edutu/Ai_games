'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:390,height:844},{width:1024,height:640}]){
 test('W276 original medieval market+real parcel buttons work at '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {snapshot:JSON.stringify(g.exportSnapshot()),routes:g.getGroundAtlasRouteResidencyAudit()};
  });
  expect(before.routes.bounded).toBe(true);
  expect(before.routes.cachedHomes).toBeGreaterThan(0);
  await page.locator('#world-trace-toggle').click();
  await expect(page.locator('#grain-chain-market')).toBeVisible();
  if(viewport.width===390){
   await expect(page.locator('#grain-chain-details')).toBeVisible();
   await expect(page.locator('#world-supply-trail>.supply-stage').first()).toBeHidden();
   const collapsed=await page.evaluate(()=>({
    height:document.querySelector('#world-ribbon').getBoundingClientRect().height,
    audit:window.__tinyKingdom.getSupplyTrailDetailsAudit()
   }));
   expect(collapsed.audit.expanded).toBe(false);
   expect(collapsed.height).toBeLessThanOrEqual(270);
   await page.locator('#grain-chain-details').click();
   await expect(page.locator('#world-supply-trail>.supply-stage').first()).toBeVisible();
   await page.locator('#grain-chain-details').click();
   await expect(page.locator('#world-supply-trail>.supply-stage').first()).toBeHidden();
  }else await expect(page.locator('#world-supply-trail>.supply-stage').first()).toBeVisible();
  await page.locator('#grain-chain-market').click();
  await expect(page.locator('#grain-chain-market')).toBeVisible();
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    routes:g.getGroundAtlasRouteResidencyAudit(),ui:g.getSupplyTrailDetailsAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    error:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(after.snapshot).toBe(before.snapshot);
  expect(after.ui.fiveCameraStagesStillUsable).toBe(true);
  expect(after.routes.cachedHomes).toBeLessThanOrEqual(after.routes.realHomes);
  expect(after.triangles).toBeGreaterThan(0);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.error).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w276',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w276/'+viewport.width+'-true-world.json',
   JSON.stringify({before,after},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w276/'+viewport.width+'-actual-market.png'});
 });
}
