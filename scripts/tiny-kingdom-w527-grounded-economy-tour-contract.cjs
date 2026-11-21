'use strict';
// W527 RED-before: W526 had no physically screened three-stop economic
// lens and advertised R shortcut was excluded by its keyboard key filter.
// GREEN-after evaluates the unmodified production selector with bounded
// physical-mesh sightlines and no synthetic market or worker.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=s.indexOf('let groundedEconomicSurveyChecks=0');
const end=s.indexOf('function advanceRealEconomicSurvey(){',begin);
assert.ok(begin>0&&end>begin,'original three-stage lens is present');
const code=s.slice(begin,end);
assert.match(s,/const safe=chooseGroundedEconomicSurveyLens\(plan,roofs,canvas\.clientWidth\)/);
assert.match(s,/getGroundedEconomicSurveyLensAudit\(\)/);
assert.match(s,/\'g\',\'G\',\'d\',\'D\',\'r\',\'R\'\]\.includes\(e\.key\)/);
for(const width of [1024,390]){
 for(const stage of ['farm','market','homes']){
  const views=[];
  const context={
   Number,Math,FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64]]},
   freeCameraSightline(v){
    views.push(v);
    const clear=v.pitch>=.4&&v.pitch<=.8&&v.zoom>=17&&v.zoom<=35;
    return {clear,screenDominantBuilding:clear?.12:1,
     screenOccupiedByBuildings:clear?.48:1,
     foregroundSceneCover:clear?.3:1};
   }
  };
  vm.createContext(context);
  const p={stage,focus:stage==='farm'?[21,.8]:stage==='market'?[-1,10]:[2,7],yaw:2.1};
  const candidate=vm.runInContext(code+'\nchooseGroundedEconomicSurveyLens('+JSON.stringify(p)+',[], '+width+');',context);
  assert.ok(candidate,'valid ground-level actual site must have a lens');
  assert.equal(candidate.stage,stage);
  assert.ok(candidate.pitch<=.8&&candidate.zoom<=35);
  // Computed midpoint averages need numeric tolerance: (16.45+24.65)/2
  // is 20.549999999999997 under IEEE-754, not literal 20.55.
  // This contract tests the actual location, never string/bit rounding.
  const expectedFocus=stage==='farm'?[20.55,1.01]:p.focus;
  const actualFocus=Array.from(candidate.focus);
  assert.equal(actualFocus.length,2,'camera keeps a 2D focus');
  for(let i=0;i<2;i++){
   assert.ok(Number.isFinite(actualFocus[i]),'physical focus coordinate is finite');
   assert.ok(Math.abs(actualFocus[i]-expectedFocus[i])<1e-9,
    'stage '+stage+' coordinate '+i+' must match the real location: '+actualFocus[i]);
  }
  assert.ok(views.length<=72,'click-time original roof checks bounded');
  const blocked={Number,Math,FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64]]},
   freeCameraSightline:()=>({clear:false})};
  vm.createContext(blocked);
  const none=vm.runInContext(code+'\nchooseGroundedEconomicSurveyLens('+JSON.stringify(p)+',[], '+width+');',blocked);
  assert.equal(none,null,'never fabricate a clear actual stage');
 }
}

// A physically clear eye can still frame most of the true wheat field
// behind sanctuary wall geometry. That is an unusable Farm introduction.
// The SAME crowded sightline is appropriate for a populated Market stage.
for(const width of [390,1024]){
 const actualYaw=2.1,stageContext={
  Number,Math,FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64]]},
  freeCameraSightline(v){
   const crowded=Math.abs(v.yaw-actualYaw)<.001;
   return {clear:true,screenDominantBuilding:.07,
    screenOccupiedByBuildings:crowded?.52:.08,
    foregroundSceneCover:.1};
  }
 };
 vm.createContext(stageContext);
 const farm=vm.runInContext(code+'\nchooseGroundedEconomicSurveyLens({stage:"farm",focus:[21,.8],yaw:2.1},[], '+width+');',stageContext);
 assert.ok(farm?.screenBuildingOccupancy<.22,
  'real farm should use physically clear low-occupancy planted-field angle');
 const market=vm.runInContext(code+'\nchooseGroundedEconomicSurveyLens({stage:"market",focus:[-1,10],yaw:2.1},[], '+width+');',stageContext);
 assert.ok(Math.abs(market?.yaw-actualYaw)<.001,
  'market must retain actual surrounding buildings, not seek an empty field');
}
console.log('W527 physically selected authentic farm-market-home lower-angle camera source contract PASS; actual WebGL footage separately gated');
