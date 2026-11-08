'use strict';
const {test,expect}=require('@playwright/test');
const {pinDungeonScene}=require('./dungeon-fixtures.cjs');
const {bootstrapCapture}=require('../../scripts/m1-parallel/D01/capture-dungeon.cjs');
const {summarizeTrial}=require('../../scripts/m1-parallel/D01/frame-ledger.cjs');

// Run with the separate D01 config. This spec is intentionally NOT added to
// the shared catalogue/parallel game suite or the existing dungeon testMatch.
// Its snapshots come from the REAL DungeonRuntime, not fake renderer frames.
test('real 3D frames are requested once per observed submission; recording is distinct from source delivery',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pin=await pinDungeonScene(page,{seed:'d01-authentic-capture',ticks:18});
 await page.addInitScript(bootstrapCapture,{maxRecords:600,maxEncodedBytes:8*1024*1024});
 await page.goto('/dungeon',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),
  {timeout:60000}).toBeGreaterThan(2);
 await page.waitForTimeout(900); // shader/asset warm-up outside observation
 const before=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame);
 const start=await page.evaluate(()=>window.__D01_CAPTURE__.start(true));
 expect(start.status).toBe('RECORDING');
 // The actual host advances once every 350 ms. Advance one real authority
 // step at a time instead of jumping eight ticks into a frozen posed scene.
 for(let i=0;i<22;i++){
  pin.advance(1);
  await page.waitForTimeout(350);
 }
 const ended=await page.evaluate(()=>window.__D01_CAPTURE__.stop());
 const report=summarizeTrial({...ended.raw,mode:'record'});
 expect(report.source.observedRenderEvents).toBeGreaterThan(2);
 expect(report.source.lastRenderFrame).toBeGreaterThan(before);
 expect(report.authority.tickIncreases).toBeGreaterThanOrEqual(8);
 expect(report.source.recordedRequestFrames).toBeGreaterThan(0);
 expect(report.source.recordedRequestFrames).toBeLessThanOrEqual(report.source.observedRenderEvents);
 expect(report.capture.requestError).toBeNull();
 expect(report.capture.tracksStopped).toBe(true);
 expect(report.capture.status).toBe('ENCODED');
 expect(report.capture.encodedBytes).toBeGreaterThan(0);
 expect(ended.videoBase64).toBeTruthy();
 expect(errors).toEqual([]);
});
