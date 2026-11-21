'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W07 RED-first: the original founding cottages crossed the PHYSICAL
// market square, so even the most careful spectator camera saw walls instead
// of genuine trading. Test built lots and moving society, not proxy pixels.
function courtIntruders(city){
 const court={x:-1,z:4.9,rx:7.55,rz:7.05};
 return city.map(([x,z,kind],index)=>{
  const rx=(2.4+kind*.42)*.5+.35,rz=(2.1+kind*.18)*.5+.35;
  const dx=Math.max(0,Math.abs(x-court.x)-rx);
  const dz=Math.max(0,Math.abs(z-court.z)-rz);
  return {index,x,z,kind,intersects:(dx/court.rx)**2+(dz/court.rz)**2<1.08**2};
 }).filter(lot=>lot.intersects);
}
test('W07 real founding and grown homes leave the public market court unobstructed',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:90000});
 await page.locator('#pause').click();
 await page.evaluate(()=>window.__tinyKingdom.reset());
 const arrival=await page.evaluate(()=>({
  world:window.__tinyKingdom.exportSnapshot(),
  numbers:window.__tinyKingdom.metrics()
 }));
 expect(arrival.numbers.citizens).toBe(12);
 expect(arrival.numbers.buildings).toBe(14);
 expect(courtIntruders(arrival.world.payload.city),
  'Real buildings eclipse the town market court at Day 1').toEqual([]);
 // The growing settlement must preserve every real resident and occupied
 // structure; relocating the founding lots cannot manufacture or hide people.
 for(let remaining=120*24*30+5*30;remaining>0;remaining-=7200){
  await page.evaluate(n=>{
   for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30);
  },Math.min(remaining,7200));
 }
 const growth=await page.evaluate(()=>({
  world:window.__tinyKingdom.exportSnapshot(),
  numbers:window.__tinyKingdom.metrics(),
  gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
 }));
 expect(growth.numbers.citizens).toBe(28);
 expect(growth.numbers.buildings).toBe(37);
 expect(courtIntruders(growth.world.payload.city),
  'A Day-120 building encroached on the original physical market').toEqual([]);
 expect(growth.gl).toBe(0);
 const before=JSON.stringify(growth.world);
 const visitor=await page.evaluate(()=>window.__tinyKingdom.visitMarket());
 expect(visitor.active&&visitor.safe).toBe(true);
 expect(visitor.composition?.grade).toBe('open-aisle');
 expect(visitor.architecture.totalForegroundCover,
  JSON.stringify({architecture:visitor.architecture,position:visitor.position})).toBeLessThan(.38);
 expect(JSON.stringify(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot()))).toBe(before);
 await page.screenshot({path:test.info().outputPath('w07-real-market-day120-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(400);
 const mobile=await page.evaluate(()=>({
  audit:window.__tinyKingdom.getMarketVisitAudit(),
  overflow:document.documentElement.scrollWidth>innerWidth,
  gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
 }));
 expect(mobile.audit.composition?.grade).toBe('open-aisle');
 expect(mobile.audit.architecture.totalForegroundCover).toBeLessThan(.38);
 expect(mobile.overflow).toBe(false);
 expect(mobile.gl).toBe(0);
 await page.screenshot({path:test.info().outputPath('w07-real-market-day120-mobile.png')});
 expect(errors).toEqual([]);
});