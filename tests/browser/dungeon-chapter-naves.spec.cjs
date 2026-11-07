'use strict';
const {test,expect}=require('@playwright/test');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const fs=require('node:fs');fs.mkdirSync('artifacts',{recursive:true});
test('real DungeonRuntime chamber has physically sculpted original Gothic naves on desktop and mobile',async({page})=>{
 test.setTimeout(180000);
 const game=DungeonRuntime.create('visual-room-art-18'),errors=[];
 for(let i=0;i<18;i++)game.step();
 const snapshot=game.publicState();
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 for(const device of [{name:'desktop',width:1440,height:832},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize({width:device.width,height:device.height});
  if(device.name==='desktop')await page.goto('/dungeon');
  await expect.poll(()=>page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__?.chapterNaves?.roomCount??-1),
   {timeout:65000}).toBeGreaterThan(0);
  const diag=await page.evaluate(()=>window.__DUNGEON_RENDER_DIAGNOSTICS__);
  expect(diag.chapterNaves.source).toBe('real-connected-walkable-floor-and-walls');
  expect(diag.chapterNaves.authorityChanged).toBe(false);
  expect(diag.chapterNaves.rosettes).toBe(diag.chapterNaves.roomCount*16);
  expect(diag.chapterNaves.drawBatches).toBeLessThanOrEqual(4);
  expect(diag.chapterNaves.wallLancets).toBeLessThanOrEqual(24);
  expect(diag.drawCalls).toBeLessThan(1600);
  expect(diag.webgl).toBe(true);
  await page.locator('#world').screenshot({
   path:'artifacts/dungeon-m1-native-naves-'+device.name+'.png',timeout:60000});
  fs.writeFileSync('artifacts/dungeon-m1-native-naves-'+device.name+'.json',JSON.stringify({
   origin:'Actual seeded DungeonRuntime publicState snapshot, not invented gameplay',
   seed:'visual-room-art-18',tick:snapshot.tick,floor:snapshot.floor,viewport:device,
   chapter:diag.chapterNaves,drawCalls:diag.drawCalls,triangles:diag.triangles,
   verdict:'UNVERIFIED: no locked-baseline A/B, coherent organic adventure or blind critics'
  },null,2));
 }
 expect(errors).toEqual([]);
});
