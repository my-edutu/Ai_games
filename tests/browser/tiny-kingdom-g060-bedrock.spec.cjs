'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G060 exposed highlands use world-anchored stone beds without touching authority or road materials',async({page})=>{
 const sourceGrass=html.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
 const sourceRoad=html.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[1]?.split('}else if(vMaterial>3.5&&vMaterial<4.5)')[0]||'';
 expect(sourceGrass).toContain('float rockShelfNoise=');
 expect(sourceGrass).toContain('float mineralBedding=');
 expect(sourceGrass).toContain('float exposedBedrock=');
 expect(sourceGrass).toContain('float screeGrain=');
 expect(sourceGrass).toContain('vec3 exposedStone=');
 expect(sourceGrass).toContain('vWorld.y');
 expect(sourceGrass).toContain('rock');
 expect(sourceRoad).not.toContain('rockShelfNoise');
 const faults=[];page.on('pageerror',err=>faults.push(err.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const game=window.__tinyKingdom,original=JSON.stringify(game.exportSnapshot());
  const gl=document.getElementById('world').getContext('webgl');
  let active='';
  if(gl){
   const program=gl.getParameter(gl.CURRENT_PROGRAM);
   const fragment=(gl.getAttachedShaders(program)||[]).find(s=>
    gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER);
   active=fragment?gl.getShaderSource(fragment):'';
  }
  game.setCamera({focus:[-23,7],zoom:20,pitch:.47,yaw:.6});
  return {gl:!!gl,active,geometry:game.getGeometryAudit(),
   before:original,after:JSON.stringify(game.exportSnapshot())};
 });
 if(result.gl){
  const activeGrass=result.active.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
  expect(activeGrass).toContain('float rockShelfNoise=');
  expect(activeGrass).toContain('float exposedBedrock=');
 }
 expect(result.before).toBe(result.after);
 expect(result.geometry.totalTriangles).toBeLessThan(160000);
 for(const mesh of [result.geometry.static,result.geometry.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents+mesh.invalidNormals+mesh.invalidColors+mesh.outOfBounds).toBe(0);
 }
 expect(faults).toEqual([]);
});
