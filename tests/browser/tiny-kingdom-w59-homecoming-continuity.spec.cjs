'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W59: Genuine uncut dusk-to-daybreak continuity. Verify that a followed
// citizen has an actual opening door; retain the clear view at their home
// after the leaf closes; restore the village overview when they really
// return to daytime work. No fabricated task, clock or actor is permitted.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W59 real citizen dusk-to-dawn film continuity '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const dusk=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let door;
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(i%3)continue;
    door=g.getCottageHomecomingAudit().doors.find(d=>
     d.swing>.55&&d.activity==='Returning home at dusk');
    if(door)break;
   }
   if(!door)return {door:null};
   const before=JSON.stringify(g.exportSnapshot());
   let view;
   for(let k=0;k<g.metrics().citizens+1;k++){
    view=g.watchHomecoming();
    if(view?.citizen===door.citizen)break;
   }
   return {door,view,readOnly:before===JSON.stringify(g.exportSnapshot())};
  });
  expect(dusk.door,'Only a true autonomous arrival is admissible').toBeTruthy();
  expect(dusk.view?.citizen).toBe(dusk.door.citizen);
  expect(dusk.readOnly).toBe(true);
  await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit().active,
   null,{timeout:60000});
  const opened=await page.evaluate(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit());
  expect(opened.phase).toBe('real-door-opening');
  expect(opened.camera.doorRayBlockers).toBe(0);
  expect(opened.camera.vegetationFaceBlockers).toBe(0);
  const resting=await page.evaluate(()=>{
   const g=window.__tinyKingdom,name=g.getHomecomingView().citizen;
   for(let n=0;n<24*30;n++){
    g.step(1/30);
    const v=g.getHomecomingView();
    const open=g.getCottageHomecomingAudit().doors.some(d=>d.citizen===name);
    if(v?.citizen===name&&v.arrival&&!open)return {found:true,view:v};
   }
   return {found:false};
  });
  expect(resting.found,'True rest must eventually shut this real cottage door').toBe(true);
  await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit().phase==='resting-at-real-home',
   null,{timeout:60000});
  const quiet=await page.evaluate(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit());
  expect(quiet.camera.vegetationFaceBlockers).toBe(0);
  expect(quiet.camera.foregroundVegetationCover).toBeLessThan(.30);
  expect(quiet.door.x).toBeCloseTo(dusk.door.doorX,3);
  expect(quiet.door.z).toBeCloseTo(dusk.door.doorZ,3);
  const morning=await page.evaluate(()=>{
   const g=window.__tinyKingdom,name=g.getHomecomingView().citizen;
   for(let n=0;n<24*30*2;n++){
    g.step(1/30);
    const v=g.getHomecomingView();
    if(v.citizen===name&&!v.arrival&&!v.active)
     return {found:true,snapshot:JSON.stringify(g.exportSnapshot())};
   }
   return {found:false};
  });
  expect(morning.found,'Daybreak must emerge from true seeded simulation').toBe(true);
  await page.waitForFunction(()=>document.body.dataset.workday==='off'&&
   !window.__tinyKingdom.getCamera().follow,null,{timeout:60000});
  const finished=await page.evaluate(()=>({
   authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   command:window.__tinyKingdom.getCommandView(),
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   overflow:document.documentElement.scrollWidth-innerWidth,
   glError:document.getElementById('world').getContext('webgl')?.getError()
  }));
  expect(finished.authority).toBe(morning.snapshot);
  expect(finished.command).toBe('world');
  expect(finished.triangles).toBeLessThan(160000);
  expect(finished.overflow).toBeLessThanOrEqual(0);
  expect(finished.glError).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w59',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w59/'+viewport.width+'-actual-daybreak-overview.png'});
 });
}
