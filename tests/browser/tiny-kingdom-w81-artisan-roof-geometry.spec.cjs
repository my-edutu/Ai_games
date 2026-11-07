'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W81 RED-first source contract: 8 expensive full-detail and growing compact
// REAL house roofs are rebuilt into tactile overlapping clay courses using the
// EXISTING original mipmapped architecture atlas, not flattened/hidden homes.
// This must recover triangles while preserving the authentic 120-day village,
// the small-house identity palette, complete materials, jobs and saved replay.
// The user-facing look/feel/play verdict is separate: a source geometry
// budget PASS is NOT a visual transformation milestone.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]) {
 test('W81 authentic layered-clay roofs reclaim full growing-town geometry at '+viewport.width+'px',async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const snapshot=JSON.stringify(g.exportSnapshot());
   const roof=g.getRoofCoursingAudit();
   return {roof,triangles:g.renderStats().lastFrameTriangles,
    snapshotPreserved:snapshot===JSON.stringify(g.exportSnapshot()),
    citizens:g.metrics().citizens,houses:g.metrics().buildings-2};
  });
  expect(initial.roof.source).toBe('physical-handlaid-roof-courses-and-original-clay-atlas');
  expect(initial.roof.renderer).toBe('webgl');
  expect(initial.roof.atlasShingles).toBe(true);
  expect(initial.roof.detailedCourses).toBe(initial.roof.detailedHomes*12);
  expect(initial.roof.compactCourses).toBe(initial.roof.compactHomes*6);
  expect(initial.roof.reclaimedTriangles).toBe(
   initial.roof.detailedHomes*204+initial.roof.compactHomes*24);
  expect(initial.roof.detailedHomes+initial.roof.compactHomes).toBe(initial.houses);
  expect(initial.snapshotPreserved).toBe(true);
  expect(initial.citizens).toBeGreaterThan(0);
  expect(initial.triangles).toBeLessThan(160000);

  // Genuine 120-day fixed-step growth, no fabricated test lots or work.
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;for(let i=0;i<120*24*30;i++)g.step(1/30);
   return {snapshot:JSON.stringify(g.exportSnapshot()),frames:g.getFrameProfile().totalFrames};
  });
  await page.waitForFunction(frames=>
   window.__tinyKingdom.getFrameProfile().totalFrames>frames,
   grown.frames,{timeout:110000});
  const grownView=await page.evaluate(()=>{
   const g=window.__tinyKingdom,real=JSON.stringify(g.exportSnapshot());
   const audit=g.getRoofCoursingAudit(),geometry=g.getGeometryAudit();
   return {audit,geometry,snapshot:real,city:g.metrics(),scene:g.renderStats(),
    gl:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(grownView.snapshot).toBe(grown.snapshot);
  expect(grownView.city.buildings).toBeGreaterThan(initial.houses+2);
  expect(grownView.audit.detailedHomes+grownView.audit.compactHomes)
   .toBe(grownView.city.buildings-2);
  expect(grownView.audit.detailedCourses).toBe(grownView.audit.detailedHomes*12);
  expect(grownView.audit.compactCourses).toBe(grownView.audit.compactHomes*6);
  expect(grownView.audit.reclaimedTriangles).toBe(
   grownView.audit.detailedHomes*204+grownView.audit.compactHomes*24);
  expect(grownView.audit.reclaimedTriangles).toBeGreaterThan(2200);
  expect(grownView.geometry.totalTriangles).toBeLessThan(160000);
  expect(grownView.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(grownView.geometry.static.invalidComponents).toBe(0);
  expect(grownView.geometry.dynamic.invalidComponents).toBe(0);
  expect(grownView.gl).toBe(0);expect(grownView.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w81',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w81/'+viewport.width+'-physical-roof-audit.json',
   JSON.stringify({viewport,initial,grown:grownView},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w81/'+viewport.width+'-grown-authentic-roofs.png'});
 });
}
