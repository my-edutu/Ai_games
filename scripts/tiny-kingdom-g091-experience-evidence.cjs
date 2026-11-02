'use strict';
/*
 * G091 — matched, REAL running browser evidence for the lived-workday
 * transformation. No mocked canvas, invented reviewer or GPU FPS.
 * Baseline is immutable G088; each side uses one seed, tick count, camera,
 * viewport and Chromium SwiftShader configuration. Continuous WebM clips
 * are complete browser recordings, including initial scene load; the
 * capture phase does not programmatically advance game ticks.
 */
const fs=require('node:fs'),path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const BASE='2f6deb43feb1a1557848d44def53a6109deb1ab1';
const DIR=path.resolve('artifacts/tiny-kingdom-experience');
const FILE='public/tiny-kingdom/index.html';
const viewport={width:1024,height:640};
const wide={focus:[0,0],yaw:.85,pitch:.52,zoom:23};
const labor={focus:[18,1],yaw:.73,pitch:.6,zoom:15};
const grown={focus:[0,0],yaw:.85,pitch:.52,zoom:23};
// G095: identical high-comprehension market inspection in old and new games.
const marketView={focus:[-.7,5.3],yaw:.62,pitch:.52,zoom:19};
const gpuArgs=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
 '--enable-precise-memory-info'];

