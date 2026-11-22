'use strict';
// W126: RED-before/GREEN-after contract for the real, saved workday.
// Browser gameplay/clip assertions are separate; source strings are NOT FPS proof.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(source);
for(const symbol of [
 "function getAuthenticWorkGesture(p)",
 "function getBuilderConstructionIntent(p)",
 "function courierCartGripTarget(side)",
 "function getAuthenticWorkdayAudit()",
 "getAuthenticWorkdayAudit,getCourierCartGripAudit",
 "const construction=getBuilderConstructionIntent(p);"
])
 assert(source.includes(symbol),'W126 actual workday implementation missing: '+symbol);
// This prevents new workday staging from silently replacing the genuine engine.
for(const invariant of [
 'function beginMarketHandoff(p)',
 'function completeActualDelivery(p)',
 'function startActualDelivery(p)',
 'function routeCitizen(p)',
 'function work(p)',
 'function exportSnapshot()',
 'function getHarvestInteractionAudit()',
 'function getForgeCraftCycleAudit()',
 'function renderCompletedHarvestWitnesses()'])
 assert(source.includes(invariant),'W126 authoritative contract lost: '+invariant);
assert(source.includes('if(construction.canBuild){'),
 'W126 a physical building frame must never award a fake cottage');
assert(source.includes('for(let i=vertexStart;i<bodyEnd;i+=10)'),
 'W126 weighted citizen torso cannot shear a genuine inventory cart');
assert(source.includes('p.activity===\'Harvesting grain\''),
 'W126 winter-store task cannot pretend to cut a living field');
console.log('W126 genuine profession/source boundaries PASS; runtime, mobile, replay and footprint remain browser gates.');

/* Executable unit-level fixtures for the EXACT functions extracted from the
 * shipping HTML; this is NOT a staged gameplay recording or synthetic actor
 * inserted into the live game. Full browser WebGL remains a separate gate. */
function extract(name){
 const offset=source.indexOf('function '+name+'(');
 assert(offset>=0,'W126 source function missing: '+name);
 const start=source.indexOf('{',offset);
 let depth=0,i=start;
 for(;i<source.length;i++){
  if(source[i]==='{')depth++;
  else if(source[i]==='}'){
   depth--;
   if(depth===0)break;
  }
 }
 assert(depth===0,'W126 malformed source function '+name);
 return source.slice(offset,i+1);
}
const builderSource=[extract('getBuilderConstructionIntent'),extract('work')].join('\n');
const builderFixture=new Function('wood','blocked','homes',[
 "const state={t:40,wood,food:500,gold:100,lastStory:999,buildCount:0};",
 "const city=Array.from({length:homes},(_,i)=>[-1-i,9,i%3]),people=[];",
 "const p={name:'Actual Builder Fixture',job:'builder',x:7,z:-4,",
 " energy:60,hunger:20,activity:'Constructing cottages'};",
 "people.push(p);",
 "if(blocked)people.push({name:'Genuine Plot Occupant',job:'farmer',",
 " x:-17-Math.floor((homes-12)/3)*3.1,z:-14+((homes-12)%3)*6.5});",
 "const events=[],reports=[];",
 "const jobWorkActivity=()=> 'Constructing cottages';",
 "const climateAt=()=>({yieldMultiplier:1}),",
 " report=v=>reports.push(v),recount=()=>{},",
 " recordActualWork=(p,before)=>events.push({before,after:{wood:state.wood,buildings:city.length}});",
 builderSource,
 "const plan=getBuilderConstructionIntent(p);work(p);",
 "return {canBuild:plan.canBuild,wood:state.wood,created:city.length-homes,",
 " buildCount:state.buildCount,eventCount:events.length};"
].join('\n'));
for(const testCase of [
 {name:'clear-budgeted-build',wood:28,blocked:false,homes:12,canBuild:true,created:1,left:0},
 {name:'no-fake-timber',wood:27.99,blocked:false,homes:12,canBuild:false,created:0,left:27.99},
 {name:'occupied-plot-no-ghost-counter',wood:28,blocked:true,homes:12,canBuild:false,created:0,left:28},
 {name:'world-building-cap',wood:30,blocked:false,homes:35,canBuild:false,created:0,left:30}
]){
 const result=builderFixture(testCase.wood,testCase.blocked,testCase.homes);
 assert.equal(result.canBuild,testCase.canBuild,testCase.name);
 assert.equal(result.created,testCase.created,testCase.name);
 assert.equal(result.buildCount,result.created,testCase.name+' ghost count');
 assert(Math.abs(result.wood-testCase.left)<1e-9,testCase.name+' wood conservation');
 assert.equal(result.eventCount,1,testCase.name+' genuine completed job recorded once');
}
const scopeCode=[extract('courierCartGripTarget'),extract('isLoadedCourierOnRoad'),
 extract('getAuthenticWorkGesture'),extract('occupationalPerformance'),
 extract('solveWorkArmIK'),extract('citizenRigPose')].join('\n');
