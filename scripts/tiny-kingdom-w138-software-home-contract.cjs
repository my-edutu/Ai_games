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
console.log('W138 8 RED/GREEN source policy cases + actual-scene key + preserved real homes/16m/GL budgets PASS; WebGL/Day120/physical FPS NOT VERIFIED.');
