'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W86 test-first contract: same actual homes, citizens and resident draw ranges
// with optional multi-draw enabled/disabled. Software CI proves fallback only.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W86 resident town draw submissions preserve all real geometry '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   g.setCamera({yaw:.63,pitch:.88,zoom:28,focus:[0,3]});
   g.setScenicMultiDrawForTesting(false);
  });
  const first=(await page.evaluate(()=>window.__tinyKingdom.renderQuality().framesDrawn));
  await page.waitForFunction(n=>window.__tinyKingdom.renderQuality().framesDrawn>n,first,{timeout:110000});
  const baseline=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),metrics:g.metrics(),
    visibility:g.getScenicVisibilityStats(),triangles:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit()};
  });
  expect(baseline.visibility.totalDriverCalls).toBe(baseline.visibility.totalDrawCalls);
  expect(baseline.visibility.totalMultiDrawBatches).toBe(0);
  await page.evaluate(()=>window.__tinyKingdom.setScenicMultiDrawForTesting(true));
  const next=await page.evaluate(()=>window.__tinyKingdom.renderQuality().framesDrawn);
  await page.waitForFunction(n=>window.__tinyKingdom.renderQuality().framesDrawn>n,next,{timeout:110000});
  const candidate=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),metrics:g.metrics(),
    visibility:g.getScenicVisibilityStats(),multi:g.getScenicMultiDrawAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    geometry:g.getGeometryAudit(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(candidate.snapshot).toBe(baseline.snapshot);
  expect(candidate.metrics.citizens).toBe(baseline.metrics.citizens);
  expect(candidate.metrics.buildings).toBe(baseline.metrics.buildings);
  expect(candidate.triangles).toBe(baseline.triangles);
  expect(candidate.triangles).toBeLessThan(160000);
  for(const key of ['totalSubmittedTriangles','totalCulledTriangles',
    'totalIssuedTriangles','totalDrawCalls'])
    expect(candidate.visibility[key]).toBe(baseline.visibility[key]);
  expect(candidate.visibility.totalDriverCalls).toBeLessThanOrEqual(candidate.visibility.totalDrawCalls);
  if(!candidate.multi.supported){
   expect(candidate.visibility.totalDriverCalls).toBe(candidate.visibility.totalDrawCalls);
   expect(candidate.visibility.totalMultiDrawBatches).toBe(0);
  }
  expect(candidate.geometry.static.invalidComponents).toBe(0);
  expect(candidate.geometry.dynamic.invalidComponents).toBe(0);
  expect(candidate.overflow).toBeLessThanOrEqual(0);
  expect(candidate.gl).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w86',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w86/'+viewport.width+'-resident-multidraw.json',
   JSON.stringify({viewport,baseline:{...baseline,snapshot:'redacted-match-only'},
    candidate:{...candidate,snapshot:'redacted-match-only'}},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w86/'+viewport.width+'-resident-multidraw.png'});
 });
}
