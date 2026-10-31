'use strict';
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4175';
test('3D view renders authoritative public snapshots, preserves the classic route and exposes evidence separately',async({page,request},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const classic=await request.get(base+'/ant');expect(classic.ok()).toBeTruthy();
  await page.goto(base+'/ant/3d');
  await page.waitForFunction(()=>window.__ANT3D_METRICS__?.frames>2);
  expect(await page.evaluate(()=>window.__ANT3D_METRICS__.dropped)).toBe(0);
  expect(await page.evaluate(()=>window.__ANT3D_STATE__.schemaVersion)).toBe(1);
  await page.getByRole('button',{name:'Forest',exact:true}).click();
  await expect(page.getByRole('button',{name:'Forest',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:testInfo.outputPath('ant-forest-3d.png')});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:testInfo.outputPath('ant-mobile-3d.png')});
  expect(errors).toEqual([]);
  await page.goto(base+'/ant/gauntlet');await expect(page.locator('#verdict')).toHaveText('NOT PASSED');
  await expect(page.locator('#rounds article')).toHaveCount(3);
  for(const asset of ['colony-3d-core.js','colony-3d-renderer.js','colony-3d-app.js','gauntlet-status.json'])expect((await request.get(base+'/ant/'+asset)).ok()).toBeTruthy();
});
test('unsupported WebGL2 offers the preserved classic view',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:original.call(this,kind,...args);};});
  await page.goto(base+'/ant/3d');await expect(page.locator('#render-fallback')).toBeVisible();
  await expect(page.locator('#render-fallback a')).toHaveAttribute('href','/ant');
});
