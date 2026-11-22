'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const gazePromise=import('../../public/infinite-tower-climb/visuals/source-first-raised-flight-gaze.mjs');
const source={
 floor:9,theme:'void',lifecycle:'running',runToken:'actual-defeated-guardian',
 tick:519,player:{health:4,state:'airborne',grounded:false},
 lastGuardianCrossing:{
   runToken:'actual-defeated-guardian',sourceTick:475,
   fromFloor:8,toFloor:9,cap:{id:'f8:cap'},
   guardian:{kind:'guardian',active:false,health:0}
 },
 intent:{mode:'air-control',targetPlatformId:'f9:p2'},
 platforms:[{id:'f9:ground',x:310000,y:100,width:220000,height:40000},
  {id:'f9:p2',x:358000,y:80000,width:52000,height:10000}]
};
const view={camera:'follow',stale:false,reducedMotion:false,
 aspect:390/844,dt:.04,focus:[0,10,25],hero:[6,12,25],
 landing:[9,14,24],heroNdc:[.68,.28,.98,.12]};
test('actual first elevated Floor9 flight makes bounded coherent gaze request, never changes source',async()=>{
 const {sourceFirstRaisedFlightGaze:plan}=await gazePromise;
 const before=JSON.stringify(source);
 const result=plan(source,view);
 assert.ok(result&&result.sourceBound);
 assert.equal(result.sourceTick,519);
 assert.equal(result.landingId,'f9:p2');
 assert.ok(result.gazeStepMetres>0&&result.gazeStepMetres<=25*.04+1e-8);
 assert.ok(result.gaze.every(Number.isFinite));
 const target=view.hero.map((v,i)=>v*.84+view.landing[i]*.16);
 assert.ok(Math.hypot(...target.map((v,i)=>v-result.gaze[i]))<
   Math.hypot(...target.map((v,i)=>v-view.focus[i])));
 assert.equal(JSON.stringify(source),before);
});
test('near-center hero needs no corrective gaze and desktop correction is independently bounded',async()=>{
 const {sourceFirstRaisedFlightGaze:plan}=await gazePromise;
 assert.equal(plan(source,{...view,heroNdc:[.2,0,.98,.12]}),null);
 const desktop=plan(source,{...view,aspect:960/600,heroNdc:[.84,.15,.98,.12]});
 assert.ok(desktop);
 assert.ok(desktop.gazeStepMetres<=20*.04+1e-8);
});
test('cannot borrow a wrong run, living guardian, old floor, non-real raised destination or stale source',async()=>{
 const {sourceFirstRaisedFlightGaze:plan}=await gazePromise;
 const invalid=[
  [{...source,floor:8},view],
  [{...source,runToken:'another'},view],
  [{...source,tick:586},view], // outside 110 tick window
  [{...source,lifecycle:'result'},view],
  [{...source,player:{...source.player,state:'standing',grounded:true}},view],
  [{...source,player:{...source.player,health:0}},view],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
   guardian:{kind:'guardian',active:true,health:1}}},view],
  [{...source,lastGuardianCrossing:null},view],
  [{...source,intent:{targetPlatformId:'f9:ground'}},view],
  [source,{...view,reducedMotion:true}],
  [source,{...view,camera:'overview'}],
  [source,{...view,heroNdc:[Infinity,0,.98,.12]}],
  [source,{...view,dt:0}]
 ];
 // use current timestamp >475+110, not an arbitrary browser delay.
 invalid[2][0].tick=586;
 for(const [state,option] of invalid)
   assert.equal(plan(state,option),null);
});
test('source-first-raised camera intervention runs after existing directors, preserves real gate and reverts rejected physical shot before WebGL',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const director=scene.indexOf('const retainedGateStep =');
 const first=scene.indexOf('sourceFirstRaisedFlightGaze(snapshot,');
 const draw=scene.indexOf('renderer.render(scene, camera)');
 assert.ok(director>=0&&director<first&&first<draw);
 assert.match(scene,/const originalGatewayPreserved=!originallyReadableSteel/);
 assert.match(scene,/steelAfter\?\.sourceBound===true/);
 assert.match(scene,/Math\.max\(\.012,steelBefore\.projectedMetalArea\*\.76\)/);
 assert.match(scene,/lookAt\.copy\(releasePreviousFocus\)/);
 assert.match(scene,/landingStayedReadable/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,releaseHero,23\.5\)/);
});
