'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('actual Chromium retains continuous original skinned figures and native costumes at desktop and mobile sizes',async({page})=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1440,height:832});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredCharacters??0),{timeout:45000}).toBeGreaterThanOrEqual(3);
 // A native-body 'walk' without actual travelled feet is not a real
 // animation. A test-generated still is not used as acceptance evidence.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.rigFullBodyStridePeakRad??0),
  {timeout:35000}).toBeGreaterThan(.002);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 expect(desktop.nativeContinuousActors).toBeGreaterThanOrEqual(3);
 expect(desktop.nativeVisibleSkinnedMeshes).toBeGreaterThanOrEqual(desktop.nativeContinuousActors*5);
 expect(desktop.nativeTexturedSourceMeshes).toBeGreaterThanOrEqual(3);
 expect(desktop.nativePresentationModes).toContain('original-continuous-rig');
 expect(desktop.cinematicFigures).toBe(0); // No detached cosmetic body rigs.
 // Verify the actual native body mesh received the authored bind-space refit;
 // a test pass cannot imply that its appearance is preferred.
 expect(desktop.nativeSculptActors).toBeGreaterThanOrEqual(3);
 expect(desktop.nativeSculptMeshes).toBeGreaterThanOrEqual(3);
 expect(desktop.nativeSculptVertices).toBeGreaterThan(0);
 expect(desktop.nativeSculptMaxShiftRaw).toBeGreaterThan(0);

 // Genuine source outfits and heads replace the occluding disconnected overlay.
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-cinematic-figures-desktop.png',timeout:60000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:30000}).toBeGreaterThan(3);
 const mobile=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 expect(mobile.nativeContinuousActors).toBeGreaterThanOrEqual(3);
 expect(mobile.nativeVisibleSkinnedMeshes).toBeGreaterThanOrEqual(mobile.nativeContinuousActors*5);
 expect(mobile.nativeTexturedSourceMeshes).toBeGreaterThanOrEqual(3);
 expect(mobile.cinematicFigures).toBe(0);
 expect(mobile.nativeSculptActors).toBeGreaterThanOrEqual(3);
 expect(mobile.nativeSculptVertices).toBeGreaterThan(0);

 // Live autonomy can add a legitimate actor during the viewport transition.
 // Never freeze a natural expedition just to manufacture identical totals.
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-cinematic-figures-mobile.png',timeout:60000});
 // Browser metrics prove skinned rigs, not actual subjective motion quality.
 fs.writeFileSync('artifacts/dungeon-m1-native-stride-desktop-mobile.json',JSON.stringify({
  source:'Real WebGL render diagnostic; live autonomous actor movement',
  baselineSha:'281735d0910c6b2443648af976003d50412ee324',
  desktop:{figures:desktop.nativeContinuousActors,identityPieces:desktop.nativeVisibleSourceMeshes,stridePeakRad:desktop.rigFullBodyStridePeakRad,
   activeShortLinks:desktop.cinematicActiveAnatomyBridges,
   sculptedOriginalActors:desktop.nativeSculptActors,sculptedOriginalVertices:desktop.nativeSculptVertices},
  mobile:{figures:mobile.nativeContinuousActors,identityPieces:mobile.nativeVisibleSourceMeshes,stridePeakRad:mobile.rigFullBodyStridePeakRad,
   activeShortLinks:mobile.cinematicActiveAnatomyBridges,
   sculptedOriginalActors:mobile.nativeSculptActors,sculptedOriginalVertices:mobile.nativeSculptVertices},
  limitations:'Not a controlled before/after or an objective animation-quality judgment'
 },null,2));
 expect(errors).toEqual([]);
});
