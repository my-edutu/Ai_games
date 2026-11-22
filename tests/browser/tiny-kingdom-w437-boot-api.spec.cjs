'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [1024,390]){
 test('W437 actual game boot and authoritative granary/loft API at '+width,async({page})=>{
  test.setTimeout(105000);
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  // The prior exact-head W433 videos showed Day 9 but every test waited 150s:
  // one unresolved export prevented window.__tinyKingdom from existing.
  await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.renderStats?.()?.lastFrameTriangles>0),null,{timeout:85000});
  const proof=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {source:'unchanged-original-authored-game',viewport:innerWidth,
    people:g.metrics().citizens,day:g.metrics().day,
    triangles:g.renderStats().lastFrameTriangles,
    granary:g.getGranarySupplyAudit(),loft:g.getCompactUpperLoftAudit(),
    snapshotChecksum:g.exportSnapshot().checksum,
    pageOverflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    userAgent:navigator.userAgent};
  });
  expect(proof.people).toBeGreaterThanOrEqual(12);
  expect(proof.triangles).toBeGreaterThan(0);
  expect(proof.triangles).toBeLessThan(160000);
  expect(proof.granary.source).toBe('real-village-food-inventory');
  expect(proof.loft.source).toBe('original-grown-cottage-retained-hollow-upper-loft');
  expect(proof.loft.newGpuBuffers).toBe(0);
  expect(proof.loft.changedAuthority).toBe(false);
  expect(proof.gl).toBe(0);
  expect(proof.pageOverflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w437');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,width+'-boot-proof.json'),
   JSON.stringify({...proof,errors,referenceHardwareFPS:'NOT MEASURED',
    substantialExperienceTransformation:'NOT PROVEN'},null,2));
  await page.screenshot({path:path.join(dir,width+'-real-village-boot.png')});
 });
}
