'use strict';
// W138: real seeded-world growth and original software render path A/B.
// Same authority snapshot; variant comparison is NOT G088 experience A/B.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W138 real 120-day software town unchanged across complete vs dirty home rendering',
 async({page},info)=>{
 test.setTimeout(600000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:160000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  const a=g.exportSnapshot();g.reset();const b=g.exportSnapshot();
  return {a:JSON.stringify(a),b:JSON.stringify(b),renderer:g.renderQuality().renderer};
 });
 expect(initial.a).toBe(initial.b);
 // Legitimate authoritative work and construction, same fixed 1/30-hour
 // increments used by production deterministic-soak, NOT fabricated houses.
 for(let day=0;day<120;day+=10){
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<7200;i++)g.step(1/30);
  });
  await page.waitForTimeout(220);
 }
 const snapshot=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const controls={focus:[0,3],yaw:.85,pitch:.52,zoom:23};
 const originalNames=await page.evaluate(()=>window.__tinyKingdom.getState().people.map(p=>p.name));
 const growth=await page.evaluate(()=>window.__tinyKingdom.metrics());
 expect(growth.buildings-2).toBeGreaterThanOrEqual(18);
 async function capture(viewport,mode){
  await page.setViewportSize(viewport);
  const prior=await page.evaluate(({mode,camera})=>{
   const g=window.__tinyKingdom;
   g.setHomePartitionOverride(mode);g.setCamera(camera);
   return g.getFrameProfile().totalFrames;
  },{mode,camera:controls});
  await page.waitForFunction(prior=>window.__tinyKingdom.getFrameProfile().totalFrames>prior,
    prior,{timeout:150000});
  const current=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {authority:JSON.stringify(g.exportSnapshot()),
    scene:g.getStationarySettlementAudit(),partition:g.getHomePartitionAudit(),
    geometry:g.getGeometryAudit(),profile:g.getFrameProfile(),
    cadence:g.getDrawCadenceAudit(),draw:g.getScenicVisibilityStats(),
    names:g.getState().people.map(p=>p.name),world:g.getSupplyTrailSnapshot(),
    cull:g.getScenicCullReferenceAudit(),bvh:g.getScenicBvhAudit(),
    error:gl?.getError()??-1,overflow:document.documentElement.scrollWidth-innerWidth,
    softwareRenderer:g.renderQuality().softwareRenderer??g.renderQuality().tier};
  });
  await info.attach('W138-'+viewport.width+'-'+(mode===null?'auto':mode?'partition':'complete')+'.png',
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W138-'+viewport.width+'-'+(mode===null?'auto':mode?'partition':'complete')+'.json',
   {body:Buffer.from(JSON.stringify({viewport,mode,current,physicalHardware:false,
    independentCritic:false,g088PairedVideo:false},null,2)),contentType:'application/json'});
  expect(current.authority).toBe(snapshot);
  expect(current.names).toEqual(originalNames);
  expect(current.error).toBe(0);
  expect(current.cull.missingChunks).toBe(0);
  expect(current.cull.falseVisibleChunks).toBe(0);
  expect(current.bvh.authoritativeStateChanged).toBe(false);
  expect(current.overflow).toBeLessThanOrEqual(0);
  expect(current.geometry.totalTriangles).toBeLessThan(160000);
  if(mode===true||mode===null){
   expect(current.partition.enabled).toBe(true);
   expect(current.partition.activeHomes).toBe(growth.buildings-2);
   expect(current.partition.mode).toBe('real-grown-town-dirty-blocks');
   expect(current.partition.staleDrawn).toBe(0);
  }else expect(current.partition.enabled).toBe(false);
  return current;
 }
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
  const complete=await capture(viewport,false);
  const partition=await capture(viewport,true);
  const auto=await capture(viewport,null);
  expect(partition.names.length).toBe(complete.names.length);
  expect(auto.scene.homes).toBe(complete.scene.homes);
  expect(partition.geometry.totalTriangles).toBe(complete.geometry.totalTriangles);
  expect(auto.geometry.totalTriangles).toBe(complete.geometry.totalTriangles);
 }

 // The source-pinned Day-121 VIDEO must actually show the MATURE village.
 // Earlier Playwright video mostly filmed Day-1 while 86,400 original
 // synchronous simulation ticks blocked browser paint. A separate recorded
 // page restores the identical authoritative saved world and gives the
 // renderer uninterrupted wall-clock time to show real citizens at work.
 // This is genuine gameplay after a valid restore, NOT a scripted movie.
 async function filmMatureWorld(viewport){
  const filmDir=info.outputPath('grown-films');
  fs.mkdirSync(filmDir,{recursive:true});
  const context=await page.context().browser().newContext({
   viewport,recordVideo:{dir:filmDir,size:viewport}
  });
  const filmPage=await context.newPage();
  const filmErrors=[];
  filmPage.on('pageerror',error=>filmErrors.push(error.message));
  const video=filmPage.video();
  let evidence;
  try{
   await filmPage.setContent(html);
   await filmPage.waitForFunction(()=>
    window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
    null,{timeout:160000});
   evidence=await filmPage.evaluate(({world,camera})=>{
    const g=window.__tinyKingdom;
    g.restoreSnapshot(JSON.parse(world));
    g.setCamera(camera);
    const restored=JSON.stringify(g.exportSnapshot());
    const first=g.metrics();
    return {restored,first,originalCitizenNames:
     g.getState().people.map(p=>p.name),
     renderer:g.renderer(),camera:g.getCamera()};
   },{world:snapshot,camera:controls});
   expect(evidence.restored).toBe(snapshot);
   expect(evidence.first.day).toBeGreaterThanOrEqual(120);
   expect(evidence.first.buildings).toBe(growth.buildings);
   // Start a real workday observer, with the existing autonomous jobs.
   // If everyone is legitimately resting, film the real populated overview.
   await filmPage.evaluate(()=>{
    const g=window.__tinyKingdom;
    if(g.getActiveWorksites().length)g.watchLiveWorkday();
   });
   await filmPage.waitForTimeout(2400);
   // Real 390px disclosure interaction, not a fake screenshot. Source-grounded
   // mobile user must still access the complete authentic supply chain.
   if(viewport.width===390){
    const before=await filmPage.evaluate(()=>{
     const ribbon=document.getElementById('world-ribbon');
     const button=document.getElementById('world-trace-toggle');
     return {mode:document.body.dataset.workday,
      width:ribbon.getBoundingClientRect().width,
      toggleWidth:button.getBoundingClientRect().width,
      toggleHeight:button.getBoundingClientRect().height,
      expanded:button.getAttribute('aria-expanded')};
    });
    if(before.mode==='live'){
     expect(before.width).toBeLessThan(140);
     expect(before.toggleWidth).toBeGreaterThanOrEqual(44);
     expect(before.toggleHeight).toBeGreaterThanOrEqual(44);
     expect(before.expanded).toBe('false');
     // The original W428 mobile dock collapses all except Pause; expand it
     // deliberately before asserting the live touch targets (W442).
     const disclosure=filmPage.locator('#mobile-transport-disclosure');
     await disclosure.click();
     await expect(disclosure).toHaveAttribute('aria-expanded','true');
     // W336 RED gate: the active ORIGINAL Day-121 human and economy viewer
     // must have 44px minimum touch targets for every VISIBLE action.
     // Desktop is unchanged; hidden commands remain in the Command desk.
     const mobileTouch=await filmPage.evaluate(()=>{
      const rectangles=selector=>Array.from(document.querySelectorAll(selector))
       .filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})
       .map(el=>({name:el.id||el.textContent.trim().slice(0,18),
        width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
      return {scenic:rectangles('.world-tour button'),
       commands:rectangles('.bottom button')};
     });
     expect(mobileTouch.scenic.length).toBeGreaterThan(0);
     expect(mobileTouch.commands.length).toBeGreaterThanOrEqual(4);
     for(const action of [...mobileTouch.scenic,...mobileTouch.commands]){
      expect(action.width).toBeGreaterThanOrEqual(44);
      expect(action.height).toBeGreaterThanOrEqual(44);
     }
     await disclosure.click();
     await expect(disclosure).toHaveAttribute('aria-expanded','false');
     await filmPage.locator('#world-trace-toggle').click();
     const opened=await filmPage.evaluate(()=>{
      const button=document.getElementById('world-trace-toggle');
      const trail=document.getElementById('world-supply-trail');
      return {expanded:button.getAttribute('aria-expanded'),
       visible:trail.getBoundingClientRect().height>0,
       width:document.getElementById('world-ribbon').getBoundingClientRect().width};
     });
     expect(opened.expanded).toBe('true');
     expect(opened.visible).toBe(true);
     expect(opened.width).toBeGreaterThan(before.width);
     await filmPage.locator('#world-trace-toggle').click();
     expect(await filmPage.locator('#world-trace-toggle').getAttribute('aria-expanded')).toBe('false');
    }
   }
   await info.attach('W138-real-grown-'+viewport.width+'-workday.png',{
    body:await filmPage.screenshot(),contentType:'image/png'});
   await filmPage.evaluate(()=>{
    const g=window.__tinyKingdom;
    g.setCamera({focus:[0,3],yaw:.58,pitch:.56,zoom:20});
   });
   await filmPage.waitForTimeout(2400);
   const final=await filmPage.evaluate(()=>{
    const g=window.__tinyKingdom;
    const gl=document.getElementById('world').getContext('webgl');
    return {metrics:g.metrics(),camera:g.getCamera(),
     frame:g.getFrameProfile(),geometry:g.getGeometryAudit(),
     nightLights:g.getVillageNightLightingAudit(),
     carryingLights:g.getHomecomingLanternAudit(),
     realWorkers:g.getActiveWorksites(),citizens:g.getState().people.map(p=>p.name),
     renderer:g.renderer(),error:gl?.getError()??-1,
     horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
   });
   expect(final.metrics.day).toBeGreaterThanOrEqual(120);
   expect(final.geometry.totalTriangles).toBeLessThan(160000);
   expect(final.citizens).toEqual(evidence.originalCitizenNames);
   // W330: the exact four authored market/street lanterns and ONLY real
   // genuine returning citizens illuminate the 120-day night. No extras.
   expect(final.nightLights.streetLamps).toHaveLength(4);
   expect(final.nightLights.maxStreetLamps).toBe(4);
   expect(final.nightLights.maxMovingLamps).toBe(2);
   expect(final.nightLights.actualCarryingCitizens).toBe(final.carryingLights.count);
   expect(final.nightLights.selectedLights).toBeLessThanOrEqual(2);
   expect(final.nightLights.selectedLights).toBeLessThanOrEqual(final.carryingLights.count);
   expect(final.nightLights.addsTriangles).toBe(0);
   expect(final.nightLights.changesSavedState).toBe(false);
   expect(final.error).toBe(0);
   expect(final.horizontalOverflow).toBeLessThanOrEqual(0);
   expect(filmErrors).toEqual([]);
   await info.attach('W138-real-grown-'+viewport.width+'-overview.png',{
    body:await filmPage.screenshot(),contentType:'image/png'});
   await info.attach('W138-real-grown-'+viewport.width+'-motion-evidence.json',{
    body:Buffer.from(JSON.stringify({source:'actual-restored-Day121-uncut-running-WebGL',
     viewport,originalSnapshotChecksum:JSON.parse(snapshot).checksum,
     initialMetrics:evidence.first,final,
     physicalGpu:false,independentCritic:false,
     claims:'Recording does not establish 30 hardware FPS or visual transformation'},null,2)),
    contentType:'application/json'});
  }finally{
   await context.close();
   if(video){
    const name='W138-authentic-Day121-'+viewport.width+'-uncut.webm';
    const out=info.outputPath(name);
    await video.saveAs(out);
    await info.attach(name,{path:out,contentType:'video/webm'});
   }
  }
 }
 await filmMatureWorld({width:1024,height:640});
 await filmMatureWorld({width:390,height:844});
 expect(pageErrors).toEqual([]);
});
