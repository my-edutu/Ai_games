'use strict';
// W424 true running farmer, 1024/390; same real crop + atmosphere + physical eye.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W424 real planted workday and physically clear original environment '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:150000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   return {state:JSON.stringify(g.exportSnapshot()),
    population:g.getState().people.map(p=>p.name),triangles:g.renderStats().lastFrameTriangles};
  });
  const work=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<30000;i++){
    g.step(1/30);
    if(i%9)continue;
    const harvest=g.getHarvestInteractionAudit();
    if(harvest.active&&harvest.progress>.12&&harvest.progress<.7){
     const snapshot=JSON.stringify(g.exportSnapshot());
     const tracked=g.watchRealGrainJourney();
     return {harvest,tracked,unchanged:snapshot===JSON.stringify(g.exportSnapshot())};
    }
   }
   return null;
  });
  expect(work,'A genuine farmer must be harvesting in the same world').toBeTruthy();
  expect(work.unchanged).toBe(true);
  await page.waitForFunction(()=>document.body.dataset.grainTracking==='on',null,{timeout:60000});
  const pre=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   pre,{timeout:120000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const frame=g.getPresentedCameraFrame(),plan=g.getCitizenCameraPlan();
   const box=document.getElementById('grain-live-strip').getBoundingClientRect();
   return {state:JSON.stringify(g.exportSnapshot()),
    population:g.getState().people.map(p=>p.name),
    harvest:g.getHarvestInteractionAudit(),
    proof:g.getGrainProofStripAudit(),frame,
    physicalEye:plan?.eye||null,
    physicalLens:plan?{yaw:plan.yaw,pitch:plan.pitch,zoom:plan.zoom,
     blockers:plan.blockers,clear:plan.eyeCollision?.clear}:null,
    triangles:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError()??0,
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
    strip:{left:box.left,right:box.right,bottom:box.bottom}};
  });
  expect(result.population).toEqual(original.population);
  expect(result.proof.visible).toBe(true);
  expect(result.proof.producer).toBe(work.harvest.citizen);
  expect(result.triangles).toBeLessThan(160000);
  expect(result.glError).toBe(0);
  expect(result.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(result.strip.left).toBeGreaterThanOrEqual(-1);
  expect(result.strip.right).toBeLessThanOrEqual(viewport.width+1);
  const destination=path.resolve('artifacts/tiny-kingdom-w424');
  fs.mkdirSync(destination,{recursive:true});
  await page.screenshot({path:path.join(destination,viewport.width+'-real-worker-and-living-sky.png')});
  fs.writeFileSync(path.join(destination,viewport.width+'-world-audit.json'),
   JSON.stringify({work,result,pageErrors:errors,
    machine:'GitHub Actions Chromium (SwiftShader/software)',
    trueHardwareFps:'NOT MEASURED',experienceGate:'NOT PROVEN',
    blindIndependentReview:'UNAVAILABLE'},null,2));
  expect(errors).toEqual([]);
 });
}
