'use strict';
// W217: inspect physically different original inhabited roofs in live WebGL.
// Same genuine citizens, house lots, replay and navigation. No fake models.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w217');
fs.mkdirSync(OUT,{recursive:true});
test.use({video:'on'});
for(const width of [1024,390]){
 test('W217 genuine hipped and gabled home roofscape '+width+'px',async({page})=>{
  test.setTimeout(250000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:110000});
  await page.locator('#pause').click();
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {sky:g.getInhabitedSkylineAudit(),citizens:g.metrics().citizens,
    buildings:g.metrics().buildings};
  });
  expect(first.sky.realHomes).toBeGreaterThan(5);
  expect(first.sky.hippedHomeCount).toBeGreaterThan(0);
  expect(first.sky.hippedHomeCount).toBeLessThan(first.sky.realHomes);
  expect(first.sky.lots.filter(h=>h.roofForm==='hip').length).toBe(first.sky.hippedHomeCount);
  await page.evaluate(()=>window.__tinyKingdom.setCamera({yaw:.6,pitch:.75,zoom:38,focus:[0,0]}));
  await page.waitForTimeout(320);
  await page.screenshot({path:path.join(OUT,'founding-roofs-'+width+'.png'),fullPage:true});
  const grown=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<10*24*30;i++)g.step(1/30);
   return {authority:JSON.stringify(g.exportSnapshot()),citizens:g.metrics().citizens,
    buildings:g.metrics().buildings,sky:g.getInhabitedSkylineAudit()};
  });
  await page.waitForFunction(()=>window.__tinyKingdom?.getVillageVisualLod().compactHomes>0,null,{timeout:110000});
  const actual=await page.evaluate(()=>{
   const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
   return {authority:JSON.stringify(g.exportSnapshot()),
    geometry:g.getGeometryAudit(),sky:g.getInhabitedSkylineAudit(),
    lod:g.getVillageVisualLod(),triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:gl?.getError()??-1};
  });
  expect(actual.authority).toBe(grown.authority);
  expect(actual.sky.realHomes).toBe(grown.sky.realHomes);
  expect(actual.sky.hippedHomeCount).toBeGreaterThan(0);
  expect(actual.sky.hippedHomeCount).toBeLessThan(actual.sky.realHomes);
  expect(actual.sky.lots.filter(h=>h.roofForm==='hip').length).toBe(actual.sky.hippedHomeCount);
  expect(actual.lod.compactRoofTiles).toBe(actual.lod.compactHomes*24);
  expect(actual.triangles).toBeLessThan(160000);
  expect(actual.glError).toBe(0);
  expect(actual.overflow).toBeLessThanOrEqual(0);
  for(const group of ['static','dynamic']){
   expect(actual.geometry[group].aligned).toBe(true);
   for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
    expect(actual.geometry[group][key]).toBe(0);
  }
  await page.screenshot({path:path.join(OUT,'grown-roofs-'+width+'.png'),fullPage:true});
  fs.writeFileSync(path.join(OUT,'audit-'+width+'.json'),JSON.stringify({
   source:'original-real-world-true-day10',width,initial:first,grown:actual.sky,
   compactHomes:actual.lod.compactHomes,triangles:actual.triangles,
   realCitizens:grown.citizens,realBuildings:grown.buildings,
   softwareWebGL:true,hardwareFPS:'NOT MEASURED',
   substantialVisualPass:'NOT PROVEN',independentCritics:'NOT AVAILABLE',errors
  },null,2));
  expect(errors).toEqual([]);
  const video=page.video();await page.close();
  if(video)await video.saveAs(path.join(OUT,'lived-town-'+width+'.webm'));
 });
}
