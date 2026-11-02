'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
// Only real deterministic runtime snapshots; never invent hand poses or combat.
function encounter(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let i=0;i<700;i++){
  const s=game.publicState(),boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  if(boss&&s.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=4))return s;
  game.step();
 }
 throw Error('Real Warden encounter not reached');
}
test('real Chromium GLB ranger bow and mystic staff remain attached to animated hand bones',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/rig-attachment-plan.js')).status()).toBe(200);
 const snapshot=encounter(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.rigBoundAccessoryActors??0),{timeout:15000}).toBeGreaterThanOrEqual(2);
 const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(d.webgl).toBe(true);
 expect(d.authored3D.rigCranialActors).toBeGreaterThanOrEqual(5);
 expect(d.authored3D.rigCranialRatios).toHaveLength(d.authored3D.rigCranialActors);
 expect(d.authored3D.rigCranialRatios.every(item=>item.ratio>=.70&&item.ratio<=.80)).toBe(true);
 expect(d.authored3D.rigBoundAccessoryParts).toBeGreaterThanOrEqual(5);
 expect(d.authored3D.rigBoundAccessoryParts).toBeLessThanOrEqual(5);
 // Genuine GLB skeletons must move the authored grip origins onto their hands.
 console.log('DUNGEON R28 actual GLB rig grip candidates:',JSON.stringify({names:d.authored3D.rigHandBoneNames,candidates:d.authored3D.rigGripCandidates}));
 await page.locator('.arena').evaluate(node=>node.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-grip-alignment-round28-world-only.png'});

 expect(d.authored3D.rigGripAlignedActors).toBeGreaterThanOrEqual(2);
 expect(d.authored3D.rigGripMaxShiftMeters).toBeGreaterThan(0.001);
 expect(d.authored3D.rigGripMaxShiftMeters).toBeLessThanOrEqual(1.14);
 expect(d.authored3D.anatomicalDetailParts).toBeGreaterThan(30);
 expect(d.authored3D.anatomicalJointFittings).toBeGreaterThanOrEqual(8);
 expect(d.authored3D.anatomicalStaticMergedParts).toBeGreaterThan(16);
 expect(d.authored3D.anatomicalDetailMeshes).toBeLessThan(d.authored3D.anatomicalDetailParts-12);
 expect(d.authored3D.missingAssets).toBe(0);
 expect(d.authored3D.incompleteAssets).toBe(0);
 expect(d.drawCalls).toBeLessThan(1600);
 expect(d.composition.visibleHeroes).toBeGreaterThan(0);
 expect(errors).toEqual([]);

 await test.info().attach('real-glb-animated-hand-bones',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,
  authority:'unaltered DungeonRuntime publicState',
  rigBoundAccessoryActors:d.authored3D.rigBoundAccessoryActors,
  rigBoundAccessoryParts:d.authored3D.rigBoundAccessoryParts,
  rigGripAlignedActors:d.authored3D.rigGripAlignedActors,
  rigGripMaxShiftMeters:d.authored3D.rigGripMaxShiftMeters,
  texturedCharacters:d.authored3D.texturedCharacters,
  drawCalls:d.drawCalls,triangles:d.triangles,composition:d.composition
 },null,2)),contentType:'application/json'});
});
