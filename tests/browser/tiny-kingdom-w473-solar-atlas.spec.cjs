'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// Use a dedicated context per viewport: setViewportSize AFTER the page fixture
// was created produced cropped 800x450 WebM while claiming 390x844 footage.
for(const width of [1024,390]){
 test('W473 same-world native shadow-atlas candidate and Day121 original citizens '+width,async({browser})=>{
  test.setTimeout(540000);
  const errors=[];
  const height=width===390?844:768;
  const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w473');
  fs.mkdirSync(dir,{recursive:true});
  const context=await browser.newContext({
   viewport:{width,height},deviceScaleFactor:1,
   recordVideo:{dir,size:{width,height}}
  });
  const page=await context.newPage();
  // Register before navigation, but only after the page exists. Previously
  // this threw a ReferenceError before any real WebGL capture could start.
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:180000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   // An actual daytime world is required for a non-empty solar shadow.
   for(let i=0;i<22;i++)g.step(.24);
   g.setSpeed(0);
  });
  await page.waitForTimeout(1500);
  async function audit(){
   return page.evaluate(()=>{
    const g=window.__tinyKingdom,s=g.renderStats(),m=g.metrics(),
     a=g.getSolarShadowAtlasAudit();
    return {day:m.day,citizens:m.citizens,buildings:m.buildings,
     checksum:g.exportSnapshot().checksum,
     atlas:a,issuedTriangles:s.lastFrameTriangles,
     fullSceneTriangles:s.lastFrameFullSceneTriangles,
     webglError:document.getElementById('world').getContext('webgl')?.getError()??-1,
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
  }
  const before=await audit();
  expect(before.atlas.enabled).toBe(false);
  await page.screenshot({path:path.join(dir,width+'-same-world-legacy.png')});
  await page.evaluate(()=>window.__tinyKingdom.setSolarShadowAtlasForTesting(true));
  await page.waitForFunction(()=>window.__tinyKingdom?.getSolarShadowAtlasAudit().uploads>=1,null,{timeout:120000});
  const candidate=await audit();
  await page.screenshot({path:path.join(dir,width+'-same-world-atlas.png')});
  expect(candidate.checksum).toBe(before.checksum);
  expect(candidate.citizens).toBe(before.citizens);
  expect(candidate.buildings).toBe(before.buildings);
  expect(candidate.atlas.enabled).toBe(true);
  expect(candidate.atlas.textureCreated).toBe(true);
  expect(candidate.atlas.textureBytes).toBe(384*384*4);
  expect(candidate.atlas.realStaticCasters).toBeGreaterThan(20);
  expect(candidate.atlas.darkenedTexels).toBeGreaterThan(100);
  expect(candidate.atlas.staticShadowGeometrySubmitted).toBe(0);
  expect(candidate.issuedTriangles).toBeLessThan(160000);
  expect(candidate.webglError).toBe(0);
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<12000;i++)g.step(.24);
   g.setSpeed(0);
   return {checksum:g.exportSnapshot().checksum,day:g.metrics().day};
  });
  expect(grown.day).toBeGreaterThanOrEqual(120);
  await page.waitForTimeout(3500);
  const ending=await audit();
  await page.screenshot({path:path.join(dir,width+'-day121-atlas.png')});
  expect(ending.checksum).toBe(grown.checksum);
  expect(ending.citizens).toBeGreaterThanOrEqual(28);
  expect(ending.buildings).toBeGreaterThanOrEqual(35);
  expect(ending.atlas.uploads).toBeGreaterThan(candidate.atlas.uploads);
  expect(ending.issuedTriangles).toBeGreaterThan(0);
  expect(ending.issuedTriangles).toBeLessThan(160000);
  expect(ending.webglError).toBe(0);
  expect(ending.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(dir,width+'-audit.json'),JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',
   backend:'CI SwiftShader; forced atlas candidate (native hardware defaults atlas on)',
   legacy:before,candidate,grown,ending,errors,
   fpsDesktopHardware:'NOT MEASURED',fpsMobileHardware:'NOT MEASURED',
   experienceTransformation:'NOT PROVEN',critic:'UNAVAILABLE',
   recordedCompleteFarmerMarketHomeHandoff:'NOT PROVEN'
  },null,2));
  const video=page.video();
  await page.close();
  if(video)await video.saveAs(path.join(dir,width+'-actual-playable.webm'));
  await context.close();
 });
}
