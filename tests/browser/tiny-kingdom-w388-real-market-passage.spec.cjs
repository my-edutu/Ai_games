'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W388 actual receiving-market connection '+viewport.width,async({page})=>{
  test.setTimeout(210000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
   null,{timeout:150000});
  const seen=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {district:g.getGrainwardDistrictAudit(),
    scene:g.renderStats(),metrics:g.metrics(),
    error:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const lane=seen.district.trueReceivingPassage;
  expect(lane).toBeTruthy();
  expect(lane.from[0]).toBe(-1);
  expect(lane.from[1]).toBeCloseTo(6.4,5);
  expect(lane.to).toEqual(seen.district.trueMarketDestination);
  expect(lane.sections).toBe(11);
  expect(lane.wheelPassages).toBe(22);
  expect(lane.drainageRibbons).toBe(22);
  expect(lane.connectedToTrueFreightEnd).toBe(true);
  expect(lane.geometryReplacedNotAdded).toBe(true);
  expect(lane.newCitizens).toBe(0);
  expect(lane.newTransactions).toBe(0);
  expect(lane.affectsNavigation).toBe(false);
  expect(lane.additionalGpuBuffers).toBe(0);
  expect(seen.metrics.citizens).toBe(12);
  expect(seen.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(seen.error).toBe(0);
  expect(seen.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const folder='artifacts/tiny-kingdom-w388-route';
  fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:folder+'/'+viewport.width+'-real-market.png'});
  fs.writeFileSync(folder+'/'+viewport.width+'-route.json',JSON.stringify(seen,null,2));
 });
}