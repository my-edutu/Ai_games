'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W50 RED-first acceptance. The actor's actual in-world position, work and
// freight must be readable while filming the original autonomous shift.
// The overlay is a spectator only: it MUST NOT alter the ledger or replay.
test('W50 real workday actor has a scene-anchored, readable desktop and 390px status',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const sample=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
  let work=null;
  for(let i=0;i<24000;i++){g.step(1/30);if(i%5===0&&g.getHarvestInteractionAudit().active){work=g.getHarvestInteractionAudit();break;}}
  if(!work)return {error:'no genuine farmer worksite during seeded clock'};
  const authorityBefore=JSON.stringify(g.exportSnapshot());
  const view=g.watchHarvestShift();
  const authorityAfter=JSON.stringify(g.exportSnapshot());
  return {work,view,unchanged:authorityBefore===authorityAfter};
 });
 expect(sample.error||'').toBe('');
 expect(sample.unchanged).toBe(true);
 expect(sample.view?.active).toBe(true);
 await page.waitForFunction(()=>{
  const a=window.__tinyKingdom?.getWorldActorTagAudit?.();
  return a?.visible&&a.citizen===window.__tinyKingdom.getHarvestInteractionAudit().citizen;
 },null,{timeout:90000});
 const desktop=await page.evaluate(()=>{
  const a=window.__tinyKingdom.getWorldActorTagAudit();
  const el=document.getElementById('world-actor-tag');
  return {a,text:el?.textContent||'',hidden:el?.hidden,htmlWidth:document.documentElement.scrollWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(desktop.a.source).toBe('projected-real-citizen-head-and-work');
 expect(desktop.a.authorityMutated).toBe(false);
 expect(desktop.a.citizen).toBe(sample.work.citizen);
 expect(desktop.a.viewMode).toBe('live');
 expect(desktop.text).toContain(sample.work.citizen);
 expect(desktop.a.x).toBeGreaterThan(0);
 expect(desktop.a.x).toBeLessThan(1024);
 expect(desktop.a.y).toBeGreaterThan(0);
 expect(desktop.a.y).toBeLessThan(640);
 expect(desktop.hidden).toBe(false);
 expect(desktop.htmlWidth).toBeLessThanOrEqual(1024);
 expect(desktop.gl).toBe(0);
 fs.mkdirSync('artifacts/tiny-kingdom-w50',{recursive:true});
 await page.screenshot({path:'artifacts/tiny-kingdom-w50/real-farmer-world-marker-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>{
  const a=window.__tinyKingdom?.getWorldActorTagAudit?.();
  return a?.viewportWidth===390&&a?.visible;
 },null,{timeout:90000});
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom,a=g.getWorldActorTagAudit();
  return {a,scroll:document.documentElement.scrollWidth,tag:document.getElementById('world-actor-tag')?.getBoundingClientRect().toJSON(),
   actual:g.getHarvestInteractionAudit(),gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.a.citizen).toBe(sample.work.citizen);
 expect(mobile.a.x).toBeGreaterThan(0);
 expect(mobile.a.x).toBeLessThan(390);
 expect(mobile.a.y).toBeGreaterThan(0);
 expect(mobile.a.y).toBeLessThan(844);
 expect(mobile.a.viewportWidth).toBe(390);
 expect(mobile.tag.left).toBeGreaterThanOrEqual(0);
 expect(mobile.tag.right).toBeLessThanOrEqual(390);
 expect(mobile.scroll).toBeLessThanOrEqual(390);
 expect(mobile.gl).toBe(0);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/tiny-kingdom-w50/real-farmer-world-marker-390px.png'});
 console.log('W50 actual farmer work readability',JSON.stringify({citizen:sample.work.citizen,desktop:desktop.a,mobile:mobile.a}));
});
