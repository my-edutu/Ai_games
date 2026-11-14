'use strict';
// W316: execute the actual production civic-core rendering path against a
// deterministic original-geometry fixture. Verify near-road house changes
// rebuild ONLY truthful streets while the complete unchanged farm/market
// core survives in the same triangle stream; season/reset still invalidate.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'actual inline playable world source must exist');
new Function(script);
const start=script.indexOf('const CIVIC_CORE_MAX_ENTRIES=');
const last=script.indexOf('function render(now)',start);
assert.ok(start>=0&&last>start,
 'W316 civic-core caching must be integrated into the actual renderer');
const original=script.slice(start,last);
assert.ok(original.includes('function updateResidentCivicDistrict('),
 'must test the real game renderer, not a surrogate implementation');
assert.match(script,/clearCivicCoreCache\(\)/,
 'world reset or restore must invalidate the complete core cache');
let current=null;
function world(){
 const calls={},city=Array.from({length:12},(_,i)=>[i,8,i%3]);
 const env={data:[],city,gpuAvailable:false,civicGpuResidencyEnabled:false,
  scenicMeshCache:null,civicSceneryCache:new Map(),civicActiveKey:'',
  civicCacheBuilds:0,civicCacheReuses:0,currentMaterial:0,
  guildhallVisualStats:{},farmScene:{},craftCounters:{},
  marketQuarterStats:{},highStreetStats:{},farmMarketStreetStats:{},
  farmStreetWeaveStats:{},roadsideMicroterrainStats:{},
  GROUND:0,routeMode:1,season:'spring',daylight:'day',
  stationaryFounders:()=>city.slice(0,12).map(x=>x.join(':')).join(';'),
  liveCivicTopologyKey:(climate,light)=>climate+':'+light+':route'+env.routeMode,
  climateAt:()=>({season:env.season==='spring'?0:2}),
  farmFieldResidentSeason:0,farmFieldResidentDisabled:true,
  prepareResidentFarmFields:()=>true,
  appendCivicCachedVertices:vertices=>{for(const v of vertices)env.data.push(v)},
  copyStaticVertexRange:start=>new Float32Array(env.data.slice(start)),
  restoreCivicStats:stats=>{
   env.guildhallVisualStats={...stats.guildhall};
   env.farmScene={...stats.farm};
   Object.assign(env.craftCounters,stats.craft);
   env.marketQuarterStats={...stats.market};
   env.highStreetStats={...stats.highStreet};
   env.farmMarketStreetStats={...stats.farmMarketStreet};
   env.currentMaterial=stats.finalMaterial;
  },
  rememberCivicScenery:(key,start,stats)=>{
   env.civicSceneryCache.set(key,{vertices:env.data.slice(start),stats});
   return true;
  },
  terrain:()=>0,rgb:()=>[.5,.5,.5]
 };
 const labels=['hall','farmstead','windmill','fenceLine','riverBridge',
  'hillsideSanctuary','forgeWorkshop','market','marketQuarter',
  'inhabitedHighStreet','farmMarketStreet','well','villageGarden',
  'guildBanner','lantern','stoneBoulder','box'];
 labels.forEach((name,index)=>{
  env[name]=()=>{
   calls[name]=(calls[name]||0)+1;
   const id=name==='inhabitedHighStreet'||name==='farmMarketStreet'?
    1000+index*10+env.routeMode:index+1;
   for(let i=0;i<30;i++)env.data.push(id);
   if(name==='hall')env.guildhallVisualStats={sections:calls[name]};
   if(name==='farmstead')env.farmScene={fields:calls[name],season:env.season};
   if(name==='forgeWorkshop')env.craftCounters={forge:calls[name]};
   if(name==='marketQuarter')env.marketQuarterStats={shops:calls[name]};
   if(name==='inhabitedHighStreet')env.highStreetStats={routes:env.routeMode};
   if(name==='farmMarketStreet')env.farmMarketStreetStats={routes:env.routeMode};
  };
 });
 vm.runInNewContext(original,env,{timeout:2500});
 return {env,calls,draw:(route=1,season='spring')=>{
  env.routeMode=route;env.season=season;env.data=[];
  vm.runInNewContext('updateResidentCivicDistrict('+JSON.stringify(season)+',"day")',env,
   {timeout:2500});
  return env.data.slice();
 }};
}
const retained=world();
const day1=retained.draw();
const coreFirst=retained.calls.hall;
assert.ok(day1.length>0&&coreFirst===1,'first frame draws full civic core');
retained.city.push([24,17,0]);
const afterNearRoad=retained.draw(2);
assert.equal(retained.calls.hall,coreFirst,'near-road home cannot regenerate guildhall');
assert.equal(retained.calls.farmstead,1,'genuine existing granary and farm retained');
assert.equal(retained.calls.marketQuarter,1,'unchanged original four shops retained');
assert.equal(retained.calls.inhabitedHighStreet,2,'true home streets replan');
assert.equal(retained.calls.farmMarketStreet,2,'true courier freight streets replan');
const cold=world();
cold.env.city.push([24,17,0]);
const uncachedNear=cold.draw(2);
assert.deepEqual(afterNearRoad,uncachedNear,
 'retained original civic core plus recomputed roads must match a full cold build vertex for vertex');
assert.notDeepEqual(day1,afterNearRoad,'actual changed street geometry must remain visible');
const audit=vm.runInNewContext('getCivicCoreResidencyAudit()',retained.env);
assert.ok(audit.reuses>=1&&audit.builds>=1);
assert.ok(audit.cachedFloats>0&&audit.cachedFloats<=audit.floatBudget);
assert.equal(audit.fullOriginalGeometryPreserved,true);
retained.draw(3,'autumn');
assert.equal(retained.calls.hall,2,'season switch invalidates original granary/market');
vm.runInNewContext('clearCivicCoreCache()',retained.env);
retained.draw(4,'autumn');
assert.equal(retained.calls.hall,3,'world reset invalidates old core resident source');
console.log('W316 PASS: original full-mesh farm/market core reused across near-road construction, cold-vs-cached vertex identity exact, original streets remade, climate/reset invalidation bounded. NO FPS or visual PASS.');
