'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function sourceSnapshot(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let i=0;i<18;i++)game.step();
 return game.publicState();
}
test('real Chromium WebGL shows original rigged fabric, with bounded GPU detail and heroes in view',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/fabric-drape-plan.js')).status()).toBe(200);
 const state=sourceSnapshot(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.draperyActors??0),{timeout:25000}).toBeGreaterThanOrEqual(3);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.authored3D.draperyPanels).toBeGreaterThanOrEqual(6);
 expect(d.authored3D.draperyPanels).toBeLessThanOrEqual(48);
 expect(d.authored3D.draperyTriangles).toBeGreaterThanOrEqual(576);
 expect(d.authored3D.draperyTriangles).toBeLessThanOrEqual(4608);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(d.visibility.unoccludedHeroes).toBeGreaterThan(0);
 expect(d.drawCalls).toBeLessThan(1600);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.authored3D.incompleteAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-drapery34-real-webgl.png',timeout:45000});
 await test.info().attach('original-fabric-real-webgl',{body:Buffer.from(JSON.stringify({
  source:'actual DungeonRuntime publicState; no invented actions',seed:'visual-room-art-18',tick:state.tick,
  draperyActors:d.authored3D.draperyActors,draperyPanels:d.authored3D.draperyPanels,
  draperyTriangles:d.authored3D.draperyTriangles,drawCalls:d.drawCalls,
  composition:d.composition,visibility:d.visibility
 },null,2)),contentType:'application/json'});
});
test('mobile Chromium renders the real cloth without losing sight of a living hero',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:390,height:844});
 const state=sourceSnapshot();
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.draperyPanels??0),{timeout:60000}).toBeGreaterThanOrEqual(6);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.composition?.visibleHeroes??0),{timeout:20000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'artifacts/dungeon-drapery34-mobile-real-webgl.png',fullPage:false,timeout:45000});
});
