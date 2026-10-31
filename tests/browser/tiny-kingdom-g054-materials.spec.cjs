'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G054 material relief is compiled, render-only, bounded and preserves the world snapshot',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getMaterialSystem));
 await page.locator('#pause').click();
 const evidence=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  const before=JSON.stringify(game.exportSnapshot());
  const materials=game.getMaterialSystem();
  const mesh=game.getGeometryAudit();
  const gl=document.getElementById('world').getContext('webgl');
  let liveFragment='';
  if(gl){
   const program=gl.getParameter(gl.CURRENT_PROGRAM);
   if(program){
    const shaders=gl.getAttachedShaders(program)||[];
    for(const shader of shaders)if(gl.getShaderParameter(shader,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER){
     liveFragment=gl.getShaderSource(shader)||'';
    }
   }
  }
  game.setCamera({focus:[0,0],yaw:.82,pitch:.51,zoom:21});
  return {materials,mesh,liveFragment,hasGPU:!!gl,
   authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
 });
 expect(evidence.materials.surfaceShaderVersion).toBe('procedural-063');
 expect(evidence.materials.materials).toContain('PLASTER');
 expect(evidence.materials.vertexStride).toBe(10);
 if(evidence.hasGPU){
  expect(evidence.liveFragment).toContain('G054 terrain relief');
  expect(evidence.liveFragment).toContain('G054 dressed stone');
  expect(evidence.liveFragment).toContain('G054 roof tiling');
  expect(evidence.liveFragment).toContain('G057: limewashed Tudor plaster');
 }
 expect(evidence.mesh.totalTriangles).toBeLessThan(160000);
 for(const part of [evidence.mesh.static,evidence.mesh.dynamic]){
  expect(part.aligned).toBe(true);
  expect(part.invalidComponents).toBe(0);
  expect(part.invalidNormals).toBe(0);
  expect(part.invalidColors).toBe(0);
  expect(part.outOfBounds).toBe(0);
 }
 expect(evidence.authorityUnchanged).toBe(true);
 expect(errors).toEqual([]);
});
