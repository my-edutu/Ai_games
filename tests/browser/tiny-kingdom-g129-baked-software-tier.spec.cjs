'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G129 continuation of one scene-wide atlas workstream. Do not layer a new
// lookup over every old volumetric fragment path on an already 2FPS software
// renderer. On hardware retain rich materials; in SwiftShader use the atlas.
test('G129 authored architectural atlas replaces costly software material hot path without compromising autonomous world',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const old=JSON.stringify(g.exportSnapshot());
  const atlas=g.getArchitectureMaterialAudit();
  const before=g.renderQuality();
  g.setRenderQuality(.65);
  const after=g.renderQuality();
  return {atlas,before,after,snapshotUnchanged:old===JSON.stringify(g.exportSnapshot()),
   geometry:g.getGeometryAudit(),scene:g.renderStats()};
 });
 expect(proof.snapshotUnchanged).toBe(true);
 expect(proof.atlas.resident).toBe(true);
 expect(proof.atlas.hasMipmaps).toBe(true);
 expect(proof.atlas.tiles).toBe(8);
 expect(proof.atlas.softwareBakedTier).toBe(proof.before.tier==='software-webgl');
 if(proof.before.tier==='software-webgl'){
  expect(proof.atlas.shaderTier).toBe('architectural-atlas-fast');
 }else{expect(proof.atlas.shaderTier).toBe('hardware-layered-original');}
 expect(proof.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(proof.geometry).toBeTruthy();
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
