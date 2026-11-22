'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W537 actual 390px original complete village on real no-WebGL Canvas2D',async({page},info)=>{
 test.setTimeout(160000);
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  const actual=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(['webgl','experimental-webgl','webgl2'].includes(kind))return null;
   return actual.call(this,kind,...args);
  };
 });
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getCanvasFallbackRasterAudit?.().draws>=2,
  null,{timeout:125000});
 const state=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {source:'real-original-390px-canvas2d',canvas:g.getCanvasFallbackRasterAudit(),
   graphics:g.renderQuality(),citizens:g.metrics().citizens,buildings:g.metrics().buildings,
   geometry:g.renderStats(),scrollWidth:document.documentElement.scrollWidth,
   worldChecksum:g.exportSnapshot().checksum};
 });
 // Persist real pixels and original source audit even for SUCCESSFUL tests:
 // Playwright may discard passing attachments from its test-results folder.
 const artifact='artifacts/tiny-kingdom-w544';
 fs.mkdirSync(artifact,{recursive:true});
 const frame=await page.screenshot();
 const audit=Buffer.from(JSON.stringify({sourceSha:process.env.GITHUB_SHA||'local',
  hardwareFps:'NOT MEASURED',independentCritics:'NOT PROVEN',...state},null,2));
 fs.writeFileSync(path.join(artifact,'original-390px-day1.png'),frame);
 fs.writeFileSync(path.join(artifact,'original-390px-day1.json'),audit);
 console.log('W544 REAL 390px Canvas2D source audit',JSON.stringify({
  originalSubmittedTriangles:state.canvas.submitted,
  originalActuallyVisibleTriangles:state.canvas.visible,
  spatialCells:state.canvas.staticSpatialCells,
  originalPainterCpuWallMs:state.canvas.lastCpuWallMs,
  device:'GitHub Actions Chromium software Canvas2D, NOT a physical GPU'}));
 await info.attach('original-day1-390px-no-WebGL.png',{
  body:frame,contentType:'image/png'});
 await info.attach('original-day1-390px-no-WebGL.json',{
  body:audit,contentType:'application/json'});
 expect(state.graphics.tier).toBe('canvas2d');
 expect(state.canvas.enabled).toBe(true);
 expect(state.canvas.visible).toBeGreaterThan(0);
 expect(state.canvas.offscreen).toBeGreaterThan(0);
 expect(state.canvas.submitted).toBeGreaterThan(state.canvas.visible);
 expect(state.citizens).toBeGreaterThan(0);
 expect(state.buildings).toBeGreaterThan(0);
 expect(state.scrollWidth).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
});
