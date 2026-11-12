'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {createOrderedReplayFeed}=require('./dungeon-m1-ordered-feed.cjs');
const {finalizeOriginalJourneyRecording}=require('./dungeon-m1-recording-lifecycle.cjs');
const BASELINE='281735d0910c6b2443648af976003d50412ee324',SEED='gauntlet-corpus-v1-0';
const VIEW=process.env.DUNGEON_M1_VIEWPORT==='mobile'?'mobile':'desktop';
const SIZE=VIEW==='mobile'?{width:390,height:844}:{width:1440,height:832};
fs.mkdirSync('artifacts',{recursive:true});

// Record each genuine step of the production authority, without staged fights,
// damage changes, teleports, cut scenes or forced death.
function organicExpedition(){
 const runtime=DungeonRuntime.create(SEED),snapshots=[runtime.publicState()];
 const milestones={entry:0,combat:null,warden:null,
  'warden-warning':null,'warden-release':null,'warden-counter':null,
  floor:null,defeat:null,restart:null};
 const first=snapshots[0];
 for(let i=0;i<2600;i++){
  const previous=snapshots.at(-1),s=runtime.step();
  snapshots.push(s);
  const boss=s.units.find(u=>u.kind==='warden'),priorBoss=previous.units.find(u=>u.kind==='warden');
  if(milestones.combat===null&&(s.kills>first.kills||s.units.some(u=>['attack','cast','hurt'].includes(u.action))))
   milestones.combat=snapshots.length-1;
  if(milestones.warden===null&&boss&&priorBoss&&boss.hp<priorBoss.hp&&s.units.some(u=>u.faction==='party'&&u.hp>0))
   milestones.warden=snapshots.length-1;
  if(milestones.floor===null&&s.floor>first.floor)milestones.floor=snapshots.length-1;
  if(milestones.defeat===null&&s.phase==='intermission'&&s.units.every(u=>u.faction!=='party'||u.hp===0))
   milestones.defeat=snapshots.length-1;
  if(s.run>first.run){milestones.restart=snapshots.length-1;break}
 }
 // Find one ENTIRE real authority warning → cast → earned counter sequence
 // after first Warden contact. Do not synthesize boss casts, script a victory,
 // substitute a screenshot camera, or cherry-pick unrelated ticks. The same
 // original seed's 3 adjacent snapshots must establish the true sequence.
 for(let i=(milestones.warden??0)+1;i+2<(milestones.floor??snapshots.length);i++){
  const warning=snapshots[i],release=snapshots[i+1],counter=snapshots[i+2];
  const boss=release.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(!boss||warning.bossWarning?.attackTick!==release.tick||
     warning.bossWarning.cells.length<8||
     release.bossWarning||counter.bossWarning||
     boss.action!=='cast'||
     !(counter.bossRecovery?.remaining>0)||
     !counter.units.some(u=>u.kind==='warden'&&u.hp>0))continue;
  milestones['warden-warning']=i;
  milestones['warden-release']=i+1;
  milestones['warden-counter']=i+2;
  break;
 }
 return {snapshots,milestones};
}
// The only film inputs are the actual canvas and the spectator's original,
// user-opted-in WebAudio bus. No synthetic soundtrack or rendered mock scene.
// Capture full-motion original WebGL/opt-in WebAudio in timestamp-ordered
// bounded chunks. The previous 8fps/480kbps and final in-page base64
// accumulation could not review natural sword/camera motion reliably.
async function beginRecording(page,isDesktop){
 return page.evaluate(async(desktop)=>{
  try{
   const canvas=document.getElementById('world');
   const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
   if(!canvas?.captureStream||!mime||typeof window.__M1_MEDIA_CHUNK__!=='function')
    return {status:'UNAVAILABLE',reason:'WebGL MediaRecorder or bounded disk sink unavailable'};
   const requestedFps=24,videoBitrate=desktop?2400000:1100000;
   // Request each actual completed WebGL frame rather than 24 synthetic
   // resamples of a browser that may only present a few real frames per second.
   let video=canvas.captureStream(0),v=video.getVideoTracks();
   let frameCaptureMode='render-driven';
   if(v.length===1&&typeof v[0].requestFrame!=='function'){
    video.getTracks().forEach(t=>t.stop());
    video=canvas.captureStream(requestedFps);v=video.getVideoTracks();
    frameCaptureMode='timed-fallback';
   }
   const audio=window.__DUNGEON_CAPTURE_SOUND__?.(),a=audio?.getAudioTracks()||[];
   if(v.length!==1)return {status:'UNAVAILABLE',reason:'No WebGL video track'};
   let framePump=null;
   if(frameCaptureMode==='render-driven'){
    const {createRenderedFrameCapture}=await import('/dungeon/rendered-frame-capture.js');
    framePump=createRenderedFrameCapture({
     readFrame:()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame,
     requestFrame:()=>v[0].requestFrame(),
     schedule:fn=>requestAnimationFrame(fn),
     cancel:id=>cancelAnimationFrame(id)
    });
   }
   const stream=new MediaStream([...v,...a]);
   const recorder=new MediaRecorder(stream,{mimeType:mime,
    videoBitsPerSecond:videoBitrate,audioBitsPerSecond:112000});
   let sequence=Promise.resolve(),bytes=0,parts=0,failure=null;
   window.__M1_RECORD__={recorder,stream,video,framePump};
   window.__M1_RESULT__=new Promise(resolve=>{
    recorder.ondataavailable=e=>{
     if(!e.data?.size)return;
     const chunk=e.data;
     // Preserve exact WebM chunk order, even if converting the next Blob
     // finishes sooner. Never hold the entire film inside the page.
     sequence=sequence.then(async()=>{
      const u=new Uint8Array(await chunk.arrayBuffer());
      let binary='';
      for(let i=0;i<u.length;i+=16384)
       binary+=String.fromCharCode(...u.subarray(i,i+16384));
      await window.__M1_MEDIA_CHUNK__(btoa(binary));
      bytes+=u.length;parts++;
     }).catch(err=>{failure=String(err)});
    };
    recorder.onerror=e=>{failure=String(e.error||e)};
    recorder.onstop=async()=>{
     const capture=framePump?.stop()??null;
     try{
      await sequence;
      const frameFault=capture?.failure??null;
      resolve({status:bytes>2048&&parts>0&&!failure&&!frameFault?'RECORDED':'UNAVAILABLE',
       reason:frameFault||failure||(bytes>2048?undefined:'Empty WebGL film'),bytes,
       chunks:parts,mime,audioTracks:a.length,videoTracks:v.length,
       requestedFps,videoBitrate,audioBitrate:112000,frameCaptureMode,
       requestedRenderedFrames:capture?.requestedFrames??null,
       lastRequestedRenderFrame:capture?.lastFrame??null});
     }catch(e){resolve({status:'UNAVAILABLE',reason:String(e),bytes,chunks:parts})}
     finally{stream.getTracks().forEach(t=>t.stop());video.getTracks().forEach(t=>t.stop())}
    };
   });
   recorder.start(1600);
   framePump?.start();
   return {status:'RECORDING',mime,audioTracks:a.length,videoTracks:v.length,
    requestedFps,videoBitrate,audioBitrate:112000,frameCaptureMode};
  }catch(e){return {status:'UNAVAILABLE',reason:String(e)}}
 },isDesktop);
}
async function stopRecording(page){
 let timer;
 try{return await Promise.race([
  page.evaluate(async()=>{
   const c=window.__M1_RECORD__;
   if(!c)return {status:'UNAVAILABLE',reason:'Never started'};
   c.framePump?.stop();
   if(c.recorder.state!=='inactive')c.recorder.stop();
   return window.__M1_RESULT__;
  }),
  new Promise(resolve=>{timer=setTimeout(()=>resolve({status:'UNAVAILABLE',reason:'Encoding timeout'}),60000)})
 ])}finally{clearTimeout(timer)}
}
test('M1 organic full-journey original WebGL audiovisual evidence: '+VIEW,async({page},testInfo)=>{
 test.setTimeout(22*60*1000);
 // Assert resolved runner options, not a claim inferred from a config filename.
 const observerPolicy={playwrightVideo:testInfo.project.use.video,
  playwrightTrace:testInfo.project.use.trace,
  primaryFilm:'original canvas + spectator-opted-in WebAudio',
  explicitMilestoneScreenshots:true};
 expect(observerPolicy.playwrightVideo).toBe('off');
 expect(observerPolicy.playwrightTrace?.screenshots).toBe(false);
 const {snapshots,milestones}=organicExpedition();
 for(const key of ['combat','warden','warden-warning','warden-release','warden-counter','floor','defeat','restart'])
  expect(milestones[key],'Missing organic milestone: '+key).not.toBeNull();
 for(const [a,b] of [['entry','combat'],['combat','warden'],
  ['warden','warden-warning'],['warden-warning','warden-release'],
  ['warden-release','warden-counter'],['warden-counter','floor'],
  ['floor','defeat'],['defeat','restart']])
  expect(milestones[a],'Natural chronology: '+a+' before '+b).toBeLessThan(milestones[b]);
 const errors=[],observations=[],milestoneFrameProof=[];page.on('pageerror',e=>errors.push(String(e)));
 // An independent 240ms host loop could overwrite unread game states.
 // Instead each actual spectator fetch consumes one true DungeonRuntime step.
 const feed=createOrderedReplayFeed(snapshots);
 await page.route('**/dungeon/state',route=>route.fulfill({json:feed.pull().snapshot}));
 await page.setViewportSize(SIZE);await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:90000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0),{timeout:90000}).toBeGreaterThan(3);
 await page.locator('#audio-toggle').click(); // genuine spectator opt-in
 const audioOptedIn=(await page.locator('#audio-toggle').getAttribute('aria-pressed'))==='true';
 const stem='artifacts/dungeon-m1-organic-journey-'+VIEW;
 const filmPath=stem+'.webm';
 const filmOutput=fs.createWriteStream(filmPath,{flags:'w'});
 let savedBytes=0,savedChunks=0,sinkError=null;
 filmOutput.on('error',err=>{sinkError=String(err)});
 await page.exposeBinding('__M1_MEDIA_CHUNK__',async(_,encoded)=>{
  if(sinkError)throw Error(sinkError);
  if(typeof encoded!=='string'||encoded.length>16*1024*1024)
   throw Error('Unbounded or invalid WebM recording chunk');
  const data=Buffer.from(encoded,'base64');
  if(data.length===0)return;
  if(!filmOutput.write(data))
   await new Promise((resolve,reject)=>{
    filmOutput.once('drain',resolve);filmOutput.once('error',reject);
   });
  savedBytes+=data.length;savedChunks++;
 });
 const recording=await beginRecording(page,VIEW==='desktop'),started=Date.now();
 // Preserve independent live original PCM signal evidence, not just WebM
 // track count (which cannot establish actual audible or synchronized sound).
 let pcmRequested=false,stageFailure=null,failedStage=null;
 try{
 for(const stage of ['combat','warden','warden-warning','warden-release','warden-counter','floor','defeat','restart']){
  failedStage=stage;
  const index=milestones[stage],expected=snapshots[index];
  if(stage==='warden'){
   // Arm the native bus before the FIRST ACTUAL Warden HP-loss checkpoint,
   // never inventing boss damage, sound, or an accelerated authority tick.
   const preImpact=Math.max((milestones.combat??0)+1,index-2);
   if(preImpact<index){
    feed.allowThrough(preImpact);
    await expect.poll(()=>page.evaluate(()=>
     window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null
    ),{timeout:420000,intervals:[300,750,1200]}).toBe(snapshots[preImpact].checksum);
   }
   pcmRequested=await page.evaluate(()=>{
    if(typeof window.__DUNGEON_RECORD_ORIGINAL_PCM__!=='function')return false;
    window.__M1_PCM_CAPTURE__=Promise.race([
     window.__DUNGEON_RECORD_ORIGINAL_PCM__(4),
     new Promise(resolve=>setTimeout(()=>resolve(
      {status:'UNAVAILABLE',reason:'Live PCM processor timeout'}),7000))
    ]);
    return true;
   });
  }
  feed.allowThrough(index);
  // The *rendered frame's* checksum must match the source milestone.
  // An unrelated next frame is NOT evidence of a recorded Warden contact.
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null
  ),{timeout:420000,intervals:[300,750,1200]}).toBe(expected.checksum);
  const proof=await page.evaluate(()=>{
   const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,s=window.__DUNGEON_PUBLIC_STATE__;
   return {frame:d?.frame??0,renderedState:d?.renderedState??null,
    publicChecksum:s?.checksum??null,composition:d?.composition,actorReadability:d?.actorReadability,
    cameraOcclusion:d?.cameraOcclusion,cinematicContinuity:d?.cinematicContinuity,visibility:d?.visibility,wardenWarningPhysicalClearance:d?.wardenWarningPhysicalClearance,baseWorldArchitecturalBatches:d?.baseWorldArchitecturalBatches,frameDelivery:d?.frameDelivery,
    renderPipeline:d?.renderPipeline,directRenderMs:d?.directRenderMs,
    directRenderBudget:d?.directRenderBudget,directDeliveryBudget:d?.directDeliveryBudget,
    surfaceResizes:d?.surfaceResizes,softwareWebGL:d?.softwareWebGL,
    nativeActorVisibility:d?.nativeActorVisibility,nativeAdultLegRig:d?.authored3D?{actors:d.authored3D.nativeAdultLegActors??0,frames:d.authored3D.nativeAdultLegFrames??0,groundMax:d.authored3D.nativeAdultLegGroundMax??0}:null,
    webglRendererName:d?.webglRendererName,postFX:d?.postFX,drawCalls:d?.drawCalls,
    triangles:d?.triangles,soundstage:d?.soundstage};
  });
  expect(proof.frame,'real rendered frame for '+stage).toBeGreaterThan(0);
  expect(proof.renderedState?.checksum,'rendered truth '+stage).toBe(expected.checksum);
  expect(proof.publicChecksum,'consumed truth '+stage).toBe(expected.checksum);
  expect(proof.actorReadability?.status,'real posed actor projection '+stage).toBe('MEASURED');
  expect(proof.baseWorldArchitecturalBatches?.sourceDrawCalls,'real original floor primitive source count').toBeGreaterThanOrEqual(proof.baseWorldArchitecturalBatches?.drawCalls??0);
  expect(proof.baseWorldArchitecturalBatches?.savedDrawCalls,'actual bounded saved base-world submits').toBeGreaterThanOrEqual(0);
  if(proof.softwareWebGL){
   expect(['active','partial-fail-open'].includes(proof.nativeActorVisibility?.status),
    'real software WebGL must report genuine per-frame rig frustum decisions').toBe(true);
   expect(proof.nativeActorVisibility?.retained,
    'at least one original hero or enemy GLB remains drawn').toBeGreaterThan(0);
   expect(proof.nativeActorVisibility?.sourceMeshesSkipped,
    'only a bounded number of imported skinned source meshes can be omitted').toBeGreaterThanOrEqual(0);
  }
  if(stage==='warden'||stage==='warden-warning'||stage==='warden-release'||stage==='warden-counter'){
   expect(proof.actorReadability.actors.some(a=>a.kind==='warden'&&a.inFrame),
    'real skinned Warden must be in the original 3D camera frame').toBe(true);
   expect(proof.actorReadability.criticalActorIds.length,
    'real shot must identify its own engaged subjects by ID').toBeGreaterThan(0);
   const bossSurface=proof.actorReadability.actors.find(a=>a.kind==='warden'&&a.inFrame);
   expect(bossSurface?.sourceSurfaceCount,
    'real Warden textured skin must supply source surface anchors').toBeGreaterThan(0);
   expect(bossSurface?.visibleHeightPx,
    'living Warden must occupy measurable 3D body height').toBeGreaterThan(16);
   const heroSurface=proof.actorReadability.actors.find(a=>
    a.critical&&a.faction==='party'&&a.inFrame);
   expect(heroSurface?.sourceSurfaceCount,
    'engaged Vanguard must carry real original skinned geometry').toBeGreaterThan(0);
   expect(heroSurface?.visibleHeightPx,
    'engaged hero must occupy measurable source-skinned body height').toBeGreaterThan(10);
   if(expected.bossWarning?.cells?.length){
    expect(proof.wardenWarningPhysicalClearance?.actualCells,
     'real hazard sightlines must be taken from authentic source cells').toBe(expected.bossWarning.cells.length);
   }
  }
  const screenshot='artifacts/dungeon-m1-organic-journey-'+VIEW+'-'+stage+'-actual-canvas.png';
  await page.locator('#world').screenshot({path:screenshot,timeout:90000});
  milestoneFrameProof.push({stage,index,checksum:expected.checksum,frame:proof.frame,
   renderedState:proof.renderedState,screenshot});
  observations.push({stage,run:proof.renderedState.run,tick:proof.renderedState.tick,
   floor:proof.renderedState.floor,phase:expected.phase,
   checksum:proof.publicChecksum,frame:proof.frame,composition:proof.composition,actorReadability:proof.actorReadability,
   visibility:proof.visibility,cameraOcclusion:proof.cameraOcclusion,
   cinematicContinuity:proof.cinematicContinuity,
   wardenWarningPhysicalClearance:proof.wardenWarningPhysicalClearance,baseWorldArchitecturalBatches:proof.baseWorldArchitecturalBatches,frameDelivery:proof.frameDelivery,
   renderPipeline:proof.renderPipeline,directRenderMs:proof.directRenderMs,
   directRenderBudget:proof.directRenderBudget,directDeliveryBudget:proof.directDeliveryBudget,
   surfaceResizes:proof.surfaceResizes,softwareWebGL:proof.softwareWebGL,
   nativeActorVisibility:proof.nativeActorVisibility,nativeAdultLegRig:proof.nativeAdultLegRig,
   webglRendererName:proof.webglRendererName,postFX:proof.postFX,drawCalls:proof.drawCalls,
   triangles:proof.triangles,soundstage:proof.soundstage});
  // A review-playback hold of the unchanged real snapshot, not a staged win.
  await page.waitForTimeout(420);
 }
 }catch(error){stageFailure=error;}
 const feedMetrics=feed.metrics();
 // A browser timeout is NOT a reason to discard its genuine WebGL/Opus film.
 // Always stop the original recorder and flush its disk sink before returning
 // the original failure; record the exact unfulfilled authoritative milestone.
 const finalization=await finalizeOriginalJourneyRecording({
  stop:async()=>recording.status==='RECORDING'?await stopRecording(page):recording,
  close:async()=>await new Promise((resolve,reject)=>{
   if(sinkError)return reject(Error(sinkError));
   filmOutput.once('error',reject);filmOutput.end(resolve);
  }),
  persist:async ({recording:captured,finalizationErrors})=>{
   fs.writeFileSync(stem+'-capture-finalization.json',JSON.stringify({
    sourceSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    baselineSha:BASELINE,view:VIEW,seed:SEED,
    verdict:stageFailure||finalizationErrors.length?'INCOMPLETE':'STAGES_RENDERED',
    failedStage:stageFailure?failedStage:null,
    failure:stageFailure?String(stageFailure):null,
    actualRenderedStages:milestoneFrameProof.map(p=>({stage:p.stage,index:p.index,checksum:p.checksum,frame:p.frame})),
    deliveredAuthoritySteps:feedMetrics.uniqueDelivered,
    expectedAuthoritySteps:snapshots.length,
    recording:captured,finalizationErrors
   },null,2));
  }
 });
 const film=finalization.recording;
 const mediaIntegrityError=film.status==='RECORDED'&&(savedBytes!==film.bytes||savedChunks!==film.chunks)?
  'WebM integrity mismatch between true MediaRecorder and streamed disk chunks':null;
 if(film.status!=='RECORDED')fs.rmSync(filmPath,{force:true});
 let pcm;
 try{pcm=pcmRequested?await page.evaluate(async()=>{
  const recorded=await window.__M1_PCM_CAPTURE__;
  const {wav,...meta}=recorded||{status:'UNAVAILABLE',reason:'Missing PCM result'};
  if(!wav)return meta;
  const raw=new Uint8Array(wav),parts=[];
  for(let i=0;i<raw.length;i+=16384)
   parts.push(String.fromCharCode(...raw.subarray(i,i+16384)));
  return {...meta,base64:btoa(parts.join(''))};
 }):{status:'UNAVAILABLE',reason:'Original PCM recorder unavailable'};
 }catch(error){pcm={status:'UNAVAILABLE',reason:'Original PCM collection failed: '+String(error)}}
 const pcmPath='artifacts/dungeon-m1-organic-journey-'+VIEW+'-original-warden.wav';
 if(pcm.base64)fs.writeFileSync(pcmPath,Buffer.from(pcm.base64,'base64'));
 const {base64:pcmBase64,...pcmFacts}=pcm;
 const receipt={schemaVersion:1,sourceSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  baselineSha:BASELINE,baselineArtifact:'https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898',
  observerPolicy,view:VIEW,viewport:SIZE,seed:SEED,source:'actual DungeonRuntime.step to real Chromium WebGL',
  scriptedStateChanges:false,authoritySnapshots:snapshots.length,
  milestones:Object.fromEntries(Object.entries(milestones).map(([name,index])=>
   [name,{index,run:snapshots[index].run,tick:snapshots[index].tick,floor:snapshots[index].floor,
    checksum:snapshots[index].checksum}])),
  elapsedMs:Date.now()-started,playbackCadence:'browser polling, held real milestone frames, not original live cadence',orderedFeed:feedMetrics,audioGestureOptIn:audioOptedIn,
  journeyCapture:{status:stageFailure||finalization.finalizationErrors.length||mediaIntegrityError||
    film.status!=='RECORDED'||milestoneFrameProof.length<5?'INCOMPLETE':'STAGES_RENDERED',
   failedStage:stageFailure?failedStage:null,failure:stageFailure?String(stageFailure):null,
   mediaIntegrityError,finalizationErrors:finalization.finalizationErrors,
   actualStageCount:milestoneFrameProof.length},
  recorder:{status:film.status,reason:film.reason,bytes:film.bytes||0,mime:film.mime,
   requestedFps:film.requestedFps||recording.requestedFps||0,
   videoBitrate:film.videoBitrate||recording.videoBitrate||0,
   audioBitrate:film.audioBitrate||recording.audioBitrate||0,
   chunks:film.chunks||0,bytesOnDisk:savedBytes,chunksOnDisk:savedChunks,
   cadenceVerified:'UNVERIFIED until decoded frames/timestamps inspected',
   audioTracks:film.audioTracks||0,videoTracks:film.videoTracks||0},
  originalAudioTrackPresent:film.status==='RECORDED'&&film.audioTracks>0,
  originalAudioPcm:{...pcmFacts,
   path:pcmBase64?pcmPath:null,source:'real original opted-in WebAudio master',
   captureWindow:'before first actual Warden HP loss, maximum four seconds',
   measured:'native PCM16 peak/RMS, explicit SILENT or UNAVAILABLE states',
   synchronizedWithVideo:'UNVERIFIED until temporal media comparison'},
  audibleSynchronizedSound:'UNVERIFIED: decode WebM and align hit timestamp with original PCM',
  matchedLockedBaseline:false,blindCritics:0,looks:'UNVERIFIED',feels:'UNVERIFIED',plays:'UNVERIFIED',
  milestoneFrameProof,observations,pageErrors:errors};
 fs.writeFileSync(stem+'.json',JSON.stringify(receipt,null,2));
 try{await page.locator('#world').screenshot({
  path:stem+(stageFailure?'-actual-last-rendered.png':'-real-restart.png'),timeout:90000});}
 catch(error){fs.writeFileSync(stem+'-last-frame-error.txt',String(error))}
 if(stageFailure)throw stageFailure;
 if(mediaIntegrityError)throw Error(mediaIntegrityError);
 if(finalization.finalizationErrors.length)
  throw Error('Original recording finalization failed: '+finalization.finalizationErrors.join('; '));
 expect(feedMetrics.uniqueDelivered,'every authentic authority tick delivered').toBe(snapshots.length);
 expect(feedMetrics.lastDeliveredIndex,'natural restart delivered').toBe(snapshots.length-1);
 expect(errors).toEqual([]);
 expect(observations.some(o=>o.frame>0)).toBe(true);
 // Capturing a film is NOT evidence of transformed looks, feels or plays.
});
