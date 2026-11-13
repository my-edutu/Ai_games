'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const HTML=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('W281 original housing residency reuses its verified topology but invalidates changed and missing homes',()=>{
 const start=HTML.indexOf('function homePartitionLiveSignature(){');
 const end=HTML.indexOf('function getStationarySettlementAudit()',start);
 expect(start,'production topology proof must exist').toBeGreaterThan(-1);
 expect(end).toBeGreaterThan(start);
 const calls={groups:0,builds:0,details:0};
 const one={key:'old',homes:1,mesh:new Float32Array(30),buffer:{}};
 const ctx={
  HOME_STATIC_GEOMETRY_KEY_VERSION:'w281-real-homes',
  city:[[2,3,0]],scenicMeshKey:'season:founders',
  homeClusterActive:[one],homeClusterCache:new Map([['old',one]]),
  homePartitionLastTopology:'',homePartitionTopologyScans:0,homePartitionFastReuses:0,
  homePartitionGuardFallbacks:0,homeClustersEnabled:()=>true,
  detailedHomeSet:()=>{calls.details++;return new Set([0])},
  homeClusterGroups:()=>{calls.groups++;return [{key:ctx.city[0][0]===2?'old':'new'}]},
  buildHomeClusters:()=>{calls.builds++;ctx.homeClusterActive=[one]},
  resetHomeVisualStats:()=>{},
  settlementSeasonCache:new Map(),scenicMeshCache:new Float32Array(30),
  gpuAvailable:false,activeCivicMesh:()=>[],homeClusterFloats:()=>0,
  villageVisualLod:{compactRoofPaletteCounts:[]},
  cottageFacadeStats:{styles:[]},streetMorphologyStats:{archetypes:[]},
  independentHousingRefreshes:0,independentHousingGrowthSkips:0,
  independentHousingGrowthWitnesses:[],state:{t:0},civicActiveKey:'',
  scenicMeshTriangles:0
 };
 vm.runInNewContext(HTML.slice(start,end),ctx);
 ctx.homePartitionLastTopology=ctx.homePartitionLiveSignature();
 expect(ctx.refreshIndependentHousing('spring','season:founders')).toBe(false);
 expect(calls.details).toBe(0);
 expect(calls.groups).toBe(0);
 expect(ctx.homePartitionFastReuses).toBe(1);
 ctx.city[0][0]=4; // one authentic lot relocated without population changing
 ctx.refreshIndependentHousing('spring','season:founders');
 expect(calls.details).toBe(1);
 expect(calls.groups).toBe(1);
 expect(calls.builds).toBe(1);
 ctx.city[0][0]=2;
 ctx.homePartitionLastTopology=ctx.homePartitionLiveSignature();
 ctx.homeClusterCache.delete('old'); // GPU buffer evicted by real memory pressure
 ctx.refreshIndependentHousing('spring','season:founders');
 expect(calls.builds).toBe(2);
 expect(ctx.homePartitionGuardFallbacks).toBeGreaterThanOrEqual(1);
});

for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W281 real WebGL inhabited home partitions survive paused camera and keep all homes '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(HTML);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>90000,null,{timeout:110000});
  await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0);g.setHomePartitionOverride(true)});
  await page.waitForFunction(()=>window.__tinyKingdom?.getHomePartitionAudit()?.activeHomes>0,null,{timeout:110000});
  const original=await page.evaluate(()=>{
   const g=window.__tinyKingdom,cam=g.getCamera();
   return {authority:JSON.stringify(g.exportSnapshot()),camera:cam,
    homes:g.getHomePartitionAudit(),buildings:g.metrics().buildings};
  });
  await page.evaluate(yaw=>window.__tinyKingdom.setCamera({yaw:yaw+.05}),original.camera.yaw);
  await page.waitForFunction(previous=>window.__tinyKingdom.getHomePartitionAudit().fastReuses>previous,
   original.homes.fastReuses,{timeout:110000});
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom,homes=g.getHomePartitionAudit(),audit=g.getGeometryAudit();
   return {authority:JSON.stringify(g.exportSnapshot()),homes,audit,
    buildings:g.metrics().buildings,overflow:document.documentElement.scrollWidth-innerWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(after.authority).toBe(original.authority);
  expect(after.buildings).toBe(original.buildings);
  expect(after.homes.activeHomes).toBeGreaterThan(0);
  expect(after.homes.activeHomes).toBe(after.homes.realTownHomes);
  expect(after.homes.staleDrawn).toBe(0);
  expect(after.homes.fastReuses).toBeGreaterThan(original.homes.fastReuses);
  expect(after.audit.totalTriangles).toBeLessThan(160000);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(after.gl).toBe(0);expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w281',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w281/real-housing-'+viewport.width+'.png'});
 });
}
