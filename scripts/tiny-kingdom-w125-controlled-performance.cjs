'use strict';
// Controlled W125 before/after browser comparison: same seed, workloads,
// viewport, SwiftShader and original authoritative step() on two exact source
// commits. Not physical-device desktop/mobile GPU FPS or a visual quality PASS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const dir=path.resolve('artifacts/tiny-kingdom-w125-comparison');
fs.mkdirSync(dir,{recursive:true});
const cases=[
 ['before',path.resolve('artifacts/w125-before.html')],
 ['after',path.resolve('artifacts/w125-after.html')]
];
const originalCamera={focus:[0,0],yaw:.85,pitch:.52,zoom:23};
// The frozen G088 is the EXPERIENCE baseline. This local adjacent-commit
// diagnostic cannot approve visual transformation, even with equal snapshots.
const FROZEN_EXPERIENCE_BASELINE='2f6deb43feb1a1557848d44def53a6109deb1ab1';
function compareCapturedBytes(before,after){
 const read=name=>fs.readFileSync(path.join(dir,name));
 const b=read(before),a=read(after);
 const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 return {beforeSha256:hash(b),afterSha256:hash(a),
  byteIdentical:b.equals(a),
  verdict:b.equals(a)?'NO_CAPTURED_PIXEL_CHANGE':'DIFFERENT_CAPTURE_BYTES_NOT_QUALITY_PROOF',
  comparisonKind:'same-world-viewport-PNG-bytes-neighboring-production-revisions',
  independentlyJudged:false,commercialReferenceVerdict:'NOT_ASSESSED'};
}

// Each PR run must compare its own latest playable original-world source
// against its most recent actual playable predecessor, not an archived W125
// pair. Documentation/test-only commits MUST NOT become image comparators.
const sourcePair=JSON.parse(fs.readFileSync(path.resolve('artifacts/w125-source-pair.json'),'utf8'));
assert.equal(sourcePair.selection,'last-two-real-playable-source-commits');
assert.match(sourcePair.before,/^[0-9a-f]{40}$/);
assert.match(sourcePair.after,/^[0-9a-f]{40}$/);
assert.notEqual(sourcePair.before,sourcePair.after);
const evidence={schema:'tiny-kingdom-w125-controlled-software-v2',
 browser:'Chromium SwiftShader',physicalHardwareGpuFps:'NOT_PROVEN',
 old:sourcePair.before,new:sourcePair.after,
 sourcePair,frozenExperienceBaseline:FROZEN_EXPERIENCE_BASELINE,
 evidenceRole:'adjacent-source diagnostic only, NOT pinned-G088 experiential A/B',
 limitations:['Software-rendered p95/p99 are not physical desktop/mobile GPU',
  '390px is an emulated viewport, not a real phone',
  'Short captures are exploratory; no causal FPS claim without adequate samples',
  'In-process comparison is subject to browser temperature and caching',
  'Adjacent production revisions cannot substitute for the immutable G088 experience baseline',
  'PNG byte identity demonstrates unchanged captured bytes, not worker-motion quality'],
 cases:{},errors:[],status:'INCOMPLETE'};
