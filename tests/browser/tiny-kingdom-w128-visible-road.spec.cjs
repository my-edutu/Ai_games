'use strict';
// W128 real WebGL full-scene captures, no staged world or fake actors.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
for(const view of [{width:1024,height:640},{width:390,height:844}]){
 test('W128 physical farm to market to home road '+view.width,async({page},info)=>{
  test.setTimeout(300000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.setViewportSize(view);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:160000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const gl=document.getElementById('world').getContext('webgl');
   return {
    state:JSON.stringify(g.exportSnapshot()),
    names:g.getState().people.map(p=>p.name),
    economy:g.metrics(),
    freight:g.getFarmMarketStreetAudit(),home:g.getMarketHomeStreetAudit(),
    roadside:g.getRealRoadscapeAudit(),graded:g.getGradedRoadAudit(),geometry:g.getGeometryAudit(),
    frame:g.getFrameProfile().totalFrames,
    triangles:g.renderStats().lastFrameTriangles,
    glError:gl?.getError()??null,overflow:document.documentElement.scrollWidth-innerWidth
   };
  });
  expect(initial.names.length).toBeGreaterThan(0);
  expect(initial.freight.connected).toBe(true);
  expect(initial.graded.sections).toBeGreaterThan(0);
  expect(initial.graded.classes.granary).toBeGreaterThan(0);
  expect(initial.graded.classes.household).toBeGreaterThan(0);
  expect(initial.graded.triangles).toBe(initial.graded.sections*12);
  expect(initial.graded.trackDepression).toBeCloseTo(.036,6);
  expect(initial.graded.maxCrownHeight).toBeLessThan(.07);
  expect(initial.graded.changesNavigation).toBe(false);
  expect(initial.graded.changesAuthoritativeState).toBe(false);
  expect(initial.roadside.routeWaypoints).toBeGreaterThan(1);
  expect(initial.roadside.sections).toBeGreaterThan(0);
  expect(initial.roadside.drainagePanels).toBe(initial.roadside.verges*3);
  expect(initial.roadside.triangles).toBeLessThanOrEqual(initial.roadside.maxBudget);
  expect(initial.roadside.closestNewVergeOffset).toBeGreaterThan(.70);
  expect(initial.roadside.maxHeight).toBeLessThanOrEqual(.5);
  expect(initial.roadside.extraBuffers).toBe(0);
  expect(initial.roadside.changesAuthoritativeState).toBe(false);
  expect(initial.roadside.changesNavigation).toBe(false);
  expect(initial.geometry.totalTriangles).toBeLessThan(160000);
  expect(initial.glError).toBe(0);
  expect(initial.overflow).toBeLessThanOrEqual(0);
  for(const shot of [
   {name:'granary-rut-street',focus:[24,-7],yaw:.46,pitch:.42,zoom:12},
   {name:'rural-corridor',focus:[12,-6],yaw:.71,pitch:.64,zoom:19},
   {name:'market-receiving',focus:[-1,10.2],yaw:.65,pitch:.48,zoom:14}
  ]){
   const before=await page.evaluate(shot=>{
    const g=window.__tinyKingdom;
    g.setCamera({focus:shot.focus,yaw:shot.yaw,pitch:shot.pitch,zoom:shot.zoom});
    return g.getFrameProfile().totalFrames;
   },shot);
   await page.waitForFunction(v=>window.__tinyKingdom.getFrameProfile().totalFrames>v,
    before,{timeout:140000});
   await info.attach('W128-'+shot.name+'-'+view.width,
    {body:await page.screenshot(),contentType:'image/png'});
  }
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {state:JSON.stringify(g.exportSnapshot()),
    names:g.getState().people.map(p=>p.name),
    economy:g.metrics(),roadside:g.getRealRoadscapeAudit(),graded:g.getGradedRoadAudit(),
    glError:document.getElementById('world').getContext('webgl')?.getError()??null,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(after.state).toBe(initial.state);
  expect(after.names).toEqual(initial.names);
  expect(after.economy).toEqual(initial.economy);
  expect(after.roadside).toEqual(initial.roadside);
  expect(after.graded).toEqual(initial.graded);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await info.attach('W128-real-scene-integrity-'+view.width,
   {body:Buffer.from(JSON.stringify({initial,after},null,2)),
    contentType:'application/json'});
 });
}
