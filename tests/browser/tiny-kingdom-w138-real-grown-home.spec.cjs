'use strict';
// W138: real seeded-world growth and original software render path A/B.
// Same authority snapshot; variant comparison is NOT G088 experience A/B.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
test('W138 real 120-day software town unchanged across complete vs dirty home rendering',
 async({page},info)=>{
 test.setTimeout(600000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:160000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();
  const a=g.exportSnapshot();g.reset();const b=g.exportSnapshot();
  return {a:JSON.stringify(a),b:JSON.stringify(b),renderer:g.renderQuality().renderer};
 });
 expect(initial.a).toBe(initial.b);
 // Legitimate authoritative work and construction, same fixed 1/30-hour
 // increments used by production deterministic-soak, NOT fabricated houses.
 for(let day=0;day<120;day+=10){
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<7200;i++)g.step(1/30);
  });
  await page.waitForTimeout(220);
 }
 const snapshot=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const controls={focus:[0,3],yaw:.85,pitch:.52,zoom:23};
 const originalNames=await page.evaluate(()=>window.__tinyKingdom.getState().people.map(p=>p.name));
 const growth=await page.evaluate(()=>window.__tinyKingdom.metrics());
 expect(growth.buildings-2).toBeGreaterThanOrEqual(18);
 async function capture(viewport,mode){
  await page.setViewportSize(viewport);
  const prior=await page.evaluate(({mode,camera})=>{
   const g=window.__tinyKingdom;
   g.setHomePartitionOverride(mode);g.setCamera(camera);
   return g.getFrameProfile().totalFrames;
  },{mode,camera:controls});
  await page.waitForFunction(prior=>window.__tinyKingdom.getFrameProfile().totalFrames>prior,
    prior,{timeout:150000});
  const current=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {authority:JSON.stringify(g.exportSnapshot()),
    scene:g.getStationarySettlementAudit(),partition:g.getHomePartitionAudit(),
    geometry:g.getGeometryAudit(),profile:g.getFrameProfile(),
    cadence:g.getDrawCadenceAudit(),draw:g.getScenicVisibilityStats(),
    names:g.getState().people.map(p=>p.name),world:g.getSupplyTrailSnapshot(),
    cull:g.getScenicCullReferenceAudit(),bvh:g.getScenicBvhAudit(),
    error:gl?.getError()??-1,overflow:document.documentElement.scrollWidth-innerWidth,
    softwareRenderer:g.renderQuality().softwareRenderer??g.renderQuality().tier};
  });
  await info.attach('W138-'+viewport.width+'-'+(mode===null?'auto':mode?'partition':'complete')+'.png',
   {body:await page.screenshot(),contentType:'image/png'});
  await info.attach('W138-'+viewport.width+'-'+(mode===null?'auto':mode?'partition':'complete')+'.json',
   {body:Buffer.from(JSON.stringify({viewport,mode,current,physicalHardware:false,
    independentCritic:false,g088PairedVideo:false},null,2)),contentType:'application/json'});
  expect(current.authority).toBe(snapshot);
  expect(current.names).toEqual(originalNames);
  expect(current.error).toBe(0);
  expect(current.cull.missingChunks).toBe(0);
  expect(current.cull.falseVisibleChunks).toBe(0);
  expect(current.bvh.authoritativeStateChanged).toBe(false);
  expect(current.overflow).toBeLessThanOrEqual(0);
  expect(current.geometry.totalTriangles).toBeLessThan(160000);
  if(mode===true||mode===null){
   expect(current.partition.enabled).toBe(true);
   expect(current.partition.activeHomes).toBe(growth.buildings-2);
   expect(current.partition.mode).toBe('real-grown-town-dirty-blocks');
   expect(current.partition.staleDrawn).toBe(0);
  }else expect(current.partition.enabled).toBe(false);
  return current;
 }
 for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
  const complete=await capture(viewport,false);
  const partition=await capture(viewport,true);
  const auto=await capture(viewport,null);
  expect(partition.names.length).toBe(complete.names.length);
  expect(auto.scene.homes).toBe(complete.scene.homes);
  expect(partition.geometry.totalTriangles).toBe(complete.geometry.totalTriangles);
  expect(auto.geometry.totalTriangles).toBe(complete.geometry.totalTriangles);
 }
 expect(pageErrors).toEqual([]);
});
