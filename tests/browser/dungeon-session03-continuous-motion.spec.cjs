'use strict';
/**
 * Session 03 evidence-only moving-film gate.
 * REAL DungeonRuntime.step() snapshots are delivered at original tick cadence,
 * to REAL Chromium WebGL and licensed GLB source mixers. Do not pretend these
 * observations are a leg fix, a controlled FPS benchmark or a new authority.
 */
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
const path=require('node:path');
const {auditOriginalSourceRafSolePair,auditOriginalSourcePoseOnlyPair}=
 require('./dungeon-session03-original-skin-pair.cjs');
const SEED='visual-room-art-18';
const VIEWS=[{name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}];
fs.mkdirSync('artifacts',{recursive:true});

function actualMovingWindow(){
 const game=DungeonRuntime.create(SEED);
 const frames=[game.publicState()];
 for(let i=0;i<650;i++)frames.push(game.step());
 // Never fabricate motion, HP, action labels, scene positions or a fight.
 // Find a naturally occurring walking passage of sufficient duration to
 // judge consecutive imported source frames. Retain every intervening step.
 let best=null;
 for(let start=0;start+16<frames.length;start++){
  const slice=frames.slice(start,start+17);
  let genuineVanguardTravel=0;
  for(let i=1;i<slice.length;i++){
   const a=slice[i-1].units.find(x=>x.id==='vanguard');
   const b=slice[i].units.find(x=>x.id==='vanguard');
   if(a&&b&&b.hp>0&&b.action==='move'&&
    Math.hypot(b.x-a.x,b.z-a.z)>0)genuineVanguardTravel++;
  }
  if(genuineVanguardTravel>=5){
   best={slice,start,genuineVanguardTravel};break;
  }
 }
 if(!best)throw Error('No 17-tick genuine Vanguard walking interval in 650 authoritative ticks');
 return best;
}

async function startOriginalCanvasFilm(page,view){
 const file=path.resolve('artifacts','dungeon-full-body-continuous-'+view+'.webm');
 fs.writeFileSync(file,Buffer.alloc(0));
 let chunks=0,bytes=0;
 await page.exposeBinding('__S3_CONTINUOUS_CHUNK__',async(_,encoded)=>{
  if(typeof encoded!=='string'||encoded.length>12*1024*1024)
   throw Error('Invalid or unbounded real WebGL recording chunk');
  const b=Buffer.from(encoded,'base64');
  fs.appendFileSync(file,b);bytes+=b.length;chunks++;
 });
 const started=await page.evaluate(()=>{
  const canvas=document.getElementById('world');
  if(!canvas?.captureStream||!window.MediaRecorder)
   return {status:'UNAVAILABLE',reason:'Original WebGL MediaRecorder unavailable'};
  const mime=['video/webm;codecs=vp8','video/webm'].find(
   t=>MediaRecorder.isTypeSupported(t));
  if(!mime)return {status:'UNAVAILABLE',reason:'No supported WebM codec'};
  const stream=canvas.captureStream(24);
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2000000});
  let chain=Promise.resolve(),error=null,parts=0;
  window.__S3_CONTINUOUS_REC__=rec;
  window.__S3_CONTINUOUS_FINISH__=new Promise(resolve=>{
   rec.ondataavailable=e=>{
    if(!e.data?.size)return;
    chain=chain.then(async()=>{
     const b=new Uint8Array(await e.data.arrayBuffer());
     let binary='';
     for(let i=0;i<b.length;i+=16384)
      binary+=String.fromCharCode(...b.subarray(i,i+16384));
     await window.__S3_CONTINUOUS_CHUNK__(btoa(binary));
     parts++;
    }).catch(e=>{error=String(e)});
   };
   rec.onerror=e=>{error=String(e.error??e)};
   rec.onstop=async()=>{
    await chain;
    stream.getTracks().forEach(x=>x.stop());
    resolve({status:parts>0&&!error?'RECORDED':'UNAVAILABLE',
     reason:error,parts,mime,requestedFps:24});
   };
  });
  rec.start(1300);
  return {status:'RECORDING',mime,requestedFps:24};
 });
 return {file,started,getBytes:()=>bytes,getChunks:()=>chunks};
}
async function stopOriginalCanvasFilm(page){
 return page.evaluate(async()=>{
  const r=window.__S3_CONTINUOUS_REC__;
  if(!r)return {status:'UNAVAILABLE',reason:'Film never started'};
  if(r.state!=='inactive')r.stop();
  return window.__S3_CONTINUOUS_FINISH__;
 });
}

