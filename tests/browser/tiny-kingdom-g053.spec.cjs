'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('G053 craftsperson walking to work counter-swings arms instead of playing the crafting beat',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>Boolean(window.__tinyKingdom?.getRigPose));
 await page.locator('#pause').click();
 const evidence=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  const before=JSON.stringify(game.exportSnapshot());
  const craft=game.getCitizenProfiles().flatMap((person,index)=>{
   const rig=game.getRigPose(index);
   return person.job==='craftsperson'&&rig.traveling?[{
    activity:person.activity,
    traveling:rig.traveling,working:rig.working,
    sidePairs:rig.legs.map((leg,i)=>leg.ankle[2]*rig.arms[i].wrist[2])
   }]:[];
  });
  return {craft,authorityUnchanged:before===JSON.stringify(game.exportSnapshot())};
 });
 expect(evidence.craft.length).toBeGreaterThan(0);
 for(const traveler of evidence.craft){
  expect(traveler.activity).toMatch(/traveling/i);
  expect(traveler.working).toBe(false);
  for(const pair of traveler.sidePairs)expect(pair).toBeLessThanOrEqual(0);
 }
 expect(evidence.authorityUnchanged).toBe(true);
 expect(errors).toEqual([]);
});
