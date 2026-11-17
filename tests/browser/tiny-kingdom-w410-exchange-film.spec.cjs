'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W410 genuine bartering citizen, central open sky, original world '+width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let film=g.watchVillageLife();
   for(let i=0;!film&&i<360;i++){g.step(.15);film=g.watchVillageLife();}
   const name=g.getSelectedCitizen(),actor=g.getNavigation().find(p=>p.name===name);
   return {name,activity:actor?.activity||null,
    before:JSON.stringify(g.exportSnapshot()),lens:g.getCitizenCameraPlan()};
  });
  expect(initial.name).toBeTruthy();
  const dir='artifacts/tiny-kingdom-w410';fs.mkdirSync(dir,{recursive:true});
  await page.waitForTimeout(650);
  const initialView=await page.evaluate(()=>({
   audit:window.__tinyKingdom.getMarketBarterWitnessAudit(),
   camera:window.__tinyKingdom.getCamera(),
   lens:window.__tinyKingdom.getCitizenCameraPlan(),
   geometry:window.__tinyKingdom.renderStats(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
  }));
  await page.screenshot({path:dir+'/'+width+'-actual-first-work.png'});
  const frames=[initialView];
  for(let i=0;i<6;i++){
   await page.evaluate(()=>window.__tinyKingdom.step(.16));
   await page.waitForTimeout(500);
   frames.push(await page.evaluate(()=>({
    actor:window.__tinyKingdom.getSelectedCitizen(),
    trade:window.__tinyKingdom.getMarketBarterWitnessAudit(),
    camera:window.__tinyKingdom.getCamera(),
    lens:window.__tinyKingdom.getCitizenCameraPlan(),
    tris:window.__tinyKingdom.renderStats().lastFrameTriangles,
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
   })));
  }
  expect(errors).toEqual([]);
  expect(frames.every(x=>x.gl===0)).toBe(true);
  expect(frames.every(x=>(x.tris??x.geometry?.lastFrameTriangles)>0&&
   (x.tris??x.geometry?.lastFrameTriangles)<160000)).toBe(true);
  if(initial.activity==='Bartering at market'){
   expect(initialView.audit.active).toBe(true);
   expect(initialView.audit.realCitizen).toBe(initial.name);
   expect(initialView.lens.marketBarterWitness).toBe(true);
  }
  await page.screenshot({path:dir+'/'+width+'-actual-later-work.png'});
  fs.writeFileSync(dir+'/'+width+'-real-market-evidence.json',JSON.stringify({
   source:'exact-W410-playable-source',width,initial:{...initial,before:'snapshot-bytes:'+initial.before.length},
   frames,errorMessages:errors,softwareWebGL:true,physicalFps:'NOT MEASURED',
   independentBlindCritics:'NOT AVAILABLE',transformation:'NOT PROVEN'
  },null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(dir+'/'+width+'-actual-market-uncut.webm');
 });
}