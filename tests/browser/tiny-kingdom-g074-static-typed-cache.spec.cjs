'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G074 WebGL scenic cache does not duplicate a 130k-triangle JS array before GPU upload',()=>{
 const start=html.indexOf('scenicMeshCache=data.slice();scenicMeshKey=')>=0?
  html.indexOf('scenicMeshCache=data.slice();scenicMeshKey='):
  html.indexOf('scenicMeshCache=gpuAvailable?new Float32Array(data):data.slice();');
 const end=html.indexOf('data=gpuAvailable?[]:scenicMeshCache.slice();',start);
 expect(start).toBeGreaterThan(0);
 expect(end).toBeGreaterThan(start);
 const build=html.slice(start,end);
 expect(build).toMatch(/scenicMeshCache\s*=\s*gpuAvailable\s*\?\s*new Float32Array\(data\)\s*:\s*data\.slice\(\)/);
 expect(build).toMatch(/const packed=packSpatialScenery\(scenicMeshCache\)/);
 expect(build).toMatch(/gl\.bufferData\(gl\.ARRAY_BUFFER,\s*packed\.vertices,\s*gl\.STATIC_DRAW\)/);
 expect(build).not.toMatch(/new Float32Array\(scenicMeshCache\)/);
});

test('G074 actual WebGL static cache uses compact Float32 storage, keeps mesh integrity and replay',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,cache=g.getScenicMeshStorage?.();
  const before=JSON.stringify(g.exportSnapshot());
  const audit=g.getGeometryAudit(),stats=g.renderStats();
  const gl=document.getElementById('world').getContext('webgl');
  return {cache,audit,stats,replay:JSON.stringify(g.exportSnapshot())===before,
   glError:gl?.getError()||0};
 });
 expect(result.cache).toMatchObject({kind:'Float32Array',bytesPerFloat:4});
 expect(result.cache.floats).toBe(result.audit.static.floats);
 expect(result.cache.bytes).toBe(result.cache.floats*4);
 expect(result.audit.totalTriangles).toBeGreaterThan(140000);
 expect(result.audit.totalTriangles).toBeLessThan(160000);
 expect(result.stats.staticGpuUploads).toBeGreaterThan(0);
 for(const stage of ['static','dynamic']){
  expect(result.audit[stage].aligned).toBe(true);
  for(const field of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(result.audit[stage][field]).toBe(0);
 }
 expect(result.replay).toBe(true);
 expect(result.glError).toBe(0);
 expect(errors).toEqual([]);
});
