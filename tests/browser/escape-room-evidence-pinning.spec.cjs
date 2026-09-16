'use strict';
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4177';

test('evidence replay frame stays pinned when a live state request is already in flight',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  let delayed=false;
  await page.route('**/escape-room/state?**',async route=>{
    if(!delayed){delayed=true;await new Promise(resolve=>setTimeout(resolve,700));}
    await route.continue();
  });
  await page.goto(`${base}/escape-room?muted=1&evidence=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__ESCAPE_PRESENT_FRAME__));
  const frame=await page.evaluate(async()=>{
    const response=await fetch('/escape-room/replay',{cache:'no-store'});
    const data=await response.json();
    return data.frames?.[0]??null;
  });
  expect(frame).toBeTruthy();
  await page.evaluate(frame=>window.__ESCAPE_PRESENT_FRAME__(frame),frame);
  await page.waitForTimeout(950);
  const pinned=await page.evaluate(()=>({
    tick:window.__ESCAPE_PUBLIC_STATE__?.tick,
    authorityChecksum:window.__ESCAPE_PUBLIC_STATE__?.authorityChecksum,
    connection:document.querySelector('[data-testid="connection"]')?.textContent,
  }));
  expect(pinned.tick).toBe(frame.tick);
  expect(pinned.authorityChecksum).toBe(frame.authorityChecksum);
  expect(pinned.connection).toBe('REPLAY');
});
