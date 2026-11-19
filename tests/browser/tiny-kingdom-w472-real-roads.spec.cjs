'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [390,1024]){
 test('W472 real village lanes and complete Day121 original population '+width,async({page})=>{
  test.setTimeout(540000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:180000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w472');
  fs.mkdirSync(dir,{recursive:true});
  async function capture(label){
   const row=await page.evaluate(()=>{
    const g=window.__tinyKingdom,stats=g.renderStats();
    return {day:g.metrics().day,citizens:g.metrics().citizens,
     buildings:g.metrics().buildings,checksum:g.exportSnapshot().checksum,
     road:g.getGradedRoadAudit(),triangles:stats.lastFrameTriangles,
     fullSceneTriangles:stats.lastFrameFullSceneTriangles,
     droppedPlots:g.getFarmFieldResidencyAudit().sceneBudget.droppedPlotsForBudget,
     webglError:document.getElementById('world').getContext('webgl')?.getError()??-1,
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   expect(row.road.classes.village).toBeGreaterThan(100);
   expect(row.road.classes.village).toBeLessThan(160);
   expect(row.citizens).toBeGreaterThanOrEqual(12);
   expect(row.triangles).toBeGreaterThan(0);
   expect(row.triangles).toBeLessThan(160000);
   expect(row.droppedPlots).toBe(0);
   expect(row.webglError).toBe(0);
   expect(row.overflow).toBeLessThanOrEqual(0);
   await page.screenshot({path:path.join(dir,width+'-'+label+'.png')});
   return row;
  }
  const opening=await capture('day1-village-streets');
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<12000;i++)g.step(.24);
   g.setSpeed(0);
   return {checksum:g.exportSnapshot().checksum,day:g.metrics().day};
  });
  expect(grown.day).toBeGreaterThanOrEqual(120);
  await page.waitForTimeout(3000);
  const ending=await capture('day121-village-streets');
  expect(ending.checksum).toBe(grown.checksum);
  expect(ending.citizens).toBeGreaterThanOrEqual(opening.citizens);
  expect(ending.buildings).toBeGreaterThanOrEqual(opening.buildings);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(dir,width+'-audit.json'),JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',
   viewport:width,opening,grown,ending,errors,
   physicalDesktopGpuFps:'NOT MEASURED',physicalMobileGpuFps:'NOT MEASURED',
   blindedCritic:'NOT PROVEN',completeFarmToHomeWitness:'NOT PROVEN'
  },null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(dir,width+'-actual-playable.webm'));
 });
}
