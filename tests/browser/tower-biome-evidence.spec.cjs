'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');
const {analyzePng,assertVisualMinimum}=require('../../scripts/tower-image-metrics.cjs');
const base='http://127.0.0.1:4176/tower/volumetric';
const artifacts=path.resolve(__dirname,'../../artifacts/tower-gauntlet-evidence');
test.use({launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));
for(const [biome,floor] of [['foundry',0],['ruins',12],['clockwork',24],['storm',36],['void',48]]){
  test('stage and capture physically navigated 3D '+biome+' biome',async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.setViewportSize({width:1600,height:900});
    await page.goto(base+'?seed=42&captureFloor='+floor,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
    await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.assetStatus==='authored-asset-loaded',null,{timeout:30000});
    const state=await page.evaluate(()=>({...window.__TOWER_VOLUMETRIC_STATE__}));
    expect(state.dimensionality).toBe(3);
    expect(state.assetClips).toEqual(expect.arrayContaining(['Idle','Running','Jump','Fall','Climb','Punch']));
    expect(state.floor).toBeGreaterThanOrEqual(floor);
    expect(state.biome).toBe(biome);
    expect(state.platforms).toBeGreaterThan(0);
    await page.waitForTimeout(450);
    const screenshot=await page.screenshot({path:path.join(artifacts,biome+'-proof-1600x900.png'),fullPage:true});
    const imageMetrics=assertVisualMinimum(analyzePng(screenshot));
    fs.writeFileSync(path.join(artifacts,biome+'-state.json'),JSON.stringify({state,errors,imageMetrics},null,2));
    expect(errors).toEqual([]);
  });
}
test('capture guardian combat shot with visible guardian body',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'?seed=42&captureFloor=10',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TOWER_VOLUMETRIC_STATE__?.status==='live',null,{timeout:30000});
  const screenshot=await page.screenshot({path:path.join(artifacts,'guardian-encounter-1600x900.png'),fullPage:true});
  assertVisualMinimum(analyzePng(screenshot));
  const state=await page.evaluate(()=>({...window.__TOWER_VOLUMETRIC_STATE__}));
  expect(state.floor).toBeGreaterThanOrEqual(10);
  expect(state.guardianKills).toBeLessThanOrEqual(2);
});

test('five biome screen captures have measurably different color palettes',()=>{
 const names=['foundry','ruins','clockwork','storm','void'];
 const metrics=names.map(n=>JSON.parse(fs.readFileSync(path.join(artifacts,n+'-state.json'),'utf8')).imageMetrics);
 for(let i=1;i<metrics.length;i++){
   const a=metrics[i-1].meanRGB,b=metrics[i].meanRGB;
   const delta=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
   expect(delta).toBeGreaterThan(3);
 }
});
