'use strict';
// W200 actual playable HTML contract: historic original home, never a reenacted event.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=source.indexOf('<script>'),b=source.indexOf('</script>',a);
assert(a>=0&&b>a);new Function(source.slice(a+8,b));
const i=source.indexOf('function realGrainHomeFrontage(home){'),
 j=source.indexOf('function toggleRealGrainHomeWitness(){',i);
assert(i>=0&&j>i,'original real cottage close-up exists in the runnable game');
const snippet=source.slice(i,j),city=[[10,3,2]],world=JSON.stringify(city);
const home={homeIndex:0,x:10,z:3,resident:'Isolde',mealId:'genuine-meal-id'};
const defaults={
 city,canvas:{clientWidth:390,clientHeight:844},
 terrain:()=>0,followCameraRoofs:()=>[],
 physicalFollowEyeClearance:()=>({clear:true}),
 followRayBlockers:()=>0,
 foregroundVegetationProjection:()=>({cover:0,faceBlockers:0}),
 foregroundSceneProjection:()=>({cover:0,cargoCover:0})
};
function run(override={}){
 const scope=vm.createContext({...defaults,...override});
 return vm.runInContext(snippet+
  '\n({realGrainHomeFrontage,chooseRealGrainHomeLens})',scope);
}
const close=run().chooseRealGrainHomeLens(home);
assert(close&&close.zoom>=4.8&&close.zoom<=8.2,'old overhead 11.5m view rejected');
assert.equal(close.source,'real-recorded-cottage-front-exterior');
assert.equal(close.homeKey,'10,3,2');
assert.equal(close.blockingVolumes,0);
assert(close.eye[2]<close.aim[2]-.25,'camera must remain outside front door');
assert(close.checkedShots<=84&&close.clearShots>0,'bounded real physical survey');
assert.equal(JSON.stringify(city),world,'no moved or invented house');
for(const [name,rejection] of [
 ['opaque roof',{followRayBlockers:()=>1}],
 ['blocked eye',{physicalFollowEyeClearance:()=>({clear:false})}],
 ['conifer',{foregroundVegetationProjection:()=>({cover:.9,faceBlockers:1})}],
 ['scenery',{foregroundSceneProjection:()=>({cover:.9,cargoCover:0})}]
]){
 assert.equal(run(rejection).chooseRealGrainHomeLens(home),null,
  'never film a physically blocked '+name);
}
const alternate=run({followRayBlockers:eye=>Math.abs(eye[0]-10)<2?1:0})
 .chooseRealGrainHomeLens(home);
assert(alternate&&Math.abs(alternate.yaw-Math.PI)>.35,'physically clear alternate angle');
assert.equal(run().chooseRealGrainHomeLens({...home,x:99}),null);
assert.equal(run().chooseRealGrainHomeLens({...home,homeIndex:55}),null);
assert(source.includes("grainJourney.homeLens?.homeKey!==city[realHome.homeIndex]?.join(',')"),
 'same-count save restoration must invalidate lens');
const t=source.slice(source.indexOf('function currentPhysicalFollowTarget(){'),
 source.indexOf('function citizenDetailCameraFrame(){'));
assert(t.includes('getRealGrainHomeWitness()')&&
 t.includes('lens.aim.every(Number.isFinite)')&&
 t.includes('return lens.aim.slice()'),
 'actual WebGL eye and citizen LOD use the SAME real exterior target');
assert(source.includes('historicalMealNotReenacted:true'),
 'authentic historical meal never portrayed as a current action');
console.log('W200 ORIGINAL physical home close-up PASS: no invented acts, bounded eye+roof+conifer+door survey; running visual A/B and hardware FPS NOT PROVEN.');
