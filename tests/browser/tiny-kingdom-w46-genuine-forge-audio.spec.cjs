'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('W46 optional authentic guild forge audio follows an actual smith, not a synthetic shift',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:85000});
 await page.locator('#pause').click();
 // Stub only the AUDIO OUTPUT hardware, never the citizen/occupation engine.
 // One oscillator start = one actually scheduled audible voice.
 await page.evaluate(()=>{
  window.__soundVoices=0;
  window.AudioContext=class{
   constructor(){this.state='running';this.currentTime=10;this.destination={};}
   createOscillator(){return {type:'sine',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},
    connect(){},start(){window.__soundVoices++},stop(){}}}
   createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},
    linearRampToValueAtTime(){}},connect(){}}}
   resume(){this.state='running';return Promise.resolve()}
   suspend(){this.state='suspended';return Promise.resolve()}
   close(){this.state='closed';return Promise.resolve()}
  };
 });
 const baseline=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  let smith=null,ticks=0;
  for(;ticks<30000;ticks++){
   g.step(1/30);
   if(ticks%3===0){
    smith=g.getForgeCraftCycleAudit().workers.find(w=>w.phase==='hammering'&&w.reachableAnvil);
    if(smith){
     const index=g.getCitizenProfiles().findIndex(p=>p.name===smith.citizen);
     const action=g.getOccupationalPerformance(index);
     if(action?.strike)break;
     smith=null;
    }
   }
  }
  return {smith,ticks,authority:JSON.stringify(g.exportSnapshot()),
   audit:g.getForgeSoundAudit()};
 });
 expect(baseline.smith,'A real forge worker must physically arrive and strike').toBeTruthy();
 expect(baseline.audit.enabled).toBe(false);
 expect(baseline.audit.hammerStrikes).toBe(0);
 await expect(page.locator('#forge-sound')).toBeVisible();
 await expect(page.locator('#forge-sound')).toHaveAttribute('aria-pressed','false');
 // Resume presentation without advancing authority. Audio belongs to an
 // active viewed game, never a frozen/paused screenshot or fake work state.
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
 await page.locator('#pause').click();
 await page.locator('#forge-follow').click();
 await page.locator('#forge-sound').click();
 await expect(page.locator('#forge-sound')).toHaveAttribute('aria-pressed','true');
 const audible=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.pollForgeSound();
  return {audit:g.getForgeSoundAudit(),
   authority:JSON.stringify(g.exportSnapshot()),voices:window.__soundVoices};
 });
 expect(audible.authority).toBe(baseline.authority);
 expect(audible.audit.enabled).toBe(true);
 expect(audible.audit.hammerStrikes).toBeGreaterThan(0);
 expect(audible.audit.lastCitizen).toBe(baseline.smith.citizen);
 expect(audible.voices).toBeGreaterThan(0);
 // A second still frame may not replay the same strike or allocate new voices.
 const repeat=await page.evaluate(()=>{
  window.__tinyKingdom.pollForgeSound();
  return {strikes:window.__tinyKingdom.getForgeSoundAudit().hammerStrikes,
    voices:window.__soundVoices};
 });
 expect(repeat.strikes).toBe(audible.audit.hammerStrikes);
 expect(repeat.voices).toBe(audible.voices);
 await page.setViewportSize({width:390,height:844});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>390);
 expect(overflow).toBe(false);
 await expect(page.locator('#forge-sound')).toHaveAttribute('aria-pressed','true');
 fs.mkdirSync('artifacts/tiny-kingdom-w46',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w46/real-forge-sound-390px.png'});
 await page.locator('#forge-sound').click();
 const muted=await page.evaluate(()=>{
  window.__tinyKingdom.pollForgeSound();
  return {audit:window.__tinyKingdom.getForgeSoundAudit(),
   authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   voices:window.__soundVoices};
 });
 expect(muted.audit.enabled).toBe(false);
 expect(muted.authority).toBe(baseline.authority);
 expect(muted.voices).toBe(audible.voices);
 expect(errors).toEqual([]);
 console.log('W46 actual physical forge sound',JSON.stringify({
  realSmith:baseline.smith.citizen,steps:baseline.ticks,
  strikes:audible.audit.hammerStrikes,voices:audible.voices,
  smallScreen390:!overflow,authorityUnchanged:muted.authority===baseline.authority
 }));
});
