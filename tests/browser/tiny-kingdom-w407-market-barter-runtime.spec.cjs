'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W407 actual market documentary with trade-post physical camera at '+width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let film=g.watchVillageLife();
   for(let i=0;!film&&i<360;i++){g.step(.15);film=g.watchVillageLife();}
   return film?{name:g.getSelectedCitizen(),action:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity,
    beforeSnapshot:JSON.stringify(g.exportSnapshot()),camera:g.getCamera()}:null;
  });
  expect(first).not.toBeNull();
  expect(first.camera.follow).toBe(true);
  const frames=[];
  for(let i=0;i<4;i++){
   await page.waitForTimeout(850);
   frames.push(await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {name:g.getSelectedCitizen(),activity:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity,
     trade:g.getMarketBarterWitnessAudit(),camera:g.getCamera(),lens:g.getCitizenCameraPlan(),
     geometry:g.renderStats(),gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
   }));
   expect(frames[i].geometry.lastFrameTriangles).toBeLessThan(160000);
   expect(frames[i].geometry.lastFrameTriangles).toBeGreaterThan(0);
   expect(frames[i].gl).toBe(0);
   await page.evaluate(()=>window.__tinyKingdom.step(.18));
  }
  if(first.action==='Bartering at market'){
   expect(frames.some(f=>f.trade.active&&f.trade.realCitizen===first.name),
    'actual bartering witness should be active').toBe(true);
   expect(frames.some(f=>f.lens?.marketBarterWitness===true),
    'camera must evaluate the authentic bartering branch').toBe(true);
  }
  expect(errors).toEqual([]);
  const dir='artifacts/tiny-kingdom-w407';fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:dir+'/'+width+'-real-market-work.png'});
  fs.writeFileSync(dir+'/'+width+'-market-camera.json',JSON.stringify({
   source:'exact-checkout-game',width,actor:first.name,firstActivity:first.action,
   beforeAuthoritySnapshotBytes:first.beforeSnapshot.length,
   frames,errorMessages:errors,softwareWebGL:true,
   capturedUncutWorkday:true,hardwareFps:'NOT MEASURED',
   independentBlindCritics:'NOT AVAILABLE',referenceParity:'NOT PROVEN'},null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(dir+'/'+width+'-real-market-workday.webm');
 });
}