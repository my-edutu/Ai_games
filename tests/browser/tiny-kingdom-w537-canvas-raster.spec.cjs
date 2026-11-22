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
 await info.attach('original-day1-390px-no-WebGL.png',{
  body:await page.screenshot(),contentType:'image/png'});
 await info.attach('original-day1-390px-no-WebGL.json',{
  body:Buffer.from(JSON.stringify({sourceSha:process.env.GITHUB_SHA||'local',
   hardwareFps:'NOT MEASURED',independentCritics:'NOT PROVEN',...state},null,2)),
  contentType:'application/json'});
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
