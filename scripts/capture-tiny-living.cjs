'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch,open,root}=require('../tests/tiny-kingdom/browser-harness.cjs');
(async()=>{
 const output=path.resolve(process.argv[2]||'artifacts/tiny-living'),label=process.argv[3]||'living';fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(process.argv[4]||path.join(root,'public/tiny-kingdom/index.html'),'utf8');
 const record={label,capturedAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),captures:[],errors:[],benchmarkPassed:false,independentCritic:false};
 const browser=await launch();try{
  const {page,errors}=await open(browser,{width:1920,height:1080},source);let clock=1000;
  await page.evaluate(()=>{const g=__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=12;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s)});
  for(const view of [{name:'village',camera:{focus:[0,3],zoom:30,pitch:.68,yaw:2.65},hud:'full'},{name:'woodland',camera:{focus:[-25,9],zoom:17,pitch:.52,yaw:1.02},hud:'cinema'}]){
   await page.evaluate(({view,clock})=>{__tinyKingdom.setCamera(view.camera);__tinyKingdom.setHudMode(view.hud);__drawFrame(clock)},{view,clock});clock+=250;
   const file=label+'-'+view.name+'.png';await page.screenshot({path:path.join(output,file)});record.captures.push({...view,file,time:12,resolution:[1920,1080]});
  }
  record.renderer=await page.evaluate(()=>__tinyKingdom.renderQuality());record.geometry=await page.evaluate(()=>__tinyKingdom.getGeometryAudit());record.foliage=await page.evaluate(()=>__tinyKingdom.getFoliageStats?.()||null);record.presentation=await page.evaluate(()=>__tinyKingdom.getLivingPresentationStats?.()||null);
  // CPU microbenchmark: mesh generation only, not a claim about GPU frame rate.
  record.meshBenchmark=await page.evaluate(()=>{const samples=[];let triangles=0;for(let n=0;n<24;n++){const t=performance.now();for(let i=0;i<__tkInspection.citizens().length;i++){const mesh=__tkInspection.captureCitizen(i);triangles+=mesh.length/30}samples.push(performance.now()-t)}const sorted=samples.slice(4).sort((a,b)=>a-b);return {samplesMs:samples,warmup:4,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],citizens:__tkInspection.citizens().length,trianglesPerBatch:triangles/24}});
  if(await page.evaluate(()=>!!__tinyKingdom.inspectCitizen)){
   for(let index=0;index<6;index++){
    const inspection=await page.evaluate(({index,clock})=>{__tinyKingdom.setHudMode('full');__tinyKingdom.setInspector('citizens');const info=__tinyKingdom.inspectCitizen(index);__drawFrame(clock);return info},{index,clock});clock+=250;
    const file=label+'-citizen-'+index+'.png';await page.screenshot({path:path.join(output,file)});record.captures.push({file,inspection});
   }
   await page.setViewportSize({width:390,height:844});await page.evaluate(clock=>{__tinyKingdom.inspectCitizen(0);__drawFrame(clock)},clock);clock+=250;await page.screenshot({path:path.join(output,label+'-mobile.png')});record.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,inspection:__tinyKingdom.getCitizenInspection()}));
   await page.setViewportSize({width:1920,height:1080});await page.evaluate(clock=>{const g=__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=22;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s);g.setSpeed(0);g.setCamera({focus:[0,3],zoom:30,pitch:.68,yaw:2.65});g.setInspector('none');__drawFrame(clock)},clock);await page.screenshot({path:path.join(output,label+'-night.png')});
  }
  record.errors.push(...errors);await page.close();
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:output,size:{width:1280,height:720}}});
  const live=await context.newPage();live.on('pageerror',e=>record.errors.push(e.message));await live.setContent(source);await live.waitForFunction(()=>!!window.__tinyKingdom);
  await live.evaluate(()=>{__tinyKingdom.setGraphicsPreset('balanced');__tinyKingdom.setCamera({focus:[0,3],zoom:30,pitch:.68,yaw:2.65})});
  const observation=()=>({clock:performance.now(),frames:__tinyKingdom.renderQuality().framesDrawn,time:__tinyKingdom.getState().state.t});
  await live.waitForTimeout(1500);const begin=await live.evaluate(observation);await live.waitForTimeout(8000);const end=await live.evaluate(observation);
  record.live={begin,end,elapsedMs:end.clock-begin.clock,observedFps:(end.frames-begin.frames)*1000/(end.clock-begin.clock),renderer:await live.evaluate(()=>__tinyKingdom.renderQuality()),note:'Actual eight-second observation at 1280x720 Balanced, same camera for baseline and candidate. Software WebGL is not hardware performance.'};
  if(await live.evaluate(()=>!!__tinyKingdom.inspectCitizen)){
   record.workPreroll=await live.evaluate(()=>{const g=__tinyKingdom;g.setSpeed(0);g.reset();let ticks=0;for(;ticks<24*30*10;ticks++){const p=g.getNavigation()[0];if(p.activity==='Traveling to farmer work'&&Math.hypot(p.position[0]-p.target[0],p.position[1]-p.target[1])<.28)break;g.step(1/30)}g.setInspector('citizens');g.inspectCitizen(0);g.setSpeed(4);return {ticks,time:g.getState().state.t,position:g.getNavigation()[0],note:'Deterministic simulation pre-roll to just before real arrival; no citizen teleport. Live clip then runs at the existing 4x speed.'}});record.citizenSequence=[];
   for(let i=0;i<12;i++){await live.waitForTimeout(1000);record.citizenSequence.push(await live.evaluate(()=>{const p=__tinyKingdom.getCitizenProfiles()[0];return {time:__tinyKingdom.getState().state.t,activity:p.activity,inspection:__tinyKingdom.getCitizenInspection(),resources:__tinyKingdom.metrics()}}));}
  }
  const video=live.video();await context.close();if(video){const from=await video.path();fs.renameSync(from,path.join(output,label+'-live.webm'));record.live.video=label+'-live.webm'}
 }finally{await browser.close()}
 fs.writeFileSync(path.join(output,label+'-manifest.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));if(record.errors.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
