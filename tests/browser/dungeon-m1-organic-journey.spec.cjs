'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
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
async function beginRecording(page){
 return page.evaluate(()=>{
  try{
   const canvas=document.getElementById('world');
   const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
   if(!canvas?.captureStream||!mime)return {status:'UNAVAILABLE',reason:'WebGL MediaRecorder unsupported'};
   const video=canvas.captureStream(8),audio=window.__DUNGEON_CAPTURE_SOUND__?.();
   const v=video.getVideoTracks(),a=audio?.getAudioTracks()||[];
   if(v.length!==1)return {status:'UNAVAILABLE',reason:'No WebGL video track'};
   const stream=new MediaStream([...v,...a]),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:480000});
   const chunks=[];
   window.__M1_RECORD__={recorder,stream,video};
   window.__M1_RESULT__=new Promise(resolve=>{
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    recorder.onerror=e=>resolve({status:'UNAVAILABLE',reason:String(e.error)});
    recorder.onstop=async()=>{
     try{
      const blob=new Blob(chunks,{type:mime}),array=new Uint8Array(await blob.arrayBuffer());
      let binary='';
      for(let i=0;i<array.length;i+=16384)binary+=String.fromCharCode(...array.subarray(i,i+16384));
      resolve({status:blob.size>2048?'RECORDED':'UNAVAILABLE',bytes:blob.size,
       reason:blob.size>2048?undefined:'Empty WebGL film',mime,base64:btoa(binary),
       audioTracks:a.length,videoTracks:v.length});
     }catch(e){resolve({status:'UNAVAILABLE',reason:String(e)})}
     finally{stream.getTracks().forEach(t=>t.stop());video.getTracks().forEach(t=>t.stop())}
    };
   });
   recorder.start(4000);
   return {status:'RECORDING',mime,audioTracks:a.length,videoTracks:v.length};
  }catch(e){return {status:'UNAVAILABLE',reason:String(e)}}
 });
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
 test.setTimeout(22*60*1000);
 const {snapshots,milestones}=organicExpedition();
 for(const key of ['combat','warden','floor','defeat','restart'])
  expect(milestones[key],'Missing organic milestone: '+key).not.toBeNull();
 for(const [a,b] of [['entry','combat'],['combat','warden'],['warden','floor'],['floor','defeat'],['defeat','restart']])
  expect(milestones[a],'Natural chronology: '+a+' before '+b).toBeLessThan(milestones[b]);
 const errors=[],observations=[],milestoneFrameProof=[];page.on('pageerror',e=>errors.push(String(e)));
 let served=snapshots[0];
 await page.route('**/dungeon/state',route=>route.fulfill({json:served}));
 await page.setViewportSize(SIZE);await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:90000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0),{timeout:90000}).toBeGreaterThan(3);
 await page.locator('#audio-toggle').click(); // real opt-in gesture; may be unavailable
 const audioOptedIn=(await page.locator('#audio-toggle').getAttribute('aria-pressed'))==='true';
 const recording=await beginRecording(page),started=Date.now();
 for(let i=1;i<snapshots.length;i++){
  served=snapshots[i];await page.waitForTimeout(240); // all real states, 240ms source cadence
  // Do not mistake a server-side stage for a filmed stage. Every decisive
  // moment must be consumed by the real browser and a fresh rendered frame.
  if(Object.values(milestones).includes(i)){
   await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.checksum),
    {timeout:60000}).toBe(snapshots[i].checksum);
   const frameBefore=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0);
   await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0),
    {timeout:60000}).toBeGreaterThan(frameBefore);
   milestoneFrameProof.push({index:i,checksum:snapshots[i].checksum,
    frame:await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0)});
  }
  if(i%24===0||Object.values(milestones).includes(i))
   observations.push(await page.evaluate(()=>{
    const s=window.__DUNGEON_PUBLIC_STATE__,d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    return {run:s?.run,tick:s?.tick,floor:s?.floor,phase:s?.phase,checksum:s?.checksum,frame:d?.frame,
     composition:d?.composition,visibility:d?.visibility,frameDelivery:d?.frameDelivery,
     triangles:d?.triangles,soundstage:d?.soundstage};
   }));
 }
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.run),{timeout:15000})
  .toBe(snapshots.at(-1).run);
 const film=recording.status==='RECORDING'?await stopRecording(page):recording;
 const receipt={schemaVersion:1,sourceSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  baselineSha:BASELINE,baselineArtifact:'https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898',
  view:VIEW,viewport:SIZE,seed:SEED,source:'actual DungeonRuntime.step to real Chromium WebGL',
  scriptedStateChanges:false,authoritySnapshots:snapshots.length,
  milestones:Object.fromEntries(Object.entries(milestones).map(([name,index])=>
   [name,{index,run:snapshots[index].run,tick:snapshots[index].tick,floor:snapshots[index].floor,
    checksum:snapshots[index].checksum}])),
  elapsedMs:Date.now()-started,intervalMs:240,audioGestureOptIn:audioOptedIn,
  recorder:{status:film.status,reason:film.reason,bytes:film.bytes||0,mime:film.mime,
   audioTracks:film.audioTracks||0,videoTracks:film.videoTracks||0},
  originalAudioTrackPresent:film.status==='RECORDED'&&film.audioTracks>0,
  audibleSynchronizedSound:'UNVERIFIED: real track requires decoded channel/PCM analysis',
  matchedLockedBaseline:false,blindCritics:0,looks:'UNVERIFIED',feels:'UNVERIFIED',plays:'UNVERIFIED',
  milestoneFrameProof,observations,pageErrors:errors};
 const stem='artifacts/dungeon-m1-organic-journey-'+VIEW;
 fs.writeFileSync(stem+'.json',JSON.stringify(receipt,null,2));
 if(film.status==='RECORDED'&&film.base64)fs.writeFileSync(stem+'.webm',Buffer.from(film.base64,'base64'));
 await page.locator('#world').screenshot({path:stem+'-real-restart.png',timeout:90000});
 expect(errors).toEqual([]);
 expect(observations.some(o=>o.frame>0)).toBe(true);
 // Capturing a film is NOT evidence of transformed looks, feels or plays.
});
