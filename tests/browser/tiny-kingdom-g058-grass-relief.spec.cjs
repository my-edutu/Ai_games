'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G058 real grass normal relief is world-anchored, range-faded, material-isolated and replay-safe',async({page})=>{
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const r=await page.evaluate(()=>{
  const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
  const gl=document.getElementById('world').getContext('webgl');
  let source='';
  if(gl){const program=gl.getParameter(gl.CURRENT_PROGRAM);
   const frag=(gl.getAttachedShaders(program)||[]).find(s=>
    gl.getShaderParameter(s,gl.SHADER_TYPE)===gl.FRAGMENT_SHADER);
   if(frag)source=gl.getShaderSource(frag)||'';
  }
  game.setCamera({focus:[-21,5],zoom:19,pitch:.48,yaw:.7});
  return {materials:game.getMaterialSystem(),mesh:game.getGeometryAudit(),
   before,after:JSON.stringify(game.exportSnapshot()),hasGPU:!!gl,source};
 });
 expect(r.materials.surfaceShaderVersion).toBe('procedural-063');
 expect(r.materials.materials.slice(0,9)).toEqual(['GENERAL','GRASS','WATER','ROAD','FOLIAGE','STONE','WOOD','ROOF','PLASTER']);
 expect(r.materials.materials.slice(9,11)).toEqual(['WINDOW_GLOW','LANTERN_GLOW']);
 expect(r.mesh.totalTriangles).toBeGreaterThan(150000);
 expect(r.mesh.totalTriangles).toBeLessThan(160000);
 for(const mesh of [r.mesh.static,r.mesh.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents+mesh.invalidColors+mesh.invalidNormals+mesh.outOfBounds).toBe(0);
 }
 expect(r.after).toBe(r.before);
 if(r.hasGPU){
  const grass=r.source.split('if(vMaterial>0.5&&vMaterial<1.5)')[1]?.split('}else if(vMaterial>1.5&&vMaterial<2.5)')[0]||'';
  const road=r.source.split('}else if(vMaterial>2.5&&vMaterial<3.5)')[1]?.split('}else if(vMaterial>3.5&&vMaterial<4.5)')[0]||'';
  expect(grass).toContain('vec3 microNormal=normalize(');
  expect(grass).toContain('detailFade=1.-smoothstep(');
  expect(grass).toContain('fineLight/baseLight');
  expect(grass).toContain('tuftMask=1.-smoothstep(');
  expect(grass).toContain('hash3(vec3(cellID,11.))');
  expect(grass).not.toContain('strandX=sin(');
  expect(grass).toContain('vWorld.xz');
  expect(road).not.toContain('microNormal');
 }
 expect(faults).toEqual([]);
});
