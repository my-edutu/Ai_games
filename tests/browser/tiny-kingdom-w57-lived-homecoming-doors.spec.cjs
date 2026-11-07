'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W57 RED-first: an actual returning citizen opens a physical home entrance.
// The night arrival, door swing and light must be derived solely from genuine
// fixed-step navigation; no synthetic actors, extra resources or fake homes.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W57 real homecoming thresholds, articulated doors, replay-free viewer '+viewport.width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const baseline=JSON.stringify(g.exportSnapshot());
   const empty=g.getCottageHomecomingAudit();
   const sameAfterAudit=baseline===JSON.stringify(g.exportSnapshot());
   let witnessed=null;
   // Advance the authoritative real world through its normal dusk/home routes.
   // Stop at the first genuinely close homecoming (not a staged fake actor).
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(i%3!==0)continue;
    const a=g.getCottageHomecomingAudit();
    const entry=a.doors.find(d=>d.swing>.48);
    if(entry){witnessed={entry,a,world:JSON.stringify(g.exportSnapshot())};break;}
   }
   return {sameAfterAudit,empty,witnessed,
    realPeople:g.getNavigation(),population:g.metrics().citizens};
  });
  expect(result.sameAfterAudit).toBe(true);
  expect(result.empty.source).toBe('real-physical-homecoming-entry');
  expect(result.witnessed,'A real worker must reach a genuine home doorway').toBeTruthy();
  const {entry}=result.witnessed;
  expect(result.realPeople.some(p=>p.name===entry.citizen)).toBe(true);
  expect(entry.swing).toBeGreaterThan(.48);
  expect(entry.distanceToTarget).toBeLessThan(2.4);
  expect(entry.homeIndex).toBeGreaterThanOrEqual(0);
  expect(entry.homeIndex).toBeLessThan(result.witnessed.a.totalHomes);
  const snapshotBefore=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
  await page.waitForFunction(()=>window.__tinyKingdom.getCottageDoorRenderAudit().panels>0,null,{timeout:60000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {render:g.getCottageDoorRenderAudit(),world:JSON.stringify(g.exportSnapshot()),
    lod:g.getVillageVisualLod(),triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  expect(after.world).toBe(snapshotBefore);
  expect(after.render.panels).toBeGreaterThan(0);
  expect(after.render.frames).toBe(after.render.panels);
  expect(after.render.thresholdSteps).toBe(after.render.panels);
  expect(after.render.panels).toBeLessThanOrEqual(result.population);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.glError).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  // This first authentic dusk return may precede the first new cottage.
  // W56 independently tests grown housing at Day 10; W57 must not fabricate
  // growth or require a non-existent compact home before its true arrival.
  expect(after.lod.detailedHomes+after.lod.compactHomes).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w57',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w57/'+viewport.width+'-real-homecoming-doors.png'});
 });
}
