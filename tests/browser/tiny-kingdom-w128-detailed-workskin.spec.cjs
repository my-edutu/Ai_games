'use strict';
// W128 genuine full-detail small worksite GPU bone-vs-original CPU A/B.
// NEVER fake a citizen/task, replace an authoritative snapshot, or infer FPS
// from an Ubuntu SwiftShader recording. This film is a safety/visual gate.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W128 same original detailed worker GPU joints '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{
   if(msg.type()==='error')errors.push(msg.text());
  });
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()
   ?.lastFrameTriangles>0,null,{timeout:125000});
  const selection=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   let sites=g.getActiveWorksites(),ticks=0;
   // Demand an authentic work beat with enough time left to observe
   // several original fixed-step poses; do not mistake a job finishing
   // naturally for a skinning/disappearance failure.
   for(;!sites.some(site=>site.remaining>.35)&&ticks<9000;ticks++){
    g.step(1/30);
    if(ticks%6===0)sites=g.getActiveWorksites();
   }
   return {sites,ticks,pre:g.exportSnapshot(),
    first:g.getFrameProfile().totalFrames};
  });
  expect(selection.sites.length,'Must use an actual working citizen').toBeGreaterThan(0);
  // Center actual autonomous worksite WITHOUT selecting/following the
  // resident: the near-detail cache is only valid at projected <11.5%
  // height. Find a legitimate currently-working subject, no invented labor.
  let chosen=null;
  for(const site of selection.sites.filter(s=>s.remaining>.35)
   .sort((a,b)=>b.remaining-a.remaining).slice(0,8)){
   const before=await page.evaluate(({x,z})=>{
    const g=window.__tinyKingdom;
    g.setCamera({focus:[x,z],yaw:.55,pitch:.85,zoom:18});
    g.setWorkingSkinEnabledForTesting(true);
    return g.getFrameProfile().totalFrames;
   },site);
   await page.waitForFunction(n=>
    window.__tinyKingdom.getFrameProfile().totalFrames>n,
    before,{timeout:125000});
   const audit=await page.evaluate(()=>
    window.__tinyKingdom.getForegroundSkinAudit());
   if(audit.realWorkers>0){
    chosen={site,audit};
    break;
   }
  }
  expect(chosen,'Physical camera should expose at least one real small detailed worker')
   .not.toBeNull();
  expect(chosen.audit.jointDraws).toBeGreaterThan(0);
  const startSnapshot=await page.evaluate(()=>
   window.__tinyKingdom.exportSnapshot());
  const camera={focus:[chosen.site.x,chosen.site.z],
   yaw:.55,pitch:.85,zoom:18};
  const sample=async enabled=>{
   const prior=await page.evaluate(({snapshot,enabled,camera})=>{
    const g=window.__tinyKingdom;
    g.setSpeed(0);g.restoreSnapshot(snapshot);
    g.setCamera(camera);
    g.setWorkingSkinEnabledForTesting(enabled);
    return g.getFrameProfile().totalFrames;
   },{snapshot:startSnapshot,enabled,camera});
   await page.waitForFunction(n=>window.__tinyKingdom
    .getFrameProfile().totalFrames>n,prior,{timeout:125000});
   await info.attach('w128-'+(enabled?'gpu-full-detail':'cpu-original')+
    '-initial-'+viewport.width,
    {body:await page.screenshot(),contentType:'image/png'});
   const sequence=[];
   for(let i=0;i<5;i++){
    const oldFrame=await page.evaluate(()=>{
     const g=window.__tinyKingdom,n=g.getFrameProfile().totalFrames;
     g.step(1/30);return n;
    });
    await page.waitForFunction(n=>window.__tinyKingdom
     .getFrameProfile().totalFrames>n,oldFrame,{timeout:125000});
    if(i===4)await info.attach('w128-'+(enabled?'gpu':'cpu')+
     '-moving-worker-'+viewport.width,{body:await page.screenshot(),
     contentType:'image/png'});
    sequence.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom,
      gl=document.getElementById('world').getContext('webgl');
     return {checksum:g.exportSnapshot().checksum,
      population:g.metrics().citizens,buildings:g.metrics().buildings,
      working:g.getActiveWorksites().map(s=>s.citizen).sort(),
      full:g.getForegroundResidentAudit(),
      skin:g.getForegroundSkinAudit(),
      geometry:g.getGeometryAudit(),
      triangles:g.renderStats().lastFrameTriangles,
      glError:gl?.getError()??-1,
      cpu:g.getFrameProfile().stages,
      gpu:g.getGpuFrameTimerAudit()};
    }));
   }
   return {snapshot:await page.evaluate(()=>
    window.__tinyKingdom.exportSnapshot()),sequence};
  };
  const cpu=await sample(false),gpu=await sample(true);
  expect(JSON.stringify(gpu.snapshot)).toBe(JSON.stringify(cpu.snapshot));
  expect(gpu.sequence.map(x=>x.checksum)).toEqual(
   cpu.sequence.map(x=>x.checksum));
  expect(gpu.sequence.map(x=>x.population)).toEqual(
   cpu.sequence.map(x=>x.population));
  expect(gpu.sequence.map(x=>x.buildings)).toEqual(
   cpu.sequence.map(x=>x.buildings));
  expect(gpu.sequence.map(x=>x.working)).toEqual(
   cpu.sequence.map(x=>x.working));
  for(let i=0;i<gpu.sequence.length;i++){
   const current=gpu.sequence[i],original=cpu.sequence[i];
   expect(current.triangles).toBe(original.triangles);
   expect(current.triangles).toBeLessThan(160000);
   expect(current.geometry.totalTriangles).toBe(original.geometry.totalTriangles);
   expect(current.glError).toBe(0);
   expect(current.skin.realWorkers).toBeGreaterThan(0);
   expect(current.skin.jointDraws).toBeGreaterThan(0);
   expect(current.skin.jointFloats).toBeLessThanOrEqual(
    current.skin.maxMeshFloats/10);
   expect(current.skin.jointBuffers).toBeLessThanOrEqual(1);
   expect(current.skin.followedAndLargeWorkerCPUContactsPreserved).toBe(true);
   expect(current.skin.deliveryAndMarketUnloadingOriginalHandsPreserved).toBe(true);
   expect(original.skin.realWorkers).toBe(0);
  }
  await info.attach('w128-original-detailed-moving-worker-'+viewport.width,
   {body:Buffer.from(JSON.stringify({source:info.project.name,viewport,
    site:chosen.site,initial:chosen.audit,cpu:cpu.sequence,
    gpu:gpu.sequence,noPhysicalGpuClaim:true},null,2)),
   contentType:'application/json'});
  expect(errors).toEqual([]);
 });
}
