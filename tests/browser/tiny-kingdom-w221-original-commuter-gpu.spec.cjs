'use strict';
// W503: observe a REAL unladen commuter at the time the authoritative
// simulation actually enters travel. The W221 test sampled one instant every
// six simulation hours, repeatedly missing whole genuine commuting windows.
// Follow the real person's coordinates with a physical camera; NEVER inject
// work, paths, people, grain or transactions for filming.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W503 original real unladen route 13-joint GPU or real CPU contact '+width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   g.setWorkingSkinEnabledForTesting(true);
   g.setCamera({focus:[0,0],yaw:.54,pitch:.78,zoom:31});
  });
  const attempts=[];let witness=null;
  for(let j=0;j<12;j++){
   const probe=await page.evaluate(()=>{
    const g=window.__tinyKingdom,before=g.getFrameProfile().totalFrames;
    let actor=null;
    for(let k=0;k<180;k++){
     g.step(1/30);
     if(k%3)continue;
     // getState() is a MINIMAL map projection (name, job, x/z, target).
     // It intentionally contains NO activity, provisions or path. Inspect
     // the ORIGINAL validated snapshot, not a synthetic/stripped citizen.
     const p=g.exportSnapshot().payload.people.find(person=>{
      const activity=person.activity||'';
      return !person.delivery&&!(Number(person.provisions)>0)&&
       (/^(Traveling to |Exploring the valley$|Returning home at dusk$)/.test(activity)||
         activity==='Traveling home for a meal')&&
       Number.isFinite(person.x)&&Number.isFinite(person.z)&&
       person.path?.length>0;
     });
     if(p){actor={name:p.name,activity:p.activity,focus:[p.x,p.z]};break;}
    }
    if(actor)g.setCamera({focus:actor.focus,yaw:.54,pitch:.78,zoom:31});
    return {before,actor};
   });
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
    .totalFrames>n,probe.before,{timeout:125000});
   const observed=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {commuter:g.getResidentCommuterAudit(),
     foreground:g.getForegroundSkinAudit(),
     savedChecksum:g.exportSnapshot().checksum,
     people:g.exportSnapshot().payload.people.map(p=>({name:p.name,activity:p.activity})),
     triangles:g.renderStats().lastFrameTriangles,profile:g.getFrameProfile().latest};
   });
   const names=[...observed.commuter.originalNames,...observed.foreground.names];
   attempts.push({attempt:j,realTravelWitness:probe.actor,
    skinCommuters:observed.commuter.skinnedCommuters,
    skinDetailed:observed.foreground.names,realGpuCitizenNames:names,
    triangles:observed.triangles,profile:observed.profile});
   if(probe.actor&&names.includes(probe.actor.name)){
    witness=probe.actor;break;
   }
  }
  await info.attach('w503-true-commuter-frame-by-frame-'+width,{
   body:Buffer.from(JSON.stringify(attempts,null,2)),contentType:'application/json'});
  expect(witness,'an actual unladen route must enter the ORIGINAL live or GPU system')
   .not.toBeNull();
  const active=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {commuter:g.getResidentCommuterAudit(),foreground:g.getForegroundSkinAudit()};
  });
  expect([...active.commuter.originalNames,...active.foreground.names])
   .toContain(witness.name);
  expect(active.commuter.gpuSkinDraws+active.foreground.jointDraws)
   .toBeGreaterThan(0);
  expect(active.commuter.jointBytes).toBeLessThanOrEqual(
   active.commuter.maxFloats/10*4);
  const saved=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  const motion=async mode=>{
   const before=await page.evaluate(({saved,mode,focus})=>{
    const g=window.__tinyKingdom;g.setSpeed(0);g.restoreSnapshot(saved);
    g.setCamera({focus,yaw:.54,pitch:.78,zoom:31});
    g.setWorkingSkinEnabledForTesting(mode);
    return g.getFrameProfile().totalFrames;
   },{saved,mode,focus:witness.focus});
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
    .totalFrames>n,before,{timeout:125000});
   const trace=[];
   for(let i=0;i<5;i++){
    const n=await page.evaluate(()=>{
     const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
     for(let k=0;k<8;k++)g.step(1/30);
     return frame;
    });
    await page.waitForFunction(v=>window.__tinyKingdom.getFrameProfile()
     .totalFrames>v,n,{timeout:125000});
    trace.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     return {checksum:g.exportSnapshot().checksum,
      people:g.getState().people.map(p=>p.name),
      buildings:g.metrics().buildings,
      commuter:g.getResidentCommuterAudit(),
      foreground:g.getForegroundSkinAudit(),
      profile:g.getFrameProfile().latest,
      triangles:g.renderStats().lastFrameTriangles,
      glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
      overflow:document.documentElement.scrollWidth-innerWidth};
    }));
   }
   await info.attach('w503-real-'+(mode?'gpu':'cpu')+'-traveler-'+width,{
    body:await page.screenshot(),contentType:'image/png'});
   return {trace,final:await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())};
  };
  const cpu=await motion(false),gpu=await motion(true);
  expect(gpu.final,'renderer cannot alter a real saved autonomous world').toEqual(cpu.final);
  expect(gpu.trace.map(x=>x.checksum)).toEqual(cpu.trace.map(x=>x.checksum));
  expect(gpu.trace.map(x=>x.people)).toEqual(cpu.trace.map(x=>x.people));
  for(let i=0;i<gpu.trace.length;i++){
   expect(gpu.trace[i].buildings).toBe(cpu.trace[i].buildings);
   expect(gpu.trace[i].triangles).toBeLessThan(160000);
   expect(gpu.trace[i].glError).toBe(0);
   expect(gpu.trace[i].overflow).toBeLessThanOrEqual(0);
  }
  await info.attach('w503-real-route-original-gpu-cpu-profile-'+width,{
   body:Buffer.from(JSON.stringify({width,witness,attempts,
    cpu:cpu.trace,gpu:gpu.trace,
    softwareDriverOnly:true,physicalGpuFps:'NOT MEASURED',
    independentVisualCritic:'UNAVAILABLE'},null,2)),
   contentType:'application/json'});
  expect(errors).toEqual([]);
 });
}