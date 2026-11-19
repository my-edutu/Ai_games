'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W227: profile the actual cold-scene stages, never a synthetic geometry loop.
// Recording remains the original playable world. Software WebGL != hardware FPS.
for(const width of [1024,390]){
 test(`W227 original cold scenery build and complete playable village at ${width}px`,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:110000});
  const audited=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {profile:g.getColdSceneryBuildAudit(),geometry:g.renderStats(),
    people:g.metrics().citizens,homes:g.metrics().buildings,
    terrain:g.getLandscapeCacheStats(),
    landscapePrewarm:g.getOriginalLandscapePrewarmAudit(),
    landscapeSourceHash:g.getOriginalLandscapeSourceHash(),
    scene:g.getScenicMeshStorage(),width:document.documentElement.scrollWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  });
  // Keep full screenshot and exact browser measurements even on an invariant failure.
  // Previous failed W227 runs uploaded traces but lost their gameplay PNGs.
  fs.mkdirSync(path.resolve(__dirname,'../../test-results'),{recursive:true});
  fs.writeFileSync(path.resolve(__dirname,`../../test-results/w227-cold-static-${width}.json`),
   JSON.stringify({source:'original-running-scene',
    runtime:'Chromium SwiftShader software WebGL; hardware FPS not measured',
    ...audited},null,2));
  await page.screenshot({path:path.resolve(__dirname,`../../test-results/w227-cold-static-${width}.png`)});
  expect(audited.profile.source).toBe('real-cold-static-stage-profile');
  expect(audited.profile.builds).toBeGreaterThanOrEqual(1);
  expect(audited.profile.last.totalMs).toBeGreaterThanOrEqual(0);
  for(const key of ['terrainBaseMs','landscapeMs','homeMs','civicMs','packUploadMs'])
   expect(Number.isFinite(audited.profile.last[key]),key).toBe(true);
  // The source-exact W462 seasonal landscape prewarm eliminates the cold
  // terrain source entirely: zero 'copy avoided' bookkeeping is CORRECT.
  // Assert a genuinely complete original terrain source by either path.
  if(audited.landscapePrewarm.completed>0){
   expect(audited.landscapePrewarm.failures).toBe(0);
   expect(audited.landscapeSourceHash).toMatch(/^[0-9a-f]{8}$/);
  }else{
   expect(audited.profile.avoidedTerrainSourceCopies).toBeGreaterThanOrEqual(1);
   expect(audited.profile.avoidedTerrainFloats).toBeGreaterThan(0);
  }
  expect(audited.people).toBeGreaterThanOrEqual(12);
  expect(audited.homes).toBeGreaterThanOrEqual(12);
  expect(audited.geometry.lastFrameTriangles).toBeGreaterThan(0);
  expect(audited.geometry.lastFrameTriangles).toBeLessThan(160000);
  expect(audited.width).toBeLessThanOrEqual(width);
  expect(audited.gl).toBe(0);
  expect(errors).toEqual([]);
 });
}
