'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G086: low-LOD citizens must face their actual walking waypoint, just like
// detailed citizens. Heading is presentation-only; no authority or RNG edits.
test('G086 compact citizens turn their emitted geometry toward their waypoint at growth',async({page})=>{
 test.setTimeout(90000);
 const compact=html.split('function compactVillager(p){')[1]?.split('\nfunction villager(p){')[0]||'';
 expect(compact).toContain('const vertexStart=data.length;');
 expect(compact).toContain('const look=p.path?.length?p.path[0]:p.target;');
 expect(compact).toContain('Math.atan2(look[0]-x,look[1]-z)');
 expect(compact).toContain('for(let v=vertexStart;v<data.length;v+=10)');
 expect(compact).toContain('data[v+3]=co*nx+si*nz');
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>10000);
 await page.locator('#pause').click();
 const snapshot=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10*24*30;i++)g.step(1/30);
  return JSON.stringify(g.exportSnapshot());
 });
 await page.waitForFunction(()=>{
  const l=window.__tinyKingdom?.getVillageVisualLod();
  return l&&l.compactCitizens>0&&l.compactFacingCount===l.compactCitizens;
 },null,{timeout:30000});
 const audit=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.querySelector('#world').getContext('webgl');
  return {lod:g.getVillageVisualLod(),geometry:g.getGeometryAudit(),
   snapshot:JSON.stringify(g.exportSnapshot()),glError:gl?.getError()||0};
 });
 expect(audit.snapshot).toBe(snapshot);
 expect(audit.lod.compactFacingCount).toBe(audit.lod.compactCitizens);
 expect(audit.lod.compactFacingCount).toBeGreaterThan(0);
 expect(audit.lod.compactTurnedCitizens).toBeGreaterThan(0);
 expect(Number.isFinite(audit.lod.compactFacingVertexError)).toBe(true);
 expect(audit.lod.compactFacingVertexError).toBeLessThan(1e-7);
 expect(audit.geometry.totalTriangles).toBeLessThan(160000);
 expect(audit.geometry.dynamic.aligned).toBe(true);
 expect(audit.geometry.dynamic.invalidComponents).toBe(0);
 expect(audit.geometry.dynamic.invalidNormals).toBe(0);
 expect(audit.glError).toBe(0);
 expect(errors).toEqual([]);
});
