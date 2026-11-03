'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G155: a real-time street tour must WALK between two actual market stalls.
// Never teleport the lens or alter autonomous jobs, stock, RNG or saved time.
test('G155 390px market stall circuit travels on real walkable streets',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0);});
 const started=await page.evaluate(()=>{
  const g=window.__tinyKingdom,market=g.visitMarket();
  return {market,position:g.getStreetWalkState().position,
   authority:JSON.stringify(g.exportSnapshot())};
 });
 expect(started.market.active).toBe(true);
 const handoff=await page.evaluate(()=>window.__tinyKingdom.nextMarketStall());
 expect(handoff.started,JSON.stringify(handoff)).toBe(true);
 expect(handoff.trade).not.toBe(started.market.stall.trade);
 expect(handoff.waypoints).toBeGreaterThan(0);
 const stationary=await page.evaluate(()=>window.__tinyKingdom.getStreetWalkState().position);
 expect(stationary).toEqual(started.position); // Not an instant viewpoint teleport.
 const journey=await page.evaluate(()=>{
  const g=window.__tinyKingdom,positions=[g.getStreetWalkState().position];
  let last=g.getMarketTourAudit();
  for(let i=0;i<480&&last.active;i++){
   g.advanceStreetWalk(.10);
   last=g.getMarketTourAudit();
   positions.push(g.getStreetWalkState().position);
  }
  return {tour:last,positions,visit:g.getMarketVisitAudit(),
   authority:JSON.stringify(g.exportSnapshot()),
   overflow:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(journey.tour.completed,JSON.stringify(journey.tour)).toBe(true);
 expect(journey.visit.stall.trade).toBe(handoff.trade);
 expect(journey.positions.length).toBeGreaterThan(5);
 for(let i=1;i<journey.positions.length;i++)
  expect(Math.hypot(journey.positions[i][0]-journey.positions[i-1][0],
   journey.positions[i][1]-journey.positions[i-1][1])).toBeLessThan(.25);
 expect(journey.visit.safe).toBe(true);
 expect(journey.authority).toBe(started.authority);
 expect(journey.overflow).toBeLessThanOrEqual(390);
 expect(journey.gl).toBe(0);
 expect(errors).toEqual([]);
});