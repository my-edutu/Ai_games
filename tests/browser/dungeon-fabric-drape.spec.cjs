'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function realSnapshot(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let i=0;i<18;i++)game.step();
 return game.publicState();
}
async function nativeScene(page){
 const state=realSnapshot(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.nativeContinuousActors??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 return {state,errors};
}
test('source-native continuous skinned costumes and original mapped fabric remain visible, without rejected duplicate bridges',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/model-assets.js')).status()).toBe(200);
 const {state,errors}=await nativeScene(page);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.nativeVisibleSkinnedMeshes).toBeGreaterThanOrEqual(15);
 expect(d.authored3D.nativeTexturedSourceMeshes).toBeGreaterThanOrEqual(3);
 expect(d.authored3D.nativePresentationModes).toContain('original-continuous-rig');
 // Real Chromium comparisons rejected disconnected procedural costume bridges.
 // Reintroducing artificial drapes simply to satisfy the old test is a visual regression.
 expect(d.authored3D.cinematicAnatomyBridges).toBe(0);
 expect(d.authored3D.draperyPanels).toBe(0);
 expect(d.authored3D.draperyTriangles).toBe(0);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(d.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(d.drawCalls).toBeLessThan(1600);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.authored3D.incompleteAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-native-rig-continuity-desktop.png',timeout:45000});
 await test.info().attach('true-original-rig-continuity',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:state.tick,source:'actual DungeonRuntime publicState',
  nativeContinuousActors:d.authored3D.nativeContinuousActors,
  nativeVisibleSkinnedMeshes:d.authored3D.nativeVisibleSkinnedMeshes,
  nativeTexturedSourceMeshes:d.authored3D.nativeTexturedSourceMeshes,
  composition:d.composition,visibility:d.visibility
 },null,2)),contentType:'application/json'});
});
test('mobile real native skinned anatomy remains onscreen with unobstructed 3D stage',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:390,height:844});
 const {errors}=await nativeScene(page);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.nativeVisibleSkinnedMeshes).toBeGreaterThanOrEqual(15);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(d.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(errors).toEqual([]);
 await page.screenshot({path:'artifacts/dungeon-native-rig-continuity-mobile.png',fullPage:false,timeout:45000});
});
test('reduced motion keeps real textured source bodies without uploading discontinued synthetic fabric',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 const {errors}=await nativeScene(page);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:35000}).toBeGreaterThan(3);
 const before=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__.authored3D);
 expect(before.nativeContinuousActors).toBeGreaterThanOrEqual(3);
 expect(before.draperyPanels).toBe(0);
 expect(before.draperyVertexUploads).toBe(0);
 expect(before.draperyNormalRebuilds).toBe(0);
 expect(before.draperyPeakDeformationMeters).toBe(0);
 expect(before.nativePresentationModes).toContain('original-continuous-rig');
 expect(errors).toEqual([]);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-native-reduced-motion.png',timeout:45000});
});
