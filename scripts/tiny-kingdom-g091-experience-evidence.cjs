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
const gpuArgs=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
 '--enable-precise-memory-info'];

const evidence={
 version:'g091-matched-lived-workday-v1',
 baselineSha:BASE,candidateSha:null,baselineBlob:null,candidateBlob:null,
 renderer:'UNVERIFIED',status:'INCOMPLETE',workdayTicks:null,
 camera:{wide,labor,grown},viewport,
 scenarios:{},videos:{},errors:[],
 limitations:[
  'SwiftShader is a software renderer; observed recording FPS is not hardware FPS.',
  'Accelerated deterministic staging is not actual real-time work or an unattended soak.',
  'A/B role trajectories can diverge because G091 intentionally changes job dwell.',
  'Neither screenshot differences nor this evidence imply independent critic endorsement.',
  'Video files include honest initialization pre-roll; no postprocessed or fabricated frames.'
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
  const result={renderer:contextInfo.quality.renderer,quality:contextInfo.quality};
  result.day1=await cameraAndScreenshot(page,wide,label+'/day1-wide.png');
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
  result.workdaySnapshot=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  await page.evaluate(()=>window.__tinyKingdom.reset());
  await advanceTicks(page,120*24*30);
  result.day120=await cameraAndScreenshot(page,grown,label+'/day120-wide.png');
  await page.evaluate(()=>window.__tinyKingdom.setHudMode('full'));
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(1000);
  result.mobile=await cameraAndScreenshot(page,grown,label+'/day120-mobile.png',false);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,label+' 390px horizontal document overflow');
  delete result.workdaySnapshot;
  return {result,ticks,workdaySnapshot:await Promise.resolve(null),sceneSnapshot:scene,
   intermediateSnapshot:null,recordedSnapshot:page};
 }finally{
  await context.close();
 }
}
async function motion(browser,html,snapshot,label){
 const {context,page,contextInfo}=await openScene(browser,html,label,true);
 const video=page.video();
 try{
  await page.evaluate(({snapshot,camera})=>{
   const g=window.__tinyKingdom;
   g.restoreSnapshot(snapshot);
   g.setCamera(camera);
   g.setCommandView('world');
  },{snapshot,camera:labor});
  // Genuine unpaused 3D simulation and real camera pointer interactions.
  const start=await page.evaluate(()=>({quality:window.__tinyKingdom.renderQuality(),
   snapshot:window.__tinyKingdom.exportSnapshot()}));
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
   isSoftware:true,uninterruptedRealTime:true,scriptedUserCameraInput:true};
 }finally{
  await context.close();
  const saved=await video.path();
  fs.renameSync(saved,path.join(DIR,label+'.webm'));
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
  evidence.videos.candidate=await motion(browser,candidate,cSnapshot,'candidate-workday');
  evidence.videos.baseline=await motion(browser,baseline,bSnapshot,'baseline-workday');
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
  await advanceTicks(page,ticks);
  return await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
 }finally{await context.close()}
}
