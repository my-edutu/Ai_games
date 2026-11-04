'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// Living Valley W22: observe the REAL worker's body before/after fixed-step
// work rather than staging a new citizen or changing the authoritative job.
// A continuous work action needs feet planted, articulated hands and two-bone
// contact across both viewport classes. This contract is written before code.
for(const mobile of [false,true]){
 test('W22 genuine planted labor and active bilateral contact '+(mobile?'390px':'desktop'),async({page})=>{
  test.setTimeout(210000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1024,height:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const sample=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   let sites=[];
   for(let tick=0;tick<18000;tick++){
    sites=g.getActiveWorksites();
    if(sites.length>=2)break;
    g.step(1/30);
   }
   if(!sites.length)return {sites:0};
   const citizen=sites[0].citizen;
   const index=g.getCitizenProfiles().findIndex(p=>p.name===citizen);
   const before=JSON.stringify(g.exportSnapshot());
   const pose=g.getRigPose(index);
   const firstContact=g.getWorkContactAudit().find(c=>c.citizen===citizen);
   const unchanged=before===JSON.stringify(g.exportSnapshot());
   let secondPose=null,secondContact=null;
   for(let i=0;i<18;i++){
    g.step(1/30);
    if(g.getActiveWorksites().some(w=>w.citizen===citizen)){
     secondPose=g.getRigPose(index);
     secondContact=g.getWorkContactAudit().find(c=>c.citizen===citizen);
    }else break;
   }
   const movement=secondPose?Math.hypot(...pose.arms[1].wrist.map((n,k)=>n-secondPose.arms[1].wrist[k])):null;
   return {sites:sites.length,pose,secondPose,firstContact,secondContact,
    unchanged,movement,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    width:document.documentElement.scrollWidth,
    triangles:g.renderStats().lastFrameTriangles};
  });
  expect(sample.sites,'Real village must supply working citizens').toBeGreaterThan(0);
  expect(sample.unchanged).toBe(true);
  expect(sample.pose.working).toBe(true);
  expect(sample.pose.laborCadence?.source).toBe('real-working-citizen');
  expect(sample.pose.laborCadence?.planted).toBe(true);
  expect(sample.pose.legs.every(leg=>leg.lift===0)).toBe(true);
  expect(sample.pose.legs[0].ankle[2]).not.toBe(sample.pose.legs[1].ankle[2]);
  expect(sample.firstContact?.targetError).toBeLessThan(.04);
  expect(sample.firstContact?.supportError).toBeLessThan(.04);
  if(sample.secondPose&&sample.secondContact){
   expect(sample.secondPose.laborCadence?.planted).toBe(true);
   expect(sample.secondContact.supportError).toBeLessThan(.04);
   expect(sample.secondPose.legs.every(leg=>leg.lift===0)).toBe(true);
   expect(sample.movement).toBeGreaterThan(.035);
  }
  expect(sample.triangles).toBeLessThan(160000);
  expect(sample.width).toBeLessThanOrEqual(mobile?390:1024);
  expect(sample.gl).toBe(0);
  expect(errors).toEqual([]);
 });
}
