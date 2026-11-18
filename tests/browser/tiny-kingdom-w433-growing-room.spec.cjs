'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W433 real grown-home rooms and 120-day original town at '+width,async({page})=>{
  test.setTimeout(420000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:150000});
  const api=await page.evaluate(()=>{
   const game=window.__tinyKingdom;game.setSpeed(0);
   const initial=game.exportSnapshot();
   return {initial,day:game.metrics().day,buildings:game.metrics().buildings,
    firstSource:game.getCompactOccupiedRoomAudit()};
  });
  expect(api.day).toBe(1);
  expect(api.initial).toBeTruthy();
  // Advance the SAME authoritative world, never spawn a staged fake household.
  const result=await page.evaluate(()=>{
   const game=window.__tinyKingdom;
   for(let i=0;i<12000;i++)game.step(.24);
   return {day:game.metrics().day,buildings:game.metrics().buildings,
    compact:game.getCompactOccupiedRoomAudit(),
    houses:game.getInhabitedSkylineAudit().lots,
    snapshot:game.exportSnapshot()};
  });
  expect(result.day).toBeGreaterThanOrEqual(120);
  expect(result.buildings).toBeGreaterThanOrEqual(api.buildings);
  expect(result.houses.length).toBeGreaterThanOrEqual(12);
  // Existing original town keeps all people and their real homes; this
  // retained geometry must emit whenever genuine grown homes are drawn.
  await page.evaluate(()=>{
   const game=window.__tinyKingdom;
   const grow=game.getInhabitedSkylineAudit().lots.filter(h=>h.compact);
   if(grow.length){
    const home=grow[0];
    game.setCamera({yaw:Math.PI,pitch:.32,zoom:7.5,focus:[home.x,home.z]});
   }
  });
  await page.waitForTimeout(3000);
  const after=await page.evaluate(()=>{
   const game=window.__tinyKingdom;
   return {audit:game.getCompactOccupiedRoomAudit(),
    stats:game.renderStats(),
    metrics:game.metrics(),
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth,
    checksum:game.exportSnapshot().checksum};
  });
  expect(after.metrics.day).toBeGreaterThanOrEqual(120);
  expect(after.audit.currentOriginalHouseholds).toBe(result.houses.length);
  expect(after.audit.modifiedEconomy).toBe(false);
  expect(after.stats.lastFrameTriangles).toBeLessThan(160000);
  expect(after.stats.lastFrameTriangles).toBeGreaterThan(0);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w433');
  fs.mkdirSync(root,{recursive:true});
  await page.screenshot({path:path.join(root,width+'-real-grown-town.png')});
  fs.writeFileSync(path.join(root,width+'-real-grown-town-proof.json'),
   JSON.stringify({viewport:width,sourceWorld:'unchanged-original-seed-steps',
    day:after.metrics.day,households:result.houses.length,
    actualCompactHomes:result.houses.filter(h=>h.compact).length,
    originalRoom:after.audit,submittedTriangles:after.stats.lastFrameTriangles,
    gl:after.gl,errors,sourceCommit:process.env.GITHUB_SHA||'local-branch',
    nativeHardwareFps:'NOT MEASURED',independentBlindedAB:'NOT PROVEN'},null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(root,width+'-real-grown-town-uncut.webm'));
 });
}