const save=()=>fs.writeFileSync(path.join(dir,'evidence.json'),
 JSON.stringify(evidence,null,2)+'\n');
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:[
   '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
   '--enable-precise-memory-info']});
  const page=await browser.newPage({viewport:{width:1024,height:640}});
  page.setDefaultTimeout(120000);
  let currentCase='bootstrap';
  page.on('pageerror',error=>evidence.errors.push({
   case:currentCase,message:String(error.message)}));
  page.on('console',message=>{
   if(message.type()==='error')evidence.errors.push({
    case:currentCase,message:message.text().slice(0,500)});
  });
  async function sample(label,viewport,snapshot,{workday=false}={}){
   const original=JSON.stringify(snapshot);
   await page.setViewportSize(viewport);
   const real=await page.evaluate(({workday,camera})=>{
    const g=window.__tinyKingdom;
    if(workday){
     if(!g.getActiveWorksites().length)return {eligible:false};
     const following=g.watchLiveWorkday();
     return {eligible:true,following,worksites:g.getActiveWorksites()};
    }
    g.setCamera(camera);
    return {eligible:true};
   },{workday,camera:originalCamera});
   if(!real.eligible)return {status:'NO_ACTUAL_WORKSITE'};
   await page.waitForTimeout(450);
   const prev=await page.evaluate(()=>({
    frames:window.__tinyKingdom.renderQuality().framesDrawn,
    memory:performance.memory?.usedJSHeapSize??null}));
   const start=Date.now();
   await page.locator('#pause').click();
   await page.waitForTimeout(6000);
   await page.locator('#pause').click();
   const snapshotStats=await page.evaluate(()=>{
    const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
    return {renderer:g.renderQuality(),scene:g.renderStats(),
     coldSceneryBuild:g.getColdSceneryBuildAudit(),
     groundAtlas:g.getGroundAtlasAudit?.()??null,
     cpu:g.getFrameProfile(),cadence:g.getDrawCadenceAudit(),
     gpu:g.getGpuFrameTimerAudit(),
     geometry:g.getGeometryAudit(),
     ledger:g.getSceneTriangleReconciliation(),
     commuter:g.getResidentCommuterAudit(),
     actor:g.getActorResidencyAudit(),
     population:g.metrics().citizens,
     structures:g.metrics().buildings,
     day:g.metrics().day,
     checksum:g.exportSnapshot().checksum,
     browserMemory:performance.memory?.usedJSHeapSize??null,
     viewport:[document.documentElement.clientWidth,
      document.documentElement.clientHeight],
     scrollWidth:document.documentElement.scrollWidth,
     glError:gl.getError()};
   });
   const duration=(Date.now()-start)/1000;
   const result={status:'RECORDED',label,viewport,witness:real,
    softwareOnly:true,elapsedSeconds:duration,
    frames:snapshotStats.renderer.framesDrawn-prev.frames,
    observedSoftwareFps:(snapshotStats.renderer.framesDrawn-prev.frames)/duration,
    beforeHeapBytes:prev.memory,...snapshotStats};
   // W147 capture-integrity gate: the six-second LIVE profiling window has
   // already advanced different numbers of authoritative ticks on slower and
   // faster source variants. That moving workload is legitimate for timing,
   // but a screenshot of its endpoint is NOT a matched-seed A/B. Restore the
   // exact original snapshot while PAUSED and draw genuine original world
   // geometry once before taking the source-matched visual comparison.
   const priorFrame=snapshotStats.renderer.framesDrawn;
   const captureWitness=await page.evaluate(({snapshot,workday,camera})=>{
    const g=window.__tinyKingdom;
    g.restoreSnapshot(snapshot); // also invalidates retained static/dynamic meshes
    if(workday){
     if(!g.getActiveWorksites().length)
      throw Error('No authentic worksite survives matched snapshot restore');
     if(!g.watchLiveWorkday())
      throw Error('Authentic workday follow could not be re-established');
    }else g.setCamera(camera);
    return {checksum:g.exportSnapshot().checksum,
     workday:workday?'original-authoritative-worker':'same-physical-town-lens',
     citizen:workday?g.getSelectedCitizen():null};
   },{snapshot,workday,camera:originalCamera});
   assert.equal(captureWitness.checksum,snapshot.checksum,
    'Screenshot world must be exact captured source snapshot');
   await page.waitForFunction(prior=>
    window.__tinyKingdom.renderQuality().framesDrawn>prior,priorFrame);
   // The genuine camera director may ease to a moving worker even while the
   // original simulation is paused. No fake work or actor is introduced.
   if(workday)await page.waitForTimeout(1000);
   const captured=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {checksum:g.exportSnapshot().checksum,metrics:g.metrics(),
     camera:g.getPresentedCameraFrame(),view:g.getCamera()};
   });
   assert.equal(captured.checksum,snapshot.checksum,
    'Paused screenshot cannot inherit different end-of-profiling simulation');
   result.matchedScreenshot={
    source:'original-world-restored-snapshot-render',
    checksum:captured.checksum,
    day:captured.metrics.day,citizens:captured.metrics.citizens,
    buildings:captured.metrics.buildings,food:captured.metrics.food,
    wood:captured.metrics.wood,gold:captured.metrics.gold,
    physicalCamera:captured.camera,view:captured.view,
    witness:captureWitness};
   await page.screenshot({path:path.join(dir,currentCase+'-'+label+'.png')});
   assert.equal(result.glError,0,'GL error '+currentCase+' '+label);
   assert(result.frames>0,'No real frame '+currentCase+' '+label);
   assert(result.geometry.totalTriangles<160000,'Complete triangle budget '+label);
   assert.equal(result.cpu.kind,'cpu-wall-submission');
   await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),snapshot);
   assert.equal(JSON.stringify(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())),
    original,'Profiling mutated original replay '+label);
   await page.setViewportSize({width:1024,height:640});
   await page.evaluate(camera=>window.__tinyKingdom.setCamera(camera),originalCamera);
   return result;
  }
  for(const [name,file] of cases){
   currentCase=name;
   const html=fs.readFileSync(file,'utf8');
   const errCount=evidence.errors.length;
   // A real document navigation terminates the preceding source build's
   // requestAnimationFrame loop. document.write alone can retain callbacks
   // and contaminate this otherwise controlled before/after measurement.
   await page.goto('about:blank');
   await page.setViewportSize({width:1024,height:640});
   await page.setContent(html,{waitUntil:'load'});
   await page.waitForFunction(()=>
    window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
   await page.locator('#pause').click();
   const seed=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    g.reset();const first=g.exportSnapshot();
    g.reset();const second=g.exportSnapshot();
    return {first,second};
   });
   assert.equal(JSON.stringify(seed.first),JSON.stringify(seed.second),
    'Reset original village seed must be deterministic');
   const row={startChecksum:seed.first.checksum,startMetrics:await page.evaluate(
    ()=>window.__tinyKingdom.metrics()),samples:{},checkpoints:[]};
   row.samples.day1=await sample('day1',{width:1024,height:640},seed.first);
   const early=await page.evaluate(()=>{
    const g=window.__tinyKingdom;let steps=0;
    for(;steps<12*30&&!g.getActiveWorksites().length;steps++)g.step(1/30);
    return {steps,realWorksites:g.getActiveWorksites(),checksum:g.exportSnapshot().checksum,
     snapshot:g.exportSnapshot()};
   });
   row.authenticWorkdaySearch={steps:early.steps,worksites:early.realWorksites,
    checksum:early.checksum};
   row.samples.workday=early.realWorksites.length?
    await sample('workday',{width:1024,height:640},early.snapshot,{workday:true}):
    {status:'NO_ACTUAL_WORKSITE',noStagedActors:true};
   await page.evaluate(s=>window.__tinyKingdom.restoreSnapshot(s),seed.first);
   for(let day=10;day<=120;day+=10){
    const part=await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     for(let i=0;i<7200;i++)g.step(1/30);
     return {snapshot:g.exportSnapshot(),metrics:g.metrics()};
    });
    row.checkpoints.push({simulatedDay:day,checksum:part.snapshot.checksum,
     population:part.metrics.citizens,structures:part.metrics.buildings,
     day:part.metrics.day});
    await page.waitForTimeout(150);
   }
   const grown=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
   row.grownChecksum=grown.checksum;
   row.grownMetrics=await page.evaluate(()=>window.__tinyKingdom.metrics());
   assert.equal(row.grownMetrics.citizens,28,'Real Day120 population changed');
   assert(row.grownMetrics.buildings>=37,'Real town growth regressed');
   row.samples.day120=await sample('day120',{width:1024,height:640},grown);
   row.samples.mobile390=await sample('mobile390',{width:390,height:844},grown);
   assert.equal(evidence.errors.length,errCount,
    'Browser exceptions detected in '+name+' original village');
   evidence.cases[name]=row;save();
  }
  const a=evidence.cases.before,b=evidence.cases.after;
  assert.equal(a.startChecksum,b.startChecksum,
   'Controlled variants began from different authoritative worlds');
  assert.equal(a.grownChecksum,b.grownChecksum,
   'W125 changed authoritative day120 replay');
  assert.deepEqual(a.checkpoints,b.checkpoints,
   'W125 changed any original 10-day checkpoint');
  evidence.comparison=Object.fromEntries(['day1','workday','day120','mobile390']
   .map(label=>{
    const old=a.samples[label],newer=b.samples[label];
    const enough=old.cpu?.samples>=15&&newer.cpu?.samples>=15;
    assert.equal(old.matchedScreenshot?.checksum,newer.matchedScreenshot?.checksum,
     'Source A/B screenshots depict different authoritative '+label+' worlds');
    return [label,{paired:old.status==='RECORDED'&&newer.status==='RECORDED'&&
      old.matchedScreenshot?.checksum===newer.matchedScreenshot?.checksum,
     screenshotWorldChecksum:old.matchedScreenshot?.checksum??null,
     enoughForExploratoryP95:enough,
     priorCpuP95Ms:old.cpu?.stages.total.p95??null,
     candidateCpuP95Ms:newer.cpu?.stages.total.p95??null,
     priorCitizenP95Ms:old.cpu?.stages.citizenGeometry.p95??null,
     candidateCitizenP95Ms:newer.cpu?.stages.citizenGeometry.p95??null,
     priorSoftwareFps:old.observedSoftwareFps??null,
     candidateSoftwareFps:newer.observedSoftwareFps??null,
     GPUHardwareGain:'NOT_PROVEN',
     conclusion:enough?'EXPLORATORY_SOFTWARE_ONLY':'INSUFFICIENT_FRAME_SAMPLES'}];
   }));
  evidence.imageIdentity=Object.fromEntries(
   ['day1','workday','day120','mobile390'].map(label=>[label,
    compareCapturedBytes('before-'+label+'.png','after-'+label+'.png')]));
  evidence.identicalCaptureCount=Object.values(evidence.imageIdentity)
   .filter(row=>row.byteIdentical).length;
  evidence.experienceQualityVerdict='NOT_PROVEN';
  evidence.hardBlocker=evidence.identicalCaptureCount===4?
   'All four adjacent-commit screenshots are byte-identical: this comparison proves no visible change':
   'Source-local images differ or incomplete; compare running motion versus immutable G088 separately';
  evidence.status='SOURCE_MATCHED_SOFTWARE_CAPTURE_ONLY';
 }catch(err){
  evidence.status='FAIL';
  evidence.failure=String(err&&err.stack||err);throw err;
 }finally{
  save();if(browser)await browser.close();
 }
})().catch(err=>{console.error(err);process.exitCode=1});