const evidence={
 version:'g113-street-visitor-grounded-supplement-v1',
 baselineSha:BASE,candidateSha:null,baselineBlob:null,candidateBlob:null,
 renderer:'UNVERIFIED',status:'INCOMPLETE',workdayTicks:null,
 camera:{wide,labor,grown,marketView},viewport,
 scenarios:{},videos:{},errors:[],
 limitations:[
  'SwiftShader is a software renderer; observed recording FPS is not hardware FPS.',
  'Accelerated deterministic staging is not actual real-time work or an unattended soak.',
  'A/B role trajectories can diverge because G091 intentionally changes job dwell.',
  'Neither screenshot differences nor this evidence imply independent critic endorsement.',
  'Video files include honest initialization pre-roll; no postprocessed or fabricated frames.',
  'Supplemental candidate live-worker shots are not equivalent to a matched A/B and cannot substitute for blinded review.',
  'G098 courier, G099 unloading and G113 first-person walk clips are candidate-only supplementary proof, not matched G088 mechanics (baseline lacks logistics and first-person movement).'
 ]
};
const mkdir=(name)=>fs.mkdirSync(path.join(DIR,name),{recursive:true});
const write=()=>fs.writeFileSync(path.join(DIR,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
function git(...args){return cp.execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim()}
function readBaseline(){
 return cp.execFileSync('git',['show',BASE+':'+FILE],
  {encoding:'utf8',maxBuffer:8*1024*1024});
}
function attachErrors(page,label){
 page.on('pageerror',error=>evidence.errors.push(label+': '+String(error.message)));
 page.on('console',msg=>{if(msg.type()==='error')
  evidence.errors.push(label+' console: '+msg.text().slice(0,500))});
}
async function openScene(browser,html,label,recordVideo=false,mobile=false){
 const size=mobile?{width:390,height:844}:viewport;
 const context=await browser.newContext({
  viewport:size,...(recordVideo?{recordVideo:{dir:DIR,size}}:{})
 });
 const page=await context.newPage();
 page.setDefaultTimeout(90000);attachErrors(page,label);
 await page.setContent(html,{waitUntil:'load'});
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 const contextInfo=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {quality:g.renderQuality(),renderer:g.renderer(),geometry:g.renderStats()};
 });
 assert.equal(contextInfo.renderer,'webgl',label+' WebGL unavailable');
 assert.equal(contextInfo.quality.tier,'software-webgl',label+' not on known SwiftShader workload');
 return {context,page,contextInfo};
}
async function cameraAndScreenshot(page,camera,filename,cinema=true){
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.evaluate(({camera,cinema})=>{
  const g=window.__tinyKingdom;
  g.setCamera(camera);g.setHudMode(cinema?'cinema':'full');
  if(cinema)g.setReferenceCapture(true);
 },{camera,cinema});
 await page.waitForTimeout(1300);
 const record=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {snapshot:g.exportSnapshot(),camera:g.getCamera(),
    triangles:g.renderStats().lastFrameTriangles,profile:g.getFrameProfile(),
    worksites:typeof g.getActiveWorksites==='function'?g.getActiveWorksites():null,
    glError:gl?.getError()??-1,quality:g.renderQuality()};
 });
 assert.equal(record.glError,0,filename+' WebGL error');
 assert(record.triangles>0&&record.triangles<160000,filename+' triangle budget');
 assert.equal(JSON.stringify(record.snapshot),before,'Capture mutated simulation');
 assert.equal(record.camera.follow,false,'Capture camera must not follow an agent');
 await page.screenshot({path:path.join(DIR,filename),timeout:90000});
 return {snapshotChecksum:record.snapshot.checksum,day:Math.floor(record.snapshot.payload.state.t/24)+1,
  simulatedHour:record.snapshot.payload.state.t,
  triangleCount:record.triangles,quality:record.quality,
  cpuPhaseMs:record.profile.stages?.total,
  activeWorksites:record.worksites?.length??null};
}
async function advanceTicks(page,total){
 const chunk=7200;
 for(let i=0;i<total;i+=chunk){
  await page.evaluate(n=>{
   const g=window.__tinyKingdom;
   for(let k=0;k<n;k++)g.step(1/30);
  },Math.min(chunk,total-i));
 }
}
async function stage(label,html,browser,matchedTicks){
 mkdir(label);
 const scene=await openScene(browser,html,label);
 const {page,context,contextInfo}=scene;
 try{
  await page.locator('#pause').click();
  // Force the exact seed/time after pausing, independent of CI frame load time.
  await page.evaluate(()=>window.__tinyKingdom.reset());
  const result={renderer:contextInfo.quality.renderer,quality:contextInfo.quality};
  result.day1=await cameraAndScreenshot(page,wide,label+'/day1-wide.png');
  result.marketDay1=await cameraAndScreenshot(page,marketView,label+'/market-day1.png');
  await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
  let ticks=matchedTicks;
  if(ticks===null){
   ticks=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    for(let i=1;i<=18000;i++){
     g.step(1/30);
     const work=g.getActiveWorksites();
     if(work.some(w=>w.job==='farmer'&&w.progress>.27&&w.progress<.42))
      return i;
    }
    throw Error('Candidate never showed a farmer working after reaching the actual field');
   });
  }else{
   await advanceTicks(page,ticks);
  }
  result.labor=await cameraAndScreenshot(page,labor,label+'/workday-close.png');
  if(label==='candidate'){
   // Supplemental experiential shot: a real working actor fills the frame.
   // Matched A/B cameras remain separately preserved above.
   const shot=await page.evaluate(()=>{
    const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
    g.setHudMode('full');
    const view=g.watchLiveWorkday();
    return {view,camera:g.getCamera(),
      authoritative:before===JSON.stringify(g.exportSnapshot())};
   });
   assert(shot.authoritative,'Live worker camera changed authoritative world');
   assert(shot.view?.active,'No actual worker in candidate live-shift scene');
   assert(shot.camera.zoom<11&&shot.camera.pitch<.66,'Live shot is still aerial');
   await page.waitForTimeout(900);
   await page.screenshot({path:path.join(DIR,label+'/live-shift-close.png'),timeout:90000});
   result.liveShift={worker:shot.view.citizen,job:shot.view.job,
     activity:shot.view.activity,progress:shot.view.progress,camera:shot.camera,
     authoritativeUnchanged:true,matchedPair:false};
   await page.evaluate(()=>window.__tinyKingdom.stopWorkdayWatch());
  }
  if(label==='candidate'){
   const delivery=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    if(typeof g.getActiveDeliveries!=='function')throw Error('No G098 deliverable gameplay');
    for(let i=0;i<30000;i++){
     g.step(1/30);
     const active=g.getActiveDeliveries();
     if(active.length)return {extraTicks:i+1,carrier:active[0],
      checksum:g.exportSnapshot().checksum};
    }
    throw Error('No authentic citizen carried goods to market within 30000 ticks');
   });
   result.deliveryTicks=ticks+delivery.extraTicks;
   const proof=await page.evaluate(()=>{
    const g=window.__tinyKingdom,before=g.exportSnapshot().checksum;
    g.watchDelivery();
    return {selected:g.getSelectedCitizen(),following:g.getCamera().follow,
     readOnly:before===g.exportSnapshot().checksum,
     status:document.getElementById('workday-activity').textContent};
   });
   assert(proof.readOnly&&proof.following,'Following a courier changed gameplay authority');
   assert.equal(proof.selected,delivery.carrier.citizen,'Camera did not select an actual courier');
   await page.waitForTimeout(900);
   await page.screenshot({path:path.join(DIR,label+'/g098-actual-delivery.png'),timeout:90000});
   result.delivery={carrier:delivery.carrier,proof,sceneFile:'g098-actual-delivery.png',
    checksum:delivery.checksum,matchedPair:false};
   await page.evaluate(()=>window.__tinyKingdom.stopWorkdayWatch());
   const handoff=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    for(let i=0;i<26000;i++){
     g.step(1/30);
     const unloading=g.getMarketHandoffs()[0];
     if(unloading&&unloading.progress<.18)
      return {extraTicks:i+1,carrier:unloading,checksum:g.exportSnapshot().checksum,
       inTransit:g.getMarketSupplyView().inTransit[unloading.resource],
       prematureReceipt:g.getDeliveryReceipts().some(r=>r.id===unloading.id)};
    }
    throw Error('G099: no true live unloading observed within 26000 ticks');
   });
   assert(handoff.inTransit>0&&!handoff.prematureReceipt,
    'G099 handoff must precede the real goods receipt');
   result.handoffTicks=result.deliveryTicks+handoff.extraTicks;
   const handoffShot=await page.evaluate(()=>{
    const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
    g.setHudMode('full');
    const followed=g.watchDelivery(),shot=g.getCitizenCameraPlan();
    if(JSON.stringify(g.exportSnapshot())!==before)
     throw Error('Unloading director mutated authoritative game');
    if(!followed||!shot||shot.blockers>0||g.getCamera().zoom>=9)
     throw Error('Actual unloading citizen is obstructed or not framed closely');
    return {selected:g.getSelectedCitizen(),camera:g.getCamera(),shot,
     status:document.getElementById('workday-activity').textContent};
   });
   assert.equal(handoffShot.selected,handoff.carrier.citizen,
    'Recorded handoff camera must follow the real unloading citizen');
   await page.waitForTimeout(850);
   await page.screenshot({path:path.join(DIR,label+'/g099-market-unloading.png'),timeout:90000});
   await page.setViewportSize({width:390,height:844});
   await page.waitForTimeout(380);
   await page.screenshot({path:path.join(DIR,label+'/g099-market-unloading-mobile.png'),timeout:90000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),
    false,'G099 mobile handoff document overflow');
   await page.setViewportSize(viewport);
   result.handoff={carrier:handoff.carrier,sceneFile:'g099-market-unloading.png',
    mobileFile:'g099-market-unloading-mobile.png',checksum:handoff.checksum,
    camera:handoffShot,realPlayerFollow:true,inTransit:handoff.inTransit,matchedPair:false};
  }
  await page.evaluate(()=>window.__tinyKingdom.reset());
  await advanceTicks(page,120*24*30);
  result.day120=await cameraAndScreenshot(page,grown,label+'/day120-wide.png');
  result.marketDay120=await cameraAndScreenshot(page,marketView,label+'/market-day120.png');
  await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(1000);
  result.mobile=await cameraAndScreenshot(page,grown,label+'/day120-mobile.png',false);
  result.marketMobile=await cameraAndScreenshot(page,marketView,label+'/market-mobile.png',false);
  if(label==='candidate'){
   const mobileLive=await page.evaluate(()=>{
    const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
    const view=g.watchLiveWorkday();
    return {view,camera:g.getCamera(),
     snapshotUnchanged:before===JSON.stringify(g.exportSnapshot())};
   });
   assert(mobileLive.view?.active,'Mobile live shift was not actual ongoing work');
   assert(mobileLive.snapshotUnchanged,'Mobile watch mutated authoritative world');
   await page.waitForTimeout(850);
   await page.screenshot({path:path.join(DIR,label+'/day120-live-mobile.png'),timeout:90000});
   result.mobileLiveShift={worker:mobileLive.view.citizen,job:mobileLive.view.job,
    camera:mobileLive.camera,matchedPair:false};
  }
  // G113: honest supplementary first-person capture of the SAME 120-day
  // simulation. G088 never had this visitor mode: NOT a matched visual PASS.
  if(label==='candidate'){
   const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
   const entered=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return g.setStreetWalk(true);
   });
   assert(entered.active&&entered.height>1.4,'No navigable physical street camera');
   await page.waitForTimeout(1000);
   await page.screenshot({path:path.join(DIR,label+'/street-human-height-mobile.png'),timeout:90000});
   const overflowMobile=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   assert.equal(overflowMobile,false,'G113 390px street UI overflow');
   await page.setViewportSize(viewport);
   await page.waitForTimeout(900);
   await page.screenshot({path:path.join(DIR,label+'/street-human-height-wide.png'),timeout:90000});
   const after=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
   assert.equal(before,after,'Street scene changed authoritative world');
   result.streetWalk={entry:entered,matchedPair:false,realWebGL:true,
    mobileFile:'street-human-height-mobile.png',wideFile:'street-human-height-wide.png',
    authorityUnchanged:true};
   await page.evaluate(()=>window.__tinyKingdom.setStreetWalk(false));
   await page.setViewportSize({width:390,height:844});
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,label+' 390px horizontal document overflow');
  return {result,ticks};
 }finally{
  await context.close();
 }
}
async function motion(browser,html,snapshot,label,live=false,camera=labor,delivery=false){
 const {context,page,contextInfo}=await openScene(browser,html,label,true);
 const video=page.video();
 try{
  await page.evaluate(({snapshot,camera})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(snapshot);
   g.setCamera(camera);
   g.setCommandView('world');
  },{snapshot,camera});
  if(live){
   await page.locator('#workday-live').click();
   const work=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {view:g.getLiveWorkdayView(),camera:g.getCamera()};
   });
   assert(work.view.active,'Supplemental clip did not follow a genuine shift');
   assert(work.camera.zoom<11,'Supplemental real worker is too distant');
  }
  if(delivery){
   await page.locator('#delivery-follow').click();
   const d=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {active:g.getActiveDeliveries(),following:g.getCamera().follow,
      selected:g.getSelectedCitizen()};
   });
   assert(d.following&&d.active.some(v=>v.citizen===d.selected),
    'Delivery recording must follow an actually loaded, navigating citizen');
  }
  // Genuine unpaused 3D simulation and real camera pointer interactions.
  const start=await page.evaluate(()=>({quality:window.__tinyKingdom.renderQuality(),
   snapshot:window.__tinyKingdom.exportSnapshot(),
   delivery:typeof window.__tinyKingdom.getActiveDeliveries==='function'?window.__tinyKingdom.getActiveDeliveries():[],
   active:typeof window.__tinyKingdom.getLiveWorkdayView==='function'?
    window.__tinyKingdom.getLiveWorkdayView():null}));
  const wallStart=Date.now();
  await page.waitForTimeout(2500);
  await page.mouse.move(480,330);
  await page.mouse.down();
  await page.mouse.move(520,342,{steps:6});
  await page.mouse.up();
  await page.waitForTimeout(2200);
  await page.mouse.wheel(0,-65);
  await page.waitForTimeout(2500);
  const end=await page.evaluate(()=>({quality:window.__tinyKingdom.renderQuality(),
   snapshot:window.__tinyKingdom.exportSnapshot(),
   camera:window.__tinyKingdom.getCamera(),
   glError:document.getElementById('world').getContext('webgl')?.getError()??-1}));
  assert.equal(end.glError,0,label+' GL error in filmed interaction');
  const seconds=(Date.now()-wallStart)/1000;
  return {renderer:contextInfo.quality.renderer,seconds,frames:end.quality.framesDrawn-start.quality.framesDrawn,
   observedFps:(end.quality.framesDrawn-start.quality.framesDrawn)/seconds,
   initialChecksum:start.snapshot.checksum,finalChecksum:end.snapshot.checksum,
   cameraAfter:end.camera,videoFile:label+'.webm',
   realLiveWorker:live?start.active:null,realDelivery:delivery?start.delivery:null,matchedPair:!live&&!delivery,
   isSoftware:true,uninterruptedRealTime:true,scriptedUserCameraInput:true};
 }finally{
  await context.close();
  const saved=await video.path();
  fs.renameSync(saved,path.join(DIR,label+'.webm'));
 }
}


