'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W102 genuine fixed-step citizen pose reuse and real street bonds '+viewport.width,async({page})=>{
  test.setTimeout(220000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const once=g.getRigPose(0),twice=g.getRigPose(0);
   const cache=g.getCitizenRigCacheAudit();
   const social=g.getSocialEncounterAudit();
   const after=JSON.stringify(g.exportSnapshot());
   return {before,after,once,twice,cache,social,
    triangles:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-window.innerWidth};
  });
  expect(result.once).toEqual(result.twice);
  expect(result.once.legs).toHaveLength(2);
  expect(result.once.arms).toHaveLength(2);
  expect(result.cache.hits).toBeGreaterThan(0);
  expect(result.cache.entries).toBeLessThanOrEqual(result.cache.maxEntries);
  expect(result.cache.allCitizensPreserved).toBe(true);
  expect(result.cache.altersAuthority).toBe(false);
  expect(result.social.people).toBeGreaterThan(0);
  expect(result.social.createdActors).toBe(0);
  expect(result.social.createdFriendships).toBe(0);
  expect(result.social.altersAuthority).toBe(false);
  expect(result.before).toBe(result.after);
  expect(result.triangles).toBeGreaterThan(0);
  expect(result.gl).toBe(0);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w102',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w102/'+viewport.width+'-genuine-citizens.png'});
 });
}