'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// Same genuine seed/world and fixed-step shipments, not staged cargo or actors.
// GPU residence/fallback comparison is an engineering equivalence check only.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W99 original real freight track GPU parity, no duplicate neon market at '+viewport.width+'px',async({page})=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:110000});
  const advance=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let count=0;
   // Replaying the ACTUAL job schedule is the only source of wheel tracks.
   for(;count<120*24*30;count++){
    g.step(1/30);
    if(count%20===0&&g.getCourierTrailAudit().segments>=2)break;
   }
   return {found:g.getCourierTrailAudit().segments>=2,count,
    world:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens};
  });
  expect(advance.found).toBe(true);
  const frames=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setCourierTrailResidencyForTesting(true);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,frames,{timeout:110000});
  const resident=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getCourierTrailResidencyAudit(),geometry:g.getGeometryAudit(),
    triangles:g.renderStats().lastFrameTriangles,world:JSON.stringify(g.exportSnapshot()),
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(resident.audit.active).toBe(true);
  expect(resident.audit.buffers).toBe(1);
  expect(resident.audit.floats).toBeGreaterThan(0);
  expect(resident.audit.floats).toBeLessThanOrEqual(resident.audit.maxFloats);
  expect(resident.audit.renderedTriangles).toBeGreaterThan(0);
  expect(resident.geometry.totalTriangles).toBeLessThan(160000);
  expect(resident.geometry.dynamic.invalidComponents).toBe(0);
  expect(resident.gl).toBe(0);
  expect(resident.overflow).toBeLessThanOrEqual(0);
  const dir='artifacts/tiny-kingdom-w99';fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:dir+'/'+viewport.width+'-physical-market-resident.png'});
  const prev=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setCourierTrailResidencyForTesting(false);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prev,{timeout:110000});
  const fallback=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getCourierTrailResidencyAudit(),geometry:g.getGeometryAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    world:JSON.stringify(g.exportSnapshot()),
    gl:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(fallback.audit.active).toBe(false);
  expect(fallback.geometry.totalTriangles).toBe(resident.geometry.totalTriangles);
  expect(fallback.triangles).toBe(resident.triangles);
  expect(fallback.world).toBe(resident.world);
  expect(fallback.world).toBe(advance.world);
  expect(resident.audit.authorityModified).toBe(false);
  expect(fallback.gl).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:dir+'/'+viewport.width+'-physical-market-fallback.png'});
  fs.writeFileSync(dir+'/'+viewport.width+'-freight-parity.json',JSON.stringify({
   viewport,source:'genuine seeded courier wheel marks',advance,
   resident,fallback,errors},null,2));
 });
}