/* G113 uncut physical street-walk clip. Human input moves a camera through
 * original actual civilization; no fake citizens, animation, or frame edits. */
async function streetMotion(browser,html,snapshot){
 const label='candidate-street-walk';
 const {context,page,contextInfo}=await openScene(browser,html,label,true);
 const video=page.video();
 try{
  await page.evaluate(saved=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(saved);
   g.setCommandView('world');
  },snapshot);
  await page.locator('#street-walk').click();
  const start=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {view:g.getStreetWalkState(),authority:g.exportSnapshot(),
    frames:g.renderQuality().framesDrawn};
  });
  assert(start.view.active,'G113 did not enter a real human-height world');
  const wallStart=Date.now();
  await page.keyboard.down('w');
  await page.waitForTimeout(2300);
  await page.keyboard.up('w');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1050);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('w');
  await page.waitForTimeout(1800);
  await page.keyboard.up('w');
  await page.mouse.move(450,270);
  await page.mouse.down();
  await page.mouse.move(480,260,{steps:5});
  await page.mouse.up();
  await page.waitForTimeout(1400);
  const end=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {view:g.getStreetWalkState(),authority:g.exportSnapshot(),
    frames:g.renderQuality().framesDrawn,
    glError:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  });
  assert.equal(end.glError,0,'G113 live walking produced WebGL errors');
  assert(end.view.active,'G113 street camera stopped in clip');
  assert(end.view.distanceTravelled>0,'G113 recording did not actually move through village');
  assert(end.authority.payload.state.t>start.authority.payload.state.t,
   'G113 recording must contain genuine ongoing autonomous world motion');
  const seconds=(Date.now()-wallStart)/1000;
  return {renderer:contextInfo.quality.renderer,seconds,observedFps:(end.frames-start.frames)/seconds,
   distanceTravelled:end.view.distanceTravelled,blockedMoves:end.view.blockedMoves,
   startView:start.view,endView:end.view,initialChecksum:start.authority.checksum,
   finalChecksum:end.authority.checksum,isSoftware:true,
   matchedPair:false,uninterruptedRealTime:true,actualKeyboardAndPointerInput:true,
   videoFile:label+'.webm'};
 }finally{
  await context.close();
  fs.renameSync(await video.path(),path.join(DIR,label+'.webm'));
 }
}

