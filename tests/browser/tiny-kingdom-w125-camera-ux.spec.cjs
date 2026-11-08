'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.join(__dirname,'../../artifacts/tiny-kingdom-w125');
fs.mkdirSync(OUT,{recursive:true});
test.use({video:'on'});

async function loaded(page,width,height){
 await page.setViewportSize({width,height});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.metrics().citizens>=12,{timeout:45000});
 await page.locator('#pause').click();
 return errors;
}
async function film(page,name){
 const video=page.video();
 await page.close();
 if(video)await video.saveAs(path.join(OUT,name+'.webm'));
}

test('W125 desktop free orbit, keyboard, collision-aware zoom and smooth overview keep authoritative world',async({page})=>{
 const errors=await loaded(page,1280,800);
 const initial=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 for(const id of ['camera-home','camera-near','camera-far','camera-street']){
  await expect(page.locator('#'+id)).toBeVisible();
  await expect(page.locator('#'+id)).toHaveAttribute('type','button');
 }
 await page.locator('#world').focus();
 const before=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 await page.keyboard.press('ArrowLeft');
 await expect.poll(async()=>page.evaluate(()=>window.__tinyKingdom.getCamera().yaw)).not.toBe(before.yaw);
 const yaw=await page.evaluate(()=>window.__tinyKingdom.getCamera().yaw);
 await page.keyboard.press('ArrowRight');
 expect(Math.abs((await page.evaluate(()=>window.__tinyKingdom.getCamera().yaw))-before.yaw)).toBeLessThan(.1);
 await page.locator('#camera-near').click();
 const nearer=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 expect(nearer.zoom).toBeLessThan(before.zoom);
 await page.locator('#camera-far').click();
 const farther=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 expect(farther.zoom).toBeGreaterThan(nearer.zoom);
 const occlusion=await page.evaluate(()=>window.__tinyKingdom.getFreeCameraCollisionAudit());
 expect(occlusion.eyeClear).toBe(true);
 await page.locator('#world').focus();
 await page.keyboard.press('f');
 await expect.poll(async()=>page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
 const selected=await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen());
 await page.keyboard.press('Home');
 await expect.poll(async()=>page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(false);
 await expect.poll(async()=>page.evaluate(()=>window.__tinyKingdom.getCameraNavigationAudit().transitionActive),{timeout:20000}).toBe(false);
 const audit=await page.evaluate(()=>window.__tinyKingdom.getCameraNavigationAudit());
 expect(audit.transitionActive).toBe(false);
 expect(audit.overviewReturns).toBeGreaterThan(0);
 expect(await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(selected);
 await page.screenshot({path:path.join(OUT,'desktop-overview.png'),fullPage:true});
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(initial);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()||0)).toBe(0);
 expect(errors).toEqual([]);
 await film(page,'desktop-camera-interactions');
});

test('W125 390px touch buttons, two-finger dolly/pan, reduced motion, and real selected citizen',async({page})=>{
 const errors=await loaded(page,390,844);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const id of ['camera-home','camera-near','camera-far','camera-street']){
  const box=await page.locator('#'+id).boundingBox();
  expect(box,id+' missing').not.toBeNull();
  expect(box.width,id).toBeGreaterThanOrEqual(44);
  expect(box.height,id).toBeGreaterThanOrEqual(44);
  expect(box.x,id).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width,id).toBeLessThanOrEqual(390);
  expect(box.y+box.height,id).toBeLessThanOrEqual(844);
 }
 expect(await page.locator('#world').evaluate(el=>getComputedStyle(el).touchAction)).toBe('none');
 const snapshot=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 const before=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:146,y:400,id:1},{x:244,y:400,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:103,y:390,id:1},{x:284,y:390,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await page.evaluate(()=>window.__tinyKingdom.getCamera());
 expect(after.zoom).toBeLessThan(before.zoom);
 expect(await page.evaluate(()=>window.__tinyKingdom.getCameraNavigationAudit().pinchGestures)).toBeGreaterThan(0);
 await page.locator('#camera-home').click();
 const back=await page.evaluate(()=>window.__tinyKingdom.getCameraNavigationAudit());
 expect(back.transitionActive).toBe(false);
 await page.locator('#camera-near').click();
 await page.locator('#camera-far').click();
 const zoomAudit=await page.evaluate(()=>window.__tinyKingdom.getFreeCameraCollisionAudit());
 expect(zoomAudit.eyeClear).toBe(true);
 await page.locator('#world').focus();
 await page.keyboard.press('f');
 const selected=await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen());
 expect(typeof selected).toBe('string');
 await page.locator('#camera-home').click();
 expect(await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(selected);
 await page.screenshot({path:path.join(OUT,'mobile-390-world.png'),fullPage:true});
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(snapshot);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()||0)).toBe(0);
 expect(errors).toEqual([]);
 await film(page,'mobile-390-gestures');
});
