'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W70 source contract: keep GPU elapsed timing separate from CPU wall time and
// software FPS; never synchronize to read GPU results or block genuine citizens.
for (const viewport of [{width:1024,height:640},{width:390,height:844}]) {
 test('W70 bounded nonblocking real GPU time audit at '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getGpuFrameTimerAudit(),snapshot:JSON.stringify(g.exportSnapshot()),
    cpu:g.getFrameProfile(),triangles:g.renderStats().lastFrameTriangles,
    citizens:g.metrics().citizens};
  });
  expect(initial.audit.kind).toBe('webgl-nonblocking-time-elapsed');
  expect(initial.audit.unit).toBe('milliseconds');
  expect(initial.audit.source).toBe('EXT_disjoint_timer_query');
  expect(['available','extension-unavailable','software-renderer','no-webgl','context-failed'])
   .toContain(initial.audit.status);
  expect(initial.audit.pending).toBeLessThanOrEqual(initial.audit.maxPending);
  expect(initial.audit.maxPending).toBeLessThanOrEqual(4);
  expect(initial.audit.samples).toBeLessThanOrEqual(initial.audit.maxSamples);
  expect(initial.audit.maxSamples).toBeLessThanOrEqual(48);
  expect(initial.audit.cpuWallFpsClaim).toBe(false);
  expect(initial.audit.hardwareFpsClaim).toBe(false);
  expect(initial.audit.blockingRead).toBe(false);
  expect(initial.cpu.kind).toBe('cpu-wall-submission');
  expect(initial.triangles).toBeGreaterThan(0);
  expect(initial.citizens).toBeGreaterThan(0);
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);for(let i=0;i<3;i++)g.step(1/30);
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    audit:g.getGpuFrameTimerAudit(),glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(after.snapshot).not.toBe(initial.snapshot);
  expect(after.audit.pending).toBeLessThanOrEqual(after.audit.maxPending);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w70',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w70/'+viewport.width+'-gpu-timing.json',
   JSON.stringify({viewport,rendered:initial.triangles,citizens:initial.citizens,
     cpu:initial.cpu,gpu:after.audit},null,2));
 });
}
