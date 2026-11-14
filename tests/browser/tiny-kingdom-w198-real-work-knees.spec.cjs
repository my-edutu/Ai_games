'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const output='artifacts/tiny-kingdom-w198-real-workers';fs.mkdirSync(output,{recursive:true});
test.use({video:'on'});
async function start(page,width,height,errors){
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height});await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:120000});
 await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
}
for(const [width,height] of [[1024,640],[390,844]]){
 test('W198 actual harvest pose, camera and moving game '+width,async({page})=>{
  test.setTimeout(300000);const errors=[];await start(page,width,height,errors);
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;let witness=null,ticks=0;
   for(;ticks<25*24*30;ticks++){
    if(ticks%15===0){
     const actors=g.getCitizenProfiles();
     for(let i=0;i<actors.length;i++){
      if(actors[i].job!=='farmer')continue;
      const pose=g.getRigPose(i),gesture=g.getAuthenticWorkGesture(i);
      if(pose?.working&&!pose.traveling&&!pose.hauling&&pose.pelvisDrop>.035&&gesture?.active){
       witness={person:actors[i],pose,gesture};break;
      }
     }if(witness)break;
    }g.step(1/30);
   }
   if(!witness)return {found:false,ticks,day:g.metrics().day};
   const prior=JSON.stringify(g.exportSnapshot());
   g.watchHarvestShift();
   return {found:true,ticks,witness,authorityUnchanged:prior===JSON.stringify(g.exportSnapshot())};
  });
  expect(result.found,'must observe REAL seeded farmer, no staged worker').toBe(true);
  expect(result.authorityUnchanged).toBe(true);
  const pose=result.witness.pose;
  expect(pose.pelvisDrop).toBeGreaterThan(.035);
  expect(pose.pelvisDrop).toBeLessThanOrEqual(.16);
  expect(pose.legs).toHaveLength(2);
  for(const l of pose.legs){
   expect(l.contact).toBe('stance');expect(l.hip[1]).toBeCloseTo(.60-pose.pelvisDrop,7);
   expect(l.pelvisDrop).toBeCloseTo(pose.pelvisDrop,7);
   expect(Math.hypot(...l.hip.map((v,i)=>v-l.knee[i]))).toBeCloseTo(.335,3);
   expect(Math.hypot(...l.knee.map((v,i)=>v-l.ankle[i]))).toBeCloseTo(.335,3);
  }
  const frames=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(1));
  await page.waitForFunction(f=>window.__tinyKingdom.getFrameProfile().totalFrames>=f+3,frames,{timeout:120000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const frame=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {scene:g.renderStats(),profile:g.getFrameProfile(),
    gl:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(frame.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(frame.gl).toBe(0);expect(frame.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.writeFileSync(output+'/'+width+'-workday.json',JSON.stringify({result,frame},null,2));
  await page.screenshot({path:output+'/'+width+'-workday.png'});
 });
}
test('W198 real Day-120 city and save/replay remain intact',async({page})=>{
 test.setTimeout(360000);const errors=[];await start(page,1024,640,errors);
 const prep=await page.evaluate(()=>{
  const g=window.__tinyKingdom,initial=g.metrics();
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  return {initial,frame:g.getFrameProfile().totalFrames,snapshot:g.exportSnapshot()};
 });
 await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,prep.frame,{timeout:120000});
 const audit=await page.evaluate(()=>{
  const g=window.__tinyKingdom,mesh=g.getGeometryAudit();
  return {metrics:g.metrics(),scene:g.renderStats(),
   staticInvalid:mesh.static.invalidComponents,dynamicInvalid:mesh.dynamic.invalidComponents,
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(audit.metrics.citizens).toBeGreaterThanOrEqual(prep.initial.citizens);
 expect(audit.metrics.buildings).toBeGreaterThan(prep.initial.buildings);
 expect(audit.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(audit.staticInvalid).toBe(0);expect(audit.dynamicInvalid).toBe(0);
 expect(audit.gl).toBe(0);expect(audit.overflow).toBeLessThanOrEqual(0);
 expect(errors).toEqual([]);
 fs.writeFileSync(output+'/day120.json',JSON.stringify(audit,null,2));
 await page.screenshot({path:output+'/day120.png'});
 expect(await page.evaluate(snapshot=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(snapshot);return before===JSON.stringify(g.exportSnapshot());
 },prep.snapshot)).toBe(true);
});
