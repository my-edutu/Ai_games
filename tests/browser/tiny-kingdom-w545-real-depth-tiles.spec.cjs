'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W545 actual 390px paused physical settlement pixels are identical with genuine static depth-tile occlusion on/off',async({page},info)=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(['webgl','experimental-webgl','webgl2'].includes(kind))return null;
   return original.call(this,kind,...args);
  };
 });
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getCanvasFallbackRasterAudit?.().draws>=2,null,{timeout:145000});
 await page.locator('#pause').click();
 const camera={yaw:.35,pitch:.66,zoom:29,focus:[0,0]};
 async function record(disabled,name){
  const draws=await page.evaluate(({disabled,camera})=>{
   globalThis.__tinyKingdomDisableStaticDepthTiles=disabled;
   const g=window.__tinyKingdom,n=g.getCanvasFallbackRasterAudit().draws;
   g.setCamera(camera);
   return n;
  },{disabled,camera});
  await page.waitForFunction(n=>window.__tinyKingdom.getCanvasFallbackRasterAudit().draws>n,draws,{timeout:30000});
  const data=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {pixels:document.querySelector('#world').toDataURL('image/png'),
    audit:g.getCanvasFallbackRasterAudit(),snapshot:g.exportSnapshot().checksum,
    metrics:g.metrics(),scroll:document.documentElement.scrollWidth};
  });
  const folder='artifacts/tiny-kingdom-w545';fs.mkdirSync(folder,{recursive:true});
  const image=Buffer.from(data.pixels.split(',')[1],'base64');
  fs.writeFileSync(path.join(folder,name+'.png'),image);
  delete data.pixels;
  fs.writeFileSync(path.join(folder,name+'.json'),
   JSON.stringify({sourceSha:process.env.GITHUB_SHA||'local',device:'GitHub hosted Chromium no-WebGL Canvas2D',
    hardwareFps:'NOT MEASURED',...data},null,2));
  await info.attach(name+'.png',{body:image,contentType:'image/png'});
  return {image,data};
 }
 const off=await record(true,'depth-tiles-disabled');
 const on=await record(false,'depth-tiles-enabled');
 expect(on.data.metrics.citizens).toBeGreaterThan(0);
 expect(on.data.metrics.buildings).toBeGreaterThan(0);
 expect(on.data.scroll).toBeLessThanOrEqual(390);
 expect(on.data.snapshot).toEqual(off.data.snapshot);
 expect(on.image.equals(off.image)).toBe(true);
 expect(on.data.audit.staticDepthTiles.exactDepthPreserved).toBe(true);
 expect(on.data.audit.staticDepthTiles.queries).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 console.log('W545 ACTUAL 390px SOFTWARE SCENE matched on/off pixels',JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',pixelIdentical:true,
   baseFrameCpuMs:off.data.audit.lastCpuWallMs,
   tileFrameCpuMs:on.data.audit.lastCpuWallMs,
   tiles:on.data.audit.staticDepthTiles,
   note:'two paused-frame samples are NOT sustained FPS or a hardware result'}));
});
