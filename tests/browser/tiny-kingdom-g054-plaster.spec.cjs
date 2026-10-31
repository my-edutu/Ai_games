'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G054c Tudor rendered plaster and gables are not mislabeled as coursed stone',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getMaterialSwatchAudit));
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  const before=JSON.stringify(game.exportSnapshot());
  const materials=game.getMaterialSwatchAudit(),geometry=game.getGeometryAudit();
  return {materials,geometry,sameSave:JSON.stringify(game.exportSnapshot())===before};
 });
 for(const name of ['housePlasterCream','housePlasterWarm','houseGablePlaster']){
  const row=result.materials[name];
  expect(row).toBeTruthy();
  expect(row.general).toBeGreaterThan(0);
  expect(row.stone).toBe(0);
  expect(row.roof).toBe(0);
 }
 expect(result.materials.houseFoundation.stone).toBeGreaterThan(0);
 expect(result.materials.houseFoundation.general).toBe(0);
 expect(result.geometry.totalTriangles).toBeLessThan(160000);
 expect(result.sameSave).toBe(true);
 expect(errors).toEqual([]);
});
