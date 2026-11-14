'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W74 protects an actually loaded courier and the ACTUAL market posts.
// An obstructed moving camera must use an available clear, genuine worker
// sightline, without moving/hiding any home, stall, parcel or citizen.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W74 authentic moving courier post-aware camera '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const ready=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   let actual=g.getActiveDeliveries();
   for(let i=0;i<44000&&!actual.length;i++){
    g.step(1/30);
    if(i%6===0)actual=g.getActiveDeliveries();
   }
   if(!actual.length)return {found:false};
   const before=JSON.stringify(g.exportSnapshot());
   const selected=g.watchDelivery();
   return {found:!!selected,selected,before,after:JSON.stringify(g.exportSnapshot())};
  });
  expect(ready.found).toBe(true);
  expect(ready.selected?.id).toBeTruthy();
  expect(ready.after).toBe(ready.before);
  await page.waitForFunction(()=>window.__tinyKingdom.getCourierPostCameraAudit()?.active,
   null,{timeout:110000});
  // Wait for the real GPU frame to include the genuine selected cart and
  // physically placed uprights, not the scene rendered before the 44k ticks.
  await page.waitForTimeout(750);
  const camera=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const audit=g.getCourierPostCameraAudit();
   const original=g.exportSnapshot();
   const policy={
    requiresRepair:g.evaluateCourierPostRepairPolicy(.18,.01,.14),
    noClearShot:g.evaluateCourierPostRepairPolicy(.18,.16,.20),
    alreadyClear:g.evaluateCourierPostRepairPolicy(.02,.01,.04)
   };
   return {audit,policy,realMarketPosts:g.getMarketGatewayAudit().structuralPosts+
    g.getTradeCorridorCameraAudit().marketPosts,
    snapshot:JSON.stringify(original),
    triangles:g.renderStats().lastFrameTriangles,
    citizenCount:g.metrics().citizens,
    errors:g.getGeometryAudit(),overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(camera.audit.source).toBe('real-courier-market-post-repair');
  expect(camera.audit.readOnly).toBe(true);
  expect(camera.audit.actor).toBeTruthy();
  // Original stalls, rebuilt gateway AND real receiving-hall pillars are all
  // camera-physical. Compare against the actual scene rather than stale 18.
  expect(camera.audit.marketPhysicalPosts).toBe(camera.realMarketPosts);
  expect(Number.isFinite(camera.audit.presentPostCover)).toBe(true);
  expect(camera.audit.presentPostCover).toBeGreaterThanOrEqual(0);
  expect(camera.audit.presentPostCover).toBeLessThanOrEqual(1);
  expect(camera.policy.requiresRepair).toBe(true);
  expect(camera.policy.noClearShot).toBe(false);
  expect(camera.policy.alreadyClear).toBe(false);
  expect(camera.snapshot).toBe(ready.before);
  expect(camera.triangles).toBeLessThan(160000);
  expect(camera.citizenCount).toBeGreaterThan(0);
  expect(camera.errors.static.invalidComponents).toBe(0);
  expect(camera.errors.dynamic.invalidComponents).toBe(0);
  expect(camera.overflow).toBeLessThanOrEqual(0);
  expect(camera.glError).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w74',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w74/'+viewport.width+'-real-courier-sightline.json',
   JSON.stringify({viewport,ready,camera},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w74/'+viewport.width+'-real-market-post-view.png'});
 });
}
