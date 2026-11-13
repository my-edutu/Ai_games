'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const {createUnheldAuthorityFeed}=require('./dungeon-m1-unheld-feed.cjs');
const BASELINE='281735d0910c6b2443648af976003d50412ee324';
const SEED='gauntlet-corpus-v1-0';
const VIEW=process.env.DUNGEON_M1_VIEWPORT==='mobile'?'mobile':'desktop';
const SIZE=VIEW==='mobile'?{width:390,height:844}:{width:1440,height:832};
const STEM='artifacts/dungeon-m1-unheld-'+VIEW;
fs.mkdirSync('artifacts',{recursive:true});

function expedition(){
 const runtime=DungeonRuntime.create(SEED);
 const snapshots=[runtime.publicState()];
 for(let i=0;i<2600;i++){
  const s=runtime.step();snapshots.push(s);
  if(s.run>snapshots[0].run)break; // authentic defeat and natural restart
 }
 if(snapshots.at(-1).run<=snapshots[0].run)
  throw Error('Seed never naturally restarted; no surrogate end allowed');
 return snapshots;
}
function milestones(snapshots){
 const first=snapshots[0],result={entry:0,combat:null,warden:null,warning:null,
  release:null,counter:null,floor:null,defeat:null,restart:snapshots.length-1};
 for(let i=1;i<snapshots.length;i++){
  const s=snapshots[i],prev=snapshots[i-1],
   boss=s.units.find(u=>u.kind==='warden'),
   prevBoss=prev.units.find(u=>u.kind==='warden');
  if(result.combat===null&&(s.kills>first.kills||s.units.some(u=>
   ['attack','cast','hurt'].includes(u.action))))result.combat=i;
  if(result.warden===null&&boss&&prevBoss&&boss.hp<prevBoss.hp&&
   s.units.some(u=>u.faction==='party'&&u.hp>0))result.warden=i;
  if(result.floor===null&&s.floor>first.floor)result.floor=i;
  if(result.defeat===null&&s.phase==='intermission'&&
   s.units.every(u=>u.faction!=='party'||u.hp===0))result.defeat=i;
 }
 for(let i=(result.warden??0)+1;i+2<(result.floor??snapshots.length);i++){
  const warning=snapshots[i],release=snapshots[i+1],counter=snapshots[i+2];
  const boss=release.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&warning.bossWarning?.attackTick===release.tick&&
   warning.bossWarning.cells.length>=8&&!release.bossWarning&&!counter.bossWarning&&
   boss.action==='cast'&&counter.bossRecovery?.remaining>0){
   result.warning=i;result.release=i+1;result.counter=i+2;break;
  }
 }
 return result;
}

