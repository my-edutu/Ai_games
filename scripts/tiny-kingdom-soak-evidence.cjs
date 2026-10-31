'use strict';
// G064 — independent, bounded, reproducible browser/SwiftShader soak evidence.
// This is not a hardware FPS test or a certification of AAA quality.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const dir=path.resolve('artifacts/tiny-kingdom-soak');
 fs.mkdirSync(dir,{recursive:true});
 const days=Number(process.env.TINY_KINGDOM_SOAK_DAYS||120);
 assert(Number.isInteger(days)&&days>=20&&days<=120,'Soak days must be 20–120');
 const evidence={
   schema:'tiny-kingdom-soak-v1',simulatedDays:days,ticksPerDay:720,
   renderer:'unverified',checkpoints:[],pageErrors:[],consoleErrors:[],
   wallClockStart:new Date().toISOString(),status:'INCOMPLETE',
   limitations:['SwiftShader is a software renderer, not consumer GPU FPS',
     'Accelerated rules replay is not an unattended real-time 24-hour soak',
     'No independent comparison or AAA visual parity assessed']
 };
 let browser;
 const write=()=>fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
 try{
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
    '--enable-precise-memory-info'
  ]});
  const page=await browser.newPage({viewport:{width:1024,height:640}});
  page.setDefaultTimeout(120000);
  page.on('pageerror',error=>evidence.pageErrors.push(String(error.message)));
  page.on('console',message=>{
   if(message.type()==='error')evidence.consoleErrors.push(message.text().slice(0,500));
  });
  const html=fs.readFileSync(path.resolve('public/tiny-kingdom/index.html'),'utf8');
  await page.setContent(html,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
  await page.locator('#pause').click();
  const start=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {renderer:g.renderer(),initialSnapshot:g.exportSnapshot(),
      render:g.renderStats(),quality:g.renderQuality()};
  });
  evidence.renderer=start.quality.renderer;
  evidence.rendererTier=start.quality.tier;
  evidence.initialTriangles=start.render.lastFrameTriangles;
  assert.equal(start.renderer,'webgl','Real WebGL unavailable');
  assert.equal(start.quality.tier,'software-webgl','Expected measured SwiftShader renderer');
  assert(start.initialSnapshot&&start.initialSnapshot.checksum);
  const chunkDays=10;
  const runChunk=async(count)=>page.evaluate(n=>{
    const game=window.__tinyKingdom;
    for(let i=0;i<n*24*30;i++)game.step(1/30);
    const snapshot=game.exportSnapshot(),nav=game.getNavigation(),m=game.metrics();
    const nonFinite=[m.food,m.wood,m.gold,m.citizens,m.buildings,m.day]
      .some(x=>!Number.isFinite(x));
    const invalidAgents=nav.filter(p=>![p.position[0],p.position[1],p.target[0],p.target[1]]
      .every(Number.isFinite)).map(p=>p.name);
    return {metrics:m,checksum:snapshot.checksum,snapshot,
      pathCache:game.routeCacheMetrics(),nonFinite,invalidAgents};
  },count);
  let checkpoint=null,last=null;
  for(let day=chunkDays;day<=days;day+=chunkDays){
   last=await runChunk(Math.min(chunkDays,days-day+chunkDays));
   const {metrics,checksum,pathCache,nonFinite,invalidAgents}=last;
   evidence.checkpoints.push({simulatedDay:day,...metrics,checksum,
      pathCache,nonFinite,invalidAgents});
   assert.equal(nonFinite,false,'Non-finite resources or counters at day '+day);
   assert.deepEqual(invalidAgents,[],'Invalid citizen coordinates at day '+day);
   assert(pathCache.entries<=1800,'Route cache exceeded bounded capacity');
   assert(metrics.food>=0&&metrics.wood>=0&&metrics.gold>=0,'Negative resources');
   if(day===days/2)checkpoint=JSON.parse(JSON.stringify(last.snapshot));
  }
  evidence.finalChecksum=last.checksum;
  evidence.finalMetrics=last.metrics;
  // Replay the second half from a validated mid-soak checkpoint.
  if(!checkpoint){
   const split=Math.floor(days/20)*10;
   await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),start.initialSnapshot);
   for(let d=0;d<split;d+=chunkDays)checkpoint=(await runChunk(chunkDays)).snapshot;
  }
  await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),checkpoint);
  const restoreDay=Math.floor(checkpoint.payload.state.t/24);
  const remainingDays=days-restoreDay;
  // The initial settlement starts seven hours into Day 1, so the restored
  // elapsed full days equal the recorded midpoint checkpoint's floor(t/24).
  for(let d=0;d<remainingDays;d+=chunkDays)await runChunk(Math.min(chunkDays,remainingDays-d));
  const replay=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  evidence.replayedChecksum=replay.checksum;
  evidence.replayByteIdentical=JSON.stringify(replay)===JSON.stringify(last.snapshot);
  assert(evidence.replayByteIdentical,'Deterministic checkpoint replay diverged');
  // Force actual presentation of the grown settlement; do not use stale mesh stats.
  await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    g.setCamera({focus:[0,0],yaw:.85,pitch:.52,zoom:23});
  });
  await page.waitForTimeout(1500);
  const grown=await page.evaluate(()=>{
    const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
    return {geometry:g.getGeometryAudit(),stats:g.renderStats(),
      growthLod:g.getGrowthLodStats(),
      glError:gl.getError(),authority:g.exportSnapshot().checksum};
  });
  evidence.grownScene=grown;
  await page.screenshot({path:path.join(dir,'day-'+days+'-real-webgl.png')});
  assert.equal(grown.glError,0,'Real WebGL error in grown settlement');
  assert.equal(grown.authority,last.checksum,'Camera changed the authoritative world');
  assert(grown.geometry.totalTriangles<160000,'Grown settlement exceeded strict 160000 triangle cap');
  const before=await page.evaluate(()=>window.__tinyKingdom.renderQuality());
  const frameStart=Date.now();
  await page.locator('#pause').click();
  await page.waitForTimeout(8000);
  await page.locator('#pause').click();
  const after=await page.evaluate(()=>window.__tinyKingdom.renderQuality());
  const elapsed=(Date.now()-frameStart)/1000;
  evidence.liveFrames={rendererTier:after.tier,seconds:elapsed,
    drawn:after.framesDrawn-before.framesDrawn,
    skipped:after.framesSkipped-before.framesSkipped,
    observedFps:(after.framesDrawn-before.framesDrawn)/elapsed,
    targetFps:after.targetFps};
  evidence.browserMemory=await page.evaluate(()=>performance.memory?
   {usedJSHeapSize:performance.memory.usedJSHeapSize,
    totalJSHeapSize:performance.memory.totalJSHeapSize}:null);
  evidence.mobile=await page.evaluate(()=>{
    const el=document.documentElement;return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
  });
  assert(evidence.liveFrames.drawn>=1,'No interactive WebGL frames were drawn');
  assert.deepEqual(evidence.pageErrors,[],'Uncaught browser exceptions');
  evidence.status='NARROW_SOAK_PASS';
 }catch(error){
  evidence.status='FAIL';
  evidence.failure=String(error&&error.stack||error);
  throw error;
 }finally{
  evidence.wallClockEnd=new Date().toISOString();
  write();
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
