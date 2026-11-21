'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W101 genuine occupied home doors are identical in cached WebGL mode '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const witness=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(g.getCottageHomecomingAudit().doors.some(d=>d.swing>.45))break;
   }
   const n=g.getCottageHomecomingAudit().doors.length;
   g.setCamera({focus:[0,0],zoom:24,yaw:.65,pitch:.52});
   g.setCottageDoorResidencyForTesting(false);
   return {realDoors:n,frame:g.getFrameProfile().totalFrames};
  });
  expect(witness.realDoors).toBeGreaterThan(0);
  await page.waitForFunction(previous=>window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   witness.frame,{timeout:110000});
  const old=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {state:JSON.stringify(g.exportSnapshot()),
    geometry:g.getGeometryAudit(),doors:g.getCottageDoorRenderAudit(),
    triangles:g.renderStats().lastFrameTriangles};
  });
  expect(old.doors.panels).toBeGreaterThan(0);
  const previous=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
   g.setCottageDoorResidencyForTesting(true);return frame;
  });
  await page.waitForFunction(frame=>{
   const g=window.__tinyKingdom;
   return g.getFrameProfile().totalFrames>frame&&g.getCottageDoorResidencyAudit().active;
  },previous,{timeout:110000});
  const fresh=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {state:JSON.stringify(g.exportSnapshot()),
    geometry:g.getGeometryAudit(),doors:g.getCottageDoorRenderAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    cache:g.getCottageDoorResidencyAudit(),
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  expect(fresh.cache.buffers).toBe(1);
  expect(fresh.cache.floats).toBeGreaterThan(0);
  expect(fresh.cache.floats).toBeLessThanOrEqual(fresh.cache.floatBudget);
  expect(fresh.cache.authorityModified).toBe(false);
  expect(fresh.cache.allRealHomesPreserved).toBe(true);
  expect(fresh.state).toBe(old.state);
  expect(fresh.geometry).toEqual(old.geometry);
  expect(fresh.doors).toEqual(old.doors);
  expect(fresh.triangles).toBe(old.triangles);
  expect(fresh.geometry.static.invalidComponents).toBe(0);
  expect(fresh.geometry.dynamic.invalidComponents).toBe(0);
  expect(fresh.gl).toBe(0);
  expect(fresh.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w101',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w101/'+viewport.width+'-real-door.png'});
 });
}
