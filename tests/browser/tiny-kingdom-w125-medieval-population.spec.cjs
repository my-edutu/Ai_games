'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W125 real medieval citizens and no dropped work/saves '+viewport.width,
 async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {save:JSON.stringify(g.exportSnapshot()),
    appearance:g.getMedievalPopulationAudit(),stats:g.renderStats(),
    profiles:g.getCitizenProfiles(),frame:g.getFrameProfile().totalFrames};
  });
  expect(first.appearance.population).toBe(first.profiles.length);
  expect(first.appearance.near+first.appearance.mid+first.appearance.far)
   .toBe(first.appearance.population);
  expect(first.appearance.roles.length).toBeGreaterThanOrEqual(5);
  expect(first.appearance.createsActors).toBe(false);
  expect(first.appearance.changesAuthority).toBe(false);
  expect(first.appearance.preservesExistingWorkHandIK).toBe(true);
  expect(first.stats.lastFrameTriangles).toBeLessThan(160000);
  const earlier=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getFrameProfile().totalFrames;
   g.setCamera({yaw:.61,pitch:.46,zoom:11});return frame;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   earlier,{timeout:125000});
  const later=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {save:JSON.stringify(g.exportSnapshot()),
    appearance:g.getMedievalPopulationAudit(),stats:g.renderStats(),
    overflow:document.documentElement.scrollWidth-innerWidth,glError:gl?.getError()??-1};
  });
  expect(later.save).toBe(first.save);
  expect(later.appearance.population).toBe(first.appearance.population);
  expect(later.appearance.near+later.appearance.mid+later.appearance.far)
   .toBe(first.appearance.population);
  expect(later.stats.lastFrameTriangles).toBeLessThan(160000);
  expect(later.glError).toBe(0);
  expect(later.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W125-real-game-medieval-population-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
