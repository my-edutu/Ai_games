'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Gauntlet 045 ground radiance tracks simulated daylight without altering authority',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1440,height:900});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const measured=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const dawn=g.getLightingProfile(7),noon=g.getLightingProfile(12),night=g.getLightingProfile(23);
  const realtime=g.getLightingProfile(g.getState().state.t);
  const gl=document.getElementById('world').getContext('webgl');
  const program=gl&&gl.getParameter(gl.CURRENT_PROGRAM);
  const uniform=program&&gl.getUniformLocation(program,'sunStrength');
  const gpuSun=uniform===null||!gl?null:gl.getUniform(program,uniform);
  return {dawn,noon,night,realtime,gpuSun,webgl:g.renderer()==='webgl',
   authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(measured.noon.solar).toBeGreaterThan(.95);
 expect(measured.dawn.solar).toBeGreaterThan(.06);
 expect(measured.dawn.solar).toBeLessThan(.50);
 expect(measured.night.solar).toBe(0);
 expect(measured.noon.ambientBlend).toBeGreaterThan(measured.dawn.ambientBlend);
 expect(measured.dawn.ambientBlend).toBeGreaterThan(measured.night.ambientBlend);
 if(measured.webgl){
  expect(measured.gpuSun).not.toBeNull();
  expect(Math.abs(measured.gpuSun-measured.realtime.solar)).toBeLessThan(.0001);
 }
 expect(measured.authorityUnchanged).toBe(true);
 expect(errors).toEqual([]);
});

test('Gauntlet 045 granary and cultivated fields exclude foreground trees without changing forest RNG',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.getFarmsteadStats().stalks===668);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const farm=g.getFarmsteadStats(),clearance=g.getFarmTreeClearanceStats();
  g.setCamera({focus:[29,-5],yaw:3.05,pitch:.50,zoom:18});
  const moved=g.getFarmTreeClearanceStats();
  return {farm,clearance,moved,sameAuthority:before===JSON.stringify(g.exportSnapshot()),
    mesh:g.getGeometryAudit()};
 });
 expect(result.farm.stalks).toBe(668);
 expect(result.farm.rows).toBe(22);
 expect(result.farm.granaries).toBe(1);
 expect(result.clearance.farmTreeOverlap).toBeGreaterThan(0);
 expect(result.clearance.renderedFarmTreeOverlap).toBe(0);
 expect(result.moved).toEqual(result.clearance);
 expect(result.sameAuthority).toBe(true);
 for(const mesh of [result.mesh.static,result.mesh.dynamic]){
  expect(mesh.invalidComponents).toBe(0);
  expect(mesh.invalidNormals).toBe(0);
  expect(mesh.invalidColors).toBe(0);
  expect(mesh.outOfBounds).toBe(0);
 }
 expect(errors).toEqual([]);
});
