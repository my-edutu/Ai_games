'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W432 real inhabited room exterior and physical open doorway '+width,async({page})=>{
  test.setTimeout(240000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:150000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  const inspect=await page.evaluate(()=>{
   const api=window.__tinyKingdom,homes=api.getInhabitedSkylineAudit().lots
    .filter(h=>!h.compact);
   if(!homes.length)throw Error('No real detailed inhabited house');
   const home=homes.sort((a,b)=>
    Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))[0];
   // Physically surveyed player camera, never a hidden roof or fake room.
   api.setCamera({yaw:Math.PI,pitch:.31,zoom:6.5,focus:[home.x,home.z]});
   return {home,room:api.getOriginalOccupiedRoomAudit(),
    population:api.metrics().citizens,
    buildings:api.metrics().buildings,
    triangles:api.renderStats().lastFrameTriangles};
  });
  expect(inspect.population).toBeGreaterThanOrEqual(12);
  expect(inspect.room.builtInstances).toBeGreaterThanOrEqual(1);
  expect(inspect.room.doorwayOpenings).toBeGreaterThanOrEqual(1);
  expect(inspect.room.maxTrianglesPerHome).toBeLessThanOrEqual(150);
  expect(inspect.room.authorityModified).toBe(false);
  await page.waitForTimeout(1900);
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w432');
  fs.mkdirSync(root,{recursive:true});
  await page.screenshot({path:path.join(root,width+'-actual-occupied-cottage.png')});
  const after=await page.evaluate(()=>({
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   submitted:window.__tinyKingdom.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   overflow:document.documentElement.scrollWidth-innerWidth,
   camera:window.__tinyKingdom.getCameraNavigationAudit()
  }));
  expect(after.snapshot).toEqual(before);
  expect(after.submitted).toBeGreaterThan(0);
  expect(after.submitted).toBeLessThan(160000);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(root,width+'-actual-cottage-proof.json'),
   JSON.stringify({viewport:width,observedRealLot:inspect.home,
    originalRoom:inspect.room,worldUnchanged:after.snapshot===before,
    submittedTriangles:after.submitted,gl:after.gl,errors,
    actualGameplayCamera:after.camera,
    hardwareFPS:'NOT MEASURED',comparisonGate:'NOT PROVEN',
    independentCritic:'UNAVAILABLE'},null,2));
  const video=page.video();
  await page.close();
  if(video)await video.saveAs(path.join(root,width+'-actual-cottage-uncut.webm'));
 });
}
