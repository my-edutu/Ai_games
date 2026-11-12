'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const dir='artifacts/tiny-kingdom-w129-market';
fs.mkdirSync(dir,{recursive:true});
async function startRealGame(page,size,errors){
 page.on('pageerror',err=>errors.push(err.message));
 await page.setViewportSize(size);
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
  null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0)});
}
async function inspect(page){
 return page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const a={source:'running-real-merchant-and-courier-settlement',
   renderer:g.renderer(),market:g.getMarketQuarterStats(),district:g.getGrainwardDistrictAudit(),
   raisedReceivingHall:g.getMarketReceivingHallAudit(),
   physicalTradeCamera:g.getTradeCorridorCameraAudit(),
   masonry:g.getCompactStoneCoursingAudit(),
   gateway:g.getMarketGatewayAudit(),street:g.getFarmMarketStreetAudit(),
   scene:g.renderStats(),geometry:g.getGeometryAudit(),city:g.metrics(),
   coherent:g.getScenicCoherentReferenceAudit(),coherentPerformance:g.getScenicCoherentAudit(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
  return a;
 });
}
function assertWorld(a){
 expect(a.renderer).toBe('webgl');
 expect(a.market.stalls).toBe(4);
 // W206: physical reception roof must no longer sit across the actual
 // unloading worker's upper body. Check the genuine playable WebGL state.
 expect(a.raisedReceivingHall.raisedEaveAboveGround).toBeGreaterThanOrEqual(3.1);
 expect(a.raisedReceivingHall.roofAboveGrainReceiptMeters).toBeGreaterThan(2.8);
 expect(a.raisedReceivingHall.roofMatchesCameraVolumes).toBe(true);
 expect(a.raisedReceivingHall.originalBays).toBe(2);
 expect(a.raisedReceivingHall.loadBearingPosts).toBe(4);
 expect(a.raisedReceivingHall.roofPanels).toBe(18);
 // W207 actual 1024px, 390px and Day-121 WebGL scene must contain
 // a genuinely INWARD wood lining on the original pitched grain roof;
 // source-only geometry stubs cannot substitute for this running-game gate.
 expect(a.raisedReceivingHall.receivingSoffitPanels).toBe(18);
 expect(a.raisedReceivingHall.receivingSoffitRafters).toBe(6);
 expect(a.raisedReceivingHall.arcadeWallSegments).toBe(4);
 expect(a.raisedReceivingHall.arcadeWallTriangles).toBeGreaterThan(40);
 expect(a.raisedReceivingHall.arcadeWallMaxHeight).toBeLessThanOrEqual(1.55);
 expect(a.raisedReceivingHall.arcadeClearCenterWidth).toBeGreaterThanOrEqual(5.1);
 expect(a.raisedReceivingHall.receivingSoffitTriangles).toBeGreaterThanOrEqual(75);
 expect(a.raisedReceivingHall.receivingSoffitTriangles).toBeLessThan(140);
 expect(a.raisedReceivingHall.frontGablePlasterPanels).toBe(0);
 expect(a.physicalTradeCamera.marketRoofBands).toBe(4);
 expect(a.physicalTradeCamera.marketPosts).toBe(4);
 expect(a.market.structuralShopLofts).toBe(2);
 expect(a.market.tradehouseShells).toBe(2);
 expect(a.market.tradehouseWindows).toBe(4);
 expect(a.market.tradehouseTriangles).toBeGreaterThan(200);
 expect(a.market.tradehouseTriangles).toBeLessThan(1600);
 expect(a.masonry.currentTrianglesPerHome).toBe(8);
 expect(a.masonry.previousTrianglesPerHome).toBe(48);
 expect(a.masonry.reclaimedTriangles).toBe(a.masonry.compactHomes*40);
 expect(a.masonry.fullCottagesStillRendered).toBe(true);
 expect(a.masonry.stoneAtlasResident).toBe(true);
 expect(a.masonry.changesAuthority).toBe(false);
 // W259 reconstructs the original two permanent merchant houses as the
 // dominant ridge. Do not lock the running district to an obsolete 4.05m
 // prototype roof or remove legal real stalls to satisfy a stale literal.
 expect(a.market.tallestRoof).toBeGreaterThan(5.50);
 expect(a.market.tallestRoof).toBeLessThan(5.85);
 expect(a.district.marketStalls).toBe(4);
 expect(a.district.genuineMarketEaves).toHaveLength(4);
 expect(a.district.genuineMarketEaves[0]).toBeGreaterThan(a.district.genuineMarketEaves[2]+.80);
 expect(a.district.genuineMarketEaves[1]).toBeGreaterThan(a.district.genuineMarketEaves[3]+.80);
 expect(a.market.rearShopGables).toBe(4);
 expect(a.market.marketWheelPassages).toBe(22);
 expect(a.market.marketDrainSegments).toBe(22);
 expect(a.market.mortarTriangles).toBe(224);
 expect(a.market.pavingStones).toBeGreaterThan(90);
 expect(a.market.pavingStones).toBeLessThanOrEqual(165);
 expect(a.street.connected).toBe(true);
 expect(a.street.unsafeSamples).toBe(0);
 expect(a.street.boundary.panels).toBeGreaterThan(0);
 expect(a.street.boundary.panels).toBeLessThanOrEqual(38);
 expect(a.street.boundary.triangles).toBe(a.street.boundary.panels*20);
 expect(a.street.boundary.triangles).toBeLessThanOrEqual(760);
 expect(a.street.boundary.authorityChanged).toBe(false);
 expect(a.street.granaryTradeEntranceUnblocked).toBe(true);
 expect(a.gateway.structuralPosts).toBeGreaterThanOrEqual(18);
 expect(a.city.citizens).toBeGreaterThan(0);
 expect(a.authorityUnchanged).toBe(true);
 expect(a.geometry.static.invalidComponents).toBe(0);
 expect(a.geometry.dynamic.invalidComponents).toBe(0);
 expect(a.coherent.missingChunks).toBe(0);
 expect(a.coherentPerformance.geometryNeverDropped).toBe(true);
 expect(a.scene.lastFrameTriangles).toBeLessThan(160000);
 expect(a.gl).toBe(0);
 expect(a.overflow).toBeLessThanOrEqual(0);
}
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W129 authentic market-house WebGL and original safe court '+viewport.width+'px',
 async({page})=>{
  test.setTimeout(300000);
  const errors=[];
  await startRealGame(page,viewport,errors);
  const g=await inspect(page);
  assertWorld(g);expect(errors).toEqual([]);
  fs.writeFileSync(dir+'/'+viewport.width+'-day1.json',JSON.stringify(g,null,2));
  await page.screenshot({path:dir+'/'+viewport.width+'-day1-market.png'});
  await page.evaluate(()=>window.__tinyKingdom.setCamera({focus:[12,0],yaw:2.35,pitch:.72,zoom:30}));
  await page.waitForTimeout(600);
  await page.screenshot({path:dir+'/'+viewport.width+'-day1-service-street.png'});
 });
}
test('W129 120-day real town growth, preserved market, replay and geometry safety',
async({page})=>{
 test.setTimeout(360000);
 const errors=[];await startRealGame(page,{width:1024,height:640},errors);
 const before=await page.evaluate(()=>window.__tinyKingdom.metrics());
 const advance=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<120*24*30;i++)g.step(1/30);
  return {snapshot:g.exportSnapshot(),lastFrame:g.getFrameProfile().totalFrames};
 });
 await page.waitForFunction(last=>window.__tinyKingdom.getFrameProfile().totalFrames>last,
  advance.lastFrame,{timeout:120000});
 const day120=await inspect(page);assertWorld(day120);
 expect(day120.city.citizens).toBeGreaterThanOrEqual(before.citizens);
 expect(day120.city.buildings).toBeGreaterThan(before.buildings);
 expect(day120.masonry.compactHomes).toBeGreaterThanOrEqual(18);
 expect(day120.masonry.reclaimedTriangles).toBeGreaterThanOrEqual(720);
 const roundtrip=await page.evaluate(snapshot=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(snapshot);
  return before===JSON.stringify(g.exportSnapshot());
 },advance.snapshot);
 expect(roundtrip).toBe(true);expect(errors).toEqual([]);
 fs.writeFileSync(dir+'/day120.json',JSON.stringify(day120,null,2));
 await page.screenshot({path:dir+'/day120-authentic-market.png'});
});