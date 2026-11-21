'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G142: the same autonomous citizens must physically return to the actual
// cottage whose exterior panes become luminous; no fake residents, movement,
// economy transactions, time, resources or camera-driven AI decisions.
test('G142 residents reach their genuine homes, light only inhabited cottages, and remain playable at 390px',async({page})=>{
 test.setTimeout(240000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:75000});
 await page.locator('#pause').click();
 const dusk=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const here=g.getDailyRhythmAudit().hour,ahead=(22-here+24)%24,steps=Math.max(1,Math.ceil(ahead*30));
  for(let i=0;i<steps;i++)g.step(ahead/steps);
  const snapshot=JSON.stringify(g.exportSnapshot());
  const view=g.watchHomecoming();
  return {view,snapshot,after:JSON.stringify(g.exportSnapshot()),rhythm:g.getDailyRhythmAudit()};
 });
 expect(dusk.rhythm.shift).toBe('night-rest');
 expect(dusk.rhythm.counts.returning+dusk.rhythm.counts.resting).toBeGreaterThan(0);
 expect(dusk.view?.active).toBe(true);
 expect(dusk.view?.inWorld).toBe(true);
 expect(dusk.snapshot).toBe(dusk.after);
 expect(await page.locator('#homecoming-follow').getAttribute('aria-pressed')).toBe('true');
 const overnight=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const here=g.getDailyRhythmAudit().hour,ahead=(4-here+24)%24,steps=Math.max(1,Math.ceil(ahead*30));
  for(let i=0;i<steps;i++)g.step(ahead/steps);
  const households=g.getOccupiedHouseholds(),rhythm=g.getDailyRhythmAudit();
  return {households,rhythm,nav:g.getNavigation(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(overnight.rhythm.shift).toBe('night-rest');
 expect(overnight.rhythm.counts.working).toBe(0);
 expect(overnight.households.length).toBeGreaterThan(0);
 const residentNames=new Set();
 for(const house of overnight.households){
  expect(house.residents.length).toBeGreaterThan(0);
  expect(house.homeIndex).toBeGreaterThanOrEqual(0);
  expect(house.homeIndex).toBeLessThan(overnight.rhythm.householdCount);
  for(const name of house.residents){
   expect(residentNames.has(name)).toBe(false);residentNames.add(name);
   const p=overnight.nav.find(c=>c.name===name);
   const witness=overnight.rhythm.citizens.find(c=>c.name===name);
   expect(p.activity).toBe('Resting at home');
   expect(witness.homeIndex).toBe(house.homeIndex);
   expect(Math.hypot(p.position[0]-p.target[0],p.position[1]-p.target[1])).toBeLessThan(.41);
  }
 }
 await page.waitForFunction(()=>window.__tinyKingdom.getHouseholdLightAudit().litHomes>0,null,{timeout:60000});
 const light=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {audit:g.getHouseholdLightAudit(),
   snapshot:JSON.stringify(g.exportSnapshot()),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(light.snapshot).toBe(overnight.snapshot);
 expect(light.audit.source).toBe('physical-residents-at-assigned-doorways');
 expect(light.audit.litHomes).toBe(Math.min(14,overnight.households.length));
 expect(light.audit.litWindows).toBe(light.audit.litHomes*8);
 expect(light.audit.litCitizens).toBeGreaterThanOrEqual(light.audit.litHomes);
 expect(light.audit.triangles).toBeLessThan(1600);
 expect(light.gl).toBe(0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(700);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 const mobile=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {view:g.getHomecomingView(),lighting:g.getHouseholdLightAudit(),
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
 });
 expect(mobile.view.inWorld).toBe(true);
 expect(mobile.lighting.litHomes).toBeGreaterThan(0);
 expect(mobile.gl).toBe(0);
 await page.locator('#homecoming-follow').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getHomecomingView()?.active)).toBe(true);
 expect(errors).toEqual([]);
});
