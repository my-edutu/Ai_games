'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G130 visual workstream: restore actual visible gameplay on 390px without
// sacrificing keyboard/scroll access to commands or changing real authority.
test('G130 mobile world view has one compact status row and one action row with complete command escape',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const facts=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const box=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();
   return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,display:getComputedStyle(e).display};};
  return {mode:document.body.dataset.command,brand:box('.top .brand'),
   tour:box('.world-tour'),weather:box('.top .pill'),ribbon:box('#world-ribbon'),
   bottom:box('.bottom'),command:box('#world-open-command'),
   viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
   unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(facts.mode).toBe('world');
 expect(facts.brand.display).toBe('none');
 expect(facts.tour.y).toBeLessThan(25);
 expect(facts.weather.y).toBeLessThan(25);
 expect(facts.ribbon.bottom).toBeLessThanOrEqual(122);
 expect(facts.bottom.height).toBeLessThanOrEqual(62);
 expect(facts.documentWidth).toBeLessThanOrEqual(facts.viewport);
 expect(facts.unchanged).toBe(true);
 await page.locator('#world-open-command').click();
 expect(await page.evaluate(()=>document.body.dataset.command)).toBe('command');
 const commands=await page.evaluate(()=>['#speed4','#save','#restore','#restart'].map(id=>{
  const el=document.querySelector(id);return !!el&&getComputedStyle(el).display!=='none';
 }));
 expect(commands).toEqual([true,true,true,true]);
 await page.locator('#command-toggle').click();
 expect(await page.evaluate(()=>document.body.dataset.command)).toBe('world');
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
