'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');

// Existing stream tests exercise live simulation. These pin a real public frame
// to exercise layout and scene-only transitions without simulation timing races.
for(const [game,port,globalName] of [['tower',4176,'__TOWER_PUBLIC_STATE__'],['maze',4174,'__MAZE_PUBLIC_STATE__']]){
 const base=`http://127.0.0.1:${port}`;
 test(`${game} portrait keeps the stage and important HUD inside the viewport`,async({page,request})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await request.get(`${base}/${game}/state?w=390&h=844`);expect(response.ok()).toBe(true);
  const frame=await response.json();expect(frame.snapshot).toBeTruthy();
  frame.scene='normal';if(game==='maze'){frame.snapshot.progressPermille=500;frame.camera={mode:'local',centerCell:frame.snapshot.currentCell};}
  await page.route(`**/${game}/state**`,route=>route.fulfill({json:frame}));
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/${game}?reducedMotion=1`);
  await page.waitForFunction(name=>Boolean(window[name]),globalName);
  const box=await page.locator('canvas').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.width).toBeGreaterThan(300);expect(box.height).toBeGreaterThan(200);expect(box.x+box.width).toBeLessThanOrEqual(391);expect(box.y+box.height).toBeLessThanOrEqual(845);
  await expect(page.locator('[data-testid="ai-intent"]')).toBeVisible();
  if(game==='tower')await expect(page.locator('[data-testid="health"]')).toBeVisible();
  else expect(await page.evaluate(()=>window.__MAZE_VIEW__.widthCells)).toBeLessThanOrEqual(7);
  const dir=path.resolve(__dirname,`../../artifacts/${game}-phase3`);fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:path.join(dir,'polish-phone-portrait.png'),fullPage:true});expect(errors).toEqual([]);
 });
 test(`${game} rejects stale frames and recovers after a feed failure`,async({page,request})=>{
  const response=await request.get(`${base}/${game}/state?w=1280&h=720`);expect(response.ok()).toBe(true);
  const original=await response.json();let frame=structuredClone(original),fail=false;
  await page.route(`**/${game}/state**`,route=>route.fulfill({status:fail?503:200,json:fail?{}:frame}));
  await page.goto(`${base}/${game}`);await page.waitForFunction(name=>Boolean(window[name]),globalName);
  const tick=frame.snapshot.tick;frame.snapshot.tick=tick-1;frame.snapshot.revision--;
  const status=page.locator(game==='tower'?'#provider-state':'#integrity');
  await expect(status).toContainText('WAITING');expect(await page.evaluate(name=>window[name].tick,globalName)).toBe(tick);
  fail=true;await expect(status).toContainText('RECONNECT');
  frame=structuredClone(original);fail=false;await expect(status).toContainText('CONNECTED');
 });
}
test('tower populates upgrade and result cards when only the scene changes',async({page,request})=>{
 const base='http://127.0.0.1:4176',response=await request.get(`${base}/tower/state?w=1280&h=720`);
 expect(response.ok()).toBe(true);const frame=await response.json();
 frame.scene='normal';frame.snapshot.upgradeOffers=[{id:'test-shield',family:'defence',name:'Shield capacitor'}];
 await page.route('**/tower/state**',route=>route.fulfill({json:frame}));await page.goto(`${base}/tower`);
 await page.waitForFunction(()=>Boolean(window.__TOWER_PUBLIC_STATE__));
 frame.scene='upgrade';await expect(page.locator('#choice-card')).toBeVisible();await expect(page.locator('#choice-options')).toContainText('Shield capacitor');
 frame.scene='result';await expect(page.locator('#result-card')).toBeVisible();
 await expect(page.locator('#result-height')).toHaveText(`${Math.floor(frame.snapshot.progress.height/1000)}m`);
});
