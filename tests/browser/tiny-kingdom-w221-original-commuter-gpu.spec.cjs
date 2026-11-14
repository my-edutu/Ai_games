'use strict';
// W221 real original town, TRUE autonomous travelers; no injected citizen
// actions or fabricated shipments. Software WebGL ≠ consumer hardware FPS.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W221 authentic live distant commuters retain and animate GPU joints '+width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   g.setWorkingSkinEnabledForTesting(true);
   g.setCamera({focus:[0,0],yaw:.54,pitch:.78,zoom:80});
  });
  // Wait for actual original villagers to begin an authorized route.
  // Read ONLY the existing simulation and GPU audits, never patch state.
  const attempts=[];
  for(let j=0;j<12;j++){
   const before=await page.evaluate(()=>{
    const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
    for(let k=0;k<180;k++)g.step(1/30);
    return frame;
   });
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile()
    .totalFrames>n,before,{timeout:125000});
   const audit=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {commuter:g.getResidentCommuterAudit(),
     authority:g.exportSnapshot().checksum,
     population:g.getState().people.map(p=>({name:p.name,activity:p.activity})),
     triangles:g.renderStats().lastFrameTriangles};
   });
   attempts.push({time: j*180/30,skin:audit.commuter.skinnedCommuters,
    names:audit.population.filter(p=>/^(Traveling to |Exploring the valley$|Returning home at dusk$)/.test(p.activity)),
    triangles:audit.triangles});
   if(audit.commuter.skinnedCommuters>0&&audit.commuter.gpuSkinDraws>0)break;
  }
  await info.attach('w221-true-commuter-eligibility-'+width,{
   body:Buffer.from(JSON.stringify(attempts,null,2)),contentType:'application/json'});
  const active=await page.evaluate(()=>window.__tinyKingdom.getResidentCommuterAudit());
  expect(active.skinnedCommuters,'actual autonomous distant traveler required').toBeGreaterThan(0);
  expect(active.gpuSkinDraws).toBeGreaterThan(0);
  expect(active.jointBufferCount).toBe(1);
  expect(active.jointBytes).toBeLessThanOrEqual(active.maxFloats/10*4);
  const saved=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  const motion=async mode=>{
   const start=await page.evaluate(({saved,mode})=>{
    const g=window.__tinyKingdom;g.setSpeed(0);
    g.restoreSnapshot(saved);
    g.setCamera({focus:[0,0],yaw:.54,pitch:.78,zoom:80});
    g.setWorkingSkinEnabledForTesting(mode);
    return g.getFrameProfile().totalFrames;
   },{saved,mode});
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
    start,{timeout:125000});
   const trace=[];
   for(let i=0;i<5;i++){
    const before=await page.evaluate(()=>{
     const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
     for(let k=0;k<8;k++)g.step(1/30);
     return frame;
    });
    await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
     before,{timeout:125000});
    trace.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     return {checksum:g.exportSnapshot().checksum,
      names:g.getState().people.map(p=>p.name),buildings:g.metrics().buildings,
      resident:g.getResidentCommuterAudit(),
      triangles:g.renderStats().lastFrameTriangles,
      glError:document.getElementById('world').getContext('webgl')?.getError()??-1,
      overflow:document.documentElement.scrollWidth-innerWidth};
    }));
   }
   await info.attach('w221-'+(mode?'skinned':'cpu')+'-world-'+width,{
    body:await page.screenshot(),contentType:'image/png'});
   return {trace,final:await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())};
  };
  const cpu=await motion(false),gpu=await motion(true);
  expect(gpu.final,'GPU presentation must not alter the real saved world').toEqual(cpu.final);
  expect(gpu.trace.map(x=>x.checksum)).toEqual(cpu.trace.map(x=>x.checksum));
  expect(gpu.trace.map(x=>x.names)).toEqual(cpu.trace.map(x=>x.names));
  for(let i=0;i<gpu.trace.length;i++){
   expect(gpu.trace[i].buildings).toBe(cpu.trace[i].buildings);
   expect(gpu.trace[i].triangles).toBeLessThan(160000);
   expect(gpu.trace[i].glError).toBe(0);
   expect(gpu.trace[i].overflow).toBeLessThanOrEqual(0);
  }
  // Actor pose builds no longer increase on each advancing gait tick if
  // the original occupation/materials have not genuinely changed.
  const same= gpu.trace.filter((r,i)=>i&&r.resident.skinnedCommuters>0&&
   gpu.trace[i-1].resident.skinnedCommuters>0);
  if(same.length){
   const prev=gpu.trace[0].resident;
   expect(gpu.trace[gpu.trace.length-1].resident.reuses)
    .toBeGreaterThanOrEqual(prev.reuses);
  }
  await info.attach('w221-authentic-desktop-mobile-gpu-vs-cpu-'+width,{
   body:Buffer.from(JSON.stringify({width,attempts,
    cpu:cpu.trace,gpu:gpu.trace,physicalGpu:false,critic:false},null,2)),
   contentType:'application/json'});
  expect(errors).toEqual([]);
 });
}
