'use strict';
/**
 * Truth-preserving AI Dungeon capture: inspect source submissions separately
 * from screenshot/MediaRecorder and authority snapshot delivery.
 *
 * Run with the existing local dungeon stream server and @playwright/test:
 * node scripts/m1-parallel/D01/capture-dungeon.cjs --url http://127.0.0.1:4181/dungeon --seconds 12 --seed d01-evidence
 *
 * The --seed mode serves genuine deterministic DungeonRuntime.publicState()
 * snapshots (same starting source sequence for A/B). --live uses the actual
 * unmodified server and does NOT claim equivalent encounters for the two runs.
 */
const fs=require('node:fs');
const path=require('node:path');
const {summarizeTrial,compareTrials,summarizeBrowserCounters}=require('./frame-ledger.cjs');
const MAX_ENCODED_BYTES=24*1024*1024;
// The actual dungeon host advances authority every 350 ms. The presentation
// HTTP poll is 190 ms, but polling must not accelerate authoritative time.
const SOURCE_TICK_INTERVAL_MS=350;
function parseArgs(argv){
 const opts={url:'http://127.0.0.1:4181/dungeon',seconds:12,seed:'d01-evidence',advance:18,out:'artifacts/d01-capture',live:false,mobile:false};
 for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==='--live')opts.live=true;
  else if(a==='--mobile')opts.mobile=true;
  else if(['--url','--seconds','--seed','--advance','--out'].includes(a)){
   if(!argv[i+1])throw Error('Missing value for '+a);
   opts[a.slice(2)]=argv[++i];
  }else throw Error('Unknown option '+a);
 }
 opts.seconds=Number(opts.seconds);opts.advance=Number(opts.advance);
 if(!Number.isInteger(opts.seconds)||opts.seconds<3||opts.seconds>45)throw Error('--seconds must be integer 3..45');
 if(!Number.isSafeInteger(opts.advance)||opts.advance<0||opts.advance>3000)throw Error('--advance must be integer 0..3000');
 if(!/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/dungeon(?:\/?(?:\?.*)?)?$/.test(opts.url))
  throw Error('--url must point to a local /dungeon test server');
 if(typeof opts.seed!=='string'||opts.seed.length>96||!opts.seed)throw Error('Invalid bounded test seed');
 return opts;
}
function buildSnapshotSequence({seed,seconds,advance}){
 const {DungeonRuntime}=require(path.resolve(__dirname,'../../../dist/games/ai-dungeon/src/index.js'));
 const game=DungeonRuntime.create(seed);
 for(let i=0;i<advance;i++)game.step();
 const states=[game.publicState()];
 for(let i=0;i<Math.ceil((seconds+6)*1000/SOURCE_TICK_INTERVAL_MS);i++){
  game.step();states.push(game.publicState());
 }
 return states;
}
/**
 * Runs in the page BEFORE app.js. It never calls DungeonRuntime, reads hidden
 * engine fields, rewrites game snapshots, changes a render callback's dt, or
 * invents a frame. Exactly one explicit track.requestFrame() is attempted
 * after each observed newly submitted WebGL renderer frame.
 */
