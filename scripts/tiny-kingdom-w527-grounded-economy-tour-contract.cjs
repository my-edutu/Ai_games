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
   Number,Math,
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
  assert.deepEqual(Array.from(candidate.focus),p.focus);
  assert.ok(views.length<=72,'click-time original roof checks bounded');
  const blocked={Number,Math,freeCameraSightline:()=>({clear:false})};
  vm.createContext(blocked);
  const none=vm.runInContext(code+'\nchooseGroundedEconomicSurveyLens('+JSON.stringify(p)+',[], '+width+');',blocked);
  assert.equal(none,null,'never fabricate a clear actual stage');
 }
}
console.log('W527 physically selected authentic farm-market-home lower-angle camera source contract PASS; actual WebGL footage separately gated');
