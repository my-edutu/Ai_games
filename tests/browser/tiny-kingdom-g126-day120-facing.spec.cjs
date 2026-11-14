'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G126 is a Day-120 REAL citizen camera regression prompted by genuine G124
// video: Edric's recorded street encounter had facingAlignment = -0.999758,
// despite older G122 Day-1 clear-ray tests passing. Do not create fake workers.
test('G126 mature settlement encounter prefers readable real working fronts',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:60000});
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<86400;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  g.setStreetWalk(true);
  const first=g.visitStreetWorker();
  const second=g.visitStreetWorker();
  const after=JSON.stringify(g.exportSnapshot());
  return {first,second,readOnly:before===after,metrics:g.metrics()};
 });
 expect(proof.readOnly).toBe(true);
 expect(proof.metrics.citizens).toBeGreaterThanOrEqual(28);
 expect(proof.metrics.buildings).toBeGreaterThanOrEqual(37);
 for(const shot of [proof.first,proof.second]){
  expect(shot.moved).toBe(true);
  expect(shot.realCitizen).toBe(true);
  expect(shot.crowdIntrusions).toBe(0);
  expect(shot.cropBlockedSamples).toBe(0);
  expect(shot.frontCandidateCount).toBeGreaterThanOrEqual(0);
  if(shot.frontCandidateCount>0){
   expect(shot.facingAlignment).toBeGreaterThan(.12);
   expect(shot.frontPreferred).toBe(true);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(120);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