function bootstrapCapture({maxRecords=2400,maxEncodedBytes=24*1024*1024}={}){
 let active=false,frames=[],callbacks=[],snapshots=[],frameRecordsDropped=0;
 let lastRenderFrame=-1,recordedRequestFrames=0,recording=null;
 let publicState=null,renderDiagnostics=null;
 const clock=()=>performance.now();
 const keep=(list,item)=>{if(list.length<maxRecords)list.push(item);else frameRecordsDropped++};
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 Object.defineProperty(window,'__DUNGEON_PUBLIC_STATE__',{
  configurable:true,enumerable:true,
  get(){return publicState},
  set(value){publicState=value;
   if(active&&Number.isSafeInteger(value?.run)&&Number.isSafeInteger(value?.tick))
    keep(snapshots,{atMs:clock(),run:value.run,tick:value.tick,floor:value.floor,phase:value.phase});
  }
 });
 Object.defineProperty(window,'__DUNGEON_RENDER_DIAGNOSTICS__',{
  configurable:true,enumerable:true,
  get(){return renderDiagnostics},
  set(value){renderDiagnostics=value;
   if(!active||!Number.isSafeInteger(value?.frame)||value.frame<=lastRenderFrame)return;
   lastRenderFrame=value.frame;
   keep(frames,{atMs:clock(),frame:value.frame,run:value.renderedState?.run,
    tick:value.renderedState?.tick,drawCalls:value.drawCalls,triangles:value.triangles,
    softwareWebGL:value.softwareWebGL,renderPixels:value.directRenderBudget?.renderPixels,
    renderSurfaceSetSizeCalls:value.renderSurface?.setSizeCalls??null,
    renderSurfaceDprChanges:value.renderSurface?.dprChanges??null,
    directRenderMs:value.softwareWebGL&&finite(value.directRenderMs)?value.directRenderMs:null});
   if(recording?.track&&recording.started&&typeof recording.track.requestFrame==='function'){
    try{recording.track.requestFrame();recordedRequestFrames++}
    catch(error){recording.requestError=String(error)}
   }
  }
 });
 // A callback's wall time includes JS and synchronous render submission; it
 // is not GPU elapsed time. Instrument only callbacks that advanced the real
 // renderer's submission ID. No synthetic callback or changed frame pacing.
 const originalRaf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=function(callback){
  return originalRaf(timestamp=>{
   const before=renderDiagnostics?.frame??-1,start=clock();
   try{return callback(timestamp)}finally{
    const frame=renderDiagnostics?.frame??-1;
    if(active&&frame>before)keep(callbacks,{atMs:clock(),frame,durationMs:clock()-start});
   }
  });
 };
 async function start(record){
  if(active)throw Error('D01 capture trial already active');
  frames=[];callbacks=[];snapshots=[];frameRecordsDropped=0;recordedRequestFrames=0;
  lastRenderFrame=renderDiagnostics?.frame??-1;recording=null;active=true;
  if(!record)return {status:'SOURCE_ONLY'};
  const canvas=document.querySelector('canvas#world');
  if(!canvas||typeof canvas.captureStream!=='function')return {status:'UNAVAILABLE',reason:'canvas.captureStream unavailable'};
  let stream=null,track=null;
  try{
   stream=canvas.captureStream(0);
   track=stream.getVideoTracks()[0];
   if(!track||typeof track.requestFrame!=='function')throw Error('manual requestFrame unavailable');
   const type=['video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
   if(!type)throw Error('WebM MediaRecorder unsupported');
   const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:2000000});
   const chunks=[];
   recording={stream,track,recorder,chunks,mimeType:type,started:false,bytes:0,
    overflow:false,requestError:null};
   recorder.addEventListener('dataavailable',event=>{
    if(!event.data?.size)return;
    if(recording.bytes+event.data.size>maxEncodedBytes){recording.overflow=true;return}
    recording.bytes+=event.data.size;chunks.push(event.data);
   });
   recorder.start(750);recording.started=true;
   return {status:'RECORDING',mimeType:type,source:'manual frame request at genuine renderer submissions'};
  }catch(error){try{stream?.getTracks().forEach(t=>t.stop())}catch{}
   recording=null;return {status:'UNAVAILABLE',reason:String(error)};
  }
 }
 async function stop(){
  if(!active)return {raw:null,videoBase64:null};
  active=false;
  let capture={status:recording?'RECORDING_FINISHING':'NOT_STARTED'},videoBase64=null;
  if(recording){
   const r=recording;
   const done=new Promise(resolve=>{
    if(r.recorder.state==='inactive'){resolve('already stopped');return}
    const timeout=setTimeout(()=>resolve('stop timed out'),6500);
    r.recorder.addEventListener('stop',()=>{clearTimeout(timeout);resolve('stopped')},{once:true});
    r.recorder.addEventListener('error',()=>{clearTimeout(timeout);resolve('recorder error')},{once:true});
   });
   try{if(r.recorder.state!=='inactive')r.recorder.stop()}catch{}
   const outcome=await done;
   try{r.stream.getTracks().forEach(t=>t.stop())}catch{}
   capture={status:r.overflow?'CAP_REACHED':r.bytes===0?'ENCODED_VIDEO_EMPTY':outcome==='stopped'?'ENCODED':'STOP_UNVERIFIED',
    detail:outcome,mimeType:r.mimeType,encodedBytes:r.bytes,numberOfChunks:r.chunks.length,
    tracksCreated:1,tracksStopped:r.stream.getTracks().every(t=>t.readyState==='ended'),
    manualFrameRequests:recordedRequestFrames,requestError:r.requestError,overflow:r.overflow};
   if(!r.overflow&&r.bytes>0&&outcome==='stopped'){
    const blob=new Blob(r.chunks,{type:r.mimeType});
    videoBase64=await new Promise(resolve=>{
     const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]??null);
     reader.onerror=()=>resolve(null);reader.readAsDataURL(blob);
    });
   }
  }
  recording=null;
  const raw={frames,callbacks,snapshots,frameRecordsDropped,recordedRequestFrames,capture};
  return {raw,videoBase64};
 }
 window.__D01_CAPTURE__=Object.freeze({start,stop,version:1});
}
async function runTrial(browser,opts,mode,states){
 const context=await browser.newContext({viewport:opts.mobile?{width:390,height:844}:{width:1440,height:832},
  deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 const cdp=await context.newCDPSession(page);
 let cdpReady=false;try{await cdp.send('Performance.enable');cdpReady=true}catch{}
 await page.addInitScript(bootstrapCapture,{maxRecords:2400,maxEncodedBytes:MAX_ENCODED_BYTES});
 let sourceStart=null;
 if(states){
  await page.route('**/dungeon/state',route=>{
   const index=sourceStart===null?0:Math.max(0,Math.min(states.length-1,Math.floor((Date.now()-sourceStart)/SOURCE_TICK_INTERVAL_MS)));
   return route.fulfill({status:200,json:states[index]});
  });
 }
 try{
  await page.goto(opts.url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Number.isSafeInteger(window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame)&&
   Boolean(window.__DUNGEON_PUBLIC_STATE__),null,{timeout:35000});
  // Do not count initialization, GLB texture loading and shader compilation as
  // a gameplay steady-state benchmark. Both A and B warm up identically.
  await page.waitForTimeout(1800);
  sourceStart=Date.now();
  const browserStart=cdpReady?(await cdp.send('Performance.getMetrics')).metrics:null;
  const started=await page.evaluate(record=>window.__D01_CAPTURE__.start(record),mode==='record');
  await page.waitForTimeout(opts.seconds*1000);
  // stop() has its own bounded MediaRecorder finalization; it must not be
  // confused with a browser-GPU stall or a Playwright navigation timeout.
  const stopped=await page.evaluate(()=>window.__D01_CAPTURE__.stop());
  const browserEnd=cdpReady?(await cdp.send('Performance.getMetrics')).metrics:null;
  const source=summarizeTrial({...stopped.raw,mode});
  source.start=started;source.errors=errors;
  source.browserCounters=summarizeBrowserCounters(browserStart,browserEnd);
  if(stopped.videoBase64){
   const target=path.join(opts.out,'d01-world-manual-frames.webm');
   fs.writeFileSync(target,Buffer.from(stopped.videoBase64,'base64'));
   source.capture.path=target;
  }
  return source;
 }finally{try{await cdp.detach()}catch{}await context.close()}
}
async function main(argv){
 const opts=parseArgs(argv);fs.mkdirSync(opts.out,{recursive:true});
 // Match actual fixed-step authoritative game snapshots rather than guessing
 // actor motion from an unrelated stream. Live mode is deliberately unpaired.
 const states=opts.live?null:buildSnapshotSequence(opts);
 const {chromium}=require('@playwright/test');
 const browser=await chromium.launch({headless:true,
  args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const unrecorded=await runTrial(browser,opts,'source-only',states);
  const recording=await runTrial(browser,opts,'record',states);
  const result={schemaVersion:1,at:new Date().toISOString(),testedSource:'current local working tree (caller must record git rev-parse HEAD)',
   provenance:states?{type:'real-authority-fixed-seed-snapshots',seed:opts.seed,initialSteps:opts.advance,
    replayRateMs:SOURCE_TICK_INTERVAL_MS,matchedStateSequence:true,claim:'Identical precomputed authoritative snapshots; callback scheduling may cause different subsets to be delivered or rendered'}:
    {type:'live-unmodified-server',matchedStateSequence:false},
   viewport:opts.mobile?[390,844]:[1440,832],secondsPerTrial:opts.seconds,
   unrecorded,recording,comparison:compareTrials(unrecorded,recording),
   verdict:'PERFORMANCE ACCEPTANCE NOT PROVEN by recording alone. Verify full GPU/browser profile, source frame movement and video contents.'};
  const out=path.join(opts.out,'capture-profile.json');fs.writeFileSync(out,JSON.stringify(result,null,2));
  console.log(JSON.stringify({path:out,comparison:result.comparison,
   recording:recording.capture,unrecordedSource:unrecorded.source},null,2));
 }finally{await browser.close()}
}
if(require.main===module)main(process.argv.slice(2)).catch(error=>{console.error(error.stack||String(error));process.exitCode=1});
module.exports={parseArgs,buildSnapshotSequence,bootstrapCapture,runTrial};