async function startFilm(page){
 return page.evaluate(async()=>{
  try{
   const canvas=document.getElementById('world');
   const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   if(!canvas?.captureStream||!mime||typeof window.__M1_UNHELD_CHUNK__!=='function')
    return {status:'UNAVAILABLE',reason:'Native WebGL capture or sink unavailable'};
   let video=canvas.captureStream(0),track=video.getVideoTracks()[0],framePump=null;
   let captureMode='render-driven';
   if(!track?.requestFrame){
    video.getTracks().forEach(t=>t.stop());
    video=canvas.captureStream(24);track=video.getVideoTracks()[0];
    captureMode='timed-fallback';
   }else{
    const {createRenderedFrameCapture}=await import('/dungeon/rendered-frame-capture.js');
    framePump=createRenderedFrameCapture({
     readFrame:()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame,
     requestFrame:()=>track.requestFrame(),
     schedule:cb=>requestAnimationFrame(cb),
     cancel:id=>cancelAnimationFrame(id)
    });
   }
   const audio=window.__DUNGEON_CAPTURE_SOUND__?.();
   const audioTracks=audio?.getAudioTracks()||[];
   if(!track)return {status:'UNAVAILABLE',reason:'No original WebGL track'};
   const stream=new MediaStream([track,...audioTracks]);
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1300000,
    audioBitsPerSecond:112000});
   let chain=Promise.resolve(),bytes=0,chunks=0,failure=null,lastFrame=-1;
   window.__M1_UNHELD_TRACE__=[];window.__M1_UNHELD_ALIVE__=true;
   function sample(){
    if(!window.__M1_UNHELD_ALIVE__)return;
    const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    if(Number.isSafeInteger(d?.frame)&&d.frame!==lastFrame){
     lastFrame=d.frame;
     if(window.__M1_UNHELD_TRACE__.length<3200)
      window.__M1_UNHELD_TRACE__.push({
       frame:d.frame,checksum:d.renderedState?.checksum??null,
       tick:d.renderedState?.tick??null,run:d.renderedState?.run??null,
       directRenderMs:d.directRenderMs??null});
    }
    requestAnimationFrame(sample);
   }
   window.__M1_UNHELD_ALIVE__=true;requestAnimationFrame(sample);
   window.__M1_UNHELD_RECORD__={stream,recorder,framePump};
   window.__M1_UNHELD_RESULT__=new Promise(resolve=>{
    recorder.ondataavailable=e=>{
     if(!e.data?.size)return;
     chain=chain.then(async()=>{
      const bytesArray=new Uint8Array(await e.data.arrayBuffer());
      let binary='';
      for(let i=0;i<bytesArray.length;i+=16384)
       binary+=String.fromCharCode(...bytesArray.subarray(i,i+16384));
      await window.__M1_UNHELD_CHUNK__(btoa(binary));
      bytes+=bytesArray.length;chunks++;
     }).catch(err=>{failure=String(err)});
    };
    recorder.onerror=e=>{failure=String(e.error||e)};
    recorder.onstop=async()=>{
     const pump=framePump?.stop()??null;
     await chain;
     stream.getTracks().forEach(t=>t.stop());
     video.getTracks().forEach(t=>t.stop());
     resolve({status:bytes>2048&&chunks>0&&!failure&&!pump?.failure?'RECORDED':'UNAVAILABLE',
      reason:failure||pump?.failure||null,bytes,chunks,
      audioTracks:audioTracks.length,videoTracks:1,captureMode,
      requestedFrames:pump?.requestedFrames??null,mime});
    };
   });
   recorder.start(1600);framePump?.start();
   return {status:'RECORDING',audioTracks:audioTracks.length,captureMode};
  }catch(e){return {status:'UNAVAILABLE',reason:String(e)}}
 });
}
async function stopFilm(page){
 let timeout;
 try{return await Promise.race([
  page.evaluate(async()=>{
   window.__M1_UNHELD_ALIVE__=false;
   const r=window.__M1_UNHELD_RECORD__;
   if(!r)return {status:'UNAVAILABLE',reason:'Recording did not start'};
   r.framePump?.stop();
   if(r.recorder.state!=='inactive')r.recorder.stop();
   return await window.__M1_UNHELD_RESULT__;
  }),
  new Promise(resolve=>{timeout=setTimeout(()=>
   resolve({status:'UNAVAILABLE',reason:'60-second native recording finalization timeout'}),60000)})
 ])}finally{clearTimeout(timeout)}
}

