'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(
 path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W97 observes genuine authoritative harvest -> escrowed courier ->
// physical market credit -> actual occupied home, never creates a worker,
// delivery, resource or camera-only receipt to make a movie look better.
// This Playwright test is a technical floor, NOT independent UX approval.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W97 truthful supply trail and real worker follow '+viewport.width,async({page},testInfo)=>{
  test.setTimeout(225000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:135000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const prior=JSON.stringify(g.exportSnapshot());
   const flow=g.getSupplyTrailSnapshot();
   return {prior,flow,after:JSON.stringify(g.exportSnapshot()),
    active:g.getActiveDeliveries(),receipts:g.getDeliveryReceipts(),
    market:g.getMarketSupplyView(),day:g.metrics().day};
  });
  expect(initial.prior).toBe(initial.after);
  expect(initial.flow.source).toBe('read-only-authentic-farm-courier-market-home');
  expect(initial.flow.noSyntheticActors).toBe(true);
  expect(initial.flow.noSyntheticTransactions).toBe(true);
  expect(initial.flow.inTransit).toEqual(initial.market.inTransit);
  expect(initial.flow.escrowed).toEqual(initial.market.escrowed);
  if(initial.flow.cargo)
   expect(initial.active.find(d=>d.id===initial.flow.cargo.id)).toBeDefined();
  if(initial.flow.latestReceipt)
   expect(initial.receipts.find(r=>r.id===initial.flow.latestReceipt.id)).toBeDefined();
  const toggle=page.locator('#world-trace-toggle');
  const strip=page.locator('#world-supply-trail');
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(strip).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(strip).toBeVisible();
  const visible=await page.evaluate(()=>{
   const strip=document.getElementById('world-supply-trail');
   const button=document.getElementById('world-trace-follow');
   const rect=strip.getBoundingClientRect();
   const flow=window.__tinyKingdom.getSupplyTrailSnapshot();
   const values=['supply-field','supply-cargo','supply-receipt','supply-home']
    .map(id=>document.getElementById(id).textContent);
   return {flow,values,
    bounds:{left:rect.left,right:rect.right,bottom:rect.bottom,
     buttonHeight:button.getBoundingClientRect().height},
    scrollWidth:document.documentElement.scrollWidth,
    state:JSON.stringify(window.__tinyKingdom.exportSnapshot())};
  });
  expect(visible.state).toBe(initial.prior);
  expect(visible.values.every(x=>x.trim().length>0)).toBe(true);
  expect(visible.bounds.left).toBeGreaterThanOrEqual(-1);
  expect(visible.bounds.right).toBeLessThanOrEqual(viewport.width+1);
  expect(visible.bounds.buttonHeight).toBeGreaterThanOrEqual(40);
  expect(visible.scrollWidth).toBeLessThanOrEqual(viewport.width);
  if(initial.flow.cargo){
   expect(visible.values[1]).toContain(initial.flow.cargo.resource);
   expect(visible.values[1]).toMatch(/Hauling|Unloading/);
  }else expect(visible.values[1]).toBe('No loaded courier');
  if(initial.flow.latestReceipt)
   expect(visible.values[2]).toContain('Day ');
  else {
   // W267 adds truthful stock context; do not reject a legitimate empty
   // receipt just because it also explains why no grain is in the dock.
   expect(visible.values[2]).toContain('No receipt yet');
   expect(visible.values[2]).toContain('no unspent verified grain at dock');
   expect(visible.values[2]).not.toContain('Day ');
  }

  await page.locator('#world-trace-follow').click();
  const afterFollow=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    selected:g.getSelectedCitizen(),workday:document.body.dataset.workday,
    geometry:g.renderStats().lastFrameTriangles,
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(afterFollow.snapshot).toBe(initial.prior);
  expect(afterFollow.geometry).toBeGreaterThan(0);
  expect(afterFollow.glError).toBe(0);
  if(initial.flow.cargo){
   expect(afterFollow.workday).toBe('delivery');
   // An observer must follow the EXACT real cart displayed in the trail,
   // not silently switch to another loaded villager.
   expect(afterFollow.selected).toBe(initial.flow.cargo.citizen);
  }
  else if(initial.flow.farmer)
   expect(afterFollow.workday).toBe('live');
  expect(pageErrors).toEqual([]);
  await testInfo.attach('W97-real-causal-chain-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
  await toggle.click();
  await expect(strip).toBeHidden();
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot())))
   .toBe(initial.prior);
 });
}
