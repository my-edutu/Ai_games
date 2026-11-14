'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W60 real resting cottage retains its physical closed leaf '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const story=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let opening=null;
   for(let n=0;n<24*30*3;n++){
    g.step(1/30);
    if(n%3===0)opening=g.getCottageHomecomingAudit().doors.find(d=>
     d.activity==='Returning home at dusk'&&d.swing>.55);
    if(opening)break;
   }
   if(!opening)return {opening:null};
   const authorityBefore=JSON.stringify(g.exportSnapshot());
   let following=null;
   for(let n=0;n<g.metrics().citizens+1;n++){
    following=g.watchHomecoming();
    if(following?.citizen===opening.citizen)break;
   }
   return {opening,following,authorityUnchanged:
    authorityBefore===JSON.stringify(g.exportSnapshot())};
  });
  expect(story.opening).toBeTruthy();
  expect(story.following.citizen).toBe(story.opening.citizen);
  expect(story.authorityUnchanged).toBe(true);
  await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit().active,null,{timeout:60000});
  const closure=await page.evaluate(()=>{
   const g=window.__tinyKingdom,name=g.getHomecomingView().citizen;
   for(let n=0;n<24*30;n++){
    g.step(1/30);
    const d=g.getCottageHomecomingAudit();
    const closed=d.closedDoors.find(x=>x.citizen===name);
    if(closed)return {closed,source:JSON.stringify(g.exportSnapshot())};
   }
   return {closed:null};
  });
  expect(closure.closed,'Same authentic resident must close their oak leaf').toBeTruthy();
  expect(closure.closed.swing).toBe(0);
  expect(closure.closed.homeIndex).toBe(story.opening.homeIndex);
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom,view=g.getHomecomingThresholdCameraAudit();
   return view.phase==='resting-at-real-home'&&
    g.getCottageDoorRenderAudit().closedPanels>0;
  },null,{timeout:95000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {shot:g.getHomecomingThresholdCameraAudit(),
    source:JSON.stringify(g.exportSnapshot()),
    renderer:g.getCottageDoorRenderAudit(),triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(result.source).toBe(closure.source);
  expect(result.shot.camera.vegetationFaceBlockers).toBe(0);
  expect(result.shot.camera.foregroundVegetationCover).toBeLessThan(.30);
  expect(result.renderer.closedPanels).toBeGreaterThan(0);
  // W61: the genuinely shut door must have visible rotating timber thickness,
  // individual oak planks and forged fittings on the SAME real household.
  expect(result.renderer.plankFaces).toBeGreaterThanOrEqual(result.renderer.panels*16);
  expect(result.renderer.ironFittings).toBeGreaterThanOrEqual(result.renderer.panels*3);
  expect(result.triangles).toBeLessThan(160000);
  expect(result.overflow).toBeLessThanOrEqual(0);
  expect(result.glError).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w60',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w60/'+viewport.width+'-real-resting-door.png'});
 });
}
