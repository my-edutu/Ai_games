'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {createOrderedReplayFeed,describeOrganicCheckpoint,planOrganicCheckpointWait}=require('./dungeon-m1-ordered-feed.cjs');
const BASELINE='281735d0910c6b2443648af976003d50412ee324',SEED='gauntlet-corpus-v1-0';
const VIEW=process.env.DUNGEON_M1_VIEWPORT==='mobile'?'mobile':'desktop';
const SIZE=VIEW==='mobile'?{width:390,height:844}:{width:1440,height:832};
fs.mkdirSync('artifacts',{recursive:true});

// Record each genuine step of the production authority, without staged fights,
// damage changes, teleports, cut scenes or forced death.
function organicExpedition(){
 const runtime=DungeonRuntime.create(SEED),snapshots=[runtime.publicState()];
 const milestones={entry:0,combat:null,warden:null,floor:null,defeat:null,restart:null};
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
 return {snapshots,milestones};
}
// The only film inputs are the actual canvas and the spectator's original,
// user-opted-in WebAudio bus. No synthetic soundtrack or rendered mock scene.
// Capture full-motion original WebGL/opt-in WebAudio in timestamp-ordered
// bounded chunks. The previous 8fps/480kbps and final in-page base64
// accumulation could not review natural sword/camera motion reliably.
async function beginRecording(page,isDesktop){
 return page.evaluate((desktop)=>{
  try{
   const canvas=document.getElementById('world');
   const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
   if(!canvas?.captureStream||!mime||typeof window.__M1_MEDIA_CHUNK__!=='function')
    return {status:'UNAVAILABLE',reason:'WebGL MediaRecorder or bounded disk sink unavailable'};
   const requestedFps=24,videoBitrate=desktop?2400000:1100000;
   const video=canvas.captureStream(requestedFps),audio=window.__DUNGEON_CAPTURE_SOUND__?.();
   const v=video.getVideoTracks(),a=audio?.getAudioTracks()||[];
   if(v.length!==1)return {status:'UNAVAILABLE',reason:'No WebGL video track'};
   const stream=new MediaStream([...v,...a]);
   const recorder=new MediaRecorder(stream,{mimeType:mime,
    videoBitsPerSecond:videoBitrate,audioBitsPerSecond:112000});
   let sequence=Promise.resolve(),bytes=0,parts=0,failure=null;
   window.__M1_RECORD__={recorder,stream,video};
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
     try{
      await sequence;
      resolve({status:bytes>2048&&parts>0&&!failure?'RECORDED':'UNAVAILABLE',
       reason:failure||(bytes>2048?undefined:'Empty WebGL film'),bytes,
       chunks:parts,mime,audioTracks:a.length,videoTracks:v.length,
       requestedFps,videoBitrate,audioBitrate:112000});
     }catch(e){resolve({status:'UNAVAILABLE',reason:String(e),bytes,chunks:parts})}
     finally{stream.getTracks().forEach(t=>t.stop());video.getTracks().forEach(t=>t.stop())}
    };
   });
   recorder.start(1600);
   return {status:'RECORDING',mime,audioTracks:a.length,videoTracks:v.length,
    requestedFps,videoBitrate,audioBitrate:112000};
  }catch(e){return {status:'UNAVAILABLE',reason:String(e)}}
 },isDesktop);
}
async function stopRecording(page){
 let timer;
 try{return await Promise.race([
  page.evaluate(async()=>{
   const c=window.__M1_RECORD__;
   if(!c)return {status:'UNAVAILABLE',reason:'Never started'};
   if(c.recorder.state!=='inactive')c.recorder.stop();
   return window.__M1_RESULT__;
  }),
  new Promise(resolve=>{timer=setTimeout(()=>resolve({status:'UNAVAILABLE',reason:'Encoding timeout'}),60000)})
 ])}finally{clearTimeout(timer)}
}
test('M1 organic full-journey original WebGL audiovisual evidence: '+VIEW,async({page})=>{
 test.setTimeout(30*60*1000);
 const {snapshots,milestones}=organicExpedition();
 for(const key of ['combat','warden','floor','defeat','restart'])
  expect(milestones[key],'Missing organic milestone: '+key).not.toBeNull();
 for(const [a,b] of [['entry','combat'],['combat','warden'],['warden','floor'],['floor','defeat'],['defeat','restart']])
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
    // Remove the alternate listener when 'drain' wins. A multi-minute
    // 1440px original WebM otherwise accumulated 11+ stale error listeners.
    const cleanup=()=>{filmOutput.off('error',onError);
     filmOutput.off('drain',onDrain)};
    const onDrain=()=>{cleanup();resolve()};
    const onError=err=>{cleanup();reject(err)};
    filmOutput.once('drain',onDrain);filmOutput.once('error',onError);
   });
  savedBytes+=data.length;savedChunks++;
 });
 const recording=await beginRecording(page,VIEW==='desktop'),started=Date.now();
 // Preserve independent live original PCM signal evidence, not just WebM
 // track count (which cannot establish actual audible or synchronized sound).
 let pcmRequested=false,stageError=null,unfinishedCheckpoint=null;
 let lastAcceptedIndex=0; // genuine source checksum actually rendered
 try{
 for(const stage of ['combat','warden','floor','defeat','restart']){
  const index=milestones[stage],expected=snapshots[index];
  if(stage==='warden'){
   // Arm the native bus before the FIRST ACTUAL Warden HP-loss checkpoint,
   // never inventing boss damage, sound, or an accelerated authority tick.
   const preImpact=Math.max((milestones.combat??0)+1,index-2);
   if(preImpact<index){
    unfinishedCheckpoint={stage:'warden-pre-impact',index:preImpact,
     checksum:snapshots[preImpact].checksum};
    feed.allowThrough(preImpact);
    await expect.poll(()=>page.evaluate(()=>
     window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null
    ),{timeout:planOrganicCheckpointWait({
     fromIndex:lastAcceptedIndex,toIndex:preImpact
    }),intervals:[300,750,1200]}).toBe(snapshots[preImpact].checksum);
    lastAcceptedIndex=preImpact;
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
  const stageBudgetMs=planOrganicCheckpointWait({fromIndex:lastAcceptedIndex,toIndex:index});
  unfinishedCheckpoint={stage,index,checksum:expected.checksum,stageBudgetMs};
  feed.allowThrough(index);
  // The *rendered frame's* checksum must match the source milestone.
  // An unrelated next frame is NOT evidence of a recorded Warden contact.
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null
  ),{timeout:stageBudgetMs,intervals:[300,750,1200]}).toBe(expected.checksum);
  const proof=await page.evaluate(()=>{
   const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,s=window.__DUNGEON_PUBLIC_STATE__;
   return {frame:d?.frame??0,renderedState:d?.renderedState??null,
    publicChecksum:s?.checksum??null,composition:d?.composition,
    visibility:d?.visibility,frameDelivery:d?.frameDelivery,
    triangles:d?.triangles,soundstage:d?.soundstage};
  });
  expect(proof.frame,'real rendered frame for '+stage).toBeGreaterThan(0);
  expect(proof.renderedState?.checksum,'rendered truth '+stage).toBe(expected.checksum);
  expect(proof.publicChecksum,'consumed truth '+stage).toBe(expected.checksum);
  // Sample the genuine imported skeleton ONCE at each real five-stage chapter;
  // never animate a fake actor, alter authority or add per-frame GPU work.
  const sourceRig=await page.evaluate(()=>
   window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.()??null);
  expect(sourceRig?.schemaVersion,'native source rig at '+stage).toBe(1);
  expect(sourceRig.summary.invalidQuaternionCount,'bone quaternion at '+stage).toBe(0);
  expect(sourceRig.summary.invalidMatrixCount,'source bone matrix at '+stage).toBe(0);
  expect(sourceRig.summary.disconnectedSegments,'joint hierarchy at '+stage).toBe(0);
  expect(sourceRig.summary.invalidSegments,'finite limb length at '+stage).toBe(0);
  expect(sourceRig.summary.bindReferenceComplete,'original GLB inverse-bind at '+stage).toBe(true);
  expect(sourceRig.summary.bindReferenceMissingActors).toBe(0);
  expect(sourceRig.summary.maxStretchFraction,'limb stretch at '+stage).toBeLessThanOrEqual(.20);
  const screenshot='artifacts/dungeon-m1-organic-journey-'+VIEW+'-'+stage+'-actual-canvas.png';
  await page.locator('#world').screenshot({path:screenshot,timeout:90000});
  milestoneFrameProof.push({stage,index,checksum:expected.checksum,frame:proof.frame,
   renderedState:proof.renderedState,screenshot,sourceRig:sourceRig.summary});
  observations.push({stage,run:proof.renderedState.run,tick:proof.renderedState.tick,
   floor:proof.renderedState.floor,phase:expected.phase,
   checksum:proof.publicChecksum,frame:proof.frame,composition:proof.composition,
   visibility:proof.visibility,frameDelivery:proof.frameDelivery,
   triangles:proof.triangles,soundstage:proof.soundstage,sourceRig:sourceRig.summary});
  // A review-playback hold of the unchanged real snapshot, not a staged win.
  await page.waitForTimeout(420);
  lastAcceptedIndex=index;
  unfinishedCheckpoint=null;
 }
 }catch(error){
  // Evidence failure remains a FAILURE: finish the actual WebM and record
  // the last source tick/visible checksum before rejecting this same test.
  // Do not fast-forward, reset authority, fake a Warden hit or label a
  // partial film 'natural restart'.
  stageError=error;
 }
 const feedMetrics=feed.metrics();
 if(!stageError){
  expect(feedMetrics.uniqueDelivered,'every authentic authority tick delivered').toBe(snapshots.length);
  expect(feedMetrics.lastDeliveredIndex,'natural restart delivered').toBe(snapshots.length-1);
 }
 let failureObservation=null,failureSourceRig=null,stageFailure=null;
 if(stageError){
  try{
   failureObservation=await page.evaluate(()=>{
    const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    return {frame:d?.frame??0,renderedState:d?.renderedState??null,
     publicChecksum:window.__DUNGEON_PUBLIC_STATE__?.checksum??null,
     frameDelivery:d?.frameDelivery??null};
   });
   const rig=await page.evaluate(()=>
    window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.()??null);
   failureSourceRig=rig?{summary:rig.summary,
    cast:rig.actors?.map(a=>({kind:a.kind,id:a.id,mode:a.mode,
     sourceAction:a.sourceActionSample,bindReferenceComplete:a.bindReferenceComplete,
     maxStretchFraction:a.maxStretchFraction,
     originalWeaponGripSocket:a.sourceWeaponGrip?.socketName??null}))}:null;
  }catch(observationError){
   failureObservation={unavailable:String(observationError)};
  }
  if(unfinishedCheckpoint){
   stageFailure=describeOrganicCheckpoint({
    stage:unfinishedCheckpoint.stage,expectedIndex:unfinishedCheckpoint.index,
    expectedChecksum:unfinishedCheckpoint.checksum,
    renderedChecksum:failureObservation?.renderedState?.checksum??null,
    renderedFrame:failureObservation?.frame??0,feed});
   stageFailure={...stageFailure,exactOriginalStageBudgetMs:unfinishedCheckpoint.stageBudgetMs};
  }
 }
 const film=recording.status==='RECORDING'?await stopRecording(page):recording;
 await new Promise((resolve,reject)=>{
  if(sinkError)return reject(Error(sinkError));
  filmOutput.once('error',reject);filmOutput.end(resolve);
 });
 if(film.status==='RECORDED'&&(savedBytes!==film.bytes||savedChunks!==film.chunks))
  throw Error('WebM integrity mismatch between true MediaRecorder and streamed disk chunks');
 if(film.status!=='RECORDED')fs.rmSync(filmPath,{force:true});
 const pcm=pcmRequested?await page.evaluate(async()=>{
  const recorded=await window.__M1_PCM_CAPTURE__;
  const {wav,...meta}=recorded||{status:'UNAVAILABLE',reason:'Missing PCM result'};
  if(!wav)return meta;
  const raw=new Uint8Array(wav),parts=[];
  for(let i=0;i<raw.length;i+=16384)
   parts.push(String.fromCharCode(...raw.subarray(i,i+16384)));
  return {...meta,base64:btoa(parts.join(''))};
 }):{status:'UNAVAILABLE',reason:'Original PCM recorder unavailable'};
 const pcmPath='artifacts/dungeon-m1-organic-journey-'+VIEW+'-original-warden.wav';
 if(pcm.base64)fs.writeFileSync(pcmPath,Buffer.from(pcm.base64,'base64'));
 const {base64:pcmBase64,...pcmFacts}=pcm;
 const receipt={schemaVersion:1,sourceSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  baselineSha:BASELINE,baselineArtifact:'https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898',
  view:VIEW,viewport:SIZE,seed:SEED,source:'actual DungeonRuntime.step to real Chromium WebGL',
  scriptedStateChanges:false,authoritySnapshots:snapshots.length,
  milestones:Object.fromEntries(Object.entries(milestones).map(([name,index])=>
   [name,{index,run:snapshots[index].run,tick:snapshots[index].tick,floor:snapshots[index].floor,
    checksum:snapshots[index].checksum}])),
  elapsedMs:Date.now()-started,playbackCadence:'browser polling, held real milestone frames, not original live cadence',orderedFeed:feedMetrics,audioGestureOptIn:audioOptedIn,
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
  milestoneFrameProof,observations,pageErrors:errors,
  // An incomplete five-stage original journey is explicit negative evidence,
  // even when a partial genuine WebM and valid earlier chapters exist.
  acceptance:stageError?'FAILED_UNREACHED_OR_UNRENDERED_CHECKPOINT':
   'ALL_FIVE_STAGES_EXACTLY_RENDERED',
  checkpointFailure:stageFailure,
  failureObservation,failureSourceRig,
  failureDetails:stageError?String(stageError.stack||stageError).slice(0,6500):null};
 fs.writeFileSync(stem+'.json',JSON.stringify(receipt,null,2));
 // Never mislabel a Warden timeout as a natural restart screenshot.
 const finalImage=stageError?stem+'-failure-actual-canvas.png':
  stem+'-real-restart.png';
 await page.locator('#world').screenshot({path:finalImage,timeout:90000});
 if(stageError)throw stageError;
 expect(errors).toEqual([]);
 expect(observations.some(o=>o.frame>0)).toBe(true);
 // Capturing a film is NOT evidence of transformed looks, feels or plays.
});
