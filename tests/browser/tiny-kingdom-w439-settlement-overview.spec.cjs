'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W439 genuine Day1 to Day121 constructed-city overview at '+width,async({page})=>{
  test.setTimeout(420000);
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:150000});
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w439');
  fs.mkdirSync(root,{recursive:true});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const checksum=g.exportSnapshot().checksum;
   const plan=g.getSettlementOverviewPlanAudit();
   const lens=g.getPhysicalProjectionAudit();
   document.getElementById('camera-home').click();
   return {day:g.metrics().day,checksum,plan,lens};
  });
  expect(first.day).toBe(1);
  expect(first.plan.actualHomes).toBeGreaterThan(0);
  expect(first.plan.authorityMutated).toBe(false);
  if(width===390)expect(first.lens.horizontalDegrees).toBeGreaterThanOrEqual(49.5);
  await page.waitForTimeout(2200);
  await page.screenshot({path:path.join(root,width+'-day1-actual-town-overview.png')});
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<12000;i++)g.step(.24);
   const checksum=g.exportSnapshot().checksum;
   const before=g.metrics();
   const plan=g.getSettlementOverviewPlanAudit();
   document.getElementById('camera-home').click();
   return {checksum,before,plan};
  });
  expect(grown.before.day).toBeGreaterThanOrEqual(120);
  expect(grown.plan.actualHomes).toBeGreaterThanOrEqual(first.plan.actualHomes);
  expect(grown.plan.zoom).toBeGreaterThanOrEqual(first.plan.zoom);
  expect(grown.plan.newRenderMeshes).toBe(0);
  await page.waitForTimeout(3500);
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {checksum:g.exportSnapshot().checksum,metrics:g.metrics(),
    camera:g.getCamera(),lens:g.getPhysicalProjectionAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(after.checksum).toEqual(grown.checksum);
  expect(after.metrics.day).toEqual(grown.before.day);
  expect(after.triangles).toBeGreaterThan(0);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  if(width===390){
   expect(after.lens.horizontalDegrees).toBeGreaterThanOrEqual(49.5);
   expect(after.camera.zoom).toBeGreaterThanOrEqual(Math.min(84,grown.plan.zoom)-2);
  }
  await page.screenshot({path:path.join(root,width+'-day121-actual-town-overview.png')});
  fs.writeFileSync(path.join(root,width+'-proof.json'),
   JSON.stringify({sourceCommit:process.env.GITHUB_SHA||'local',
    input:'real-authoritative-fixed-step-day1-to-day121',day:after.metrics.day,
    realHomes:grown.plan.actualHomes,realPeople:after.metrics.population,
    plan:grown.plan,actualLens:after.lens,triangles:after.triangles,
    gl:after.gl,errors,authorityChecksumUnchangedByCamera:after.checksum===grown.checksum,
    hardwareFps:'NOT MEASURED',independentBlindedAB:'NOT PROVEN',
    substantialTransformation:'NOT PROVEN'},null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(root,width+'-real-original-game-uncut.webm'));
 });
}
