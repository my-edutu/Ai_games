'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');
const path=require('node:path');
fs.mkdirSync('artifacts',{recursive:true});
const moduleFrom=name=>import('data:text/javascript;base64,'+
 fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon',name)).toString('base64'));
test('real seeded alternate cloister topology survives genuine WebGL camera perspectives and mobile',async({page,request})=>{
 test.setTimeout(240000);
 for(const f of ['/dungeon/alternate-gallery-plan.js','/dungeon/alternate-gallery.js'])
  expect((await request.get(f)).status()).toBe(200);
 const {planConnectedDungeonJourney}=await moduleFrom('connected-journey-plan.js');
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 let chosen=null;
 // Discovery is bounded, deterministic and built from REAL authority snapshots,
 // not a fabricated route or fake combat scene. Some seeds genuinely have no loop.
 for(let i=0;i<40;i++){
  const seed='side-gallery-observed-'+String(i).padStart(2,'0');
  const game=DungeonRuntime.create(seed),s=game.publicState();
  const main=planConnectedDungeonJourney(s.map,s.floor,s.exit,s.units);
  const alternate=planAlternateDungeonGallery(s.map,s.floor,s.exit,main,s.units,s.traps);
  if(alternate.status!=='ready')continue;
  chosen={seed,game,first:s,alternate};break;
 }
 expect(chosen,'At least one authentic generated dungeon must expose a legal secondary loop').toBeTruthy();
 const {seed,game,first,alternate}=chosen;
 const partyIds=new Set(first.units.filter(u=>u.faction==='party').map(u=>u.id));
 const actualBranchCells=new Set(alternate.detour.slice(1,-1).map(p=>p.gridX+','+p.gridZ));
 let served=0;
 const observed={routeVisits:0,combatActions:0,routeCombatActions:0,
  ticks:0,seed,selectedAt:{run:first.run,floor:first.floor,tick:first.tick}};
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',async route=>{
  const s=game.publicState();
  if(s.run===first.run&&s.floor===first.floor){
   const near=s.units.filter(u=>partyIds.has(u.id)&&u.hp>0&&
    actualBranchCells.has(u.x+','+u.z));
   if(near.length)observed.routeVisits++;
   const actions=s.units.filter(u=>['attack','cast','hurt'].includes(u.action));
   if(actions.length)observed.combatActions++;
   if(near.length&&actions.length)observed.routeCombatActions++;
  }
  game.step();served++;
  await route.fulfill({json:s});
 });
 await page.setViewportSize({width:1440,height:832});
 await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.dressing?.alternateGallery?.connected===true),
  {timeout:80000}).toBe(true);
 const collect=()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
 const initial=await collect(),gallery=initial.dressing.alternateGallery;
 expect(gallery.status).toBe('ready');
 expect(gallery.branchOnlyCells).toBeGreaterThanOrEqual(3);
 expect(gallery.drawCalls).toBeLessThanOrEqual(3);
 expect(gallery.geometryCount).toBeLessThanOrEqual(3);
 expect(gallery.materialCount).toBeLessThanOrEqual(3);
 expect(gallery.dynamicLights).toBe(0);
 expect(gallery.materialRoles).toEqual([
  'bearing-service-stone','blind-iron-seal','worn-service-paving']);
 expect(gallery.occluderBounds).toBe(alternate.facades.length);
 expect(gallery.activeHazardCells).toBe(alternate.metrics.activeHazardCells);
 expect(gallery.hazardFree).toBe(alternate.metrics.hazardFree);
 expect(gallery.allocatedBytes).toBeLessThan(100000);
 expect(gallery.collisionEffects).toBe(0);
 expect(gallery.navigationEdits).toBe(0);
 expect(gallery.combatEdits).toBe(0);
 expect(gallery.source).toContain('existing-authority-loop-only');
 expect(initial.webgl).toBe(true);
 expect(initial.composition.visibleHeroes).toBeGreaterThan(0);
 await page.locator('.arena').evaluate(el=>el.classList.add('world-only-audit'));
 const frames=[];
 for(const mode of ['cinematic','tactical']){
  const d=await collect();frames.push({camera:mode,state:d.renderedState,
   alt:d.dressing.alternateGallery,drawCalls:d.drawCalls,triangles:d.triangles});
  await page.locator('#world').screenshot({
   path:'artifacts/dungeon-alternate-cloister-'+mode+'.png',timeout:65000});
  if(mode==='cinematic')await page.locator('#view-toggle').click();
 }
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.webgl===true),{timeout:45000}).toBe(true);
 const mobile=await collect();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.locator('#world').screenshot({
  path:'artifacts/dungeon-alternate-cloister-mobile.png',timeout:65000});
 observed.ticks=game.publicState().tick-first.tick;
 expect(errors).toEqual([]);
 const evidence={
  origin:'unchanged deterministic DungeonRuntime map and autonomous HTTP ticks',
  seed,initialSnapshot:{tick:first.tick,run:first.run,floor:first.floor,exit:first.exit},
  alternate:{branch:alternate.branch,rejoin:alternate.rejoin,
   cells:alternate.detour.map(p=>({x:p.gridX,z:p.gridZ})),
   activeHazards:alternate.metrics.activeHazardCells},
  selectedGallery:gallery,viewpoints:frames,
  mobile:{renderedState:mobile.renderedState,drawCalls:mobile.drawCalls},
  runtime:{...observed,authorityPolls:served,
   actualBranchVisited:observed.routeVisits>0,
   actualCombatObserved:observed.combatActions>0},
  proofLimits:'Route topology and live WebGL are checked; if actualBranchVisited is false, no autonomous traversal of this particular side loop is claimed.',
  milestone:'IN PROGRESS / NOT TRANSFORMED; no matched reference A/B or blind critique'
 };
 fs.writeFileSync('artifacts/dungeon-alternate-cloister-evidence.json',
  JSON.stringify(evidence,null,2));
 await test.info().attach('actual-secondary-dungeon-loop',{
  body:Buffer.from(JSON.stringify(evidence,null,2)),
  contentType:'application/json'});
});
