'use strict';
// W136 LIVE-GAME candidate evidence, NOT hardware frame performance.
// The physical real worker/market/world retain all authoritative objects.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W136 original scene draw-plan and truthful economic HUD '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.getFrameProfile()
   ?.totalFrames>0,null,{timeout:155000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setCamera({focus:[0,3],yaw:.6,pitch:.75,zoom:35});
   g.setSpeed(0);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(start=>window.__tinyKingdom.getFrameProfile()
   .totalFrames>start,before,{timeout:155000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {plan:g.getScenicDrawPlanCacheAudit(),hud:g.getLiveHudCadenceAudit(),
    scene:g.getScenicVisibilityStats(),population:g.metrics().citizens,
    buildings:g.metrics().buildings,world:g.getSupplyTrailSnapshot(),
    geometry:g.getGeometryAudit(),glError:gl?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth,
    renderer:g.renderQuality().renderer,profile:g.getFrameProfile()};
  });
  expect(result.plan.viewsPerMeshLimit).toBe(2);
  expect(result.plan.authorityChanged).toBe(false);
  expect(result.plan.noCitizenOrHouseOmission).toBe(true);
  expect(result.hud.immutableAuthority).toBe(true);
  expect(result.hud.updates).toBeGreaterThan(0);
  expect(result.population).toBeGreaterThan(0);
  expect(result.buildings).toBeGreaterThan(0);
  expect(result.geometry.totalTriangles).toBeLessThan(160000);
  expect(result.glError).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W136-real-world-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W136-real-game-cpu-hud-audit-'+viewport.width,
   {body:Buffer.from(JSON.stringify({viewport,result,
    physicalGpuTest:false,independentCriticTest:false},null,2)),
    contentType:'application/json'});
 });
}
