'use strict';
// W519: genuine Day-21 roof-over-camera failure witnessed in W518
// desktop/390px captured playback. No fake house or manipulated saved world.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W519 actual growing homes must not swallow the playable village camera '+viewport.width,
 async({page},info)=>{
  test.setTimeout(420000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>
   window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.reset();g.setSpeed(0);
   g.setCamera({focus:[23.0,1.0],yaw:.82,pitch:.59,zoom:12.8});
  });
  // W520 RED-before contract: W519 physical checks falsely passed actual
  // Day1→Day121 roof-filled desktop and 390px recordings. A clear camera EYE
  // is insufficient when a real home occupies the complete screen.
  const evidenceDirectory=path.resolve('artifacts/tiny-kingdom-w520-court-camera',String(viewport.width));
  fs.mkdirSync(evidenceDirectory,{recursive:true});
  const stages=[],initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:g.exportSnapshot(),people:g.metrics().citizens,
    homes:g.metrics().buildings};
  });
  let prevDay=0;
  for(const day of [1,21,41,81,121]){
   const delta=day===1?0:(day-prevDay)*24*30;
   for(let remaining=delta;remaining>0;remaining-=7200)
    await page.evaluate(n=>{
     const g=window.__tinyKingdom;
     for(let i=0;i<n;i++)g.step(1/30);
    },Math.min(7200,remaining));
   prevDay=day;
   const lastFrame=await page.evaluate(()=>
    window.__tinyKingdom.renderQuality().framesDrawn);
   await page.waitForFunction(before=>
    window.__tinyKingdom.renderQuality().framesDrawn>before,
    lastFrame,{timeout:125000});
   const observed=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    const canvas=document.querySelector('#world');
    const before=g.exportSnapshot().checksum;
    const physical=g.getFreeCameraCollisionAudit();
    const grown=g.getGrowingTownCameraAudit();
    const after=g.exportSnapshot().checksum;
    return {day:g.metrics().day,people:g.metrics().citizens,
     homes:g.metrics().buildings,physical,grown,
     scene:g.renderStats().lastFrameTriangles,
     camera:g.getCamera(),
     realAuthorityUntouchedByCamera:before===after,
     checksum:after,webglError:canvas.getContext('webgl').getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   stages.push(observed);
   // Preserve the original live audit even if a strict physical framing
   // assertion fails on this day. CI must not upload only terminal green clips.
   const actualFrame=await page.screenshot();
   // Independent raster-level gate from genuine WebGL footage. W520's
   // 2/2 green browser test filmed 99.99% neutral grey roof/plaster pixels
   // in its desktop scene crop; valid W518 Day1 overview showed real green.
   // Never substitute synthetic images, camera audit flags or 3D sketches.
   const actualPixels=await page.evaluate(async base64=>{
    const bytes=Uint8Array.from(atob(base64),ch=>ch.charCodeAt(0));
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    const scratch=document.createElement('canvas');
    scratch.width=bitmap.width;scratch.height=bitmap.height;
    const ctx=scratch.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bitmap,0,0);
    const left=Math.floor(bitmap.width*.14),top=Math.floor(bitmap.height*.2);
    const width=Math.floor(bitmap.width*.72),height=Math.floor(bitmap.height*.63);
    const data=ctx.getImageData(left,top,width,height).data;
    let total=0,green=0,neutral=0;
    for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5){
     const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
     total++;
     if(g>r*1.06&&g>b*1.045&&g>35&&g<220)green++;
     if(Math.max(r,g,b)-Math.min(r,g,b)<25)neutral++;
    }
    bitmap.close();
    return {sampled:total,greenFraction:green/total,
     neutralFraction:neutral/total};
   },actualFrame.toString('base64'));
   observed.actualScreenPixels=actualPixels;

   // Preserve the genuine PNG and raster audit before any failure can stop
   // Playwright. Never leave a red experience test without downloadable film.
   fs.writeFileSync(path.join(evidenceDirectory,'day-'+day+'.json'),
    JSON.stringify({source:process.env.GITHUB_SHA||'local',viewport,
     seed:initial.snapshot.checksum,...observed,
     hardwareFps:'NOT MEASURED'},null,2));
   fs.writeFileSync(path.join(evidenceDirectory,'day-'+day+'.png'),actualFrame);
   await info.attach('real-day-'+day+'-'+viewport.width,{
    body:actualFrame,contentType:'image/png'});
   if(day===1){
    expect(actualPixels.greenFraction).toBeGreaterThan(.12);
    expect(actualPixels.neutralFraction).toBeLessThan(.90);
   }
   expect(observed.realAuthorityUntouchedByCamera).toBe(true);
   expect(observed.camera.follow).toBe(false);
   expect(observed.physical.eyeClear).toBe(true);
   expect(observed.physical.viewClear).toBe(true);
   // Independent visual-composition contract: reject the genuine W519
   // roof-filled frames that still passed eyeClear and viewClear. Only a
   // physically unobstructed ray to the town court counts as a free overview.
   expect(observed.physical.centralTownRayClear).toBe(true);
   expect(observed.physical.centralTownBlockers).toBe(0);
   expect(observed.physical.nearRoofDominance).toBeLessThan(.78);
   expect(observed.physical.screenDominantBuilding).toBeLessThan(.40);
   expect(observed.scene).toBeGreaterThan(0);
   expect(observed.scene).toBeLessThan(160000);
   expect(observed.webglError).toBe(0);
   expect(observed.overflow).toBeLessThanOrEqual(0);
   expect(observed.people).toBeGreaterThanOrEqual(initial.people);
   expect(observed.grown.hiddenStructures).toBe(0);
   expect(observed.grown.hiddenCitizens).toBe(0);
  }
  expect(stages.at(-1).homes).toBeGreaterThan(initial.homes);
  expect(stages.at(-1).day).toBeGreaterThanOrEqual(120);
  fs.writeFileSync(path.join(evidenceDirectory,'real-world-audit.json'),
   JSON.stringify({source:process.env.GITHUB_SHA||'local',
    seedChecksum:initial.snapshot.checksum,viewport,stages,
    hardwareFps:'NOT MEASURED',independentBlindCritic:'NOT PROVEN'},null,2));
  expect(errors).toEqual([]);
  await info.attach('actual-growing-camera-audit-'+viewport.width,{
   body:Buffer.from(JSON.stringify({source:process.env.GITHUB_SHA||'local',
    seedChecksum:initial.snapshot.checksum,viewport,stages,
    nativeHardwareFps:'NOT MEASURED',independentBlindCritic:'NOT PROVEN',
    scorecardA:'NOT PROVEN',scorecardB:'FAIL'},null,2)),
   contentType:'application/json'});
 });
}
