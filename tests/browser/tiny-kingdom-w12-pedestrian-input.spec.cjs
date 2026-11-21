'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W12 is one vertical piece of the Living Valley/market workstream.
// RED source contract: the old pedestrian dock intercepted the Command Desk
// toggle and keyboard/mobile taps between slow SwiftShader frames disappeared.
test('W12 one command dock and deterministic immediate keyboard/touch camera input at 390px',async({page})=>{
 test.setTimeout(170000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 const started=await page.evaluate(()=>{
  const g=window.__tinyKingdom;g.setSpeed(0);g.setStreetWalk(true);
  return {state:JSON.stringify(g.exportSnapshot()),walk:g.getStreetWalkState()};
 });
 expect(started.walk.active).toBe(true);
 // Both events are sent in the same JavaScript task. No render frame can
 // occur between them, regardless of renderer FPS or requestAnimationFrame.
 const keyboard=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=g.getStreetWalkState();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));
  return {before,after:g.getStreetWalkState()};
 });
 expect(Math.abs(keyboard.after.yaw-keyboard.before.yaw)).toBeGreaterThan(.08);
 // Emulate a short, legitimate pointer press in the SAME frame. Stub only
 // pointer capture because synthetic PointerEvents lack a registered pointer.
 const touch=await page.evaluate(()=>{
  const g=window.__tinyKingdom,b=document.querySelector('[data-street-key="arrowleft"]');
  const before=g.getStreetWalkState(),capture=b.setPointerCapture;
  b.setPointerCapture=()=>{};
  try{
   b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:17,pointerType:'touch',bubbles:true}));
   b.dispatchEvent(new PointerEvent('pointerup',{pointerId:17,pointerType:'touch',bubbles:true}));
  }finally{b.setPointerCapture=capture}
  return {before,after:g.getStreetWalkState()};
 });
 expect(Math.abs(touch.after.yaw-touch.before.yaw)).toBeGreaterThan(.08);
 // Opening the complete desk must remove the pedestrian overlay from hit
 // testing; closing the desk must restore the overlay without leaving walk.
 await page.locator('#street-command-desk').click();
 await expect(page.locator('.bottom')).toBeVisible();
 await expect(page.locator('#street-walk-controls')).toBeHidden();
 await expect(page.locator('#command-toggle')).toBeVisible();
 await page.locator('#command-toggle').click({timeout:20000});
 await expect(page.locator('.bottom')).toBeHidden();
 await expect(page.locator('#street-walk-controls')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(started.state);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
});
