'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// G128: whole inhabited-town material reconstruction. This contract verifies
// a resident, unique, original architectural surface atlas rather than extra
// decorative geometry. Visual experience still needs uncut blind A/B proof.
test('G128 stone, timber, clay roof and limewash have stable bounded physical albedo',async({page})=>{
 test.setTimeout(180000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const proof=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const atlas=g.getArchitectureMaterialAudit?.();
  const again=g.getArchitectureMaterialAudit?.();
  g.setStreetWalk(true);
  const first=g.visitStreetWorker();
  const second=g.visitStreetWorker();
  return {atlas,again,first,second,unchanged:before===JSON.stringify(g.exportSnapshot()),
   triangles:g.renderStats().lastFrameTriangles};
 });
 expect(proof.atlas).toBeTruthy();
 expect(proof.atlas).toEqual(proof.again);
 expect(proof.atlas).toMatchObject({resident:true,renderer:'webgl-original-architectural-atlas',
  width:1024,height:512,tiles:8,textureUnits:1,hasMipmaps:true});
 expect(proof.atlas.bytes).toBe(1024*512*4);
 expect(proof.atlas.uploads).toBe(1);
 expect(proof.atlas.sampledMaterials).toEqual(
  expect.arrayContaining(['stone','timber','roof','plaster','road','foliage']));
 const tones=proof.atlas.samples;
 expect(new Set([tones.stone.join(','),tones.timber.join(','),tones.roof.join(','),tones.plaster.join(',')]).size).toBe(4);
 expect(proof.unchanged).toBe(true);
 expect(proof.triangles).toBeLessThan(160000);
 expect(proof.first.realCitizen).toBe(true);
 expect(proof.second.realCitizen).toBe(true);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:60000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(pageErrors).toEqual([]);
});
