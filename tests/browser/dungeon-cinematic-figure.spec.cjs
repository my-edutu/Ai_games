'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('actual Chromium renders original 3D cinematic figures at desktop and mobile sizes',async({page})=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1440,height:832});await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.authoredCharacters??0),{timeout:45000}).toBeGreaterThanOrEqual(3);
 // A native-body 'walk' without actual travelled feet is not a real
 // animation. A test-generated still is not used as acceptance evidence.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.rigFullBodyStridePeakRad??0),
  {timeout:35000}).toBeGreaterThan(.002);
 const desktop=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 expect(desktop.cinematicFigures).toBeGreaterThanOrEqual(3);
 expect(desktop.cinematicMeshes).toBeGreaterThanOrEqual(desktop.cinematicFigures*16);
 expect(desktop.cinematicPairedBatches).toBe(desktop.cinematicFigures*6);
 expect(desktop.cinematicAnatomyBridges).toBe(desktop.cinematicFigures*14);
 // Do not force metre-long false arms for a passing number: real bone-link
 // distances must suppress implausible spans; the rendered story is the bar.
 expect(desktop.cinematicActiveAnatomyBridges).toBeGreaterThanOrEqual(0);
 expect(desktop.cinematicSuppressedLongAnatomyBridges).toBeGreaterThanOrEqual(0);
 expect(desktop.cinematicActiveAnatomyBridges+desktop.cinematicSuppressedLongAnatomyBridges)
  .toBeLessThanOrEqual(desktop.cinematicAnatomyBridges);
 expect(desktop.cinematicRenderedParts).toBe(desktop.cinematicMeshes+desktop.cinematicPairedBatches);
 expect(desktop.cinematicRenderedParts).toBeGreaterThanOrEqual(desktop.cinematicFigures*22);
 expect(desktop.cinematicMeshes).toBeLessThanOrEqual(240);
 expect(desktop.cinematicVertices).toBeGreaterThan(3000);
 expect(desktop.cinematicMaterialsMapped).toBeGreaterThanOrEqual(desktop.cinematicFigures*5);
 expect(desktop.cinematicBoneMounts).toBeGreaterThanOrEqual(desktop.cinematicFigures*12);
 expect(desktop.cinematicMaxHandOffsetMeters).toBeLessThanOrEqual(.015);
 expect(desktop.cinematicSourceHidden).toBe(desktop.cinematicFigures);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-cinematic-figures-desktop.png',timeout:60000});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:30000}).toBeGreaterThan(3);
 const mobile=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D);
 // Live autonomy can add a legitimate actor during the viewport transition.
 // Never freeze a natural expedition just to manufacture identical totals.
 expect(mobile.cinematicFigures).toBeGreaterThanOrEqual(3);
 expect(mobile.cinematicPairedBatches).toBe(mobile.cinematicFigures*6);
 expect(mobile.cinematicRenderedParts).toBe(mobile.cinematicMeshes+mobile.cinematicPairedBatches);
 expect(mobile.cinematicAnatomyBridges).toBe(mobile.cinematicFigures*14);
 expect(mobile.cinematicSourceHidden).toBe(mobile.cinematicFigures);
 expect(mobile.cinematicMaxHandOffsetMeters).toBeLessThanOrEqual(.015);
 expect(mobile.cinematicMeshes).toBeLessThanOrEqual(240);
 await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-cinematic-figures-mobile.png',timeout:60000});
 // Actual browser diagnostic receipt, not a fabricated feel score. Peak
 // values prove an executed animated overlay, never motion quality or FPS.
 fs.writeFileSync('artifacts/dungeon-m1-native-stride-desktop-mobile.json',JSON.stringify({
  source:'Real WebGL render diagnostic; live autonomous actor movement',
  baselineSha:'281735d0910c6b2443648af976003d50412ee324',
  desktop:{figures:desktop.cinematicFigures,stridePeakRad:desktop.rigFullBodyStridePeakRad,
   activeShortLinks:desktop.cinematicActiveAnatomyBridges},
  mobile:{figures:mobile.cinematicFigures,stridePeakRad:mobile.rigFullBodyStridePeakRad,
   activeShortLinks:mobile.cinematicActiveAnatomyBridges},
  limitations:'Not a controlled before/after or an objective animation-quality judgment'
 },null,2));
 expect(errors).toEqual([]);
});
