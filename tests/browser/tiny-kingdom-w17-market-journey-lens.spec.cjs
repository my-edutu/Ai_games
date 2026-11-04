'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W17: original G088/W16 matched Day-120 mobile film exposed a camera looking
// into opaque timber even though the pedestrian's route was physically safe.
// Fix the actual, moving spectator experience; do not move/delete architecture,
// invent residents, accelerate authority or grant fraudulent market receipts.
for(const grown of [false,true])test('W17 physically truthful mobile market walk - '+(grown?'Day120':'Day1'),async({page})=>{
 test.setTimeout(240000);
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0);});
 if(grown){
  for(let remaining=120*24*30;remaining>0;remaining-=7200)
   await page.evaluate(n=>{for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30)},Math.min(remaining,7200));
 }
 const begun=await page.evaluate(()=>{
  const g=window.__tinyKingdom, before=JSON.stringify(g.exportSnapshot());
  const market=g.visitMarket(),origin=g.getStreetWalkState().position;
  const next=g.nextMarketStall();
  return {before,market,origin,next,position:g.getStreetWalkState().position};
 });
 expect(begun.market.active,JSON.stringify(begun.market)).toBe(true);
 expect(begun.next.started,JSON.stringify(begun.next)).toBe(true);
 expect(begun.position).toEqual(begun.origin);
 const filmed=await page.evaluate(()=>{
  const g=window.__tinyKingdom,observations=[];
  let last=g.getStreetWalkState().position,steps=0,tour=g.getMarketTourAudit(),maxStep=0;
  while(tour.active&&steps++<600){
   g.advanceStreetWalk(.10);
   const camera=g.getStreetWalkState(),newPos=camera.position;
   maxStep=Math.max(maxStep,Math.hypot(newPos[0]-last[0],newPos[1]-last[1]));
   if(tour.lens&&tour.remaining>1.0){
    observations.push({...tour.lens,remaining:tour.remaining,position:newPos.slice(),actualYaw:camera.yaw});
   }
   last=newPos;tour=g.getMarketTourAudit();
  }
  return {tour,observations,maxStep,visit:g.getMarketVisitAudit(),
   after:JSON.stringify(g.exportSnapshot()),metrics:g.metrics(),
   mobileOverflow:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(filmed.tour.completed,JSON.stringify(filmed.tour)).toBe(true);
 expect(filmed.tour.travelledMeters).toBeGreaterThan(2.5);
 expect(filmed.maxStep).toBeLessThan(.26);
 // Genuine Day-120 alternate stalls can be just over 2.5m away; score
 // the actual odometer and swept motion, not an arbitrary sample count.
 expect(filmed.observations.length).toBeGreaterThanOrEqual(4);
 // RED on W16: physically projected market-post data was never consulted
 // when choosing the moving camera; the final frame could be all wall/post.
 const lens=filmed.observations;
 expect(lens.every(v=>Number.isFinite(v.chosenObstructionScore)&&
  Number.isFinite(v.requestedObstructionScore))).toBe(true);
 expect(lens.every(v=>v.chosenObstructionScore<=v.requestedObstructionScore+1e-6)).toBe(true);
 expect(lens.every(v=>Number.isFinite(v.centralPostCount)&&
  Number.isFinite(v.aimDeviation))).toBe(true);
 const obstructed=lens.filter(v=>v.requestedObstructionScore>4);
 if(obstructed.length)expect(obstructed.some(v=>v.chosenObstructionScore<v.requestedObstructionScore)).toBe(true);
 expect(filmed.visit.safe).toBe(true);
 expect(filmed.visit.architecture.portraitSafe).toBe(true);
 expect(filmed.after).toBe(begun.before); // camera journey cannot alter citizens / economy
 expect(filmed.mobileOverflow).toBeLessThanOrEqual(390);
 expect(filmed.gl).toBe(0);
 expect(pageErrors).toEqual([]);
});
