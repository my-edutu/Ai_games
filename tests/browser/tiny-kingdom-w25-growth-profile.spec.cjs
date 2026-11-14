'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const W24='9b4bdeb3dba591b09fe6906d6be234710e3fdb28';
const W25='95f07bbc77287eb824140173ec74abf75e389d17';
const destination=path.resolve(__dirname,'../../artifacts/tiny-kingdom');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// Pin the candidate to its ACTUAL executable source. Current draft PR #64
// advances under parallel W26 development; loading HEAD here and labelling
// it W25 would fabricate an obsolete historical benchmark.
const html25=execFileSync('git',['show',W25+':public/tiny-kingdom/index.html'],
 {encoding:'utf8',maxBuffer:20*1024*1024});
// Fetch-depth=0 in the dedicated job so the prior source is an exact Git
// object, not a guessed screenshot or asynchronously updated public website.
const html24=execFileSync('git',['show',W24+':public/tiny-kingdom/index.html'],
 {encoding:'utf8',maxBuffer:20*1024*1024});
test('W25 matched W24 construction-growth CPU wall phases, replay truth and 390px physical pictures',async({browser})=>{
 test.setTimeout(360000);
 fs.mkdirSync(destination,{recursive:true});
 const results=[];let pinnedSnapshot=null,pinnedSnapshotHash=null;
 for(const [label,html] of [['W24',html24],['W25',html25]]){
  const page=await browser.newPage({viewport:{width:1024,height:640}});
  const pageErrors=[];page.on('pageerror',err=>pageErrors.push(err.message));
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  await page.locator('#pause').click();
  // One EXACT authoritative snapshot for both source versions, not merely
  // the same seed. CI software draws at different rates while page starts.
  // Save/restore under pause prevents accidental timing-derived RNG drift.
  if(label==='W24'){
   pinnedSnapshot=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
   pinnedSnapshotHash=hash(JSON.stringify(pinnedSnapshot));
  }else{
   expect(await page.evaluate(snapshot=>window.__tinyKingdom.restoreSnapshot(snapshot),pinnedSnapshot)).toBe(true);
   expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(JSON.stringify(pinnedSnapshot));
  }
  // A fixed inspected camera, then a frozen frame. The next fixed-step
  // authoritative construction changes the entire rendered town legitimately.
  const initialFrame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.85,pitch:.52,zoom:23,focus:[0,0]}));
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,initialFrame,{timeout:90000});
  await page.locator('#world').screenshot({path:path.join(destination,label+'-day1.png')});
  const baseline=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {population:g.metrics().citizens,buildings:g.metrics().buildings,
    civics:g.getCivicSceneryCacheStats(),storage:g.getScenicMeshStorage(),
    geometry:g.getGeometryAudit()};
  });
  const growth=[];
  for(let k=0;k<3;k++){
   // Capture cursor INSIDE the same page task as the 1/30 fixed-step
   // advance; a paused render cannot slip between cursor and world change.
   const changed=await page.evaluate(()=>{
    const g=window.__tinyKingdom,frames=g.getFrameProfile().totalFrames,
     buildings=g.metrics().buildings;
    let steps=0;
    while(g.metrics().buildings<=buildings&&steps<9000){
     g.step(1/30);steps++;
    }
    return {frames,steps,from:buildings,to:g.metrics().buildings,
     authority:JSON.stringify(g.exportSnapshot()),civicBefore:g.getCivicSceneryCacheStats()};
   });
   expect(changed.to).toBeGreaterThan(changed.from);
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
    changed.frames,{timeout:90000});
   const after=await page.evaluate(()=>{
    const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
    return {performance:g.getFrameProfile().latest,
     civic:g.getCivicSceneryCacheStats(),residency:g.getSettlementResidentStats(),
     visible:g.getScenicVisibilityStats(),geometry:g.getGeometryAudit(),
     authority:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()??-1};
   });
   expect(after.authority).toBe(changed.authority);
   expect(after.glError).toBe(0);
   expect(after.geometry.totalTriangles).toBeLessThan(160000);
   expect(after.geometry.static.invalidComponents).toBe(0);
   if(label==='W25'&&after.civic.activeKey===changed.civicBefore.activeKey){
    expect(after.civic.gpuUploads).toBe(changed.civicBefore.gpuUploads);
    expect(after.civic.gpuResident).toBe(true);
   }
   growth.push({steps:changed.steps,buildings:changed.to,
    authoritySha256:hash(after.authority),cpuWallMs:after.performance,
    residentHits:after.residency.hits,originalCivic:after.civic,
    visibleStaticTriangles:after.visible.totalSubmittedTriangles,
    sceneTriangles:after.geometry.totalTriangles});
   await page.locator('#world').screenshot({path:path.join(destination,label+'-growth'+(k+1)+'.png')});
  }
  const frame=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,frame,{timeout:90000});
  const mobile=await page.evaluate(()=>({
   width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
  }));
  expect(mobile.width).toBeLessThanOrEqual(390);expect(mobile.gl).toBe(0);
  await page.locator('#world').screenshot({path:path.join(destination,label+'-mobile.png')});
  expect(pageErrors).toEqual([]);
  results.push({label,source:label==='W24'?W24:W25,initialSnapshotSha256:pinnedSnapshotHash,renderer:await page.evaluate(()=>window.__tinyKingdom.renderQuality().renderer),
   baseline,growth,mobile});
  await page.close();
 }
 for(let i=0;i<3;i++){
  expect(results[0].growth[i].steps).toBe(results[1].growth[i].steps);
  expect(results[0].growth[i].authoritySha256).toBe(results[1].growth[i].authoritySha256);
  expect(results[0].growth[i].sceneTriangles).toBe(results[1].growth[i].sceneTriangles);
 }
 const summary={schema:'W25 real-browser matched growth CPU-wall-v1',device:'GitHub Actions Linux SwiftShader software WebGL',
  notGpuElapsed:true,notConsumerHardware:true,notExperiencePass:true,
  reference:'official Manor Lords is a separate commercial gate, not claimed',
  cases:results};
 fs.writeFileSync(path.join(destination,'w25-real-growth-benchmark.json'),JSON.stringify(summary,null,2));
 console.log('W25 REAL CONSTRUCTION BEFORE/AFTER: '+JSON.stringify(results.map(r=>({
  source:r.source,buildings:r.growth.map(g=>g.buildings),
  staticCpuWallMs:r.growth.map(g=>g.cpuWallMs.staticGeometry),
  totalCpuWallMs:r.growth.map(g=>g.cpuWallMs.total),
  civicGpuUploads:r.growth.map(g=>g.originalCivic.gpuUploads||null),
  residentHits:r.growth.map(g=>g.residentHits)}))));
});