for(const view of VIEWS)test('original source 17-tick uninterrupted WebGL moving-film audit: '+view.name,
 async({page})=>{
 test.setTimeout(240000);
 const scenario=actualMovingWindow();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 let current=scenario.slice[0];
 await page.setViewportSize({width:view.width,height:view.height});
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),
  {timeout:60000}).toBeGreaterThanOrEqual(3);
 // Actual original 3D canvas film, not a contact sheet or a requested-FPS claim.
 const film=await startOriginalCanvasFilm(page,view.name);
 expect(film.started.status,JSON.stringify(film.started)).toBe('RECORDING');
 const rows=[],nativeSourceRafPairs=[],nativeSourcePosePairs=[];
 try{
  for(let step=1;step<scenario.slice.length;step++){
   current=scenario.slice[step];
   await expect.poll(()=>page.evaluate(()=>
    window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null),
    {timeout:18000,intervals:[60,90,130,180]}).toBe(current.checksum);
   // A browser frame must genuinely advance before any sampled original skin.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(
    ()=>requestAnimationFrame(resolve))));
   const sample=await page.evaluate(()=>{
    const diag=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    const rig=window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.();
    const a=rig?.actors?.find(x=>x.kind==='vanguard');
    return {frame:diag?.frame??null,
     actorId:a?.id??null,authorityTick:window.__DUNGEON_PUBLIC_STATE__?.tick??null,
     visible:a?.sourceVisible===true,timeMs:performance.now(),
     tick:window.__DUNGEON_PUBLIC_STATE__?.tick??null,
     checksum:diag?.renderedState?.checksum??null,
     rigSourceActors:rig?.summary?.sourceActors??null,
     invalidBones:rig?.summary?.invalidQuaternionCount??null,
     invalidMatrices:rig?.summary?.invalidMatrixCount??null,
     sourceInstanceId:a?.sourceInstanceId??null,
     sourceClip:a?.sourceActionSample?.clipName??null,
     sourceClipTime:a?.sourceActionSample?.time??null,
     sourceClipDuration:a?.sourceActionSample?.duration??null,
     sourceWeight:a?.sourceActionSample?.weight??null,
     // Original mixer transition receipt. A null / ordinary 230ms exit is
     // a genuine rejected guard, NEVER accepted full-body gait evidence.
     movingExitFade:a?.sourceActionSample?.movingExitFade??null,
     rootWorld:a?.rootWorld??null,
     sourceSolePatchWorld:a?.sourceSolePatchWorld??null,
     sourceWeaponGrip:a?.sourceWeaponGrip?
      {socketName:a.sourceWeaponGrip.socketName,
       attachedToGripSocket:a.sourceWeaponGrip.attachedToGripSocket}:null,
     sourceLinkedFoot:a?.nativeLegOwnership?
      {probeFrames:a.nativeLegOwnership.sourceLinkedFootProbeFrames??0,
       acceptedFrames:a.nativeLegOwnership.sourceLinkedFootAcceptedFrames??0,
       last:a.nativeLegOwnership.sourceLinkedFootProbeLast??null}:null,
     // Exact rendered original GLB world-root witness; NOT a generated step,
     // heel/toe plant, IK correction, target or source pose by itself.
     microWalk:a?.nativeLegOwnership?
      {selected:Boolean(a.nativeLegOwnership.originalMicroTravelSelected),
       receipt:a.nativeLegOwnership.originalMicroTravelWitness??null}:null};
   });
   rows.push({...sample,authorityTick:current.tick});
   expect(sample.checksum,'real WebGL source must display this legal tick').toBe(current.checksum);
   expect(sample.rigSourceActors).toBeGreaterThanOrEqual(3);
   expect(sample.invalidBones).toBe(0);
   expect(sample.invalidMatrices).toBe(0);
   expect(sample.sourceWeaponGrip?.attachedToGripSocket,
    'original Vanguard source sword must stay on handslotr').toBe(true);
   // Native rAF AFTER the previous source skin; same untouched public tick.
   // No extra source animation, synthetic root movement, contacts or hits.
   // Reject mismatched source clone, missed frame, invalid skin or stale clip.
   const after=await page.evaluate(async()=>{
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const diag=window.__DUNGEON_RENDER_DIAGNOSTICS__;
    const rig=window.__DUNGEON_SOURCE_RIG_DEFORMATION__?.();
    const a=rig?.actors?.find(x=>x.kind==='vanguard');
    return {frame:diag?.frame??null,
     actorId:a?.id??null,authorityTick:window.__DUNGEON_PUBLIC_STATE__?.tick??null,
     visible:a?.sourceVisible===true,timeMs:performance.now(),
     checksum:diag?.renderedState?.checksum??null,
     sourceInstanceId:a?.sourceInstanceId??null,
     sourceClip:a?.sourceActionSample?.clipName??null,
     sourceClipTime:a?.sourceActionSample?.time??null,
     sourceClipDuration:a?.sourceActionSample?.duration??null,
     sourceWeight:a?.sourceActionSample?.weight??null,
     rootWorld:a?.rootWorld??null,
     sourceSolePatchWorld:a?.sourceSolePatchWorld??null,
     sourceWeaponGrip:a?.sourceWeaponGrip?
      {socketName:a.sourceWeaponGrip.socketName,
       attachedToGripSocket:a.sourceWeaponGrip.attachedToGripSocket}:null};
   });
   nativeSourceRafPairs.push({publicTick:current.tick,
    sourceBeforeFrame:sample.frame,sourceAfterFrame:after.frame,
    ...auditOriginalSourceRafSolePair({before:sample,after,floorTopY:-.02})});
   // READ-ONLY independent keyed-pose witness. A stationary source root
   // can still animate its licensed skeleton, but must NEVER count as a
   // foot plant or as valid authoritative root movement.
   nativeSourcePosePairs.push({publicTick:current.tick,
    sourceBeforeFrame:sample.frame,sourceAfterFrame:after.frame,
    ...auditOriginalSourcePoseOnlyPair({before:sample,after,floorTopY:-.02})});
   // Native stream sees actual published ticks at production 350ms cadence.
   await page.waitForTimeout(350);
  }
 }finally{
  const result=await stopOriginalCanvasFilm(page);
  const video={...result,bytes:film.getBytes(),chunks:film.getChunks(),
   path:'artifacts/dungeon-full-body-continuous-'+view.name+'.webm'};
  const evidence={schemaVersion:1,sourceSha:process.env.GITHUB_SHA??null,
   baselineSha:'281735d0910c6b2443648af976003d50412ee324',
   source:'unmodified real DungeonRuntime.step, live original WebGL canvas and native GLB',
   viewport:view,seed:SEED,windowStart:scenario.start,
   genuineVanguardTravelSteps:scenario.genuineVanguardTravel,
   originalAuthoritySnapshots:scenario.slice.length,
   actualFrames:rows,errors,video,
   // True original next-render-frame imported-clip and BOTH skinned shoe
   // readbacks, including explicit reasons when no match survives.
   nativeSourceRafPairs,
   genuineSameTickOriginalSkinPairs:nativeSourceRafPairs.filter(x=>x.eligible).length,
   nativeSourcePosePairs,
   genuineSourcePoseOnlyPairs:nativeSourcePosePairs.filter(x=>x.poseEligible).length,
   sourcePoseOnlyRejections:nativeSourcePosePairs.reduce((acc,p)=>{
    if(!p.poseEligible)acc[p.reason]=(acc[p.reason]||0)+1;
    return acc;
   },{}),
   originalSourceRafRejections:nativeSourceRafPairs.reduce((acc,p)=>{
    if(!p.eligible)acc[p.reason]=(acc[p.reason]||0)+1;
    return acc;
   },{}),
   walkExitFadeObserved:rows.filter(x=>x.movingExitFade?.fromClip==='Walking_A').length,
   movingExitFadeSelected:rows.filter(x=>x.movingExitFade?.candidateSelected===true).length,
   // Independent AFTER visual evidence must show if this new connected
   // shoe-correction eligibility is EVER used, and whether buried toes remain.
   // Missing/wrong clips never become a false zero-penetration claim.
   witnessedMicroWalkSelections:rows.filter(x=>x.microWalk?.selected).length,
   originalWalkingShoeEvidence:rows.filter(x=>x.sourceClip==='Walking_A'&&
    x.sourceWeight>=.9&&['left','right'].every(side=>
     Number.isFinite(x.sourceSolePatchWorld?.[side]?.toe?.[1])&&
     Number.isFinite(x.sourceSolePatchWorld?.[side]?.heel?.[1]))).map(x=>{
      const floorTopY=-.02,shoe=x.sourceSolePatchWorld;
      return {frame:x.frame,tick:x.tick,
       microWalkSelected:Boolean(x.microWalk?.selected),
       leftToePenetrationMeters:Math.max(0,floorTopY-shoe.left.toe[1]),
       rightToePenetrationMeters:Math.max(0,floorTopY-shoe.right.toe[1]),
       leftHeelAboveMeters:shoe.left.heel[1]-floorTopY,
       rightHeelAboveMeters:shoe.right.heel[1]-floorTopY};
     }),
   warning:'These are native WebGL original-rig measurements, not foot plants. A requested MediaRecorder 24fps is not actual animation FPS. Ineligible pairs, missing source skin, absent two-point support or independent multi-role critique remain failures.'};
  const out='artifacts/dungeon-full-body-continuous-'+view.name+'.json';
  fs.writeFileSync(out,JSON.stringify(evidence,null,2));
  await test.info().attach('session03-uninterrupted-original-motion-'+view.name,{
   body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
  expect(result.status,JSON.stringify(video)).toBe('RECORDED');
  expect(film.getBytes(),'original canvas WebM should be nonempty').toBeGreaterThan(2048);
 }
 expect(rows.length).toBe(16);
 expect(nativeSourceRafPairs.length).toBe(16);
 expect(nativeSourcePosePairs.length).toBe(16);
 expect(nativeSourcePosePairs.every(x=>x.contactLocked===false&&
  x.plantCertified===false&&x.eligible===false)).toBe(true);
 expect(new Set(rows.map(x=>x.frame)).size,
  'film must include genuinely advancing renderer frames').toBeGreaterThanOrEqual(10);
 expect(rows.some(x=>x.sourceClip==='Walking_A'),
  'at least one sampled source-mixer action must be genuinely Walking_A').toBe(true);
 // This is a measured original Three.js crossFadeFrom receipt, not a
 // source-code planner assertion or a claimed planted foot. Both actual
 // viewports must exercise the tested 300ms native soft landing on the
 // original deterministic 17-tick journey after the guarded source fix.
 expect(rows.some(x=>x.movingExitFade?.fromClip==='Walking_A'&&
  x.movingExitFade?.candidateSelected===true&&
  x.movingExitFade?.selectedFadeSeconds===.30&&
  x.movingExitFade?.originalPreviousRunning===true&&
  x.movingExitFade?.originalPreviousWeight>=.9&&
  x.movingExitFade?.contactLocked===false),
  'original live Walking_A->Idle must actually select the guarded source-micro-arrival fade').toBe(true);
 expect(errors).toEqual([]);
});
