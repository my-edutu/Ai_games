'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W91 RED-first rendering-spine contract. THE EXACT physical windmill and
// deterministic climate particles must stay fully visible and animated
// without rebuilding their geometry in the citizen's per-frame JS stream.
// Software fallback remains equivalent, with no change to seeded authority.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W91 original windmill and climate VBOs remain resident '+viewport.width,async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {resident:g.getAmbientGpuResidencyAudit?.(),
    snapshot:JSON.stringify(g.exportSnapshot()),stats:g.renderStats(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(initial.resident).toBeTruthy();
  expect(initial.resident.staticWindmill).toBe(true);
  expect(initial.resident.weatherRainTriangles).toBe(200);
  expect(initial.resident.weatherSnowTriangles).toBe(240);
  expect(initial.resident.maxWeatherBuffers).toBe(2);
  expect(initial.resident.weatherUploads).toBe(2);
  expect(initial.resident.noAuthorityChanges).toBe(true);
  const movement=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const before=JSON.stringify(g.exportSnapshot());
   const probes=['rain','snow'].flatMap(kind=>[0,17,99].map(index=>
    ({kind,index,at0:g.getWeatherVertexMotionProbe(kind,index,0),
      at9:g.getWeatherVertexMotionProbe(kind,index,9.4)})));
   const after=JSON.stringify(g.exportSnapshot());
   return {probes,unchanged:before===after,
    audit:g.getAmbientGpuResidencyAudit(),
    errors:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(movement.unchanged).toBe(true);
  expect(movement.probes.every(p=>Number.isFinite(p.at9.y)&&
   Number.isFinite(p.at9.z)&&p.at9.y>=0.3&&p.at9.y<11.8&&
   (p.kind==='rain'||Math.abs(p.at9.z-p.at0.z)<=.71))).toBe(true);
  expect(movement.audit.weatherUploads).toBe(2);
  expect(movement.errors).toBe(0);
  expect(initial.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  expect(initial.snapshot).toBeTruthy();
  await testInfo.attach('W91-real-resident-ambient-'+viewport.width+'px',
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
