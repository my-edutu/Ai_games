'use strict';
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4177';

test('inspect camera keeps a physical mechanism framed inside safe room bounds',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(`${base}/escape-room?muted=1&evidence=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__ESCAPE_PUBLIC_STATE__&&window.__ESCAPE_INSPECT_OBJECT__));
  const target=await page.evaluate(()=>{
    const state=window.__ESCAPE_PUBLIC_STATE__;
    return state.objects.find(object=>object.mechanismKind&&!object.carried)||state.objects.find(object=>!object.carried);
  });
  expect(target).toBeTruthy();
  await page.evaluate(id=>window.__ESCAPE_INSPECT_OBJECT__(id),target.id);
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','inspect');
  await page.waitForTimeout(850);
  const diagnostics=await page.evaluate(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__);
  expect(diagnostics.inspectObjectId).toBe(target.id);
  expect(diagnostics.inspectSurface).toBe(target.placement.surface);
  expect(diagnostics.cameraWithinBounds).toBe(true);
  expect(diagnostics.inspectTargetVisible).toBe(true);
  expect(diagnostics.cameraTargetDistance).toBeGreaterThanOrEqual(1.9);
  expect(diagnostics.cameraTargetDistance).toBeLessThanOrEqual(3.6);
  expect(diagnostics.cameraClearance).toBeGreaterThanOrEqual(.28);
});
