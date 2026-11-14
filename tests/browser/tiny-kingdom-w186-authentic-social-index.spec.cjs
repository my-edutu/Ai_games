'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W186 real neighborhood social index survives actual civilization at '+viewport.width,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const first=g.exportSnapshot();
   for(let i=0;i<3*24*30;i++)g.step(1/30);
   const audit=g.getCitizenSocialIndexAudit();
   return {first:first.checksum,after:g.exportSnapshot().checksum,audit,
    day:g.metrics().day,residents:g.metrics().citizens,
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.after).not.toBe(result.first);
  expect(result.day).toBeGreaterThanOrEqual(3);
  expect(result.audit.residents).toBe(result.residents);
  expect(result.audit.lastPotentialPairs).toBe(result.residents*(result.residents-1)/2);
  expect(result.audit.lastCandidates).toBeLessThanOrEqual(result.audit.lastPotentialPairs);
  expect(result.audit.retainedCellRecords).toBeLessThanOrEqual(128);
  expect(result.gl).toBe(0);expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w186',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w186/'+viewport.width+'-authentic-social.json',JSON.stringify({viewport,result},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w186/'+viewport.width+'-real-civilization.png'});
 });
}
