'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// A real WebGL/autonomy/mobile correctness floor, not an experience PASS.
test('G112 true after-dark worksite illumination preserves actual citizen authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<20000&&g.getActiveWorksites().length<2;i++)g.step(1/30);
 });
 const before=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 await page.locator('#workday-live').click();
 const observed=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  const shaders=gl.getAttachedShaders(gl.getParameter(gl.CURRENT_PROGRAM));
  const fragment=shaders.find(s=>gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER);
  const vertex=shaders.find(s=>gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.VERTEX_SHADER);
  return {authority:JSON.stringify(g.exportSnapshot()),live:g.getLiveWorkdayView(),citizen:g.getSelectedCitizen(),
   actor:g.getState().people.find(p=>p.name===g.getSelectedCitizen()),
   night:g.getObservedWorkLightProfile(23),day:g.getObservedWorkLightProfile(12),
   fragment:gl.getShaderSource(fragment),vertex:gl.getShaderSource(vertex),
   quality:g.renderQuality(),glError:gl.getError()};
 });
 expect(observed.authority).toBe(before);
 expect(observed.live.active).toBe(true);
 expect(observed.night.active).toBe(true);
 expect(observed.night.citizen).toBe(observed.citizen);
 expect(observed.night.provenance).toBe('selected-citizen-actual-worksite');
 expect(observed.night.strength).toBeGreaterThan(0);
 expect(observed.night.strength).toBeLessThanOrEqual(1);
 expect(observed.night.radius).toBe(5.5);
 expect(observed.night.x).toBeCloseTo(observed.actor.x-.63,7);
 expect(observed.night.z).toBeCloseTo(observed.actor.z+.45,7);
 expect(observed.day.active).toBe(false);
 expect(observed.day.strength).toBe(0);
 expect(observed.vertex).toContain('workLightPosition');
 expect(observed.fragment).toContain('if(groundAtlasFast>.5){');
 expect(observed.quality.materialNoise).toMatch(/bilinear-software|trilinear/);
 expect(observed.glError).toBe(0);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
  authority:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  glError:document.querySelector('#world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.width).toBeLessThanOrEqual(mobile.viewport);
 expect(mobile.authority).toBe(before);
 expect(mobile.glError).toBe(0);
 expect(errors).toEqual([]);
});
