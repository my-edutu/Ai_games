'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G092: a player should be able to observe an actual LIVE occupational shift,
// not only a past event, with a close readable camera and visible work progress.
// This tests game state, real activity, controls, and preserved authority; it
// explicitly does NOT certify AAA visual quality or hardware performance.
test('G092 live workday director follows and explains real ongoing labor',async({page})=>{
 test.setTimeout(170000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0);
 await page.locator('#pause').click();
 const staged=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<20000;i++){
   g.step(1/30);
   if(g.getActiveWorksites().length>=2)break;
  }
  return {sites:g.getActiveWorksites(),snapshot:JSON.stringify(g.exportSnapshot())};
 });
 expect(staged.sites.length).toBeGreaterThanOrEqual(2);
 // Button is a genuine player-accessible control, not an inert inspector API.
 const live=page.locator('#workday-live');
 await expect(live).toHaveAttribute('aria-label',/live|working|workday/i);
 await live.click();
 const entered=await page.evaluate(()=>({
  camera:window.__tinyKingdom.getCamera(),
  view:window.__tinyKingdom.getLiveWorkdayView(),
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  mode:document.body.dataset.workday,
  message:document.getElementById('workday-activity').textContent,
  progress:document.getElementById('workday-progress').value,
  command:window.__tinyKingdom.getCommandView()
 }));
 expect(entered.snapshot).toBe(staged.snapshot);
 expect(entered.mode).toBe('live');
 expect(entered.command).toBe('world');
 expect(entered.camera.follow).toBe(true);
 expect(entered.camera.pitch).toBeLessThan(.66);
 expect(entered.camera.zoom).toBeLessThan(11);
 expect(staged.sites.some(s=>s.citizen===entered.view.citizen)).toBe(true);
 expect(entered.view.active).toBe(true);
 expect(entered.view.progress).toBeGreaterThanOrEqual(0);
 expect(entered.view.progress).toBeLessThan(1);
 expect(entered.progress).toBeGreaterThanOrEqual(0);
 expect(entered.message).toContain(entered.view.citizen);
 await expect(live).toHaveAttribute('aria-pressed','true');
 const later=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<10;i++)g.step(1/30);
  const before=JSON.stringify(g.exportSnapshot());
  document.getElementById('workday-live').click(); // choose another genuine shift
  return {before,after:JSON.stringify(g.exportSnapshot()),view:g.getLiveWorkdayView(),
   camera:g.getCamera(),sites:g.getActiveWorksites()};
 });
 expect(later.after).toBe(later.before);
 expect(later.view.active).toBe(true);
 expect(later.view.citizen).not.toBe(entered.view.citizen);
 expect(later.sites.some(s=>s.citizen===later.view.citizen)).toBe(true);
 expect(later.camera.zoom).toBeLessThan(11);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({
  scrollOverflow:document.documentElement.scrollWidth>innerWidth,
  progressVisible:!!document.querySelector('#workday-progress'),
  status:document.getElementById('workday-activity').getAttribute('role'),
  selected:window.__tinyKingdom.getLiveWorkdayView().citizen,
  snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
  glError:document.querySelector('#world').getContext('webgl')?.getError()??0
 }));
 expect(mobile.scrollOverflow).toBe(false);
 expect(mobile.progressVisible).toBe(true);
 expect(mobile.status).toBe('status');
 expect(mobile.selected).toBe(later.view.citizen);
 expect(mobile.glError).toBe(0);
 await page.evaluate(()=>document.querySelector('.tour-btn[data-scenic="market"]').click());
 expect(await page.evaluate(()=>window.__tinyKingdom.getLiveWorkdayView().active)).toBe(false);
 expect(await live.getAttribute('aria-pressed')).toBe('false');
 expect(errors).toEqual([]);
});