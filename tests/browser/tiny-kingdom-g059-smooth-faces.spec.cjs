'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G059 face-ring vertices use continuous normalized sculptural normals without changing the civilization',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const r=await page.evaluate(()=>{
  const game=window.__tinyKingdom,before=JSON.stringify(game.exportSnapshot());
  const profiles=game.getCitizenProfiles().map((_,i)=>({
   face:game.getFaceProfile(i),normals:game.getFaceNormalProfile(i)
  }));
  game.setCamera({focus:[-4,-3],zoom:12.8,pitch:.76,yaw:.3});
  return {profiles,geometry:game.getGeometryAudit(),before,
   after:JSON.stringify(game.exportSnapshot())};
 });
 expect(r.profiles.length).toBeGreaterThanOrEqual(12);
 for(const {face,normals} of r.profiles){
  expect(face.meshTriangles).toBe(156);
  expect(normals).toHaveLength(face.rings.length);
  for(const ring of normals){
   expect(ring).toHaveLength(face.segments);
   for(const n of ring){
    expect(n).toHaveLength(3);
    expect(n.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...n)).toBeCloseTo(1,6);
   }
  }
  // Open ring normals face outward, whereas the jaw and crown have
  // opposite vertical slopes. This would fail for flat per-triangle normals.
  expect(normals[0][0][1]).toBeLessThan(-.05);
  expect(normals.at(-1)[0][1]).toBeGreaterThan(.05);
  expect(normals[3][0][2]).toBeGreaterThan(.7);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  expect(dot(normals[3][0],normals[3][1])).toBeGreaterThan(.82);
  expect(dot(normals[3][0],normals[3][3])).toBeLessThan(.5);
 }
 expect(r.geometry.totalTriangles).toBeLessThan(160000);
 expect(r.geometry.dynamic.aligned).toBe(true);
 expect(r.geometry.dynamic.invalidNormals+r.geometry.dynamic.invalidComponents).toBe(0);
 expect(r.after).toBe(r.before);
 expect(errors).toEqual([]);
});
