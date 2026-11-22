'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const dir='artifacts/tiny-kingdom-w387-home-shader';
fs.mkdirSync(dir,{recursive:true});
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W387 authentic unmodified home GPU render A/B '+viewport.width,async({page})=>{
  test.setTimeout(330000);
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error.message)));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:125000});
  const startFrame=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   g.setHomePartitionOverride(true);
   g.setCamera({focus:[1,3],yaw:.64,pitch:.49,zoom:23});
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,startFrame,{timeout:125000});
  const snapshot=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  const variants=[];
  for(const enabled of [false,true]){
   const frame=await page.evaluate(value=>{
    const g=window.__tinyKingdom;g.setResidentHomeShaderForTesting(value);
    return g.getFrameProfile().totalFrames;
   },enabled);
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,frame,{timeout:125000});
   const audit=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {snapshot:g.exportSnapshot(),metrics:g.metrics(),
     home:g.getHomePartitionAudit(),pass:g.getResidentHomeShaderAudit(),
     scene:g.renderStats(),glError:document.getElementById('world').getContext('webgl').getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   expect(audit.snapshot).toEqual(snapshot);
   expect(audit.home.activeHomes).toBe(audit.metrics.buildings-2);
   expect(audit.home.staleDrawn).toBe(0);
   expect(audit.pass.linked).toBe(true);
   expect(audit.pass.enabled).toBe(enabled);
   expect(audit.glError).toBe(0);
   expect(audit.overflow).toBeLessThanOrEqual(0);
   const file=viewport.width+'-'+(enabled?'specialist':'original');
   await page.screenshot({path:dir+'/'+file+'.png'});
   fs.writeFileSync(dir+'/'+file+'.json',JSON.stringify({...audit,snapshot:'redacted'},null,2));
   variants.push(audit);
  }
  expect(variants[1].pass.specializedDrawFrames).toBeGreaterThan(0);
  expect(variants[1].pass.specializedDrawTriangles).toBeGreaterThan(0);
  expect(variants[1].scene.lastFrameTriangles).toBe(variants[0].scene.lastFrameTriangles);
  expect(variants[1].metrics).toEqual(variants[0].metrics);
  expect(errors).toEqual([]);
 });
}
