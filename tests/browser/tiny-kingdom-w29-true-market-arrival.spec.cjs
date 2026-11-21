'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W29 Living Valley: real W27 Day-120 uncut mobile market video ended against
// an opaque cottage. W28 checks roof rays during walking, but final arrival
// changed the camera's pitch AFTER selecting its supposedly clear yaw.
// The visible FINAL frame must be measured at the actual chosen pitch.
// Never move a citizen, alter a stall or credit any fictional delivery.
for(const grown of [false,true])test(
 'W29 mobile market arrives with pitch-matched physical 3D framing '+(grown?'Day120':'Day1'),
 async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  await page.evaluate(()=>{window.__tinyKingdom.reset();window.__tinyKingdom.setSpeed(0);});
  if(grown){
   for(let n=120*24*30;n>0;n-=7200){
    await page.evaluate(count=>{for(let i=0;i<count;i++)window.__tinyKingdom.step(1/30)},
     Math.min(n,7200));
   }
  }
  const result=await page.evaluate(()=>{
   const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
   const first=g.visitMarket();
   const next=g.nextMarketStall();
   let stepCount=0,tour=g.getMarketTourAudit(),maxStep=0;
   let last=g.getStreetWalkState().position;
   while(tour.active&&stepCount++<750){
    g.advanceStreetWalk(.10);
    const position=g.getStreetWalkState().position;
    maxStep=Math.max(maxStep,Math.hypot(position[0]-last[0],position[1]-last[1]));
    last=position;tour=g.getMarketTourAudit();
   }
   const arrival=tour.arrival;
   return {first,next,tour,arrival,maxStep,stepCount,
    state:g.getStreetWalkState(),visit:g.getMarketVisitAudit(),
    authorityUnchanged:JSON.stringify(g.exportSnapshot())===before,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    width:document.documentElement.scrollWidth};
  });
  expect(result.first.active,JSON.stringify(result.first)).toBe(true);
  expect(result.next.started,JSON.stringify(result.next)).toBe(true);
  expect(result.tour.completed,JSON.stringify(result.tour)).toBe(true);
  expect(result.tour.travelledMeters).toBeGreaterThan(2.5);
  expect(result.maxStep).toBeLessThan(.26);
  // RED on W28: no actual-final-pitch frame audit; its view can fill with roof.
  expect(result.arrival?.source).toBe('pitched-physical-market-arrival');
  expect(result.arrival?.pitchProbes).toBeGreaterThanOrEqual(5);
  expect(result.arrival?.physicalSamples).toBe(15);
  expect(result.arrival?.actualTilt).toBeCloseTo(result.state.tilt,7);
  expect(result.arrival?.actualBearing).toBeCloseTo(result.state.yaw,7);
  expect(result.arrival?.frame.blockedFraction).toBeLessThanOrEqual(
   result.arrival?.unrefinedFrame.blockedFraction+0.001);
  expect(result.arrival?.frame.centralBlocked).toBeLessThanOrEqual(
   result.arrival?.unrefinedFrame.centralBlocked);
  expect(result.arrival?.frame.blockedFraction).toBeLessThanOrEqual(
   result.arrival?.scoredFrame.blockedFraction+0.001);
  expect(result.visit.safe).toBe(true);
  expect(result.authorityUnchanged).toBe(true);
  expect(result.gl).toBe(0);
  expect(result.width).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
 });
