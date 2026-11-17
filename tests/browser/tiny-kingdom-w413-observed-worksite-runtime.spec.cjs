'use strict';
// W413: real playable original WebGL, followed genuine workplace hero.
// Compare two render-only modes without creating actors, labor or cargo.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W413 actual observed worksite CPU/GPU rig '+viewport.width,async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>
   window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:150000});
  const setup=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let actual=g.getActiveWorksites(),ticks=0;
   while(!actual.length&&ticks<5000){
    g.step(1/30);ticks++;
    if(ticks%5===0)actual=g.getActiveWorksites();
   }
   const watch=actual.length?g.watchLiveWorkday():null;
   return {ticks,actual,watch,selected:g.getSelectedCitizen(),
    selectedTask:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity,
    citizenCount:g.metrics().citizens};
  });
  expect(setup.actual.length,'a genuinely scheduled worker is required').toBeGreaterThan(0);
  expect(setup.watch,'following a real active worksite is required').toBeTruthy();
  expect(setup.selectedTask).toBeTruthy();
  await page.waitForFunction(name=>{
   const g=window.__tinyKingdom;
   return g.getForegroundResidentAudit().observedRealWorksiteSkinNames.includes(name);
  },setup.selected,{timeout:150000});
  const read=()=>page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    selected:g.getSelectedCitizen(),
    observed:g.getForegroundResidentAudit().observedRealWorksiteSkinNames,
    skin:g.getForegroundSkinAudit(),
    population:g.metrics().citizens,
    triangles:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
    overflow:document.documentElement.scrollWidth-innerWidth,
    actorTask:g.getNavigation().find(p=>p.name===g.getSelectedCitizen())?.activity};
  });
  const candidate=await read();
  expect(candidate.observed).toContain(setup.selected);
  expect(candidate.skin.jointDraws).toBeGreaterThan(0);
  const folder=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w413');
  fs.mkdirSync(folder,{recursive:true});
  await page.screenshot({path:path.join(folder,viewport.width+'-selected-gpu-worker.png')});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
   g.setForegroundResidentEnabledForTesting(false);return n;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   before,{timeout:150000});
  const cpu=await read();
  expect(cpu.observed).not.toContain(setup.selected);
  expect(cpu.snapshot).toBe(candidate.snapshot);
  await page.screenshot({path:path.join(folder,viewport.width+'-selected-cpu-worker.png')});
  const beforeAgain=await page.evaluate(()=>{
   const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
   g.setForegroundResidentEnabledForTesting(true);return n;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   beforeAgain,{timeout:150000});
  const again=await read();
  expect(again.snapshot).toBe(candidate.snapshot);
  expect(again.observed).toContain(setup.selected);
  const motion=[];
  for(let i=0;i<3;i++){
   const prior=await page.evaluate(()=>{
    const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
    g.step(1/30);return n;
   });
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
    prior,{timeout:150000});
   motion.push(await read());
  }
  expect(motion.some(row=>row.snapshot!==again.snapshot)).toBe(true);
  for(const row of [candidate,cpu,again,...motion]){
   expect(row.population).toBe(setup.citizenCount);
   expect(row.triangles).toBeLessThan(160000);
   expect(row.glError).toBe(0);
   expect(row.overflow).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(folder,viewport.width+'-actual-moving-worker.png')});
  fs.writeFileSync(path.join(folder,viewport.width+'-real-worksite-evidence.json'),
   JSON.stringify({source:'checkout-exact-head',viewport,setup,
    cpu:{...cpu,snapshot:'same-original-saved-world'},
    gpu:{...candidate,snapshot:'same-original-saved-world'},
    motion:motion.map(row=>({...row,snapshot:'advanced-authoritative-time'})),
    pageErrors:errors,softwareWebGL:true,physicalHardwareFps:'NOT MEASURED',
    experienceGate:'NOT PROVEN',commercialReference:'FAIL'},null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(folder,viewport.width+'-uncut-real-worksite.webm'));
 });
}
