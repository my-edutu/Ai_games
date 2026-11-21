'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W405 actual original followed workday, GPU skin and user camera at '+width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const height=width===390?844:640;
  await page.setViewportSize({width,height});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let film=g.watchVillageLife();
   for(let i=0;!film&&i<360;i++){g.step(.15);film=g.watchVillageLife();}
   return film?{subject:g.getSelectedCitizen(),camera:g.getCamera(),
    people:g.metrics().citizens,authority:JSON.stringify(g.exportSnapshot()),
    skin:g.getForegroundSkinAudit(),resident:g.getForegroundResidentAudit(),
    action:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity}:null;
  });
  expect(first,'only an actual autonomous worker can start a documentary').not.toBeNull();
  expect(first.camera.follow).toBe(true);
  expect(first.people).toBeGreaterThanOrEqual(12);
  // No fabricated filmed delivery or pretending software WebGL is mobile GPU.
  const observed=[];
  for(let frame=0;frame<4;frame++){
   await page.waitForTimeout(800);
   const state=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {name:g.getSelectedCitizen(),
     stage:document.body.dataset.workday,
     task:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity,
     skin:g.getForegroundSkinAudit(),resident:g.getForegroundResidentAudit(),
     geometry:g.renderStats(),camera:g.getCamera(),
     gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
   });
   observed.push(state);
   expect(state.geometry.lastFrameTriangles).toBeGreaterThan(0);
   expect(state.geometry.lastFrameTriangles).toBeLessThan(160000);
   expect(state.gl).toBe(0);
   // Genuine seed-world steps, never manually pose or teleport a citizen.
   await page.evaluate(()=>{const g=window.__tinyKingdom;g.step(.18);});
  }
  expect(errors).toEqual([]);
  const dir='artifacts/tiny-kingdom-w405';
  fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:dir+'/'+width+'-actual-followed-workday.png'});
  fs.writeFileSync(dir+'/'+width+'-followed-workday.json',JSON.stringify({
   exactSource:'github-actions-checkout-head',viewport:{width,height},
   first:{...first,authorityChecksumLength:first.authority.length,authority:undefined},
   observed,errorMessages:errors,softwareWebGL:true,
   physicalHardwareFps:'NOT MEASURED',matchedG088:'NOT PROVEN',
   independentCritics:'NOT AVAILABLE'},null,2));
  const video=page.video();
  await page.close();
  if(video)await video.saveAs(dir+'/'+width+'-actual-continuous-workday.webm');
 });
}
