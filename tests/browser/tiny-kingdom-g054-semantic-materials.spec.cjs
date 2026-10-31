'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G054b real vertex material IDs exclude woven banners and market canvas from stone coursing',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getMaterialSystem));
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const proof=g.getMaterialSwatchAudit();
  const mesh=g.getGeometryAudit();
  return {proof,mesh,unchanged:before===JSON.stringify(g.exportSnapshot())};
 });
 for(const [name,minimum] of [['guildCloth',24],['guildGoldTrim',1],['marketCanvas',2],['festivalGoldSilk',1]]){
  const row=result.proof[name];
  expect(row.general).toBeGreaterThanOrEqual(minimum);
  expect(row.stone).toBe(0);
  expect(row.roof).toBe(0);
 }
 expect(result.proof.guildCloth.total).toBe(24);
 expect(result.proof.marketCanvas.total).toBe(2);
 expect(result.proof.festivalGoldSilk.total).toBeGreaterThanOrEqual(1);
 expect(result.mesh.totalTriangles).toBeLessThan(160000);
 expect(result.unchanged).toBe(true);
 expect(errors).toEqual([]);
});