test('M1 unheld entire real-source expedition with original WebGL/audio: '+VIEW,async({page})=>{
 test.setTimeout(25*60*1000);
 const snapshots=expedition(),stages=milestones(snapshots);
 for(const stage of ['combat','warden','warning','release','counter','floor','defeat','restart'])
  expect(stages[stage],'Authentic encounter event absent: '+stage).not.toBeNull();
 const feed=createUnheldAuthorityFeed(snapshots),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 // Only the entry frame may be repeated BEFORE film and audio initialize.
 // During capture: one genuine next authority step on EVERY browser poll.
 await page.route('**/dungeon/state',route=>route.fulfill({json:feed.pull().snapshot}));
 await page.setViewportSize(SIZE);await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0),{timeout:90000}).toBeGreaterThan(3);
 await page.locator('#audio-toggle').click();
 const optedIn=(await page.locator('#audio-toggle').getAttribute('aria-pressed'))==='true';
 let diskBytes=0,diskChunks=0,diskFailure=null;
 const output=fs.createWriteStream(STEM+'.webm',{flags:'w'});
 output.on('error',e=>{diskFailure=String(e)});
 await page.exposeBinding('__M1_UNHELD_CHUNK__',async(_,encoded)=>{
  if(diskFailure)throw Error(diskFailure);
  if(typeof encoded!=='string'||encoded.length>16*1024*1024)
   throw Error('Invalid or oversized WebM chunk');
  const chunk=Buffer.from(encoded,'base64');
  if(!output.write(chunk))await new Promise((resolve,reject)=>{
   output.once('drain',resolve);output.once('error',reject);
  });
  diskBytes+=chunk.length;diskChunks++;
 });
 const recording=await startFilm(page);
 const start=Date.now();
 let failure=null,captured={status:'UNAVAILABLE',reason:'Film not started'};
 try{
  expect(recording.status,'native canvas must record').toBe('RECORDING');
  feed.begin(); // NO stage holds, checkpoint waits, forced deaths or fake audio
  await expect.poll(()=>feed.metrics().uniqueDelivered,{
   timeout:18*60*1000,intervals:[500,1000,1500]}).toBe(snapshots.length);
  await expect.poll(()=>page.evaluate(()=>
   window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null),{
   timeout:150000,intervals:[400,800,1200]}).toBe(snapshots.at(-1).checksum);
 }catch(error){failure=String(error)}
 try{captured=recording.status==='RECORDING'?
  await stopFilm(page):{status:'UNAVAILABLE',reason:recording.reason}}
 catch(error){captured={status:'UNAVAILABLE',reason:String(error)}}
 try{await new Promise((resolve,reject)=>{
  if(diskFailure)return reject(Error(diskFailure));
  output.once('error',reject);output.end(resolve);
 })}catch(error){failure=failure||String(error)}
 let rendered=[];
 try{rendered=await page.evaluate(()=>window.__M1_UNHELD_TRACE__||[])}
 catch(error){failure=failure||String(error)}
 const indexByChecksum=new Map(snapshots.map((s,i)=>[s.checksum,i]));
 const observed=new Set(rendered.map(f=>indexByChecksum.get(f.checksum)).filter(Number.isInteger));
 const represented=Object.fromEntries(Object.entries(stages).map(([stage,i])=>
  [stage,{index:i,checksum:snapshots[i]?.checksum??null,
   exactFrameRendered:observed.has(i),nearestRenderedTickDistance:
    observed.size?Math.min(...[...observed].map(x=>Math.abs(x-i))):null}]));
 const receipt={schemaVersion:1,sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  baselineSha:BASELINE,view:VIEW,seed:SEED,viewport:SIZE,
  evidenceClass:'UNHELD_ORDERED_AUTHORITY_ORIGINAL_WEBGL_AUDIO',
  source:'actual DungeonRuntime.step states, served consecutively at real browser poll cadence',
  heldIntermediateMilestones:false,scriptedStateChanges:false,
  naturalAuthorityRestart:snapshots.at(-1).run>snapshots[0].run,
  snapshots:snapshots.length,feed:feed.metrics(),elapsedMs:Date.now()-start,
  originalAudioOptIn:optedIn,media:captured,bytesOnDisk:diskBytes,chunksOnDisk:diskChunks,
  recorderFailure:diskFailure,observedRenderedFrames:rendered.length,
  observedUniqueAuthorityTicks:observed.size,representativeStages:represented,
  cadenceLimit:'Real browser-poll playback of precomputed authentic authority, not proof of live network/clock equivalence',
  performanceLimit:'CI software WebGL frame timestamps, NOT representative hardware GPU',
  sourceOriginalAudioSync:'UNVERIFIED_PENDING_INDEPENDENT_AV_INSPECTION',
  independentCritics:0,looks:'UNVERIFIED',feels:'UNVERIFIED',plays:'UNVERIFIED',
  transformedVerified:false,failure,pageErrors:errors};
 fs.writeFileSync(STEM+'.json',JSON.stringify(receipt,null,2));
 if(failure)throw Error(failure);
 expect(diskFailure).toBeNull();
 expect(captured.status).toBe('RECORDED');
 expect(diskBytes).toBeGreaterThan(2048);
 expect(feed.metrics().intermediateHolds).toBe(0);
 expect(observed.size,'actually rendered original 3D frames').toBeGreaterThan(15);
 expect(errors).toEqual([]);
});
