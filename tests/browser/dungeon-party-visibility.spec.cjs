'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
fs.mkdirSync('artifacts',{recursive:true});
function snapshot(){
 const game=DungeonRuntime.create('visual-room-art-18');
 for(let step=0;step<18;step++)game.step();
 return game.publicState();
}
test('real seeded Chromium WebGL reveals near-party masonry but retains distant dungeon walls',async({page,request})=>{
 test.setTimeout(120000);
 expect((await request.get('/dungeon/party-visibility-plan.js')).status()).toBe(200);
 const state=snapshot(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:60000}).toBeGreaterThanOrEqual(3);
 // Real whole-body protection may shrink stone to 13cm directly, leaving
 // zero in the intermediate 43cm band. Assert actual active foreground cuts.
 await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.cutawayWalls??0),{timeout:20000}).toBeGreaterThan(0);
 // Use the real seeded authority snapshot and actual WebGL frame loop. Once
 // the camera/party are steady, a repeated image must not reupload unchanged
 // instanced masonry buffers each rendered frame.
 await expect.poll(()=>page.evaluate(()=>{
  const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
  return Boolean(d&&d.wallMatrixWrites===0&&d.parapetMatrixWrites===0&&
   d.dressing?.matrixWrites?.facade===0&&d.dressing?.matrixWrites?.weathered===0);
 }),{timeout:40000}).toBe(true);
 const diagnostics=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 expect(diagnostics.cutawayWalls).toBeGreaterThan(0);
 // Native imported Gothic models arrive after buildWorld. Their geometry
 // must join the same true 3D camera AND cutaway plan, not remain invisible
 // to the sightline director when a tall pillar hides a skinned protagonist.
 expect(diagnostics.authoredProps.indexed).toBeLessThanOrEqual(diagnostics.authoredProps.loaded);
 if(diagnostics.authoredProps.loaded>0)
  expect(diagnostics.authoredProps.indexed).toBeGreaterThan(0);
 expect(diagnostics.cutawayNearbyWalls).toBeLessThan(diagnostics.wallProfiles.totalWalls);
 expect(diagnostics.visibility.unoccludedHeroes).toBeGreaterThanOrEqual(2);
 expect(diagnostics.composition.visibleHeroes).toBeGreaterThanOrEqual(2);
 expect(diagnostics.drawCalls).toBeLessThan(1600);
 expect(diagnostics.physicalActorStage?.maxActors).toBe(5);
 expect(diagnostics.physicalActorStage?.authorityChanged).toBe(false);
 expect(diagnostics.authored3D.missingAssets).toBe(0);
 expect(errors).toEqual([]);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 await page.locator('#world').screenshot({path:'artifacts/dungeon-party-clearance-round35-world-only.png',timeout:45000});
 await test.info().attach('actual-seeded-party-cutaway',{body:Buffer.from(JSON.stringify({
  seed:'visual-room-art-18',tick:state.tick,frame:diagnostics.frame,
  cutawayWalls:diagnostics.cutawayWalls,nearbyWalls:diagnostics.cutawayNearbyWalls,
  wallMatrixWrites:diagnostics.wallMatrixWrites,parapetMatrixWrites:diagnostics.parapetMatrixWrites,
  dressingMatrixWrites:diagnostics.dressing?.matrixWrites,
  composition:diagnostics.composition,visibility:diagnostics.visibility,
  render: {drawCalls:diagnostics.drawCalls,triangles:diagnostics.triangles}
 },null,2)),contentType:'application/json'});
});


// The M1 story continues across a single locked original benchmark. These
// are true source-backed desktop/phone WebGL pictures, NOT a quality vote.
for(const viewport of [{name:'desktop',width:1440,height:832},{name:'phone',width:390,height:844}]){
 test('M1 live '+viewport.name+' real native-actor camera and acting-space evidence',async({page})=>{
  test.setTimeout(150000);
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const runtime=DungeonRuntime.create('dungeon-ui-round17');
  for(let tick=0;tick<18;tick++)runtime.step();
  const truth=runtime.publicState();
  await page.route('**/dungeon/state',route=>route.fulfill({json:truth}));
  await page.goto('/dungeon');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.authored3D?.texturedCharacters??0),{timeout:90000}).toBeGreaterThanOrEqual(3);
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0),{timeout:15000}).toBeGreaterThan(3);
  const d=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(d.authored3D.missingAssets).toBe(0);
  expect(d.cutawayWalls).toBeGreaterThan(0);
  expect(d.cutawayWalls).toBeLessThan(d.wallProfiles.totalWalls);
  expect(d.drawCalls).toBeLessThan(1600);
  expect(d.visibility.unoccludedHeroes).toBeGreaterThanOrEqual(2);
  await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
  await page.locator('#world').screenshot({path:'artifacts/dungeon-m1-acting-pocket-'+viewport.name+'-seed18.png',timeout:65000});
  await test.info().attach('M1-'+viewport.name+'-real-game-evidence',{
   body:Buffer.from(JSON.stringify({baseline:'281735d0910c6b2443648af976003d50412ee324',seed:'dungeon-ui-round17',tick:truth.tick,
    viewport,camera:d.cinematicLens,cameraShot:d.cinematicShot,heroVisibility:d.visibility,
    realCutaway:d.cutawayWalls,remainingWalls:d.wallProfiles.totalWalls,drawCalls:d.drawCalls,
    UNVERIFIED:['audiovisual-reference-A/B','independent-blind-critics','original-recorded-sound','full-five-phase-campaign']},null,2)),
   contentType:'application/json'});
 });
}
