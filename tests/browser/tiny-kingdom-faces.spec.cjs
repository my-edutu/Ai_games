'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('Gauntlet 041 sculpted facial anatomy is bounded and render-only',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const profiles=g.getCitizenProfiles().map((_,i)=>g.getFaceProfile(i));
  return {profiles,geometry:g.getGeometryAudit(),unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(result.profiles).toHaveLength(12);
 expect(new Set(result.profiles.map(p=>[p.jawWidth,p.cheekWidth,p.eyeSpacing,p.noseProjection].map(v=>v.toFixed(4)).join(':'))).size).toBe(12);
 for(const face of result.profiles){
  expect(face.rings).toHaveLength(7);
  expect(face.segments).toBe(12);
  expect(face.meshTriangles).toBe(156);
  expect(face.jawWidth).toBeGreaterThan(.13);
  expect(face.jawWidth).toBeLessThan(face.cheekWidth);
  expect(face.eyeSpacing).toBeGreaterThan(.065);
  expect(face.eyeSpacing).toBeLessThan(face.cheekWidth*.60);
  expect(face.noseProjection).toBeGreaterThan(.04);
  expect(face.noseProjection).toBeLessThan(.10);
  expect(face.earHeight).toBeGreaterThan(.085);
  expect(face.earHeight).toBeLessThan(.14);
  expect(face.rings.every(r=>[r.y,r.rx,r.rz,r.z].every(Number.isFinite)&&r.rx>0&&r.rz>0)).toBe(true);
  for(let i=1;i<face.rings.length;i++)expect(face.rings[i].y).toBeGreaterThan(face.rings[i-1].y);
 }
 expect(result.geometry.dynamic.aligned).toBe(true);
 expect(result.geometry.dynamic.invalidNormals).toBe(0);
 expect(result.geometry.dynamic.invalidComponents).toBe(0);
 expect(result.geometry.dynamic.invalidColors).toBe(0);
 expect(result.unchanged).toBe(true);
 expect(errors).toEqual([]);
});
