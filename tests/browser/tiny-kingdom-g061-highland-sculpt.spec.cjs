'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

function legacyTerrain(x,z){
 const d=Math.hypot(x,z),edge=Math.max(0,Math.min(1,(d-24)/18));
 const upland=edge*edge*(2.8+1.8*Math.sin(x*.18+z*.11)*Math.cos(z*.24));
 return .13*Math.sin(x*.32)*Math.cos(z*.24)+
  .7*Math.pow(Math.abs(x)/40,2)+.25*Math.pow(Math.abs(z)/38,2)+upland;
}

test('G061 sculpted highland relief visibly changes distant ridge height but preserves inhabited valley, replay and triangle budget',async({page})=>{
 const faults=[];page.on('pageerror',err=>faults.push(err.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const outcome=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const snapshot=JSON.stringify(g.exportSnapshot());
  const samples=[];
  for(let x=-42;x<=42;x+=4)for(let z=-42;z<=42;z+=4){
   if(Math.hypot(x,z)<30)continue;
   samples.push({x,z,height:g.getTerrainHeight(x,z)});
  }
  const central=[[0,0],[7,12],[16,-9],[-15,13],[22,3]].map(([x,z])=>({x,z,height:g.getTerrainHeight(x,z)}));
  // Independent screenshot critic found a kink and polygon bank tear in G061a.
  // Protect the actual 105-segment stream and both 2.72m gravel shoulders.
  const stream=[];
  for(let x=-42;x<=42;x+=6){
   const center=20+3*Math.sin(x*.13);
   for(const off of [-2.72,-1.8,0,1.8,2.72])
    stream.push({x,z:center+off,height:g.getTerrainHeight(x,center+off)});
  }
  const horizon=[[-92,20],[-43,20],[-30,-28],[43,20],[92,20]].map(([x,z])=>g.getTerrainHeight(x,z));
  g.setCamera({focus:[-23,7],zoom:23,pitch:.51,yaw:.66});
  return {samples,central,horizon,stream,mesh:g.getGeometryAudit(),
   before:snapshot,after:JSON.stringify(g.exportSnapshot())};
 });
 // This is an elevation/normal change in the real terrain function, not merely
 // recolouring grass. The playable centre and authoritative seed stay fixed.
 for(const {x,z,height} of outcome.central)expect(height).toBeCloseTo(legacyTerrain(x,z),10);
 const changes=outcome.samples.map(({x,z,height})=>height-legacyTerrain(x,z));
 expect(changes.filter(delta=>Math.abs(delta)>.20).length).toBeGreaterThan(95);
 expect(Math.max(...changes)-Math.min(...changes)).toBeGreaterThan(1.8);
 expect(Math.max(...changes.map(Math.abs))).toBeLessThan(1.9);
 for(const {x,z,height} of outcome.stream)expect(height).toBeCloseTo(legacyTerrain(x,z),10);
 expect(outcome.horizon.every(Number.isFinite)).toBe(true);
 expect(outcome.before).toBe(outcome.after);
 expect(outcome.mesh.totalTriangles).toBeLessThan(160000);
 for(const mesh of [outcome.mesh.static,outcome.mesh.dynamic]){
  expect(mesh.aligned).toBe(true);
  expect(mesh.invalidComponents+mesh.invalidNormals+mesh.invalidColors+mesh.outOfBounds).toBe(0);
 }
 expect(faults).toEqual([]);
});
