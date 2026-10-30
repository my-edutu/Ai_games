'use strict';
const {test,expect}=require('@playwright/test');
async function openCity(page){
 await page.goto('/traffic/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('body')).toHaveAttribute('data-ready','true',{timeout:60000});
 await expect(page.locator('#loading-state')).toBeHidden();
}
test('real 3D city loads local assets and autonomous traffic advances',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await openCity(page);
 const first=await page.evaluate(()=>({state:window.cityTraffic.getSnapshot(),render:window.cityTraffic.getDiagnostics()}));
 expect(first.state.vehicles.length).toBeGreaterThan(15);expect(first.state.pedestrians).toHaveLength(48);expect(first.state.signals).toHaveLength(16);
 expect(first.render.rendererCalls).toBeGreaterThan(0);expect(first.render.triangles).toBeGreaterThan(10000);
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().tick)).toBeGreaterThan(first.state.tick);
 const second=await page.evaluate(()=>window.cityTraffic.getSnapshot());
 expect(second.vehicles.some(v=>{const prior=first.state.vehicles.find(p=>p.id===v.id);return prior&&Math.hypot(v.x-prior.x,v.z-prior.z)>0.01})).toBe(true);
 await expect(page.locator('#stat-active')).toHaveText(String(second.metrics.active));
 expect(errors).toEqual([]);
});
test('pause and speed controls change scheduling without changing traffic while paused',async({page})=>{
 await openCity(page);await page.locator('#pause-toggle').click();
 const tick=await page.evaluate(()=>window.cityTraffic.getSnapshot().tick);
 await page.locator('[data-speed="4"]').click();
 await expect(page.locator('#toast')).not.toContainText('Simulation running');
 await page.evaluate(()=>new Promise(resolve=>{let frames=0;function check(){if(++frames===6)resolve();else requestAnimationFrame(check)}requestAnimationFrame(check)}));
 expect(await page.evaluate(()=>window.cityTraffic.getSnapshot().tick)).toBe(tick);
 await expect(page.locator('[data-speed="4"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#pause-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().tick)).toBeGreaterThan(tick);
});
test('experiment controls change actual demand, signal policy and roadworks',async({page})=>{
 await openCity(page);await page.locator('#pause-toggle').click();
 if(!await page.locator('#experiment-panel').isVisible())await page.locator('#experiment-toggle').click();
 await page.locator('#rush-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().demand)).toBe(2);
 await page.locator('[data-policy="fixed"]').click();
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().policy)).toBe('fixed');
 await page.locator('#roadworks-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().incident)).toBe(true);
 await expect(page.locator('#roadworks-toggle')).toHaveAttribute('aria-pressed','true');
 await page.locator('#roadworks-toggle').click();
 await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getSnapshot().incident)).toBe(false);
});
test('camera, lighting, queue overlay and sound controls are connected',async({page})=>{
 await openCity(page);await page.locator('#pause-toggle').click();
 for(const mode of ['street','follow','aerial']){await page.locator(`[data-camera="${mode}"]`).click();await expect.poll(()=>page.evaluate(()=>window.cityTraffic.getDiagnostics().cameraMode)).toBe(mode);}
 await page.locator('#night-toggle').click();expect(await page.evaluate(()=>window.cityTraffic.getDiagnostics().night)).toBe(true);
 await page.locator('#overlay-toggle').click();expect(await page.evaluate(()=>window.cityTraffic.getDiagnostics().trafficOverlay)).toBe(true);
 await expect(page.locator('#overlay-legend')).toBeVisible();
 await page.locator('#sound-toggle').click();await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed','true');
 await page.locator('#sound-toggle').click();await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed','false');
});
test('mobile reduced-motion layout keeps real controls within the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await openCity(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const id of ['pause-toggle','experiment-toggle','night-toggle','help-open']){const box=await page.locator('#'+id).boundingBox();expect(box).not.toBeNull();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);expect(box.y+box.height).toBeLessThanOrEqual(844);}
 await page.evaluate(()=>window.cityTraffic.command({type:'set-paused',value:true}));
 await page.locator('#overlay-toggle').click();
 await page.locator('#experiment-toggle').click();await expect(page.locator('#demand-range')).toBeVisible();
 await expect(page.locator('#overlay-legend')).toBeVisible();
 await expect(page.locator('#queue-summary')).toBeVisible();
 const busiest=await page.evaluate(()=>[...window.cityTraffic.getSnapshot().signals].sort((a,b)=>b.queue-a.queue)[0]);
 await expect(page.locator('#queue-summary-location')).toContainText(busiest.id.toUpperCase());
 await expect(page.locator('#queue-summary-count')).toContainText(String(busiest.queue));
 await page.locator('#queue-focus').click();await expect(page.locator('#experiment-panel')).toBeHidden();
 await page.locator('#experiment-toggle').click();
 for(const selector of ['#experiment-close','#demand-range','#pause-toggle','[data-speed="2"]']){const box=await page.locator(selector).boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);}
 await page.locator('#demand-range').focus();await page.keyboard.press('Escape');await expect(page.locator('#experiment-panel')).toBeHidden();await expect(page.locator('#experiment-toggle')).toBeFocused();
 await page.locator('#help-open').click();await expect(page.locator('#help-dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#help-dialog')).toBeHidden();
});
test('WebGL failure gives a visible recovery action instead of a blank game',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).includes('webgl'))return null;return original.call(this,type,...args)};});
 await page.goto('/traffic/');await expect(page.locator('#fatal-state')).toBeVisible();await expect(page.locator('#reload-city')).toBeEnabled();await expect(page.locator('#loading-state')).toBeHidden();
});
test('lost graphics context restores the saved real simulation after reload',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await openCity(page);
 const saved=await page.evaluate(()=>{window.cityTraffic.command({type:'set-paused',value:true});window.cityTraffic.command({type:'set-demand',value:1.5});const snapshot=window.cityTraffic.getSnapshot();const gl=document.querySelector('#viewport canvas').getContext('webgl2');const loss=gl.getExtension('WEBGL_lose_context');if(!loss)throw new Error('Browser cannot exercise context loss');loss.loseContext();return{tick:snapshot.tick,demand:snapshot.demand};});
 await expect(page.locator('#fatal-state')).toBeVisible();await page.locator('#reload-city').click();
 await expect.poll(()=>page.evaluate(()=>Boolean(window.cityTraffic?.getDiagnostics().recovered))).toBe(true);
 const restored=await page.evaluate(()=>({state:window.cityTraffic.getSnapshot(),render:window.cityTraffic.getDiagnostics()}));
 expect(restored.state.tick).toBeGreaterThanOrEqual(saved.tick);expect(restored.state.demand).toBe(saved.demand);expect(restored.render.failed).toBe(false);
});
test('live progress page exposes evidence and preserves the independently recorded benchmark verdict',async({page})=>{
 await page.goto('/traffic/progress/');await expect(page.locator('#benchmark-status')).toHaveText('REFERENCE LEADS');await expect(page.locator('#build-status')).not.toHaveText('Loading progress…');
 await expect(page.getByRole('link',{name:'Open the city'})).toHaveAttribute('href','/traffic/');
 const response=await page.request.get('/traffic/progress/data.json');expect(response.ok()).toBe(true);const data=await response.json();expect(data.productionReady).toBe(false);expect(data.references).toHaveLength(3);
});
