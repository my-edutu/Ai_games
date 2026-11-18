'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W440 Day1 and Day121 genuine market-home district, full city reversible '+width,async({page})=>{
  test.setTimeout(480000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:150000});
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w440');
  fs.mkdirSync(root,{recursive:true});
  const start=await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0);return {
   day:g.metrics().day,checksum:g.exportSnapshot().checksum,
   town:g.getSettlementOverviewPlanAudit(),trade:g.getMarketHomeDistrictPlanAudit()};});
  expect(start.day).toBe(1);expect(start.trade.realHomes).toBe(start.town.actualHomes);
  await page.locator('#camera-disclosure').click();
  await expect(page.locator('#camera-market-homes')).toBeVisible();
  await page.locator('#camera-market-homes').click();
  await page.waitForTimeout(2400);
  await page.screenshot({path:path.join(root,width+'-day1-real-market-homes.png')});
  const first=await page.evaluate(()=>{const g=window.__tinyKingdom;return {
   checksum:g.exportSnapshot().checksum,stage:g.getRealEconomicSurveyAudit().last,
   camera:g.getCamera(),triangles:g.renderStats().lastFrameTriangles};});
  expect(first.checksum).toBe(start.checksum);
  expect(first.stage.stage).toBe('market-home-district');expect(first.stage.physicalSafe).toBe(true);
  expect(first.triangles).toBeGreaterThan(0);expect(first.triangles).toBeLessThan(160000);
  const grown=await page.evaluate(()=>{const g=window.__tinyKingdom;
   for(let i=0;i<12000;i++)g.step(.24);g.setSpeed(0);return {
    day:g.metrics().day,checksum:g.exportSnapshot().checksum,
    people:g.metrics().citizens,town:g.getSettlementOverviewPlanAudit(),
    trade:g.getMarketHomeDistrictPlanAudit()};});
  expect(grown.day).toBeGreaterThanOrEqual(120);
  expect(grown.trade.realHomes).toBeGreaterThanOrEqual(start.trade.realHomes);
  expect(grown.trade.zoom).toBeLessThan(grown.town.zoom);
  expect(grown.trade.districtHomeCount).toBe(3);
  expect(grown.trade.zoom).toBeLessThanOrEqual(width===390?35:30);
  expect(grown.trade.actualBuildingsUnchanged).toBe(true);
  expect(grown.trade.newCitizens).toBe(0);
  await page.locator('#camera-disclosure').click();
  await expect(page.locator('#camera-market-homes')).toBeVisible();
  await page.locator('#camera-market-homes').click();
  await page.waitForTimeout(3400);
  await page.screenshot({path:path.join(root,width+'-day121-actual-lived-market-homes.png')});
  const district=await page.evaluate(()=>{const g=window.__tinyKingdom;
   return {checksum:g.exportSnapshot().checksum,day:g.metrics().day,
    camera:g.getCamera(),stage:g.getRealEconomicSurveyAudit().last,
    triangles:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};});
  expect(district.checksum).toBe(grown.checksum);
  expect(district.stage.physicalSafe).toBe(true);
  expect(district.stage.districtHomeCount).toBeGreaterThan(0);
  expect(district.camera.zoom).toBeLessThan(grown.town.zoom+2);
  expect(district.camera.zoom).toBeLessThanOrEqual(width===390?38:33);
  expect(district.triangles).toBeGreaterThan(0);expect(district.triangles).toBeLessThan(160000);
  expect(district.gl).toBe(0);expect(district.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.locator('#camera-disclosure').click();
  await expect(page.locator('#camera-home')).toBeVisible();
  await page.locator('#camera-home').click();
  await page.waitForTimeout(3200);
  const ended=await page.evaluate(()=>{const g=window.__tinyKingdom;
   return {checksum:g.exportSnapshot().checksum,camera:g.getCamera(),
    triangles:g.renderStats().lastFrameTriangles,people:g.metrics().citizens};});
  expect(ended.checksum).toBe(grown.checksum);
  expect(ended.camera.zoom).toBeGreaterThan(district.camera.zoom);
  expect(ended.triangles).toBeLessThan(160000);
  await page.screenshot({path:path.join(root,width+'-day121-original-full-town-return.png')});
  fs.writeFileSync(path.join(root,width+'-proof.json'),JSON.stringify({
   actualDay:grown.day,realHomes:grown.trade.realHomes,realPeople:ended.people,
   originalFullTown:grown.town,realEconomicDistrict:grown.trade,
   physicalCamera:district.camera,triangles:district.triangles,glError:district.gl,
   pageErrors:errors,unchangedAuthoritativeSnapshot:grown.checksum===ended.checksum,
   softwareWebGL:true,physicalHardwareFPS:'NOT MEASURED',
   independentBlindAB:'NOT PROVEN',experienceGate:'NOT PROVEN'
  },null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(root,width+'-original-uncut-real-game.webm'));
 });
}