'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});

/**
 * Real running server, genuine authoritative ticks and Three.js WebGL.
 * Reframe one live expedition from three ACTUAL camera modes, then mobile.
 * These are evidence captures, not a pre-scripted battle or claim of AAA parity.
 */
test('connected entry, encounter and Warden masonry survives live traversal and three spectator perspectives',async({page,request})=>{
 test.setTimeout(300000);
 for(const path of ['/dungeon/connected-journey-plan.js','/dungeon/connected-journey.js'])
  expect((await request.get(path)).status()).toBe(200);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.connectedJourney?.reachable===true),
  {timeout:90000}).toBe(true);
 const diagnostic=()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 // Scene existence precedes GLB/visible-hero readiness on real software WebGL.
 // Require an actual rendered hero rather than reading an incidental first frame.
 await expect.poll(async()=>((await diagnostic())?.composition?.visibleHeroes??0),
  {timeout:55000}).toBeGreaterThan(0);
 const first=await diagnostic(),firstScene=first.dressing.connectedJourney;
 expect(firstScene.chapters.map(c=>c.role)).toEqual(['entry','ordinary','warden']);
 expect(firstScene.source).toBe('actual-authority-map-exit-and-live-enemy-placements');
 expect(firstScene.thresholds).toBeLessThanOrEqual(3);
 expect(firstScene.facades).toBeLessThanOrEqual(18);
 expect(firstScene.drawCalls).toBeLessThanOrEqual(11);
 expect(firstScene.textureCount).toBe(0);
 expect(firstScene.distinctProfiles).toBeTruthy();
 expect(Object.keys(firstScene.distinctProfiles).length).toBeGreaterThan(0);
 expect(firstScene.dynamicLights).toBe(0);
 expect(firstScene.allocatedBytes).toBeLessThan(200000);
 expect(firstScene.collisionEffects).toBe(0);
 expect(firstScene.walkableGroundObstacles).toBe(0);
 expect(first.webgl).toBe(true);
 expect(first.composition.visibleHeroes).toBeGreaterThan(0);
 const captions=[];
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 for(const mode of ['cinematic','tactical','chase']){
  const d=await diagnostic();
  captions.push({mode,source:d.renderedState,connected:d.dressing.connectedJourney,
   drawCalls:d.drawCalls,triangles:d.triangles,visibleHeroes:d.composition.visibleHeroes,
   unoccludedHeroes:d.visibility.unoccludedHeroes});
  await page.locator('#world').screenshot({
   path:'artifacts/dungeon-connected-journey-'+mode+'.png',timeout:65000});
  if(mode!=='chase')await page.locator('#view-toggle').click();
 }
 const original=first.renderedState;
 await expect.poll(()=>page.evaluate(({run,tick})=>{
  const state=window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState;
  return Boolean(state&&(state.run>run||state.run===run&&state.tick>tick+1));
 },original),{timeout:70000}).toBe(true);
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.connectedJourney?.reachable===true),
  {timeout:55000}).toBe(true);
 const mobile=await diagnostic();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(mobile.dressing.connectedJourney.drawCalls).toBeLessThanOrEqual(11);
 await page.locator('#world').screenshot({
  path:'artifacts/dungeon-connected-journey-mobile.png',timeout:65000});
 expect(errors).toEqual([]);
 const evidence={source:'live autonomous server, actual map and WebGL camera controls',
  noFabricatedCombat:true,original,mobile:{state:mobile.renderedState,
   connected:mobile.dressing.connectedJourney},viewpoints:captions,
  limits:{geometry:'at most eleven retained role-specific batches',navigation:'unchanged authority'},
  gate:'IN PROGRESS / NOT TRANSFORMED; this is not a blind reference comparison'};
 fs.writeFileSync('artifacts/dungeon-connected-journey-evidence.json',
  JSON.stringify(evidence,null,2));
 await test.info().attach('connected-journey-live-traversal',
  {body:Buffer.from(JSON.stringify(evidence,null,2)),contentType:'application/json'});
});
