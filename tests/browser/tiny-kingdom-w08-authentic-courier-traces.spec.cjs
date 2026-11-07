'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W08 RED-FIRST: visually follow a REAL laden handcart from the fields to the
// market. Tracks must be born from citizen displacement, not an invented road,
// particle clock or economy. Fully bounded, view-only and restoration-safe.
test('W08 real courier wheels leave physical finite traces without manufacturing deliveries',async({page})=>{
 test.setTimeout(190000);
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
   null,{timeout:90000});
 await page.locator('#pause').click();
 const witnessed=await page.evaluate(()=>{
  const game=window.__tinyKingdom;game.reset();
  if(typeof game.getCourierTrailAudit!=='function')
    return {missing:'getCourierTrailAudit not implemented'};
  const empty=game.getCourierTrailAudit();
  let traveling=null,steps=0,seen;
  for(;steps<44000;steps++){
   game.step(1/30);
   const active=game.getActiveDeliveries().filter(d=>d.stage==='travel');
   seen=game.getCourierTrailAudit();
   // Three short segments across different real carts need not form the
   // longer, uninterrupted wheel witness this assertion requires.
   if(active.length&&seen.segments>=3&&
      seen.tracks.some(t=>t.samples>=4&&t.realActor)){
    traveling=active[0];break;
   }
  }
  if(!traveling)return {missing:'no genuine moving courier with wheel tracks'};
  const before=JSON.stringify(game.exportSnapshot());
  const audit=game.getCourierTrailAudit();
  const readOnly=JSON.stringify(game.exportSnapshot())===before;
  const bound=audit.segments<=audit.maxSegments&&
    audit.activeTracks<=audit.maxTracks&&audit.triangles<=audit.maxTriangles;
  const provenance=audit.tracks.every(t=>t.id&&t.samples>=1&&t.realActor)&&
    audit.tracks.some(t=>t.samples>=4);
  game.setCamera({focus:[traveling.x,traveling.z],yaw:.85,pitch:.68,zoom:14});
  const cameraReadOnly=JSON.stringify(game.exportSnapshot())===before;
  return {empty,traveling,audit,readOnly,bound,provenance,
    cameraReadOnly,before,steps};
 });
 expect(witnessed.missing||'').toBe('');
 expect(witnessed.empty.segments).toBe(0);
 expect(witnessed.traveling).toMatchObject({stage:'travel'});
 expect(witnessed.audit.source).toBe('actual-courier-displacement');
 expect(witnessed.audit.segments).toBeGreaterThanOrEqual(3);
 expect(witnessed.audit.triangles).toBeGreaterThan(0);
 expect(witnessed.bound&&witnessed.provenance).toBe(true);
 expect(witnessed.readOnly&&witnessed.cameraReadOnly).toBe(true);
 await page.waitForFunction(()=>window.__tinyKingdom.getCourierTrailAudit().renderedTriangles>0,null,{timeout:30000});
 const visible=await page.evaluate(()=>window.__tinyKingdom.getCourierTrailAudit());
 expect(visible.renderedTriangles).toBeGreaterThanOrEqual(12);
 await page.screenshot({path:test.info().outputPath('w08-real-moving-courier-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(160);
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>innerWidth,
  gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
  audit:window.__tinyKingdom.getCourierTrailAudit(),
  authoritative:JSON.stringify(window.__tinyKingdom.exportSnapshot())
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.gl).toBe(0);
 expect(mobile.audit.segments).toBeGreaterThanOrEqual(3);
 expect(mobile.authoritative).toBe(witnessed.before);
 await page.screenshot({path:test.info().outputPath('w08-real-moving-courier-mobile.png')});
 const restored=await page.evaluate(()=>{
  const g=window.__tinyKingdom,s=g.exportSnapshot();
  g.restoreSnapshot(s);
  const clear=g.getCourierTrailAudit();
  return {clear,restored:JSON.stringify(g.exportSnapshot())===JSON.stringify(s)};
 });
 expect(restored.restored).toBe(true);
 expect(restored.clear.segments).toBe(0);
 expect(pageErrors).toEqual([]);
});
