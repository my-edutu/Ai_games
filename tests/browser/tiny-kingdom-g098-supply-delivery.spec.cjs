'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// RED first: the earlier G097 carriers replay a historical resource receipt but
// have no *real destination*. The new full-cycle contract demands that a
// producing citizen carries a bounded authoritative consignment over an actual
// safe navigated route, reaches the market, and visibly unloads it exactly once.
// Village-wide stock is booked at work completion; transfer must not mint stock.
// All presentation/camera reads must leave seeded authority untouched.
test('G098 work -> real cargo journey -> market receipt is navigable, replayable and player-visible',async({page})=>{
 test.setTimeout(190000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  if(typeof g.getActiveDeliveries!=='function'||typeof g.getDeliveryReceipts!=='function')
   return {missing:true};
  const first=JSON.stringify(g.exportSnapshot());
  let cargo=null;
  for(let i=0;i<30000;i++){
   g.step(1/30);
   if(i%3===0&&(cargo=g.getActiveDeliveries()[0]))break;
  }
  if(!cargo)return {missing:false,cargo:null};
  const afterRead=JSON.stringify(g.exportSnapshot());
  g.getActiveDeliveries();g.getDeliveryReceipts();
  const readOnly=JSON.stringify(g.exportSnapshot())===afterRead;
  const snapshot=g.exportSnapshot();
  g.restoreSnapshot(snapshot);
  const restored=g.getActiveDeliveries().find(row=>row.citizen===cargo.citizen);
  const restoredChecksum=g.exportSnapshot().checksum;
  const cameraBefore=JSON.stringify(g.exportSnapshot());
  document.getElementById('delivery-follow').click();
  const cameraAfter=JSON.stringify(g.exportSnapshot());
  const following=g.getCamera().follow;
  const liveStatusVisible=getComputedStyle(document.getElementById('workday-activity')).display!=='none';
  const liveMeterVisible=getComputedStyle(document.getElementById('workday-progress')).display!=='none';
  const routeStatus=document.getElementById('workday-activity').textContent;
  const selected=g.getSelectedCitizen();
  const route=g.getNavigation().find(n=>n.name===cargo.citizen);
  let receipt=null;
  for(let i=0;i<16000;i++){
   g.step(1/30);
   receipt=g.getDeliveryReceipts().find(row=>row.citizen===cargo.citizen);
   if(receipt)break;
  }
  const deliveriesAfter=g.getActiveDeliveries().filter(row=>row.citizen===cargo.citizen);
  const market=g.getMarketSupplyView();
  const stock=g.metrics();
  return {missing:false,first,cargo,readOnly,restored,restoredChecksum,
   expectedChecksum:snapshot.checksum,cameraUnchanged:cameraBefore===cameraAfter,
   following,liveStatusVisible,liveMeterVisible,routeStatus,selected,route,receipt,deliveriesAfter,market,stock};
 });
 expect(staged.missing).toBe(false);
 expect(staged.cargo).toBeTruthy();
 expect(['food','wood']).toContain(staged.cargo.resource);
 expect(staged.cargo.amount).toBeGreaterThan(0);
 expect(staged.cargo.destination.length).toBe(2);
 expect(staged.cargo.activity).toMatch(/Traveling with/);
 expect(staged.readOnly).toBe(true);
 expect(staged.restored).toMatchObject({citizen:staged.cargo.citizen,
  resource:staged.cargo.resource,amount:staged.cargo.amount});
 expect(staged.restoredChecksum).toBe(staged.expectedChecksum);
 expect(staged.cameraUnchanged).toBe(true);
 expect(staged.following).toBe(true);
 expect(staged.liveStatusVisible).toBe(true);
 expect(staged.liveMeterVisible).toBe(true);
 expect(staged.routeStatus).toMatch(/market/i);
 expect(staged.selected).toBe(staged.cargo.citizen);
 expect(staged.route).toBeTruthy();
 expect(staged.receipt).toMatchObject({citizen:staged.cargo.citizen,
  resource:staged.cargo.resource,amount:staged.cargo.amount});
 expect(staged.deliveriesAfter).toEqual([]);
 expect(staged.stock.food).toBeGreaterThanOrEqual(0);
 expect(staged.stock.wood).toBeGreaterThanOrEqual(0);
 expect(staged.market.inTransit.food).toBeGreaterThanOrEqual(0);
 expect(staged.market.inTransit.wood).toBeGreaterThanOrEqual(0);
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('#delivery-follow')).toBeVisible();
 const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>innerWidth,
  role:document.getElementById('workday-activity').getAttribute('role'),
  routeLabel:document.getElementById('workday-progress').getAttribute('aria-label'),
  routeMeterVisible:getComputedStyle(document.getElementById('workday-progress')).display!=='none',
  glError:document.querySelector('#world').getContext('webgl')?.getError()||0
 }));
 expect(mobile.overflow).toBe(false);
 expect(mobile.role).toBe('status');
 expect(mobile.routeLabel).toMatch(/market|delivery/i);
 expect(mobile.routeMeterVisible).toBe(true);
 expect(mobile.glError).toBe(0);
 expect(pageErrors).toEqual([]);
});
