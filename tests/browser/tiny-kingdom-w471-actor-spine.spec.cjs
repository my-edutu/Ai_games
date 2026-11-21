'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [390,1024]){
 test('W471 same-world original actor 3D presentation parity '+width,async({page})=>{
  test.setTimeout(540000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:180000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w471');
  fs.mkdirSync(dir,{recursive:true});
  async function capture(enabled,label){
   const prev=await page.evaluate(()=>window.__tinyKingdom.renderQuality().framesDrawn);
   await page.evaluate(v=>window.__tinyKingdom.setResidentActorGpuForTesting(v),enabled);
   await page.waitForFunction(n=>window.__tinyKingdom.renderQuality().framesDrawn>n,
    prev,{timeout:180000});
   const record=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {actor:g.getActorResidencyAudit(),world:g.metrics(),
     checksum:g.exportSnapshot().checksum,
     geometry:g.renderStats(),citizens:g.getVillageVisualLod(),
     camera:g.getCamera(),
     horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
     webglError:document.getElementById('world').getContext('webgl')?.getError()??-1,
     renderer:g.renderQuality().renderer};
   });
   expect(record.actor.residentActorGpuEnabled).toBe(enabled);
   expect(record.geometry.lastFrameTriangles).toBeGreaterThan(0);
   expect(record.geometry.lastFrameTriangles).toBeLessThan(160000);
   expect(record.webglError).toBe(0);
   expect(record.horizontalOverflow).toBeLessThanOrEqual(0);
   await page.screenshot({path:path.join(dir,width+'-'+label+'.png')});
   return record;
  }
  const previous=await capture(true,'old-resident-software-3d');
  const candidate=await capture(false,'original-live-software-3d');
  expect(previous.renderer).toMatch(/SwiftShader|llvmpipe|softpipe/i);
  expect(candidate.renderer).toMatch(/SwiftShader|llvmpipe|softpipe/i);
  expect(candidate.actor.softwareTierCpuFallback).toBe(true);
  expect(previous.checksum).toBe(candidate.checksum);
  expect(previous.citizens.population).toBe(candidate.citizens.population);
  expect(previous.world.day).toBe(candidate.world.day);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(dir,width+'-paired-world.json'),JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',
   samePausedAuthorityChecksum:true,oldSoftware3d:previous,candidateSoftware3d:candidate,
   errors,reportedHardwareFps:'NOT MEASURED',independentBlindedCritic:'NOT PROVEN',
   fullUncutFarmToHome:'NOT PROVEN',workload:'genuine paused Day-1 viewport only'
  },null,2));
  const vid=page.video();await page.close();
  if(vid)await vid.saveAs(path.join(dir,width+'-real-camera-render.webm'));
 });
}
