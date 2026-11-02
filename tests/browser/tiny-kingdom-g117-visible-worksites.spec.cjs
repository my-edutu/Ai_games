'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G117: G116 actual camera footage showed Bran's true harvest concealed by
// unbroken wheat. Roof and crowd visibility alone were false positives.
// Film original live labor WITHOUT deleting crops, moving villagers, or
// inventing work. Allow the spectator to meet a second autonomous worker.
test('G117 inspect two real worksites without foreground crop or crowd occlusion',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 for(let n=0;n<12;n++)await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let tick=0;tick<7200;tick++)g.step(1/30);
 });
 const original=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.evaluate(snapshot=>{window.__g117Snapshot=snapshot},original);
 await page.locator('#street-walk').click();
 const visit=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const first=g.visitStreetWorker(),firstView=g.getStreetWalkState();
  const second=g.visitStreetWorker(),secondView=g.getStreetWalkState();
  const persons=g.getState().people.map(p=>({name:p.name,job:p.job,activity:p.activity}));
  return {first,second,firstView,secondView,persons,
   same:JSON.stringify(g.exportSnapshot())===window.__g117Snapshot};
 });
 // The exported snapshot was saved through a JS-global ONLY for this assertion,
 // not as a replacement for the real autonomous world or replay data.
 expect(visit.first.moved&&visit.second.moved).toBe(true);
 expect(visit.first.realCitizen&&visit.second.realCitizen).toBe(true);
 expect(visit.first.citizen).not.toBe(visit.second.citizen);
 for(const visitShot of [visit.first,visit.second]){
  expect(visit.persons.some(p=>p.name===visitShot.citizen&&p.job===visitShot.job)).toBe(true);
  expect(visitShot.lineOfSight).toBe(true);
  expect(visitShot.crowdIntrusions).toBe(0);
  expect(visitShot.cropBlockedSamples).toBe(0);
  expect(visitShot.metres).toBeGreaterThanOrEqual(2.4);
  expect(visitShot.metres).toBeLessThanOrEqual(7.8);
 }
 expect(visit.firstView.visibility.openSky&&visit.secondView.visibility.openSky).toBe(true);
 expect(Math.abs(visit.firstView.tilt)).toBeGreaterThan(.015);
 expect(Math.abs(visit.secondView.tilt)).toBeGreaterThan(.015);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const button=document.getElementById('street-meet-worker');
  const bounds=button.getBoundingClientRect();
  return {label:button.textContent,within:bounds.left>=0&&bounds.right<=innerWidth,
   overflow:document.documentElement.scrollWidth>innerWidth,
   glError:document.getElementById('world').getContext('webgl')?.getError()??0};
 });
 expect(mobile.label).toContain('Next');
 expect(mobile.within&&!mobile.overflow).toBe(true);
 expect(mobile.glError).toBe(0);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(original);
 expect(errors).toEqual([]);
});
