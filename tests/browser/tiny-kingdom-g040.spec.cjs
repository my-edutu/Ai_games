'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('Gauntlet 040 tailored medieval garment profiles are tapered, distinct and render-only',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const profiles=g.getCitizenProfiles().map((_,i)=>g.getGarmentProfile(i));
  const audit=g.getGeometryAudit();
  return {profiles,audit,unchanged:JSON.stringify(g.exportSnapshot())===before};
 });
 expect(result.profiles).toHaveLength(12);
 expect(new Set(result.profiles.map(p=>p.style+':'+p.rings.map(r=>r.rx.toFixed(3)).join(','))).size).toBeGreaterThan(5);
 for(const p of result.profiles){
  expect(p.rings).toHaveLength(5);
  expect(p.panelCount).toBe(8);
  expect(p.surfaceTriangles).toBe(104);
  expect(p.rings[0].rx).toBeGreaterThan(p.rings[2].rx);
  expect(p.rings[3].rx).toBeGreaterThan(p.rings[2].rx);
  expect(p.rings[4].rx).toBeLessThan(p.rings[3].rx);
  for(let i=1;i<p.rings.length;i++)expect(p.rings[i].y).toBeGreaterThan(p.rings[i-1].y);
  expect(Math.abs(p.hemSway)).toBeLessThanOrEqual(.026);
 }
 expect(result.audit.dynamic.aligned).toBe(true);
 expect(result.audit.dynamic.invalidComponents).toBe(0);
 expect(result.audit.dynamic.invalidNormals).toBe(0);
 expect(result.audit.dynamic.invalidColors).toBe(0);
 expect(result.audit.dynamic.outOfBounds).toBe(0);
 expect(result.audit.dynamic.triangles).toBeLessThan(32000);
 expect(result.unchanged).toBe(true);
 expect(errors).toEqual([]);
});
