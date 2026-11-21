'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G122: inspect an actual builder without making the visitor stare at backs,
// oversized bystanders, or props. Camera decisions must be read-only. The
// checkpoint is inspectable; only real footage can validate visual quality.
test('G122 visited real workers use readable front-facing street compositions',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const evidence=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<30000&&!g.getActiveWorksites().some(w=>w.job==='builder');i++)
   g.step(1/30);
  const previous=JSON.stringify(g.exportSnapshot());
  g.setStreetWalk(true);
  const first=g.visitStreetWorker();
  const second=g.visitStreetWorker();
  const after=JSON.stringify(g.exportSnapshot());
  return {previous,after,first,second};
 });
 expect(evidence.after).toBe(evidence.previous);
 for(const shot of [evidence.first,evidence.second]){
  expect(shot.moved).toBe(true);
  expect(shot.realCitizen).toBe(true);
  expect(shot.crowdIntrusions).toBe(0);
  expect(shot.cropBlockedSamples).toBe(0);
  expect(shot.facingAlignment).toBeGreaterThan(-.1);
  expect(shot.frameCrowdBurden).toBeLessThan(2.5);
  expect(shot.metres).toBeGreaterThanOrEqual(3);
  expect(shot.metres).toBeLessThanOrEqual(7.8);
 }
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(250);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {width:document.documentElement.scrollWidth,
    authority:JSON.stringify(g.exportSnapshot()),camera:g.getStreetWalkState(),
    gl:document.querySelector('#world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.width).toBeLessThanOrEqual(390);
 expect(mobile.authority).toBe(evidence.previous);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
});
