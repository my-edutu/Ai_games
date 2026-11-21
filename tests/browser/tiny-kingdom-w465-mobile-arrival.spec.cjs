'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [390,1024]){
 test('W465 genuine Day1 mobile market arrival / Day121 full original town '+width,async({page})=>{
  test.setTimeout(540000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:180000});
  const g=()=>window.__tinyKingdom;
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w465');
  fs.mkdirSync(root,{recursive:true});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const opening=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getOriginalMobileMarketArrivalAudit(),
    snapshot:g.exportSnapshot().checksum,camera:g.getCamera(),
    metrics:g.metrics(),triangles:g.renderStats().lastFrameTriangles,
    fullSceneTriangles:g.renderStats().lastFrameFullSceneTriangles,
    viewBudget:g.renderStats().viewFarmBudgetAudit,
    fieldBudget:g.getFarmFieldResidencyAudit().sceneBudget,
    preflight:g.getCooperativeFirstSceneAudit(),
    loadingHidden:document.getElementById('kingdom-stage-status').hidden,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(opening.metrics.day).toBe(1);
  expect(opening.metrics.citizens).toBeGreaterThanOrEqual(12);
  expect(opening.metrics.buildings).toBeGreaterThanOrEqual(12);
  expect(opening.triangles).toBeGreaterThan(0);
  expect(opening.triangles).toBeLessThan(160000);
  expect(opening.loadingHidden).toBe(true);
  expect(opening.viewBudget.source).toBe('actual-retained-frustum-issued-scene-budget');
  expect(opening.viewBudget.issuedViewTriangles).toBe(opening.triangles);
  expect(opening.viewBudget.viewBudgetBreached).toBe(false);
  expect(opening.fullSceneTriangles).toBeGreaterThanOrEqual(opening.triangles-opening.viewBudget.bridgedStaticTriangles);
  expect(opening.fieldBudget.droppedPlotsForBudget).toBe(0);
  expect(opening.gl).toBe(0);
  expect(opening.overflow).toBeLessThanOrEqual(0);
  if(width===390){
   expect(opening.audit.attempted).toBe(true);
   expect(opening.audit.applied).toBe(true);
   expect(opening.audit.cameraOnly).toBe(true);
   expect(opening.audit.authoritativeChanges).toBe(false);
   expect(opening.audit.visibleOccupiedHomeLots.length).toBe(3);
   // W470: a physically clear camera is insufficient if it only films roofs.
   // Inspect the REAL receiving dock projection and genuine worker evidence,
   // rather than accepting first unoccluded orbit or manufacturing inhabitants.
   const composition=opening.audit.composition;
   expect(composition.source).toBe('w470-original-physical-market-workday-composition');
   expect(composition.physicallySurveyedAngles).toBe(14);
   expect(composition.safeMarketCompositions).toBeGreaterThan(0);
   expect(composition.realMarketOnScreen).toBe(true);
   expect(typeof composition.realMarketRayClear).toBe('boolean');
   expect(typeof composition.originalHomeOnScreen).toBe('boolean');
   expect(composition.actualCitizensInFrame).toBeGreaterThanOrEqual(0);
   expect(composition.noActorsOrGoodsCreated).toBe(true);
   expect(composition.hardwareFPS).toBe('NOT MEASURED');

   expect(opening.camera.zoom).toBeLessThan(40);
   const touch=await page.locator('#camera-market-homes').boundingBox();
   expect(touch?.width).toBeGreaterThanOrEqual(44);
   expect(touch?.height).toBeGreaterThanOrEqual(44);
  }else expect(opening.audit.applied).toBe(false);
  await page.screenshot({path:path.join(root,width+'-day1-true-market-homes-arrival.png')});
  await page.locator('#camera-disclosure').click();
  await page.locator('#camera-home').click();
  await page.waitForTimeout(2500);
  const overview=await page.evaluate(()=>({
   snapshot:window.__tinyKingdom.exportSnapshot().checksum,
   camera:window.__tinyKingdom.getCamera()}));
  expect(overview.snapshot).toBe(opening.snapshot);
  if(width===390)expect(overview.camera.zoom).toBeGreaterThan(opening.camera.zoom);
  await page.screenshot({path:path.join(root,width+'-day1-real-town-overview.png')});
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<12000;i++)g.step(.24);
   g.setSpeed(0);
   return {checksum:g.exportSnapshot().checksum,metrics:g.metrics(),
    overview:g.getSettlementOverviewPlanAudit(),
    arrival:g.getOriginalMobileMarketArrivalAudit()};
  });
  expect(grown.metrics.day).toBeGreaterThanOrEqual(120);
  expect(grown.metrics.buildings).toBeGreaterThanOrEqual(opening.metrics.buildings);
  await page.waitForTimeout(2500);
  const ending=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {
   checksum:g.exportSnapshot().checksum,
   triangles:g.renderStats().lastFrameTriangles,
   fullSceneTriangles:g.renderStats().lastFrameFullSceneTriangles,
   viewBudget:g.renderStats().viewFarmBudgetAudit,
   fieldBudget:g.getFarmFieldResidencyAudit().sceneBudget,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(ending.checksum).toBe(grown.checksum);
  expect(ending.triangles).toBeGreaterThan(0);
  expect(ending.triangles).toBeLessThan(160000);
  expect(ending.viewBudget.source).toBe('actual-retained-frustum-issued-scene-budget');
  expect(ending.viewBudget.issuedViewTriangles).toBe(ending.triangles);
  expect(ending.viewBudget.viewBudgetBreached).toBe(false);
  expect(ending.fullSceneTriangles).toBeGreaterThanOrEqual(ending.triangles-ending.viewBudget.bridgedStaticTriangles);
  expect(ending.fieldBudget.droppedPlotsForBudget).toBe(0);
  expect(ending.fieldBudget.originalPlotsPreserved).toBe(true);
  expect(ending.gl).toBe(0);expect(ending.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(root,width+'-day121-uncut-populated-town.png')});
  fs.writeFileSync(path.join(root,width+'-audit.json'),JSON.stringify({
   commit:process.env.GITHUB_SHA||'local',workload:'original seeded playable WebGL world',
   opening,overview,grown,ending,pageErrors:errors,
   realHardwareFPS:'NOT MEASURED',independentBlindAB:'NOT PROVEN',
   experienceA:'NOT PROVEN',commercialB:'FAIL'
  },null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(root,width+'-uncut-real-world.webm'));
 });
}
