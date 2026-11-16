'use strict';
/* W370 RED-first: actual watch-grain farmer previously failed to activate
 * physical workday camera when Live Shift was disabled. Test real source
 * function, without creating citizens or changing authoritative world state.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function segment(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing original running-game camera function: '+start);
 return source.slice(a,b);
}
const production=segment('function genuineGrainLaborCameraActive(citizen){',
 'function planCitizenCamera(')+segment('function observedWorkdayCameraPlan(citizen,preferredYaw){',
 'function getCourierDocumentaryCameraAudit(){');
function run({producer='Bram',activity='Harvesting grain',workday=false,
 delivery=false,grain=true,viewport=390}={}){
 const events=[],citizen={name:'Bram',job:'farmer',activity,x:12,z:-7,
  delivery:delivery?{id:'actual-food-escrow',stage:'travel',resource:'food'}:null};
 const context={grainJourney:grain?{producer}:null,liveWorkday:workday,
  document:{body:{dataset:{workday:'live'}}},city:[],
  canvas:{clientWidth:viewport,clientHeight:844},
  recentObservedCourierReceipt:()=>null,
  isObservedRealCourier:p=>Boolean(p.delivery),
  isWorkingAtSite:p=>p.activity==='Harvesting grain',
  getCottageHomecomingAudit:()=>({doors:[],closedDoors:[]}),
  cameraArchitectureTopologyKey:()=> 'unchanged-roof-and-nav',
  actionCameraZoom:null,actionCameraPitch:null,
  performance:{now:()=>1234},
  liveShotPlanCache:null,liveShotPlanBuilds:0,
  tryReusePhysicalCourierShot:()=>null,
  planCitizenCamera:(p,yaw,forced=false)=>{
   events.push({name:p.name,forced,delivery:Boolean(p.delivery)});
   return {yaw,pitch:forced?.24:.76,zoom:forced?4.8:12.8,
    target:[p.x,1,p.z],eye:[p.x+2,3,p.z+3]};
  }};
 context.citizen=citizen;
 vm.runInNewContext(production,context,{timeout:2000});
 const lens=vm.runInNewContext('observedWorkdayCameraPlan(citizen,.4)',context,{timeout:2000});
 return {lens,events,context};
}
const watched=run();
assert.equal(watched.events.length,1);
assert.equal(watched.events[0].forced,true,
 'A real watched harvesting farmer must use the physical working-IK camera');
assert.equal(watched.lens.zoom,4.8,'Original close-up is activated, not far generic Follow');
assert.equal(watched.context.liveShotPlanBuilds,1,'Workday lens must remain cacheable');
assert.equal(run({grain:false}).events[0].forced,false,
 'Ordinary spectators retain their original camera');
assert.equal(run({producer:'Someone Else'}).events[0].forced,false,
 'Watching one parcel must not invent labor for a different worker');
assert.equal(run({activity:'Resting at home'}).events[0].forced,false,
 'A rested resident must not be fabricated as a harvesting worker');
assert.equal(run({delivery:true,activity:'Hauling to market'}).events[0].forced,false,
 'The authentic loaded-courier delivery lens keeps its existing camera contract');
assert.equal(run({grain:false,workday:true}).events[0].forced,true,
 'Existing live workday camera remains intact');
assert.match(source,/const working=Boolean\(forceWorkday\|\|liveWorkday\|\|\s*genuineGrainLaborCameraActive\(citizen\)/,
 'Real grain witness must activate actual portrait and physical camera sampling');
assert.match(source,/const isPortraitWorkWitness=[\s\S]*?genuineGrainLaborCameraActive\(citizen\)/,
 '390px actual watched grain needs bounded real crop/roof alternative survey');
assert.match(source,/function workdayCameraCompositionAudit\(\)[\s\S]*?genuineGrainLaborCameraActive\(person\)/,
 'Real grain actor must publish the physical workday-obstruction audit');
console.log('W370 genuine watched farmer: original physical worker lens, ordinary spectator, different producer, resting resident, loaded courier, 390px crop safety, existing Live Shift PASS. Hardware/visual A/B NOT PROVEN.');
