'use strict';
// W140: source-matched WebGL driver-bindings A/B on real Day-1 and mobile,
// without changing population, jobs, camera identity or authoritative state.
// SwiftShader cannot prove hardware VAO speed: mark unsupported explicitly.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W140 original village and touch-size view stay identical with hardware VAOs or legacy pointers',
 async({page},info)=>{
 test.setTimeout(220000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:150000});
  await page.locator('#pause').click();
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setCamera({focus:[0,3],yaw:.85,pitch:.52,zoom:20});
   return JSON.stringify(g.exportSnapshot());
  });
  const samples=[];
  for(const mode of [false,true,false]){
   const prev=await page.evaluate(mode=>{
    const g=window.__tinyKingdom;
    const ok=g.setGeometryVaoEnabledForTesting(mode);
    if(!ok&&mode)return {unsupported:true,prior:g.getFrameProfile().totalFrames};
    return {unsupported:false,prior:g.getFrameProfile().totalFrames};
   },mode);
   await page.waitForFunction(p=>window.__tinyKingdom.getFrameProfile().totalFrames>p,
    prev.prior,{timeout:150000});
   const current=await page.evaluate(()=>{
    const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
    return {world:JSON.stringify(g.exportSnapshot()),vao:g.getGeometryVaoAudit(),
     triangles:g.getGeometryAudit().totalTriangles,
     citizens:g.metrics().citizens,
     scene:g.getScenicCullReferenceAudit(),
     frame:g.getFrameProfile(),glError:gl?.getError()??-1,
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   await info.attach('W140-'+viewport.width+'-'+(mode?'vao':'legacy')+'.png',
     {body:await page.screenshot(),contentType:'image/png'});
   samples.push({...current,requested:mode,unsupported:prev.unsupported});
   expect(current.world).toBe(initial);
   expect(current.scene.missingChunks).toBe(0);
   expect(current.scene.falseVisibleChunks).toBe(0);
   expect(current.glError).toBe(0);
   expect(current.triangles).toBeLessThan(160000);
   expect(current.overflow).toBeLessThanOrEqual(0);
   expect(current.vao.residentBindings).toBeLessThanOrEqual(24);
   expect(current.vao.authorityChanged).toBe(false);
   if(!prev.unsupported)expect(current.vao.enabled).toBe(mode);
  }
  expect(samples.map(s=>s.citizens)).toEqual([samples[0].citizens,samples[0].citizens,samples[0].citizens]);
  expect(samples.map(s=>s.triangles)).toEqual([samples[0].triangles,samples[0].triangles,samples[0].triangles]);
  await info.attach('W140-'+viewport.width+'-bindings.json',
    {body:Buffer.from(JSON.stringify({viewport,samples,
      performanceVerdict:'NOT PROVEN - separate matched physical GPU device required',
      independentCritics:'NOT AVAILABLE',
      experienceMilestone:'NOT PROVEN'},null,2)),contentType:'application/json'});
 }
 expect(errors).toEqual([]);
});
