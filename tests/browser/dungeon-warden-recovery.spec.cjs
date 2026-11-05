'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});

/**
 * Real browser WebGL verification of M1 Warden counterplay. Staging keeps a
 * legitimate seeded and walkable Warden court; all attacks, HP changes,
 * timing, exposure, sound events and enemy decisions use DungeonRuntime.step.
 * This is NOT a full organic expedition, matched M1 baseline or blind review.
 */
test('true Warden shockwave opens visible desktop/mobile tactical counterplay and opt-in audio capture',async({page,request})=>{
 test.setTimeout(210000);
 const seed='warden-counterwindow-browser-M1',game=DungeonRuntime.create(seed),s=game.state;
 const boss=s.units.find(u=>u.kind==='warden'),hero=s.units.find(u=>u.id==='vanguard');
 expect(boss).toBeTruthy();expect(hero).toBeTruthy();
 for(const u of s.units)if(u.faction==='enemy'&&u!==boss||u.faction==='party'&&u!==hero)u.hp=0;
 hero.x=boss.x+1;hero.z=boss.z;s.tick=5;
 expect(s.map[hero.z][hero.x]).toBe('.');
 let current=game.publicState(),pageErrors=[];
 expect(current.bossRecovery).toBeNull();
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:current}));
 expect((await request.get('/dungeon')).status()).toBe(200);
 await page.setViewportSize({width:1440,height:832});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:75000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.visible),{timeout:45000}).toBe(true);
 expect(await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.exposedCounterWindow)).toBe(false);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-counter-telegraph-real-desktop.png',timeout:90000});

 // An optional real recording uses the opt-in original WebAudio bus, actual
 // canvas capture and MediaRecorder. Unsupported devices/codecs are UNVERIFIED,
 // never a synthetic recording. The simulated fight continues either way.
 let captureSupport={supported:false,reason:'spectator audio unavailable'};
 await page.locator('#audio-toggle').click();
 if(await page.locator('#audio-toggle').getAttribute('aria-pressed')==='true'){
  captureSupport=await page.evaluate(()=>{
   try{
    const sound=window.__DUNGEON_CAPTURE_SOUND__?.();
    const canvas=document.getElementById('world');
    const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
    if(!sound?.getAudioTracks().length||!canvas?.captureStream||!mime)return {supported:false,reason:'audio/canvas capture unsupported'};
    const frames=canvas.captureStream(12);
    const stream=new MediaStream([...frames.getVideoTracks(),...sound.getAudioTracks()]);
    if(!stream.getVideoTracks().length)return {supported:false,reason:'no real WebGL video track'};
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:750000});
    const chunks=[];
    window.__DUNGEON_WARDEN_AUDIOVISUAL_CLIP__=new Promise(resolve=>{
     recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
     recorder.onerror=e=>resolve({supported:false,reason:String(e.error)});
     recorder.onstop=()=>{
      const blob=new Blob(chunks,{type:mime}),reader=new FileReader();
      reader.onload=()=>{stream.getTracks().forEach(t=>t.stop());
       resolve({supported:blob.size>1000,base64:String(reader.result).split(',')[1]||'',bytes:blob.size,mime})};
      reader.onerror=()=>resolve({supported:false,reason:'FileReader failed'});
      reader.readAsDataURL(blob);
     };
    });
    recorder.start(250);setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},3000);
    return {supported:true,mime};
   }catch(e){return {supported:false,reason:String(e)}}
  });
 }
 current=game.step();
 expect(current.bossRecovery?.remaining).toBe(2);
 expect(current.events.some(e=>e.kind==='opening')).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:25000}).toBe(current.tick);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenRitual?.exposedCounterWindow),{timeout:20000}).toBe(true);
 await expect(page.locator('#boss-phase')).toContainText('EXPOSED');
 await expect(page.locator('#boss-strip')).toHaveAttribute('data-recovery','true');
 // Real browser reconstruction: the current living defender must occupy the
 // camera-facing side of the Warden while the actual vulnerable boss lowers
 // shoulder armour. This does not pretend the screenshot won a blind vote.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.wardenExposure?.weight??0),
  {timeout:20000}).toBeGreaterThan(.7);
 const duelStage=await page.evaluate(()=>{
  const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,s=window.__DUNGEON_PUBLIC_STATE__;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  const hero=s.units.filter(u=>u.faction==='party'&&u.hp>0)
   .sort((a,b)=>(Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z))-
    (Math.abs(b.x-boss.x)+Math.abs(b.z-boss.z)))[0];
  const dx=boss.x-hero.x,dz=boss.z-hero.z,o=d.cinematicShot?.offsets||[0,0,0];
  return {mode:d.cinematicShot?.mode,nearSide:(o[0]*dx+o[2]*dz)/(
   Math.hypot(o[0],o[2])*Math.hypot(dx,dz)),recovery:d.wardenExposure?.weight};
 });
 // The cast and the new two-turn opening happen on the SAME authority
 // tick. The real 3D strike must get its release shot before the recovery
 // camera; an immediate EXPOSED requirement hid the boss's true impact.
 expect(duelStage.mode).toBe('warden-release');
 await test.info().attach('real-Warden-authoritative-strike-stage',{
  body:Buffer.from(JSON.stringify(duelStage)),contentType:'application/json'});
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-true-strike-real-desktop.png',timeout:90000});
 const beforeHp=boss.hp;
 current=game.step();
 expect(boss.hp).toBeLessThan(beforeHp);
 expect(current.bossRecovery?.remaining).toBe(1);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_PUBLIC_STATE__?.tick),{timeout:25000}).toBe(current.tick);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cinematicShot?.mode),{timeout:25000}).toBe('warden-counter');
 // Check the ACTUAL hero-forward counterstrike stage, after the release
 // played, not a generic idle recovery shot hiding real blade contact.
 const recovered=await page.evaluate(()=>{
  const d=window.__DUNGEON_RENDER_DIAGNOSTICS__,s=window.__DUNGEON_PUBLIC_STATE__;
  const b=s.units.find(u=>u.kind==='warden'&&u.hp>0),h=s.units.find(u=>u.id==='vanguard');
  const o=d.cinematicShot?.offsets||[0,0,0],dx=b.x-h.x,dz=b.z-h.z;
  return {mode:d.cinematicShot?.mode,nearSide:(o[0]*dx+o[2]*dz)/
   (Math.hypot(o[0],o[2])*Math.hypot(dx,dz))};
 });
 expect(recovered.mode).toBe('warden-counter');
 expect(recovered.nearSide).toBeLessThan(-.2);
 const physicalSightline=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.duelSightline);
 expect(physicalSightline?.heroId).toBe('vanguard');
 expect(physicalSightline?.mode).toBe('warden-counter');
 expect(physicalSightline?.heroDepthLead).toBeGreaterThan(0);
 expect(physicalSightline?.projectedSeparation).toBeGreaterThan(0);
 expect(physicalSightline?.renderedActorStaging).toBe(true);
 await test.info().attach('real-Warden-physical-counter-camera',{
  body:Buffer.from(JSON.stringify({physicalSightline,recovered})),contentType:'application/json'});
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-counter-open-real-desktop.png',timeout:90000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.viewport?.width),{timeout:25000}).toBeGreaterThan(100);
 await expect(page.locator('#boss-phase')).toContainText('EXPOSED');
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-counter-attack-real-mobile.png',timeout:90000});
 if(captureSupport.supported){
  const recording=await page.evaluate(()=>window.__DUNGEON_WARDEN_AUDIOVISUAL_CLIP__);
  if(recording?.supported&&recording.base64)
   await test.info().attach('real-Warden-counter-boss-WebGL-original-audio.webm',{
    body:Buffer.from(recording.base64,'base64'),contentType:recording.mime
   });
  else console.log('Warden boss motion/audio recording UNVERIFIED:',recording?.reason||'no recorded frames');
 }else console.log('Warden boss motion/audio recording UNVERIFIED:',captureSupport.reason);
 expect(pageErrors).toEqual([]);
 await test.info().attach('real-warden-counterauthority-receipt',{body:Buffer.from(JSON.stringify({
  seed,source:'actual DungeonRuntime.step() with legitimate positioned court, NOT fully organic expedition',
  initialTick:5,counterTicks:[6,7],bonusDamage:'verified by separate actual damage test',
  desktopMobileRealWebGL:true,originalAudioCaptureAttempt:captureSupport,
  lockedBaselineSha:'281735d0910c6b2443648af976003d50412ee324',
  matchedBaselineComparison:false,threeIndependentCritics:false,completeExpedition:false
 },null,2)),contentType:'application/json'});
});
