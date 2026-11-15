'use strict';
// W365: exercise user-opened REAL five-stage economy controls on the actual
// WebGL world and original 390px DOM; never stage citizens or transactions.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const HTML=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const out='artifacts/tiny-kingdom-w365-mobile-parcel';
fs.mkdirSync(out,{recursive:true});
test.use({video:'on'});
test('W365 390px real parcel ledger keeps the moving village visible and all five stages touchable',async({page})=>{
 test.setTimeout(330000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(HTML);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>85000,null,{timeout:150000});
 const original=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);g.setCommandView('world');
  return JSON.stringify(g.exportSnapshot());
 });
 const toggle=page.locator('#world-trace-toggle');
 await toggle.click();
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('body')).toHaveAttribute('data-supply-details','closed');
 const packed=await page.evaluate(()=>{
  const rect=id=>{const a=document.getElementById(id).getBoundingClientRect();
   return {x:a.left,y:a.top,right:a.right,bottom:a.bottom,width:a.width,height:a.height};};
  const root=rect('world-ribbon'),close=rect('world-trace-toggle'),
   details=rect('grain-chain-details'),follow=rect('world-trace-follow'),
   caption=rect('grain-chain-caption');
  const stages=[...document.querySelectorAll('#grain-chain-steps button')].map(b=>{
   const r=b.getBoundingClientRect();return {id:b.id,x:r.left,right:r.right,y:r.top,bottom:r.bottom,
    height:r.height,aria:b.getAttribute('aria-label')};});
  const overlap=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
  return {root,close,details,follow,caption,stages,
   fullCaption:document.getElementById('grain-chain-caption').textContent,
   captionAccessible:getComputedStyle(document.getElementById('grain-chain-caption')).visibility==='visible',
   controlsInside:[close,details,follow,...stages].every(r=>r.x>=root.x-2&&
    r.right<=root.right+2&&r.y>=root.y-2&&r.bottom<=root.bottom+2),
   overlappingActions:overlap(details,follow)||overlap(close,details)||overlap(close,follow),
   rootArea:root.width*root.height,screenArea:innerWidth*innerHeight,
   viewportOverflow:document.documentElement.scrollWidth-innerWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError()};
 });
 fs.writeFileSync(out+'/390-physical-dock.json',JSON.stringify(packed,null,2));
 expect(packed.root.height).toBeLessThanOrEqual(184.1);
 expect(packed.rootArea/packed.screenArea).toBeLessThan(.22);
 expect(packed.stages.length).toBe(5);
 expect(packed.controlsInside).toBe(true);
 expect(packed.overlappingActions).toBe(false);
 expect(packed.captionAccessible).toBe(true);
 expect(packed.fullCaption.length).toBeGreaterThan(10);
 for(const stage of packed.stages){expect(stage.height).toBeGreaterThanOrEqual(44);
  expect(stage.aria?.length).toBeGreaterThan(6);}
 expect(packed.close.height).toBeGreaterThanOrEqual(44);
 expect(packed.details.height).toBeGreaterThanOrEqual(44);
 expect(packed.follow.height).toBeGreaterThanOrEqual(44);
 expect(packed.viewportOverflow).toBeLessThanOrEqual(0);expect(packed.gl).toBe(0);
 await page.screenshot({path:out+'/390-authentic-economy-dock.png'});
 await page.locator('#grain-chain-details').click();
 await expect(page.locator('body')).toHaveAttribute('data-supply-details','open');
 for(const id of ['supply-field','supply-cargo','supply-receipt','supply-trade','supply-meal','supply-home'])
  await expect(page.locator('#'+id)).toBeAttached();
 const expanded=await page.evaluate(()=>{
  const el=document.getElementById('world-ribbon');
  return {height:el.getBoundingClientRect().height,scrollHeight:el.scrollHeight,
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(expanded.height).toBeLessThanOrEqual(310.1);
 expect(expanded.overflow).toBeLessThanOrEqual(0);
 await page.screenshot({path:out+'/390-real-receipt-details-open.png'});
 await page.locator('#world-trace-toggle').click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(page.locator('#world-supply-trail')).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(original);
 expect(errors).toEqual([]);
});