(async()=>{
 fs.mkdirSync(DIR,{recursive:true});
 for(const label of ['baseline','candidate'])mkdir(label);
 let browser;
 try{
  const baseline=readBaseline(),candidate=fs.readFileSync(FILE,'utf8');
  evidence.baselineBlob=cp.execFileSync('git',['hash-object','--stdin'],
   {input:baseline,encoding:'utf8'}).trim();
  evidence.candidateBlob=git('hash-object',FILE);
  evidence.candidateSha=git('rev-parse','HEAD');
  assert.notEqual(baseline,candidate,'Candidate is unchanged from pinned G088 baseline');
  browser=await chromium.launch({headless:true,args:gpuArgs});
  const c=await stage('candidate',candidate,browser,null);
  evidence.workdayTicks=c.ticks;
  evidence.scenarios.candidate=c.result;
  const b=await stage('baseline',baseline,browser,c.ticks);
  evidence.scenarios.baseline=b.result;
  assert.equal(c.result.labor.simulatedHour,b.result.labor.simulatedHour,
   'Live-workday A/B must be captured at identical simulation time');
  assert.equal(c.result.day120.simulatedHour,b.result.day120.simulatedHour,
   'Day120 A/B must use identical simulated time');
  // Real, unedited matched-hour gameplay. Recreate read-only staged snapshots
  // inside newly recording contexts; no clock stepping during footage.
  const cSnapshot=await regenerateSnapshot(browser,candidate,c.ticks);
  const bSnapshot=await regenerateSnapshot(browser,baseline,c.ticks);
  assert.equal(cSnapshot.checksum,c.result.labor.snapshotChecksum,
   'Candidate staged video snapshot must reproduce matched screenshot authority');
  assert.equal(bSnapshot.checksum,b.result.labor.snapshotChecksum,
   'Pinned G088 staged video snapshot must reproduce matched screenshot authority');
  evidence.videos.candidate=await motion(browser,candidate,cSnapshot,'candidate-workday');
  evidence.videos.baseline=await motion(browser,baseline,bSnapshot,'baseline-workday');
  evidence.videos.candidateLive=await motion(browser,candidate,cSnapshot,'candidate-live-shift',true);
  evidence.videos.candidateStreetWalk=await streetMotion(browser,candidate,cSnapshot);
   // Full, uncut paired market gameplay with actual citizen simulation and
   // real pointer orbit/zoom. No screenshots or mock animation substituted.
   evidence.videos.candidateMarket=await motion(browser,candidate,cSnapshot,'candidate-market',false,marketView);
   evidence.videos.baselineMarket=await motion(browser,baseline,bSnapshot,'baseline-market',false,marketView);
  // Real, continuous gameplay from a reproducible physical delivery state,
  // without faking agents, fast-forwarding within footage, or matching an
  // unavailable G088 delivery mechanic.
  const dSnapshot=await regenerateSnapshot(browser,candidate,c.result.deliveryTicks);
  assert.equal(dSnapshot.checksum,c.result.delivery.checksum,
   'G098 delivery filmed state differs from genuine witnessed source state');
  evidence.videos.candidateDelivery=await motion(browser,candidate,dSnapshot,
   'candidate-delivery',false,marketView,true);
  // Uncut browser footage starts from the deterministically replayed,
  // physically unloading citizen and remains actual interactive gameplay.
  const hSnapshot=await regenerateSnapshot(browser,candidate,c.result.handoffTicks);
  assert.equal(hSnapshot.checksum,c.result.handoff.checksum,
   'G099 filmed handoff differs from authoritative staged citizen action');
  evidence.videos.candidateHandoff=await motion(browser,candidate,hSnapshot,
   'candidate-market-unloading',false,
   {focus:[0,10.2],yaw:.62,pitch:.28,zoom:10.6},true);
  evidence.status='SCENARIOS_CAPTURED_NOT_BLIND_REVIEWED';
  assert.deepEqual(evidence.errors,[],'Uncaught browser/console errors');
 }catch(error){
  evidence.errors.push(String(error?.stack||error));
  evidence.status='FAILED';
  process.exitCode=1;
 }finally{
  write();
  await browser?.close();
 }
})();
async function regenerateSnapshot(browser,html,ticks){
 const {page,context}=await openScene(browser,html,'staging-clip');
 try{
  await page.locator('#pause').click();
  await page.evaluate(()=>window.__tinyKingdom.reset());
  await advanceTicks(page,ticks);
  return await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 }finally{await context.close()}
}
