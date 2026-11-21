'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('W47 genuine commuter has rolling heel-to-toe boots and planted working feet on desktop and 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  let travellers=0,heels=0,toes=0,stance=0,swing=0,planted=0,nonFinite=0;
  const occupations=new Set();
  for(let tick=0;tick<7200;tick++){
   g.step(1/30);
   if(tick%15)continue;
   const people=g.getCitizenProfiles();
   for(let i=0;i<people.length;i++){
    const gait=g.getCitizenGaitAudit(i);
    if(gait.traveling){
     travellers++;occupations.add(gait.job);
     for(const leg of gait.legs){
      stance+=Number(leg.contact==='stance');
      swing+=Number(leg.contact==='swing');
      heels+=Number(leg.rollRadians>.06);
      toes+=Number(leg.rollRadians<-.06);
      nonFinite+=Number(!Number.isFinite(leg.rollRadians)||!Number.isFinite(leg.soleHeight));
     }
    }else if(gait.working){
     planted++;
     nonFinite+=Number(gait.legs.some(l=>l.rollRadians!==0||l.contact!=='stance'));
    }
   }
  }
  const snapshot=JSON.stringify(g.exportSnapshot());
  for(let i=0;i<g.getCitizenProfiles().length;i++)g.getCitizenGaitAudit(i);
  return {travellers,heels,toes,stance,swing,planted,nonFinite,
   occupationCount:occupations.size,readOnly:JSON.stringify(g.exportSnapshot())===snapshot,
   citizens:g.metrics().citizens};
 });
 expect(result.travellers).toBeGreaterThan(20);
 expect(result.occupationCount).toBeGreaterThanOrEqual(2);
 expect(result.stance).toBeGreaterThan(0);
 expect(result.swing).toBeGreaterThan(0);
 expect(result.heels).toBeGreaterThan(0);
 expect(result.toes).toBeGreaterThan(0);
 expect(result.planted).toBeGreaterThan(0);
 expect(result.nonFinite).toBe(0);
 expect(result.readOnly).toBe(true);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await expect(page.locator('#pause')).toBeVisible();
 const mobile=await page.evaluate(()=>({
  population:window.__tinyKingdom.getCitizenProfiles().length,
  gait:window.__tinyKingdom.getCitizenGaitAudit(0),
  geometry:window.__tinyKingdom.renderStats().lastFrameTriangles
 }));
 expect(mobile.population).toBe(result.citizens);
 expect(mobile.gait.legs).toHaveLength(2);
 expect(mobile.geometry).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 fs.mkdirSync('artifacts/tiny-kingdom-w47',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w47/390px-real-commuters.png'});
 console.log('W47 authentic commute gait',JSON.stringify(result));
});
