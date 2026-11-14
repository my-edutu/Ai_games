'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const out='artifacts/tiny-kingdom-w306-survey';
fs.mkdirSync(out,{recursive:true});
test.use({video:'on'});
async function setup(page,size,errors){
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(size);await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:150000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
}
async function survey(page,name,filename){
 const r=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot()),
   plan=g.advanceRealEconomicSurvey();
  return {plan,unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(r.plan.accepted).toBe(true);expect(r.plan.stage).toBe(name);
 expect(r.unchanged).toBe(true);
 await page.waitForFunction(()=>!window.__tinyKingdom.getCameraNavigationAudit().transitionActive,
  null,{timeout:90000});
 const state=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const value={survey:g.getRealEconomicSurveyAudit(),camera:g.getCamera(),
   physical:g.getFreeCameraCollisionAudit(),triangles:g.renderStats().lastFrameTriangles,
   city:g.metrics(),gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   stageControl:document.getElementById('camera-survey').dataset.stage};
  value.authorityUnchanged=before===JSON.stringify(g.exportSnapshot());
  return value;
 });
 expect(state.survey.stage).toBe(name);expect(state.survey.realHomesRetained).toBe(true);
 expect(state.survey.inventedTransactions).toBe(0);
 expect(state.stageControl).toBe(name);
 expect(state.physical.viewClear).toBe(true);
 expect(state.triangles).toBeLessThan(160000);
 expect(state.gl).toBe(0);expect(state.overflow).toBeLessThanOrEqual(0);
 expect(state.authorityUnchanged).toBe(true);
 fs.writeFileSync(out+'/'+filename+'.json',JSON.stringify(state,null,2));
 await page.screenshot({path:out+'/'+filename+'.png'});
 return state;
}
for(const size of [{width:1024,height:640},{width:390,height:844}]){
 test('W306 original live 3D farm-market-homes tour '+size.width+'px',async({page})=>{
  test.setTimeout(420000);const errors=[];await setup(page,size,errors);
  await survey(page,'farm',size.width+'-farm');
  await survey(page,'market',size.width+'-market');
  const grown=await survey(page,'homes',size.width+'-homes');
  // During expensive software-WebGL startup the actual autonomous village
  // may finish a new home before pause. Inspect the authoritative count,
  // not a speculative zero-growth assumption.
  expect(grown.survey.last.grownHomes).toBe(
   Math.max(0,grown.survey.last.recordedHomes-grown.survey.last.foundingHomes));
  expect(grown.survey.last.districtHomeCount).toBeGreaterThanOrEqual(4);
  expect(grown.survey.last.districtHomeCount).toBeLessThanOrEqual(8);
  expect(grown.survey.last.zoom).toBeLessThanOrEqual(size.width===390?45:33);
  expect(grown.survey.last.inspectedHomeLots.length).toBe(grown.survey.last.districtHomeCount);
  // W308: do not select a pretend staged harvest. Advance the ORIGINAL seeded
  // world until a real worksite is occupied, then observe that exact citizen.
  const documentary=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   let ticks=0;
   while(g.getActiveWorksites().length===0&&ticks<7200){g.step(1/30);ticks++}
   const actualWorkers=g.getActiveWorksites().map(w=>w.citizen),
    before=JSON.stringify(g.exportSnapshot()),
    candidate=g.advanceRealEconomicSurvey();
   return {ticks,actualWorkers,candidate,
    frameBefore:g.getFrameProfile().totalFrames,
    unchanged:before===JSON.stringify(g.exportSnapshot())};
  });
  expect(documentary.actualWorkers.length).toBeGreaterThan(0);
  expect(documentary.candidate.accepted).toBe(true);
  expect(documentary.candidate.stage).toBe('workday');
  expect(documentary.candidate.actualWorker).toBe(true);
  expect(documentary.actualWorkers).toContain(documentary.candidate.citizen);
  expect(documentary.unchanged).toBe(true);
  // Capture only after the REAL 3D renderer submitted a worker-follow view,
  // not a still image from the previous houses shot on slow SwiftShader.
  await page.waitForFunction(previous=>
   window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   documentary.frameBefore,{timeout:150000});
  const live=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const view=g.getLiveWorkdayView();
   return {audit:g.getRealEconomicSurveyAudit(),view,
    workerNames:g.getActiveWorksites().map(w=>w.citizen),
    realCameraPlan:g.getCitizenCameraPlan(),
    actualComposition:g.getWorkdayCompositionAudit(),
    documentaryDirector:g.getLiveWorkDirectorStats(),
    actualProjectedCitizen:g.getCitizenPickCandidates().find(p=>p.name===view.citizen)||null,
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth,
    triangles:g.renderStats().lastFrameTriangles};
  });
  expect(live.audit.stage).toBe('workday');
  expect(live.view.citizen).toBe(documentary.candidate.citizen);
  expect(live.workerNames).toContain(live.view.citizen);
  expect(live.gl).toBe(0);
  expect(live.triangles).toBeLessThan(160000);
  expect(live.overflow).toBeLessThanOrEqual(0);
  fs.writeFileSync(out+'/'+size.width+'-real-workday.json',JSON.stringify({documentary,live},null,2));
  await page.screenshot({path:out+'/'+size.width+'-real-workday.png'});
  expect(errors).toEqual([]);
 });
}
test('W306 actual 120-day homes and 390px physical survey stay authoritative',async({page})=>{
 test.setTimeout(600000);const errors=[];await setup(page,{width:1024,height:640},errors);
 const last=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  return g.getFrameProfile().totalFrames;
 });
 await page.waitForFunction(prev=>window.__tinyKingdom.getFrameProfile().totalFrames>prev,
  last,{timeout:150000});
 const frozen=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await survey(page,'farm','day121-farm');
 await survey(page,'market','day121-market');
 const grown=await survey(page,'homes','day121-inhabited-new-homes');
 expect(grown.survey.last.grownHomes).toBeGreaterThanOrEqual(12);
 expect(grown.survey.last.inspectedHomeLots.length).toBeGreaterThan(0);
 expect(grown.survey.last.districtSource).toBe('grown');
 expect(grown.survey.last.districtHomeCount).toBeGreaterThanOrEqual(4);
 expect(grown.survey.last.districtHomeCount).toBeLessThanOrEqual(8);
 expect(grown.survey.last.zoom).toBeLessThanOrEqual(33);
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(frozen);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(500);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   triangles:g.renderStats().lastFrameTriangles};
 });
 expect(mobile.gl).toBe(0);expect(mobile.overflow).toBeLessThanOrEqual(0);
 expect(mobile.triangles).toBeLessThan(160000);
 await page.screenshot({path:out+'/day121-mobile-grown-homes.png'});
 expect(errors).toEqual([]);
});