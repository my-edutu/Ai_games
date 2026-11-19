'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [390,1024]){
 test('W469 player arms a REAL farmer workday; no synthetic crop, courier or receipt '+width,async({page})=>{
  test.setTimeout(540000);
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:180000});
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w469');
  fs.mkdirSync(root,{recursive:true});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const before=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum);
  await page.locator('#world-trace-toggle').click();
  const target=page.locator('#world-trace-arm');
  expect(await target.isVisible()).toBe(true);
  const bounds=await target.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await target.click();
  const initial=await page.evaluate(()=>({
   queue:window.__tinyKingdom.getGrainObservationQueueAudit(),
   checksum:window.__tinyKingdom.exportSnapshot().checksum
  }));
  expect(initial.checksum).toBe(before); // presentation NEVER changes seeded authority
  expect(initial.queue.armed||initial.queue.tracking).toBe(true);
  expect(initial.queue.createdDeliveries).toBe(0);
  expect(initial.queue.addedInventory).toBe(0);
  const advance=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const events=[];
   let steps=0;
   while(!g.getGrainObservationQueueAudit().tracking&&steps<1800){
    g.step(.24); // same real authority rules, no state injection, deterministic
    g.advanceQueuedGrainObservation(); // camera observer only
    steps++;
    if(steps%120===0)events.push({
     day:g.metrics().day,activeFarmers:g.getSupplyTrailSnapshot().farmer,
     loaded:g.getActiveDeliveries().filter(d=>d.resource==='food').length});
   }
   return {steps,events,queue:g.getGrainObservationQueueAudit(),
    realFarmer:g.getRealGrainJourneyAudit(),
    checksum:g.exportSnapshot().checksum,world:g.metrics()};
  });
  expect(advance.queue.tracking).toBe(true);
  expect(advance.queue.armed).toBe(false);
  expect(advance.queue.successfulActualObservations).toBe(1);
  expect(advance.realFarmer.active).toBe(true);
  expect(advance.realFarmer.producer).toBeTruthy();
  expect(advance.realFarmer.noCreatedActors).toBe(true);
  expect(advance.realFarmer.noCreatedTransactions).toBe(true);
  const camera=await page.evaluate(()=>window.__tinyKingdom.getCamera());
  expect(camera.follow).toBe(true);
  // From here the recording observes ordinary uninterrupted live simulation,
  // not a scripted / teleported parcel. It is only a sample, NOT a full day.
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(16));
  await page.waitForTimeout(11000);
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  await page.waitForTimeout(1000);
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {world:g.metrics(),queue:g.getGrainObservationQueueAudit(),
    journey:g.getRealGrainJourneyAudit(),
    chain:g.getGrainProofStripAudit(),
    camera:g.getCamera(),selected:g.getSelectedCitizen(),
    activeDeliveries:g.getActiveDeliveries(),receipts:g.getDeliveryReceipts(),
    workers:g.getActiveWorksites(),worksite:g.getWorksiteChoreography(),
    pose:g.getWorkdayRenderStats(),realHandoffs:g.getMarketHandoffRenderStats(),
    stats:g.renderStats(),overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    checksum:g.exportSnapshot().checksum};
  });
  expect(observed.queue.tracking).toBe(true);
  expect(observed.queue.createdDeliveries).toBe(0);
  expect(observed.queue.inventedCitizens).toBe(0);
  expect(observed.stats.lastFrameTriangles).toBeGreaterThan(0);
  expect(observed.stats.lastFrameTriangles).toBeLessThan(160000);
  expect(observed.gl).toBe(0);
  expect(observed.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(root,width+'-actual-farmer-workday.png')});
  const beforeStop=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum);
  await target.click();
  const stopped=await page.evaluate(()=>({
   audit:window.__tinyKingdom.getGrainObservationQueueAudit(),
   checksum:window.__tinyKingdom.exportSnapshot().checksum}));
  expect(stopped.audit.tracking).toBe(false);
  expect(stopped.audit.armed).toBe(false);
  expect(stopped.checksum).toBe(beforeStop);
  fs.writeFileSync(path.join(root,width+'-truthful-workday-audit.json'),
    JSON.stringify({sourceCommit:process.env.GITHUB_SHA||'local',
      capture:'real moving game; 11-second post-selection excerpt, NOT full handoff',
      preRollUsesOriginalAuthoritativeStep:true,
      fullDayUninterrupted:'NOT PROVEN',nativeHardwareFps:'NOT MEASURED',
      independentBlindedReview:'NOT PROVEN',comparisonWithG088:'NOT PROVEN',
      initial,advance,observed,stopped,pageErrors:errors},null,2));
  const movie=page.video();await page.close();
  if(movie)await movie.saveAs(path.join(root,width+'-actual-workday-excerpt.webm'));
 });
}
