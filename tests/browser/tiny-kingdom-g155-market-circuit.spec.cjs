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
 // G159 RED: screenshot evidence showed a stall post dominating the center
 // of the 390px frame despite the wall-only portraitSafe test passing.
 // The physical timbers must be evaluated, not removed from the world.
 expect(started.market.architecture.posts?.centralCover,
  JSON.stringify(started.market.architecture)).toBeLessThan(.38);
 // Read the activation and position in ONE browser turn; a slow SwiftShader
 // frame can advance the real walking animation between separate evaluations.
 const immediate=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {handoff:g.nextMarketStall(),position:g.getStreetWalkState().position};
 });
 const handoff=immediate.handoff;
 expect(handoff.started,JSON.stringify(handoff)).toBe(true);
 expect(handoff.trade).not.toBe(started.market.stall.trade);
 expect(handoff.waypoints).toBeGreaterThan(0);
 expect(immediate.position).toEqual(started.position); // Never teleport on click.
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
 
// G156 RED source: G155 real uncut Day-120 film recorded started=false and
// 0 metres travelled despite the user pressing Next stall. No mock actors.
test('G156 real Day-120 market circuit reaches another actual stall on mobile',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{window.__tinyKingdom.reset();window.__tinyKingdom.setSpeed(0);});
 for(let remaining=120*24*30;remaining>0;remaining-=7200)
  await page.evaluate(n=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<n;i++)g.step(1/30);
  },Math.min(remaining,7200));
 const start=await page.evaluate(()=>{
  const g=window.__tinyKingdom,authority=JSON.stringify(g.exportSnapshot());
  const visit=g.visitMarket(),position=g.getStreetWalkState().position;
  const next=g.nextMarketStall(),still=g.getStreetWalkState().position;
  return {authority,visit,position,next,still,planning:g.getMarketVisitPlanningAudit()};
 });
 expect(start.visit.active,JSON.stringify(start.planning)).toBe(true);
 expect(start.next.started,JSON.stringify({next:start.next,planning:start.planning})).toBe(true);
 expect(start.next.trade).not.toBe(start.visit.stall.trade);
 expect(start.next.meters).toBeGreaterThan(2.5);
 expect(start.next.reachableCells).toBeGreaterThan(1);
 expect(start.next.reachableCells).toBeLessThanOrEqual(3000);
 // G158 RED: the real Day-120 market had 238 alternate-stall compositions,
 // but global person proximity rejected 186 even if the citizen was BEHIND
 // the lens. Screen-space crowd occlusion must admit a real framed passage.
 expect(start.planning.connectedSearch?.portraitSafeViews,
  JSON.stringify(start.planning.connectedSearch)).toBeGreaterThan(0);
 expect(start.planning.connectedSearch?.crowdRejected).toBeLessThan(
  start.planning.connectedSearch?.screenedViews);
 expect(start.still).toEqual(start.position);
 const arrived=await page.evaluate(()=>{
  const g=window.__tinyKingdom;let tour=g.getMarketTourAudit(),
   minSafe=true,steps=0,travelled=0,last=g.getStreetWalkState().position;
  while(tour.active&&steps++<1000){
   g.advanceStreetWalk(.10);
   const p=g.getStreetWalkState().position;
   minSafe=minSafe&&g.getMarketVisitAudit().safe;
   travelled+=Math.hypot(p[0]-last[0],p[1]-last[1]);
   last=p;tour=g.getMarketTourAudit();
  }
  return {tour,visit:g.getMarketVisitAudit(),minSafe,travelled,
   authority:JSON.stringify(g.exportSnapshot()),
   overflow:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(arrived.tour.completed,JSON.stringify(arrived.tour)).toBe(true);
 expect(arrived.visit.stall.trade).toBe(start.next.trade);
 // A route counts only when it finishes at a photographically readable,
 // genuinely visible stall — never merely beside another opaque wall.
 expect(arrived.visit.architecture.portraitSafe).toBe(true);
 expect(arrived.visit.architecture.posts?.centralCover,
  JSON.stringify(arrived.visit.architecture)).toBeLessThan(.38);
 expect(arrived.visit.architecture.interveningRoofs).toBe(0);
 expect(arrived.visit.foregroundCitizenCount).toBeLessThanOrEqual(1);
 expect(arrived.travelled).toBeGreaterThan(2.5);
 expect(arrived.minSafe).toBe(true);
 expect(arrived.authority).toBe(start.authority);
 expect(arrived.overflow).toBeLessThanOrEqual(390);
 expect(arrived.gl).toBe(0);
 expect(errors).toEqual([]);
});
