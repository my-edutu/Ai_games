'use strict';
// W216: genuine paused-world free camera must not regenerate unchanged society
// geometry merely because the camera's presentation revision advanced.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const out=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w216');
fs.mkdirSync(out,{recursive:true});
test.use({video:'on'});
for(const width of [1024,390]){
 test('W216 original medieval society survives cached moving camera at '+width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:90000});
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toContainText('Resume');
  await page.evaluate(()=>window.__tinyKingdom.setCamera({
   yaw:.47,pitch:.71,zoom:75,focus:[0,0]
  }));
  await page.waitForFunction(()=>window.__tinyKingdom.getCameraDynamicCacheStats().entries===1,null,{timeout:90000});
  // W218: the old test waited for the eye to equal an already sampled eye.
  // After an actual camera move that is not a valid readiness condition:
  // it blocked BOTH real desktop and portrait captures for 60 seconds.
  // The cache-ready check above establishes the initial submitted draw;
  // the post-orbit >0.05m eye displacement below proves genuine movement.
  const firstEye=await page.evaluate(()=>window.__tinyKingdom.getPresentedCameraFrame()?.eye);
  expect(firstEye?.length).toBe(3);
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {authority:JSON.stringify(g.exportSnapshot()),
    population:g.metrics().citizens,buildings:g.metrics().buildings,
    cache:g.getCameraDynamicCacheStats(),upload:g.renderStats().dynamicGpuUploads,
    eye:g.getPresentedCameraFrame().eye,triangles:g.renderStats().lastFrameTriangles};
  });
  expect(before.cache.entries).toBe(1);
  expect(before.cache.cachedFloats).toBeGreaterThan(0);
  // W219: direct REAL software-WebGL assembly/index identity check. These
  // physical volumes are built from the current city plus genuine loaded
  // couriers; asking several camera rays must not rebuild a giant AABB index.
  const physical=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const original=g.getCameraOcclusionModel().roofTotal;
   const before=g.getCameraArchitectureResidencyAudit();
   const indexBefore=g.getCameraRayBroadphaseAudit();
   for(let i=0;i<4;i++){
    if(g.getCameraOcclusionModel().roofTotal!==original)
     throw Error('Original physical scene changed during unchanged view');
   }
   const after=g.getCameraArchitectureResidencyAudit();
   const indexAfter=g.getCameraRayBroadphaseAudit();
   return {original,before,after,indexBefore,indexAfter};
  });
  expect(physical.after.physicalViewEntries).toBe(1);
  expect(physical.after.physicalViewAssemblies).toBe(physical.before.physicalViewAssemblies);
  expect(physical.after.physicalViewReuses).toBeGreaterThanOrEqual(
   physical.before.physicalViewReuses+4);
  expect(physical.original).toBeGreaterThanOrEqual(before.buildings);
  await page.screenshot({path:path.join(out,'before-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>window.__tinyKingdom.setCamera({
   yaw:.55,pitch:.71,zoom:75,focus:[0,0]
  }));
  await page.waitForFunction(eye=>{
   const now=window.__tinyKingdom.getPresentedCameraFrame()?.eye;
   return now&&Math.hypot(...now.map((v,i)=>v-eye[i]))>.05;
  },before.eye,{timeout:60000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {authority:JSON.stringify(g.exportSnapshot()),
    population:g.metrics().citizens,buildings:g.metrics().buildings,
    cache:g.getCameraDynamicCacheStats(),upload:g.renderStats().dynamicGpuUploads,
    triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
  });
  await page.screenshot({path:path.join(out,'after-'+width+'.png'),fullPage:true});
  expect(after.authority,'camera cannot transact or move citizens').toBe(before.authority);
  expect(after.population).toBe(before.population);
  expect(after.buildings).toBe(before.buildings);
  expect(after.cache.reuses,'same real geometry must survive orbit').toBeGreaterThan(before.cache.reuses);
  expect(after.cache.builds,'camera-only orbit must not rebuild original meshes').toBe(before.cache.builds);
  expect(after.cache.skippedUploads).toBeGreaterThan(before.cache.skippedUploads);
  expect(after.upload,'no driver reupload for unchanged vertices').toBe(before.upload);
  expect(after.triangles).toBe(before.triangles);
  expect(after.overflow).toBeLessThanOrEqual(width);
  expect(after.gl).toBe(0);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({source:'W216 real paused-camera WebGL',width,
   originalPeople:after.population,buildings:after.buildings,
   reuseDelta:after.cache.reuses-before.cache.reuses,
   rebuildDelta:after.cache.builds-before.cache.builds,
   skippedUploads:after.cache.skippedUploads-before.cache.skippedUploads}));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(out,'orbit-'+width+'.webm'));
 });
}
