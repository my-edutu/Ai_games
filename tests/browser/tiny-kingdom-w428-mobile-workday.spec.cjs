'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const width of [390,1024]){
 test('W428 real 3D workers and accessible world-first controls '+width,async({page})=>{
  test.setTimeout(240000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:150000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const original=await page.evaluate(()=>({
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   people:window.__tinyKingdom.metrics().citizens,
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   overflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(original.people).toBeGreaterThanOrEqual(12);
  expect(original.triangles).toBeGreaterThan(0);
  expect(original.triangles).toBeLessThan(160000);
  expect(original.gl).toBe(0);
  expect(original.overflow).toBeLessThanOrEqual(0);
  const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w428');
  fs.mkdirSync(root,{recursive:true});
  if(width===390){
   const disclosure=page.locator('#mobile-transport-disclosure');
   await expect(disclosure).toBeVisible();
   await expect(disclosure).toHaveAttribute('aria-expanded','false');
   await expect(page.locator('#pause')).toBeVisible();
   await expect(page.locator('#save')).toBeHidden();
   const compact=await page.locator('#transport-actions').boundingBox();
   expect(compact.width).toBeLessThan(145);
   expect(compact.height).toBeLessThanOrEqual(65);
   await page.screenshot({path:path.join(root,'390-original-world-clear-controls.png')});
   await disclosure.click();
   await expect(disclosure).toHaveAttribute('aria-expanded','true');
   await expect(page.locator('#save')).toBeVisible();
   await expect(page.locator('#restore')).toBeVisible();
   await expect(page.locator('#speed4')).toBeVisible();
   const full=await page.locator('#transport-actions').boundingBox();
   expect(full.height).toBeLessThanOrEqual(300);
   await page.screenshot({path:path.join(root,'390-all-original-controls-open.png')});
   await disclosure.click();
   await expect(page.locator('#save')).toBeHidden();
   await expect(page.locator('#pause')).toBeVisible();
  }else{
   await expect(page.locator('#mobile-transport-disclosure')).toBeHidden();
   await expect(page.locator('#save')).toBeVisible();
   await page.screenshot({path:path.join(root,'1024-original-controls.png')});
  }
  const after=await page.evaluate(()=>({
   snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
   people:window.__tinyKingdom.metrics().citizens,
   gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
   overflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(after.snapshot).toEqual(original.snapshot);
  expect(after.people).toEqual(original.people);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(root,width+'-original-control-evidence.json'),
   JSON.stringify({source:'exact-GitHub-PR-head',viewport:width,first:{
    people:original.people,triangles:original.triangles,gl:original.gl},
    unchangedSavedWorld:after.snapshot===original.snapshot,
    errors,softwareGL:true,hardwareFPS:'NOT MEASURED',
    experienceGate:'NOT PROVEN',independentReview:'NOT AVAILABLE'},null,2));
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(root,width+'-uncut-original-controls.webm'));
 });
}