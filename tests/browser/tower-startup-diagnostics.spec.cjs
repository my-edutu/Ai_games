'use strict';
const {test,expect}=require('@playwright/test');
test.use({launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test('first-party 3D lab boot sequence emits precise errors instead of silent timeouts',async({page})=>{
 const errors=[],badResponses=[],failedRequests=[],consoleErrors=[];
 page.on('pageerror',e=>errors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()})});
 page.on('requestfailed',r=>failedRequests.push({url:r.url(),reason:r.failure()?.errorText}));
 await page.goto('http://127.0.0.1:4176/tower/volumetric',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(2500);
 const state=await page.evaluate(()=>({
  state:{...window.__TOWER_VOLUMETRIC_STATE__},
  canvas:document.querySelector('#volumetric-canvas')?.getBoundingClientRect()?.toJSON(),
  statusText:document.querySelector('#status')?.textContent,
  sceneModules:performance.getEntriesByType('resource').filter(r=>r.name.includes('/tower/')).map(r=>r.name)
 }));
 const summary={state,errors,consoleErrors,badResponses,failedRequests};
 console.log('TOWER_3D_BOOT_DIAGNOSTICS '+JSON.stringify(summary).slice(0,20000));
 expect(badResponses).toEqual([]);
 expect(failedRequests).toEqual([]);
 expect(errors).toEqual([]);
 expect(state.state?.status).toBe('live');
 expect(state.state?.tick).toBeGreaterThan(0);
});
