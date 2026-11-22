'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W58 RED-first: the previous W57 homecoming movie kept the camera overhead
// while the actual, already-simulated cottage door moved out of sight.
// Observe a true door swing with a safe external, human-scale camera;
// never advance fictitious agents or alter saved world state while framing.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W58 authentic threshold witness with open exterior sightline '+viewport.width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let door=null;
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(i%3)continue;
    const audit=g.getCottageHomecomingAudit();
    door=audit.doors.find(d=>d.swing>.53&&d.activity==='Returning home at dusk');
    if(door)break;
   }
   if(!door)return {door:null};
   const source=JSON.stringify(g.exportSnapshot());
   let view=null;
   for(let k=0;k<g.metrics().citizens+1;k++){
    view=g.watchHomecoming();
    if(view?.citizen===door.citizen)break;
   }
   const witness=g.getHomecomingThresholdCameraAudit();
   const after=JSON.stringify(g.exportSnapshot());
   return {door,view,witness,readOnly:source===after,
    authorityChecksum:g.getState().state?.t};
  });
  expect(observed.door,'True dusk return must occur without scripted actors').toBeTruthy();
  expect(observed.view.citizen).toBe(observed.door.citizen);
  expect(observed.readOnly).toBe(true);
  expect(observed.witness.active,'Actual open doorway must receive a witness camera').toBe(true);
  expect(observed.witness.door.homeIndex).toBe(observed.door.homeIndex);
  expect(observed.witness.door.swing).toBeGreaterThan(.5);
  expect(observed.witness.camera.zoom).toBeLessThanOrEqual(6.2);
  expect(observed.witness.camera.pitch).toBeLessThanOrEqual(.31);
  expect(observed.witness.camera.doorRayBlockers).toBe(0);
  expect(observed.witness.camera.outsideDoor).toBe(true);
  await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit().active,null,{timeout:60000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {camera:g.getHomecomingThresholdCameraAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(after.camera.active).toBe(true);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w58',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w58/'+viewport.width+'-authentic-door-witness.png'});
 });
}
