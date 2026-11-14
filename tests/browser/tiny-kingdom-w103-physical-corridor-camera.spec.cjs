'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// Use the genuine rendered world, real courier cargo and original market receipt.
// Do not spawn, teleport or stage any actor or fake trade to film the corridor.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W103 authentic receiving roof and granary corridor camera at '+viewport.width+'px',async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const oldFrame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const snapshot=JSON.stringify(g.exportSnapshot());
   const corridor=g.getTradeCorridorCameraAudit(),model=g.getCameraOcclusionModel();
   g.setCamera({yaw:.4,pitch:.55,zoom:18,focus:[-.1,10.4]});
   return {snapshot,corridor,model,citizens:g.metrics().citizens,buildings:g.metrics().buildings};
  });
  await page.waitForFunction(fr=>window.__tinyKingdom.getFrameProfile().totalFrames>fr,oldFrame,{timeout:110000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getPresentedCameraFrame();
   return {snapshot:JSON.stringify(g.exportSnapshot()),frame,
    projected:g.getMarketStructuralSightline(frame.eye,frame.target),
    triangleCount:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(before.corridor).toMatchObject({marketRoofBands:4,marketPosts:4,
   granaryRoofBands:4,granaryPosts:2,totalVolumes:14,boundsValid:true,
   authorityModified:false,populatedFromActualGeometry:true});
  expect(before.model.receivingHallRoofBands).toBe(4);
  expect(before.model.receivingHallPosts).toBe(4);
  expect(before.model.granaryPorchRoofBands).toBe(4);
  expect(before.model.granaryPorchPosts).toBe(2);
  expect(after.projected.modelledPosts).toBeGreaterThanOrEqual(22);
  expect(after.snapshot).toEqual(before.snapshot);
  expect(after.triangleCount).toBeLessThan(160000);
  expect(after.gl).toBe(0);expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const folder='artifacts/tiny-kingdom-w103';fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:folder+'/'+viewport.width+'-actual-market-roof.png'});
  // Continue the real seeded simulation to the first physical loaded courier.
  const real=await page.evaluate(()=>{
   const g=window.__tinyKingdom;let steps=0;
   while(!g.getActiveDeliveries().length&&steps<90000){g.step(1/30);steps++}
   const freight=g.getActiveDeliveries()[0];
   if(!freight)return {steps,hasRealCourier:false};
   const snapshot=JSON.stringify(g.exportSnapshot());
   const follow=g.watchDelivery(freight.id);
   return {steps,hasRealCourier:true,freight,follow,
    preserved:snapshot===JSON.stringify(g.exportSnapshot()),
    camera:g.getCourierPostCameraAudit(),
    scene:g.getCameraOcclusionModel(),frameCount:g.getFrameProfile().totalFrames};
  });
  expect(real.hasRealCourier).toBe(true);
  expect(real.follow?.id).toBe(real.freight.id);
  expect(real.preserved).toBe(true);
  expect(real.camera.marketPhysicalPosts).toBeGreaterThanOrEqual(22);
  expect(real.scene.receivingHallRoofBands).toBe(4);
  await page.waitForFunction(fr=>window.__tinyKingdom.getFrameProfile().totalFrames>fr,
   real.frameCount,{timeout:110000});
  const played=await page.evaluate(()=>({
   frame:window.__tinyKingdom.renderStats(),
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(played.frame.lastFrameTriangles).toBeLessThan(160000);
  expect(played.gl).toBe(0);expect(played.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:folder+'/'+viewport.width+'-genuine-loaded-courier.png'});
  fs.writeFileSync(folder+'/'+viewport.width+'-real-corridor-camera.json',
   JSON.stringify({viewport,before,camera:after.projected,real,played,errors},null,2));
 });
}
