'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

/**
 * Real independently seeded authority drives every visible Warden frame.
 * No painted canvas, fabricated snapshot, altered HP, actor teleport or
 * disabled simulation. This is a Warden encounter study, NOT the complete
 * natural campaign acceptance reel nor a matched baseline A/B.
 */
function findLivingWarden(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let i=0;i<700;i++){
  const state=game.publicState(),boss=state.units.find(u=>u.kind==='warden'&&u.hp>0);
  const living=state.units.filter(u=>u.faction==='party'&&u.hp>0);
  if(boss&&living.some(hero=>Math.abs(hero.x-boss.x)+Math.abs(hero.z-boss.z)<=4))
   return {game,firstTick:state.tick,firstFloor:state.floor};
  game.step();
 }
 throw Error('No naturally encountered nearby Warden within 700 actual seeded ticks');
}

for(const device of [
 {name:'desktop',width:1440,height:832,seconds:4},
 {name:'mobile',width:390,height:844,seconds:4}
]){
 test('real Warden Court chapter motion and original opt-in sound evidence — '+device.name,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const {game,firstTick,firstFloor}=findLivingWarden();
  let served=0;
  await page.setViewportSize({width:device.width,height:device.height});
  await page.route('**/dungeon/state',async route=>{
   const snapshot=game.publicState();
   game.step();served++;
   await route.fulfill({json:snapshot});
  });
  await page.goto('/dungeon');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredBosses??0),
   {timeout:60000}).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.wardenCourt?.activeBoss??false),
   {timeout:30000}).toBe(true);
  const initial=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(initial.dressing.wardenCourt.originalAssets).toBe(true);
  expect(initial.dressing.wardenCourt.processionTiles).toBeGreaterThan(0);
  // Real naturally opened boss arenas must have carved enclosing wall reliefs.
  expect(initial.dressing.wardenCourt.reliefs).toBeGreaterThan(0);
  expect(initial.dressing.wardenCourt.collisionChanged).toBe(false);
  expect(initial.dressing.wardenCourt.dynamicLights).toBe(1);
  expect(initial.dressing.wardenBattleFloorStatus).toBe('READY');
  expect(initial.dressing.wardenBattleFloorTiles).toBeGreaterThan(20);
  expect(initial.dressing.wardenBattleFloorTiles).toBeLessThanOrEqual(49);
  expect(initial.dressing.wardenBattleFloorCollisionChanges).toBe(0);
  expect(initial.webgl).toBe(true);
  // This button is the product's real user-gesture sound opt-in, not test
  // injection into WebAudio or a synthetic offline soundtrack.
  await page.locator('#audio-toggle').click();
  const soundOptedIn=await page.locator('#audio-toggle').getAttribute('aria-pressed');
  const record=await page.evaluate(async seconds=>{
   const canvas=document.getElementById('world');
   if(typeof MediaRecorder==='undefined'||typeof canvas?.captureStream!=='function')
    return {capture:'UNAVAILABLE',reason:'MediaRecorder / captureStream unsupported'};
   const video=canvas.captureStream(12),originalAudio=window.__DUNGEON_CAPTURE_SOUND__?.()??null;
   const tracks=[...video.getVideoTracks(),...(originalAudio?.getAudioTracks()??[])];
   if(!tracks.some(t=>t.kind==='video'))return {capture:'UNAVAILABLE',reason:'No live canvas video track'};
   const merged=new MediaStream(tracks);
   const codecs=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'];
   const mime=codecs.find(value=>MediaRecorder.isTypeSupported(value));
   if(!mime){merged.getTracks().forEach(t=>t.stop());return {capture:'UNAVAILABLE',reason:'No supported WebM recording MIME'};}
   let recorder;
   try{recorder=new MediaRecorder(merged,{mimeType:mime,videoBitsPerSecond:1100000});}
   catch(e){video.getTracks().forEach(t=>t.stop());return {capture:'UNAVAILABLE',reason:String(e)};}
   const parts=[];
   const stopped=new Promise(resolve=>{
    recorder.ondataavailable=e=>{if(e.data.size>0)parts.push(e.data);};
    recorder.onerror=e=>resolve({capture:'ERROR',reason:String(e.error||e)});
    recorder.onstop=()=>resolve({capture:'RECORDED'});
   });
   recorder.start(800);
   await new Promise(resolve=>setTimeout(resolve,seconds*1000));
   if(recorder.state!=='inactive')recorder.stop();
   const result=await stopped;
   video.getTracks().forEach(t=>t.stop());
   if(result.capture!=='RECORDED')return result;
   const blob=new Blob(parts,{type:mime}),buffer=await blob.arrayBuffer(),bytes=new Uint8Array(buffer);
   if(bytes.byteLength<1500)return {capture:'UNAVAILABLE',reason:'Video output too small',bytes:bytes.byteLength};
   // Base64 is transferred solely to the local Playwright runner; it is
   // never stored in the game, exposed to runtime viewers or uploaded publicly.
   let binary='';const batch=0x8000;
   for(let i=0;i<bytes.length;i+=batch)binary+=String.fromCharCode(...bytes.subarray(i,i+batch));
   return {capture:'RECORDED',mime,bytes:bytes.byteLength,
    videoTracks:video.getVideoTracks().length,audioTracks:originalAudio?.getAudioTracks().length??0,
    base64:btoa(binary)};
  },device.seconds);
  const capturePath='artifacts/dungeon-m1-court-'+device.name+'.webm';
  const {base64,...captureMeta}=record;
  if(record.capture==='RECORDED'){
   fs.writeFileSync(capturePath,Buffer.from(base64,'base64'));
   await test.info().attach('real-warden-court-'+device.name+'-motion-audio-track',
    {path:capturePath,contentType:'video/webm'});
  }

  // Genuine current boss WebAudio, independently captured if canvas WebM is
  // zero-byte. Never claim audio without a populated WAV and positive RMS.
  const originalPcm=await page.evaluate(async()=>{
   if(typeof window.__DUNGEON_RECORD_ORIGINAL_PCM__!=='function')
    return {status:'UNAVAILABLE',reason:'No original game sound tap'};
   const recording=window.__DUNGEON_RECORD_ORIGINAL_PCM__(2.5);
   const result=await Promise.race([recording,new Promise(resolve=>
    setTimeout(()=>resolve({status:'UNAVAILABLE',reason:'No AudioContext frames delivered'}),4400))]);
   if(result?.status!=='RECORDED'||!result.wav)return result;
   let binary='';
   for(let i=0;i<result.wav.length;i+=32768)
    binary+=String.fromCharCode(...result.wav.subarray(i,i+32768));
   const {wav,...meta}=result;return {...meta,base64:btoa(binary)};
  });
  const {base64:pcmBase64,...pcmReceipt}=originalPcm||{status:'UNAVAILABLE'};
  if(pcmReceipt.status==='RECORDED')await test.info().attach('dungeon-m1-court-'+device.name+'-original-audio.wav',{
   body:Buffer.from(pcmBase64,'base64'),contentType:'audio/wav'});
  else console.log('DUNGEON WARDEN ORIGINAL AUDIO UNVERIFIED:',pcmReceipt.reason||pcmReceipt.status);
  const after=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  await page.locator('#world').screenshot({
   path:'artifacts/dungeon-m1-court-'+device.name+'.png',timeout:60000
  });
  const receipt={
   method:'Seeded DungeonRuntime public snapshots, stepped once per actual browser poll; no stage mutation',
   seed:'visual-room-art-18',firstTick,firstFloor,authorityPolls:served,device,
   optInAudioControl:soundOptedIn,recording:captureMeta,originalPcmAudio:pcmReceipt,
   initialCourt:initial.dressing.wardenCourt,finalCourt:after.dressing.wardenCourt,
   initialBoss:initial.authored3D.authoredBosses,finalBoss:after.authored3D.authoredBosses,
   drawCalls:after.drawCalls,triangles:after.triangles,webgl:after.webgl,
   authenticStrikeScars:after.wardenImpactScars??null,
   limitations:'Not full unbroken organic campaign, audio track existence is not proof of audible sound; not baseline-matched; no blind critics, real-phone hardware performance or gameplay-quality verdict'
  };
  fs.writeFileSync('artifacts/dungeon-m1-court-'+device.name+'.json',JSON.stringify(receipt,null,2));
  expect(errors).toEqual([]);
  expect(served).toBeGreaterThanOrEqual(1);
 });
}
