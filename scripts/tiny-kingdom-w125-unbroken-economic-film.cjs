'use strict';
/*
 * W125 — real uninterrupted accelerated simulation recording.
 * No synthetic people, stock, schedules, receipts, seeded overrides or
 * favorable run selection. Start from the actual original reset/seed 83127.
 * Every step executes the shipped authoritative browser g.step(1/30).
 * Video is one continuous browser recording (including initialization).
 * SwiftShader results cannot be passed off as real hardware GPU performance.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.resolve('public/tiny-kingdom/index.html'),'utf8');
const out=path.resolve('artifacts/tiny-kingdom-w125-economic-chain');
fs.mkdirSync(out,{recursive:true});
const LIMIT_DAYS=Math.min(160,Math.max(30,Number(process.env.TINY_W125_FILM_DAYS||80)));
const STEP=1/30,DAY_STEPS=24*30;
const profiles=[
 {name:'desktop',viewport:{width:1024,height:640}},
 {name:'mobile',viewport:{width:390,height:844}}
];
const manifest={
 version:'w125-authentic-uncut-accelerated-fixed-step-v1',
 sourceSha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 pinnedG088:'2f6deb43feb1a1557848d44def53a6109deb1ab1',
 simulatedLimitDays:LIMIT_DAYS,
 renderer:'SwiftShader software WebGL only — not hardware GPU',
 recordings:{},overall:'UNVERIFIED',
 limitations:[
  'One continuous unedited browser video per viewport, including load pre-roll',
  'Time-lapse: 30Hz genuine rules advanced in <=1h batches (<=0.5h on an active transfer) between actual rendered frames',
  'No actor insertion, manual inventory changes, time travel, seed edits or forced purchases',
  'Camera observes active citizens; camera attention does not alter economics',
  'This is not uninterrupted 30Hz video of every simulated frame',
  'A PASS requires one matching real positive farmer harvest, loaded road journey, unload, receipt, staffed market transfer and home meal',
  'W267 added real market shelf snapshots log true stored receipt remainder; not a blinded hardware evaluation'
 ]
};
function write(){fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(manifest,null,2)+'\n')}
function recordEvent(byId,id,kind,event){
 if(!id)return;
 if(!byId.has(id))byId.set(id,{id,events:{}});
 const row=byId.get(id);
 if(!row.events[kind])row.events[kind]=event;
}
async function film(browser,profile){
 const {name,viewport}=profile;
 const context=await browser.newContext({viewport,recordVideo:{dir:out,size:viewport}});
 const page=await context.newPage();page.setDefaultTimeout(120000);
 const result={status:'INCOMPLETE',viewport,chain:null,checkedTicks:0,
  stages:{},errors:[],clip:name+'-original-uncut.webm',screenshots:[]};
 page.on('pageerror',error=>result.errors.push('page '+error.message));
 page.on('console',message=>{if(message.type()==='error')
  result.errors.push('console '+message.text().slice(0,200))});
 const byId=new Map();
 try{
  await page.setContent(html,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__tinyKingdom&&
   window.__tinyKingdom.renderStats().lastFrameTriangles>0,null,{timeout:120000});
  const renderer=await page.evaluate(()=>window.__tinyKingdom.renderer());
  assert.equal(renderer,'webgl','Actual WebGL unavailable for '+name);
  await page.locator('#pause').click();
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.reset();g.setCamera({focus:[18,1],yaw:.74,pitch:.57,zoom:16});
   return {seed:g.exportSnapshot().payload.seed,
    checksum:g.exportSnapshot().checksum,time:g.exportSnapshot().payload.state.t,
    citizens:g.metrics().citizens};
  });
  result.initial=initial;
  await page.screenshot({path:path.join(out,name+'-first-farm.png')});
  result.screenshots.push(name+'-first-farm.png');
  let followed=null,stage='farm';
  const totalSteps=LIMIT_DAYS*DAY_STEPS;
  while(result.checkedTicks<totalSteps){
   const busy=stage==='courier'||stage==='unload'||stage==='trade';
   // Keep every original farmer work event in the bounded 12-entry workday
   // log even in a 28-resident mature village: sample no slower than 1h.
   const n=Math.min(busy?15:30,totalSteps-result.checkedTicks);
   const observed=await page.evaluate(n=>{
    const g=window.__tinyKingdom;
    for(let i=0;i<n;i++)g.step(1/30);
    const snapshot=g.exportSnapshot(),metrics=g.metrics();
    return {time:snapshot.payload.state.t,checksum:snapshot.checksum,metrics,
     work:g.getWorkdayEvents(),loads:g.getActiveDeliveries(),
     handoffs:g.getMarketHandoffs(),receipts:g.getDeliveryReceipts(),
     trades:snapshot.payload.state.householdTrades||[],
     meals:snapshot.payload.state.householdMeals||[],
     provision:g.getHouseholdProvisionAudit(),
     truth:g.getReceiptHouseholdAudit(),
     negative:metrics.food<0||metrics.wood<0||metrics.gold<0,
     navigation:g.getNavigation()};
   },n);
   result.checkedTicks+=n;
   assert(!observed.negative,'Authoritative resource below zero');
   for(const d of observed.loads)if(d.job==='farmer'&&d.resource==='food'){
    // Tie the SAME cargo ID to the genuine positive farmer work() event
    // that immediately preceded startActualDelivery; do not infer a harvest
    // from decorative field meshes or a scripted actor.
    const source=observed.work.find(e=>e.job==='farmer'&&
     e.citizen===d.citizen&&e.delta.food>0&&
     Math.abs(e.time-d.started)<.00001);
    if(source)recordEvent(byId,d.id,'harvest',{citizen:source.citizen,
     time:source.time,amount:source.delta.food,at:[source.x,source.z]});
    recordEvent(byId,d.id,'load',{citizen:d.citizen,amount:d.amount,
     time:d.started,position:[d.x,d.z],stage:d.stage});
    if(d.stage==='unloading')recordEvent(byId,d.id,'unload',{
     citizen:d.citizen,time:observed.time,position:[d.x,d.z]});
    if(!followed&&stage==='farm'){
     followed=d.id;stage='courier';
     await page.evaluate(id=>window.__tinyKingdom.watchDelivery(id),d.id);
     result.stages.courierFollowed=followed;
     await page.screenshot({path:path.join(out,name+'-loaded-road.png')});
     result.screenshots.push(name+'-loaded-road.png');
    }
   }
   for(const handoff of observed.handoffs)
    if(handoff.job==='farmer'&&handoff.resource==='food')
     recordEvent(byId,handoff.id,'unload',{citizen:handoff.citizen,
      time:observed.time,position:[handoff.x,handoff.z]});
   for(const r of observed.receipts)
    if(r.job==='farmer'&&r.resource==='food'&&r.creditedAtUnloading){
     recordEvent(byId,r.id,'receipt',{
      citizen:r.citizen,amount:r.amount,time:r.time,
      at:r.destination});
     if(r.id===followed&&!result.stages.realDockStock){
      // W267: original playable game, actual receipt AFTER credited unloading.
      // Keep spectator optics physical and take a real WebGL screenshot.
      result.stages.realDockStock={receiptId:r.id};
      const dock=await page.evaluate(id=>{
       const g=window.__tinyKingdom;
       const lens=g.getRealMarketReceiptLensForEvidence(id);
       // Inspect the unchanged original world from a genuine credited
       // receipt's physically surveyed trading-court angle. The free-orbit
       // camera may have a different vertical aim from the follow lens;
       // record the survey rather than asserting unmeasured visibility.
       if(lens)g.setCamera({focus:lens.anchor,
        yaw:lens.yaw,pitch:lens.pitch,zoom:lens.zoom});
       const stock=g.getMarketReceiptDisplayAudit();
       const remaining=g.getReceiptHouseholdAudit().outstandingLots
        .find(lot=>lot.id===id)?.remaining??0;
       return {stock,receiptRemaining:remaining,
        checksum:g.exportSnapshot().checksum,
        physicalLensUnavailable:!lens,
        physicalLens:lens?{source:lens.source,receiptId:lens.receiptId,
         yaw:lens.yaw,pitch:lens.pitch,zoom:lens.zoom,
         visibleShelves:lens.visibleShelves,postCover:lens.postCover,
         minHeightFraction:lens.minHeightFraction,
         clearShots:lens.clearShots,checkedShots:lens.checkedShots,
         surveyedEye:lens.eye.slice()}:null};
      },r.id);
      result.stages.realDockStock={receiptId:r.id,...dock};
      await page.waitForTimeout(550);
      const photo=name+'-real-credited-market-shelves.png';
      await page.screenshot({path:path.join(out,photo)});
      result.screenshots.push(photo);
     }
    }
   for(const t of observed.trades){
    recordEvent(byId,t.receiptId,'trade',{
     citizen:t.citizen,amount:t.amount,time:t.time,id:t.id});
    if(result.stages.realDockStock?.receiptId===t.receiptId&&
       !result.stages.realMarketPurchase){
      // Same ACTUAL farmer receipt, purchased by a real named citizen.
      // The rendered stock may include other real receipts, so record the
      // exact tracked lot in addition to bounded whole-shelf bags.
      result.stages.realMarketPurchase={receiptId:t.receiptId};
      const dock=await page.evaluate(id=>{
       const g=window.__tinyKingdom;
       const lens=g.getRealMarketReceiptLensForEvidence(id);
       // Inspect the unchanged original world from a genuine credited
       // receipt's physically surveyed trading-court angle. The free-orbit
       // camera may have a different vertical aim from the follow lens;
       // record the survey rather than asserting unmeasured visibility.
       if(lens)g.setCamera({focus:lens.anchor,
        yaw:lens.yaw,pitch:lens.pitch,zoom:lens.zoom});
       const stock=g.getMarketReceiptDisplayAudit();
       const remaining=g.getReceiptHouseholdAudit().outstandingLots
        .find(lot=>lot.id===id)?.remaining??0;
       return {stock,receiptRemaining:remaining,
        checksum:g.exportSnapshot().checksum,
        physicalLensUnavailable:!lens,
        physicalLens:lens?{source:lens.source,receiptId:lens.receiptId,
         yaw:lens.yaw,pitch:lens.pitch,zoom:lens.zoom,
         visibleShelves:lens.visibleShelves,postCover:lens.postCover,
         minHeightFraction:lens.minHeightFraction,
         clearShots:lens.clearShots,checkedShots:lens.checkedShots,
         surveyedEye:lens.eye.slice()}:null};
      },t.receiptId);
      result.stages.realMarketPurchase={receiptId:t.receiptId,
       buyer:t.citizen,purchased:t.amount,...dock};
      await page.waitForTimeout(550);
      const photo=name+'-real-purchased-market-shelves.png';
      await page.screenshot({path:path.join(out,photo)});
      result.screenshots.push(photo);
     }
   }
   for(const m of observed.meals)recordEvent(byId,m.receiptId,'meal',{
    citizen:m.citizen,amount:m.amount,time:m.time,
    homeIndex:m.homeIndex,id:m.id});
   const complete=[...byId.values()].find(x=>
    ['harvest','load','unload','receipt','trade','meal'].every(k=>x.events[k]));
   if(complete){
    const e=complete.events;
    assert(e.harvest.time<=e.load.time+1e-7,'Load precedes actual harvest');
    assert(e.load.time<=e.unload.time+1e-7,'Unloading predates origin');
    assert(e.unload.time<=e.receipt.time+1e-7,'Receipt predates unloading');
    assert(e.load.time<=e.receipt.time+1e-7,'Receipt predates load');
    assert(e.receipt.time<=e.trade.time+1e-7,'Market sale predates receipt');
    assert(e.trade.time<=e.meal.time+1e-7,'Meal predates purchase');
    result.chain=complete;
    result.finishedAt=observed.time;result.finalChecksum=observed.checksum;
    result.dayReached=Math.floor(observed.time/24)+1;
    stage='home';
    await page.evaluate(x=>{
     const g=window.__tinyKingdom,homes=g.getDailyRhythmAudit().citizens,
      person=homes.find(p=>p.name===x);
     if(person)g.setCamera({focus:person.home,yaw:.76,pitch:.55,zoom:13});
    },e.meal.citizen);
    await page.screenshot({path:path.join(out,name+'-earned-household.png')});
    result.screenshots.push(name+'-earned-household.png');
    await page.waitForTimeout(1100);result.status='PASS';
    break;
   }
   if(stage==='courier'&&followed&&byId.get(followed)?.events.receipt){
    stage='trade';
    await page.evaluate(()=>{
     window.__tinyKingdom.setCamera({focus:[-1,7.5],
      yaw:.65,pitch:.52,zoom:16});
    });
   }
   // The real render loop owns presented video frames; run a bounded
   // real-time beat after each authentic fixed-step batch, not still-image
   // montage stitching.
   await page.waitForTimeout(busy?90:45);
  }
  result.observedLineages=[...byId.values()].slice(0,30);
  if(result.status!=='PASS')
   result.reason='No single observed farmer load, unload, receipt, staffed transfer and home meal chain by Day '+LIMIT_DAYS;
  result.render=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {renderer:g.renderer(),scene:g.getGeometryAudit(),quality:g.renderQuality(),
    frame:g.renderStats(),trueStock:g.getMarketSupplyView(),
    realHousehold:g.getHouseholdProvisionAudit()};
  });
  result.lastFrameError=await page.evaluate(()=>document.getElementById('world').getContext('webgl')?.getError()??-1);
  assert.equal(result.lastFrameError,0,'GL error in final gameplay view');
 }catch(err){result.status='FAIL';result.reason=String(err.stack||err)}
 finally{
  try{await page.waitForTimeout(600)}catch{}
  const video=page.video();
  await context.close();
  try{await video.saveAs(path.join(out,result.clip))}catch(err){
   result.errors.push('video save '+String(err));result.status='FAIL'}
 }
 return result;
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:[
   '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
  ]});
  for(const profile of profiles){
   const result=await film(browser,profile);
   manifest.recordings[profile.name]=result;write();
  }
  manifest.overall=Object.values(manifest.recordings).every(v=>v.status==='PASS')?'PASS':'FAIL';
 }catch(error){manifest.overall='FAIL';manifest.fatal=String(error.stack||error)}
 finally{await browser?.close();write();}
 if(manifest.overall!=='PASS'){
  console.error('W125 full-chain acceptance NOT PROVEN. Inspect '+path.join(out,'evidence.json'));
  process.exitCode=1;
 }else console.log('W125 genuine full-chain desktop/mobile evidence PASS, '+manifest.sourceSha);
})();
