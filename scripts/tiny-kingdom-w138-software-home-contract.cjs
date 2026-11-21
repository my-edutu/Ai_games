'use strict';
/* W138 Phase 1: source-first RED/GREEN grown-town software dirty-block contract.
   It checks the actual playable inline script, not a surrogate economy.
   Browser render, CI status and hardware FPS are separate, unproved gates. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
new vm.Script(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')));
const start=html.indexOf('const SOFTWARE_HOME_CLUSTER_MIN_HOMES=');
const end=html.indexOf('function homeClusterFloats()',start);
assert(start>0&&end>start);
const policy=new Function('gpuAvailable','swiftGpu','homeClusterOverride','city',
 html.slice(start,end)+'return homeClustersEnabled();');
for(const [gpu,software,forced,count,expected] of [
 [false,true,null,40,false],[true,false,null,4,true],
 [true,true,null,17,false],[true,true,null,18,true],
 [true,true,null,37,true],[true,true,false,37,false],
 [true,true,true,6,true],[true,false,false,37,false]
])assert.equal(policy(gpu,software,forced,Array(count)),expected,
 'W138 policy '+JSON.stringify([gpu,software,forced,count]));
const sceneFrom=html.indexOf('function stationarySceneKey(');
const sceneTo=html.indexOf('function resetHomeVisualStats()',sceneFrom);
assert(sceneFrom>0&&sceneTo>sceneFrom);
const scene=new Function('gpuAvailable','homeClustersEnabled','stationaryFounders','city',
 html.slice(sceneFrom,sceneTo)+'return stationarySceneKey;');
assert.match(scene(true,()=>true,()=> 'original-founders',Array(37))('winter','day'),/founders:original-founders/);
assert.match(scene(true,()=>false,()=> 'original-founders',Array(17))('winter','day'),/:17$/);
for(const token of [
 'const HOME_CLUSTER_EDGE=16','function buildHomeClusters(',
 'takeStaleHomeClusterForGrowth(group,climateKey,',
 'if(homeClusterActive.reduce((n,e)=>n+e.homes,0)!==city.length)',
 "throw Error('W76 dropped a real inhabited cottage')",
 'if(homeClusterCachedFloats>HOME_CLUSTER_FLOAT_BUDGET',
 'if(!homeClustersEnabled()||scenicMeshKey!==sceneKey)return false;',
 "swiftGpu?'real-grown-town-dirty-blocks':'hardware-dirty-blocks'",
 'getHomePartitionAudit,getStationarySettlementAudit,setHomePartitionOverride',
 'lastFrameTriangles='
])assert(html.includes(token),token);

// W446 RED before the fix: the same authentic market camera selected eight
// distant high-detail houses with a complete VBO, but six physically local
// cottages with resident/dirty blocks. That is NOT rendering parity.
// Execute the actual production function, not a copied substitute.
const lodFrom=html.indexOf('function realHomeDetailViewMode(');
const lodTo=html.indexOf('function currentHomeDetailAnchor()',lodFrom);
assert(lodFrom>0&&lodTo>lodFrom);
const cameraMode=new Function('HOME_DETAIL_LOCAL_ORBIT_ZOOM',
 html.slice(lodFrom,lodTo)+'return realHomeDetailViewMode;')(35);
for(const count of [13,28,35,120])for(const zoom of [12,20,23,35,43,70]){
 for(const onStreet of [false,true])for(const following of [false,true]){
  const a=cameraMode(count,true,onStreet,following,false,zoom);
  const b=cameraMode(count,false,onStreet,following,false,zoom);
  assert.equal(a,b,'identical original camera must not change actual home detail with GPU partition mode');
  assert.equal(a,(onStreet||following||zoom<=35)?'inspection':'overview',
   'real workday proximity must select truthful occupied-cottage details');
 }
}
for(const count of [3,12])for(const zoom of [5,23,70])
 assert.equal(cameraMode(count,true,true,true,false,zoom),'overview',
  'original founding geometry remains fully detailed without extra switching');
assert.equal(cameraMode(35,true,false,false,true,23),'overview',
 'cinematic view remains established original overview policy');
assert.match(html,/rendererModeLodParity:true/);
console.log('W446 original home LOD equals across complete/dirty GPU rendering for 192 physical camera cases; real 120-day browser evidence remains required.');

console.log('W138 8 RED/GREEN source policy cases + actual-scene key + preserved real homes/16m/GL budgets PASS; WebGL/Day120/physical FPS NOT VERIFIED.');