const exactShaft=source.match(/const COURIER_CART_GRIP=Object\.freeze\(\{lateral:\.29,height:\.45,back:-\.20\}\);/);
assert(exactShaft,'W126 authored shaft must match original physical cart endpoints');
const courierFixture=new Function('delivery','activity','phase',[
 "const p={name:'Original Courier Fixture',job:'farmer',x:4,z:1,",
 " phase,activity,energy:80,hunger:30,workTimer:.6,",
 " target:[6,2],path:[[5,2]],delivery};",
 "const people=[p],city=[],state={t:100,wood:40},presentationEpoch=0;",
 "let citizenRigEpoch=-1,citizenRigTime=-1,citizenRigCache=new WeakMap(),",
 " citizenRigEntries=0,citizenRigResets=0,citizenRigHits=0,citizenRigBuilds=0;",
 "const isWorkingAtSite=()=>false,isMarketUnloading=()=>false,",
 " getPhysicalGreeting=()=>null,terrain=()=>0,workDuration=()=>2,",
 " actualForgeHandTarget=()=>null;",
 exactShaft[0],scopeCode,
 "const rig=citizenRigPose(p),gesture=getAuthenticWorkGesture(p);",
 "const gaps=[-1,1].map((side,i)=>Math.hypot(",
 " ...rig.arms[i].wrist.map((v,j)=>v-courierCartGripTarget(side)[j])));",
 "return {hauling:rig.hauling,stage:gesture.stage,gaps,contacts:rig.legs.map(v=>v.contact)};"
].join('\n'));
for(const phase of [0,1,10]){
 const r=courierFixture({id:'Original:32',resource:'food',amount:2,
  escrowed:true,stage:'travel'},'Traveling with food to market',phase);
 assert.equal(r.hauling,true,'legitimate load carries both hands');
 assert.equal(r.stage,'hauling','real escrow stage');
 assert(r.gaps.every(gap=>gap<.005),'both wrists contact unmodified cart shafts');
 assert(r.contacts.every(contact=>contact==='stance'||contact==='swing'),
  'loaded route uses actual walking stance');
}
const nonCargo=courierFixture(null,'Traveling to farmer work',2);
assert.equal(nonCargo.hauling,false,'no movie cart without original escrow');
const stageFixture=new Function('job','activity','fraction','wood',[
 "const p={name:'Genuine Worker Fixture',job,x:7,z:-4,phase:3,",
 " workTimer:fraction*2,activity,path:[],target:[7,-4]};",
 "const state={t:100,wood},city=Array.from({length:12},(_,i)=>[-i,9,i%3]),",
 " people=[p],DELIVERY_UNLOAD_HOURS=1;",
 "const isMarketUnloading=()=>false,isWorkingAtSite=()=>true,workDuration=()=>2;",
 extract('isLoadedCourierOnRoad'),
 extract('getBuilderConstructionIntent'),extract('getAuthenticWorkGesture'),
 "const before=JSON.stringify({state,city,people});",
 "const result=getAuthenticWorkGesture(p);",
 "return {stage:result.stage,unchanged:before===JSON.stringify({state,city,people})};"
].join('\n'));
for(const [job,activity,fraction,wood,stage] of [
 ['farmer','Harvesting grain',.02,40,'preparing'],
 ['farmer','Harvesting grain',.50,40,'cutting'],
 ['farmer','Harvesting grain',.80,40,'gathering'],
 ['farmer','Harvesting grain',.98,40,'tying'],
 ['farmer','Tending winter stores',.50,40,'winter-stores'],
 ['craftsperson','Making household goods',.10,40,'stoking'],
 ['craftsperson','Making household goods',.50,40,'hammering'],
 ['craftsperson','Making household goods',.90,40,'quenching'],
 ['builder','Constructing cottages',.10,40,'marking'],
 ['builder','Constructing cottages',.50,40,'joining'],
 ['builder','Constructing cottages',.80,40,'raising'],
 ['builder','Constructing cottages',.95,40,'seating'],
 ['builder','Constructing cottages',.50,20,'joinery-only']
]){
 const r=stageFixture(job,activity,fraction,wood);
 assert.equal(r.stage,stage,job+' @'+fraction+' real shift stage');
 assert.equal(r.unchanged,true,'presentation stage must never mutate the world');
}
console.log('W126 four genuine profession state-machine fixtures, cart two-hand IK, builder timber/plot/count, and read-only work clocks PASS. Browser WebGL acceptance separate.');
