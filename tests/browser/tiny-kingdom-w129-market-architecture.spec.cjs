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
   renderer:g.renderer(),market:g.getMarketQuarterStats(),
   gateway:g.getMarketGatewayAudit(),street:g.getFarmMarketStreetAudit(),
   scene:g.renderStats(),geometry:g.getGeometryAudit(),city:g.metrics(),
   overflow:document.documentElement.scrollWidth-innerWidth,
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   authorityUnchanged:before===JSON.stringify(g.exportSnapshot())};
  return a;
 });
}
function assertWorld(a){
 expect(a.renderer).toBe('webgl');
 expect(a.market.stalls).toBe(4);
 expect(a.market.structuralShopLofts).toBe(2);
 expect(a.market.tradehouseShells).toBe(2);
 expect(a.market.tradehouseWindows).toBe(4);
 expect(a.market.tradehouseTriangles).toBeGreaterThan(200);
 expect(a.market.tradehouseTriangles).toBeLessThan(1600);
 expect(a.market.tallestRoof).toBe(4.05);
 expect(a.market.rearShopGables).toBe(4);
 expect(a.market.marketWheelPassages).toBe(22);
 expect(a.market.marketDrainSegments).toBe(22);
 expect(a.market.mortarTriangles).toBe(224);
 expect(a.market.pavingStones).toBeGreaterThan(200);
 expect(a.market.pavingStones).toBeLessThanOrEqual(260);
 expect(a.street.connected).toBe(true);
 expect(a.street.unsafeSamples).toBe(0);
 expect(a.street.granaryTradeEntranceUnblocked).toBe(true);
 expect(a.gateway.structuralPosts).toBeGreaterThanOrEqual(18);
 expect(a.city.citizens).toBeGreaterThan(0);
 expect(a.authorityUnchanged).toBe(true);
 expect(a.geometry.static.invalidComponents).toBe(0);
 expect(a.geometry.dynamic.invalidComponents).toBe(0);
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
 const roundtrip=await page.evaluate(snapshot=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(snapshot);
  return before===JSON.stringify(g.exportSnapshot());
 },advance.snapshot);
 expect(roundtrip).toBe(true);expect(errors).toEqual([]);
 fs.writeFileSync(dir+'/day120.json',JSON.stringify(day120,null,2));
 await page.screenshot({path:dir+'/day120-authentic-market.png'});
});