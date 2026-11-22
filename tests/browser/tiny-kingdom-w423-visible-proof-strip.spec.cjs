'use strict';
// W423: direct running WebGL + true simulated grain, not staged workers or stock.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W423 live true-grain proof remains visible and 390px controllable '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:150000});
  const start=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   for(let i=0;i<30000;i++){
    g.step(1/30);
    if(i%9)continue;
    const harvest=g.getHarvestInteractionAudit();
    if(harvest.active&&harvest.progress>.12&&harvest.progress<.7){
     const previous=JSON.stringify(g.exportSnapshot());
     const tracked=g.watchRealGrainJourney();
     return {harvest,tracked,snapshotSafe:previous===JSON.stringify(g.exportSnapshot())};
    }
   }
   return null;
  });
  expect(start,'Only original farmer harvesting may begin a witness').toBeTruthy();
  expect(start.snapshotSafe).toBe(true);
  await page.waitForFunction(()=>document.body.dataset.grainTracking==='on'&&
   !document.getElementById('grain-live-strip').hidden,null,{timeout:60000});
  const visible=await page.evaluate(()=>{
   const g=window.__tinyKingdom,root=document.getElementById('grain-live-strip');
   const frame=g.getPresentedCameraFrame();
   return {model:g.getGrainProofStripAudit(),caption:root.innerText,
    box:root.getBoundingClientRect().toJSON(),
    viewport:innerWidth,scrollOverflow:document.documentElement.scrollWidth-innerWidth,
    stageNodes:root.querySelectorAll('[data-grain-step]').length,
    originalActor:g.getSelectedCitizen(),frame,
    submittedTriangles:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError()??0};
  });
  expect(visible.model.visible).toBe(true);
  expect(visible.model.producer).toBe(start.harvest.citizen);
  expect(visible.stageNodes).toBe(5);
  expect(visible.scrollOverflow).toBeLessThanOrEqual(0);
  expect(visible.box.left).toBeGreaterThanOrEqual(-1);
  expect(visible.box.right).toBeLessThanOrEqual(viewport.width+1);
  expect(visible.submittedTriangles).toBeLessThan(160000);
  expect(visible.glError).toBe(0);
  const file='artifacts/tiny-kingdom-w423';
  fs.mkdirSync(file,{recursive:true});
  await page.screenshot({path:file+'/'+viewport.width+'-original-real-farmer-5-stage-proof.png'});
  // Detailed event history is revealed ONLY by a real person choosing it.
  const inspection=await page.evaluate(()=>{
   const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
   document.getElementById('grain-live-details').click();
   return {worldUnchanged:before===JSON.stringify(g.exportSnapshot()),
    expanded:document.body.dataset.supply,
    stripHidden:getComputedStyle(document.getElementById('grain-live-strip')).display==='none'};
  });
  expect(inspection.worldUnchanged).toBe(true);
  expect(inspection.expanded).toBe('open');
  expect(inspection.stripHidden).toBe(true);
  fs.writeFileSync(file+'/'+viewport.width+'-original-source-evidence.json',
   JSON.stringify({source:'running-playable-world',start,visible,inspection,
    nativeHardwareFps:'NOT MEASURED',blindCritics:'NOT AVAILABLE',
    experienceTransformation:'NOT PROVEN',errors},null,2));
  expect(errors).toEqual([]);
 });
}
