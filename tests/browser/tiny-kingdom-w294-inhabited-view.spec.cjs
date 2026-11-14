'use strict';
// Authentic 120-day autonomous settlement and two camera directions at desktop
// and 390px. Simulation is accelerated between captures, not a continuous
// 120-day movie; each capture/video still comes from the running playable game.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W294 original lived-in street direction follows genuine camera without hiding houses',async({page},info)=>{
 test.setTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
 await page.locator('#pause').click();
 const g0=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 // Exactly the same real fixed-step Day121 gameplay used by prior grown-town
 // tests. The world itself builds the houses and employs every original human.
 for(let day=0;day<120;day+=10){
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<7200;i++)g.step(1/30);
  });
  await page.waitForTimeout(180);
 }
 const start=await page.evaluate(()=>{
  const g=window.__tinyKingdom,metrics=g.metrics(),lots=g.getInhabitedSkylineAudit().lots;
  const xs=lots.map(v=>v.x),zs=lots.map(v=>v.z);
  return {authority:JSON.stringify(g.exportSnapshot()),metrics,
   population:g.getState().people.length,
   focus:[(Math.min(...xs)+Math.max(...xs))/2,
    (Math.min(...zs)+Math.max(...zs))/2]};
 });
 expect(start.authority).not.toBe(g0);
 expect(start.metrics.day).toBeGreaterThanOrEqual(120);
 expect(start.metrics.buildings-2).toBeGreaterThanOrEqual(18);
 async function turnAndCapture(viewport,yaw,label){
  await page.setViewportSize(viewport);
  const prior=await page.evaluate(({focus,yaw})=>{
   const g=window.__tinyKingdom;
   g.setHomePartitionOverride(true);
   const before=g.getFrameProfile().totalFrames;
   g.setCamera({focus,yaw,pitch:.54,zoom:9.6});
   return before;
  },{focus:start.focus,yaw});
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   prior,{timeout:150000});
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom,p=g.getHomePartitionAudit();
   return p.enabled&&p.activeHomes===g.metrics().buildings-2&&p.staleDrawn===0;
  },null,{timeout:150000});
  const state=await page.evaluate(()=>{
   const g=window.__tinyKingdom,homes=g.getHomePartitionAudit();
   const skyline=g.getInhabitedSkylineAudit();
   const canvas=document.getElementById('world'),gl=canvas.getContext('webgl');
   return {authority:JSON.stringify(g.exportSnapshot()),
    buildings:g.metrics().buildings,population:g.getState().people.length,
    details:skyline.lots.filter(x=>!x.compact).map(x=>x.lot),
    homes,geometry:g.getGeometryAudit(),profile:g.getFrameProfile(),
    camera:g.getFreeCameraCollisionAudit(),
    error:gl?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const prefix='W294-'+viewport.width+'-'+label;
  // W295 verification: keep source-owned screenshots AND the complete real
  // geometry/CPU/gl/authority audit as downloadable evidence. Playwright's
  // ephemeral info.attach records were not retained in prior successful ZIPs.
  const evidenceDir=path.resolve(__dirname,'../../artifacts/tiny-kingdom/w295-camera');
  fs.mkdirSync(evidenceDir,{recursive:true});
  const exactHead=require('node:child_process')
   .execFileSync('git',['rev-parse','HEAD'],{cwd:path.resolve(__dirname,'../..')})
   .toString().trim();
  const pixels=await page.screenshot();
  const metadata=JSON.stringify({viewport,yaw,
   sourceCommit:exactHead,softwareWebGL:true,
   independentReviewer:false,nativeGPUFPS:'NOT MEASURED',
   uncutWorkday:false,accelerated120Days:true,state},null,2);
  fs.writeFileSync(path.join(evidenceDir,prefix+'.png'),pixels);
  fs.writeFileSync(path.join(evidenceDir,prefix+'.json'),metadata);
  await info.attach(prefix+'.png',{body:pixels,contentType:'image/png'});
  await info.attach(prefix+'.json',{body:Buffer.from(metadata),contentType:'application/json'});
  expect(state.authority).toBe(start.authority);
  expect(state.population).toBe(start.population);
  expect(state.buildings).toBe(start.metrics.buildings);
  expect(state.homes.activeHomes).toBe(state.homes.realTownHomes);
  expect(state.homes.staleDrawn).toBe(0);
  expect(state.homes.detailPolicy.mode).toBe('inspection');
  expect(state.homes.detailPolicy.allOriginalHomesRetained).toBe(true);
  expect(state.details.length).toBe(6);
  expect(state.geometry.totalTriangles).toBeLessThan(160000);
  // W297: a camera that films only the underside of a real occupied roof
  // cannot pass just because its pixels and home counts are nonzero.
  expect(state.camera.eyeClear).toBe(true);
  expect(state.camera.viewClear).toBe(true);
  expect(state.camera.nearBlockers).toBe(0);
  expect(state.error).toBe(0);
  expect(state.overflow).toBeLessThanOrEqual(0);
  return state;
 }
 const results=[];
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
  const left=await turnAndCapture(viewport,Math.PI/2,'west');
  const right=await turnAndCapture(viewport,-Math.PI/2,'east');
  expect(left.details).not.toEqual(right.details);
  expect(right.homes.detailPolicy.retainedLODChanges)
   .toBeGreaterThan(left.homes.detailPolicy.retainedLODChanges);
  results.push({viewport,left:left.details,right:right.details});
 }
 expect(errors).toEqual([]);
 await info.attach('W294-original-real-cameras.json',{
  body:Buffer.from(JSON.stringify({scene:'authentic-Day121-camera-orbit',
   originalHomes:start.metrics.buildings-2,originalCitizens:start.population,
   results,nativeHardwareFps:'NOT PROVEN',blindedCritic:'NOT AVAILABLE'},null,2)),
  contentType:'application/json'});
});
