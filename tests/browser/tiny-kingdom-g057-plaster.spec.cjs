'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G057 plaster has its own real GPU material and rain-streak shader without altering the kingdom',async({page})=>{
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getMaterialSwatchAudit));
 await page.waitForFunction(()=>window.__tinyKingdom.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const surface=g.getMaterialSystem(),swatches=g.getMaterialSwatchAudit();
  const geometry=g.getGeometryAudit();
  const gl=document.getElementById('world').getContext('webgl');
  let source='';
  if(gl){
   const program=gl.getParameter(gl.CURRENT_PROGRAM);
   for(const shader of program?(gl.getAttachedShaders(program)||[]):[]){
    if(gl.getShaderParameter(shader,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER)
     source=gl.getShaderSource(shader)||'';
   }
  }
  return {surface,swatches,geometry,source,hasGPU:!!gl,
    authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(result.surface.vertexStride).toBe(10);
 expect(result.surface.materials.slice(0,9)).toEqual(['GENERAL','GRASS','WATER','ROAD','FOLIAGE','STONE','WOOD','ROOF','PLASTER']);
 // G071 extends the append-only GPU material table; existing plaster ID 8 remains stable.
 expect(result.surface.materials.slice(9,11)).toEqual(['WINDOW_GLOW','LANTERN_GLOW']);
 expect(result.surface.surfaceShaderVersion).toBe('procedural-063');
 for(const name of ['housePlasterCream','housePlasterWarm','houseGablePlaster',
  'sidePlasterOak','sidePlasterAsh','sidePlasterLime','sidePlasterSand']){
  const row=result.swatches[name];
  expect(row.plaster).toBeGreaterThan(0);
  expect(row.plaster).toBe(row.total);
  expect(row.general+row.stone+row.roof).toBe(0);
 }
 for(const name of ['guildCloth','guildGoldTrim','marketCanvas','festivalGoldSilk']){
  const row=result.swatches[name];
  expect(row.general).toBe(row.total);
  expect(row.plaster+row.stone+row.roof).toBe(0);
 }
 expect(result.swatches.houseFoundation.stone).toBe(result.swatches.houseFoundation.total);
 expect(result.swatches.houseFoundation.plaster).toBe(0);
 if(result.hasGPU){
  expect(result.source).toContain('G057: limewashed Tudor plaster');
  expect(result.source).toContain('weatherWetness');
  expect(result.source).toContain('vMaterial>7.5&&vMaterial<8.5');
 }
 expect(result.geometry.totalTriangles).toBeGreaterThan(150000);
 expect(result.geometry.totalTriangles).toBeLessThan(160000);
 expect(result.geometry.static.invalidComponents+result.geometry.dynamic.invalidComponents).toBe(0);
 expect(result.authorityUnchanged).toBe(true);
 expect(faults).toEqual([]);
});
