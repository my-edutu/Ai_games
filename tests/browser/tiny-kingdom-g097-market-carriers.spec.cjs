'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G097: A carrier exists only after an actual positive, recorded authoritative
// work event. It is attached to that citizen, not a fake trade or new NPC.
// This is a safety contract, NOT a visual-transformation acceptance test.
test('G097 real production gives travelling workers bounded physical cargo without changing authority',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 // Loading/rendering is genuinely live; start() can already have produced work
 // by the time the 3D scene is ready. Reset only the fixture AFTER pausing.
 await page.evaluate(()=>window.__tinyKingdom.reset());
 const evidence=await page.evaluate(()=>{
  const g=window.__tinyKingdom,initial=g.exportSnapshot();
  const missing=typeof g.getStreetCargoWitnesses!=='function';
  if(missing)return {missing};
  const initialCargo=g.getStreetCargoWitnesses(),firstSnapshot=JSON.stringify(g.exportSnapshot());
  let witness=null,events=[],ticks=0;
  for(let i=0;i<10500;i++){
   g.step(1/30);ticks++;
   if(i%5===0){
    const now=g.getStreetCargoWitnesses();
    if(now.length){witness=now[0];events=g.getWorkdayEvents();break}
   }
  }
  const finalSnapshot=JSON.stringify(g.exportSnapshot());
  const pureRead=JSON.stringify(g.exportSnapshot())===finalSnapshot;
  const matching=events.find(e=>e.id===witness?.eventId&&e.citizen===witness?.citizen);
  const positive=matching?matching.delta[witness.resource]:0;
  const stateBefore=JSON.stringify(g.exportSnapshot());
  for(let i=0;i<5;i++)g.getStreetCargoWitnesses();
  const stateAfter=JSON.stringify(g.exportSnapshot());
  const restore=g.exportSnapshot();
  g.restoreSnapshot(restore);
  return {missing,emptyInitially:initialCargo.length===0,
   pureInitially:firstSnapshot===JSON.stringify(initial),
   witness,matching:!!matching,positive,
   pureRead,stableView:stateBefore===stateAfter,
   clearedOnRestore:g.getStreetCargoWitnesses().length===0,
   restored:JSON.stringify(g.exportSnapshot())===JSON.stringify(restore),
   triangles:g.renderStats().lastFrameTriangles,ticks};
 });
 expect(evidence.missing).toBe(false);
 expect(evidence.emptyInitially).toBe(true);
 expect(evidence.pureInitially).toBe(true);
 expect(evidence.matching).toBe(true);
 expect(evidence.positive).toBeGreaterThan(0);
 expect(evidence.witness.ageHours).toBeGreaterThanOrEqual(0);
 expect(evidence.witness.ageHours).toBeLessThanOrEqual(6.5);
 expect(evidence.witness.activity).toMatch(/Travel|Explor/);
 expect(evidence.pureRead).toBe(true);
 expect(evidence.stableView).toBe(true);
 expect(evidence.clearedOnRestore).toBe(true);
 expect(evidence.restored).toBe(true);
 expect(evidence.triangles).toBeLessThan(160000);
 expect(errors).toEqual([]);
});
