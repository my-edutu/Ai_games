'use strict';
/* W368: red-first real player-visible farm->courier->market->home watch.
 * No test creates villagers, changes deliveries, steps world or credits goods.
 * Dispatch must select existing authoritative work, never stage actors.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function segment(start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'W368 expected playable function missing: '+start);
 return src.slice(a,b);
}
const functions=segment('function chooseRealGrainWitness(){','function watchRealGrainJourney(){')+
 segment('function watchVillageLife(){',"button('world-watch-life',watchVillageLife)");
function scenario(people,width=390,alreadyFollowing=false){
 const calls={grain:0,house:0,delivery:0,work:0,supply:0,audit:0,attach:0};
 const context={people,canvas:{clientWidth:width},
  grainJourney:alreadyFollowing?{producer:'Bram'}:null,
  supplyTrailOpen:false,selectedCitizen:0,
  document:{body:{dataset:{}}},
  watchRealGrainJourney:()=>{
   calls.grain++;context.grainJourney={producer:'Bram'};return {active:true,kind:'grain'};
  },
  getRealGrainJourneyAudit:()=>{calls.audit++;return {active:true,kind:'existing-grain'};},
  // The real documentary attachment is separately validated in playable source.
  // This isolated VM must inject its dependency rather than fail before dispatch.
  attachVillageDocumentaryToGrainJourney:()=>{calls.attach++;return true;},
  watchHouseholdErrand:()=>{calls.house++;return {active:true,kind:'household'};},
  watchDelivery:()=>{calls.delivery++;return {active:true,kind:'other-delivery'};},
  watchLiveWorkday:()=>{calls.work++;return {active:true,kind:'workday'};},
  toggleSupplyTrail:()=>{calls.supply++;context.supplyTrailOpen=true;},
  getVillageDocumentaryAudit:()=>({active:true,kind:'legacy-director'}),
  advanceVillageDocumentary:()=>{},
  villageDocumentary:null
 };
 vm.runInNewContext(functions,context,{timeout:2000});
 return {context,calls,watch:()=>vm.runInNewContext('watchVillageLife()',context,{timeout:2000}),
  witness:()=>vm.runInNewContext('chooseRealGrainWitness()',context,{timeout:2000})};
}
const harvest={name:'Asha',job:'farmer',activity:'Harvesting grain',delivery:null};
const courier={name:'Bram',job:'farmer',activity:'Hauling to market',
 delivery:{id:'authentic-parcel',resource:'food',stage:'on-road',amount:3.024}};
const unloading={name:'Cora',job:'farmer',activity:'Unloading',delivery:{
 id:'real-unload',resource:'food',stage:'unloading',amount:1.2}};
const irrelevant={name:'Dena',job:'builder',activity:'Constructing',delivery:null};
const mobile=scenario([harvest,courier,unloading,irrelevant],390);
assert.equal(mobile.witness(),unloading,'Follow real unloading before an unrelated fresh harvest');
assert.equal(mobile.watch().kind,'grain');
assert.equal(mobile.calls.grain,1);
assert.equal(mobile.calls.attach,1,'same genuine courier linked to one documentary');
assert.equal(mobile.calls.house,0,'Do not lose the causal food chain to a generic household errand');
assert.equal(mobile.calls.delivery,0);
assert.equal(mobile.calls.supply,0,'390px camera must not be buried under the expanded supply ledger');
const desktop=scenario([harvest,courier,irrelevant],1024);
assert.equal(desktop.witness(),courier,'A loaded real courier is preferred to unrelated harvest');
assert.equal(desktop.watch().kind,'grain');
assert.equal(desktop.calls.supply,0,'Desktop genuine workday must remain unobstructed; existing ledger is opt-in');
const fresh=scenario([harvest,irrelevant],390);
assert.equal(fresh.witness(),harvest);
assert.equal(fresh.watch().kind,'grain');
const noGrain=scenario([irrelevant],390);
assert.equal(noGrain.witness(),null);
assert.equal(noGrain.watch().kind,'household');
assert.equal(noGrain.calls.work,0,'Existing household errand stays accessible');
const continuing=scenario([harvest],390,true);
assert.equal(continuing.watch().kind,'existing-grain','Do not toggle an already observed real parcel off');
assert.equal(continuing.calls.grain,0);
assert.equal(continuing.calls.audit,1);
assert.equal(continuing.calls.attach,1,'existing parcel keeps its documentary');
assert(src.includes('function attachVillageDocumentaryToGrainJourney(){'),
 'the actual original documentary attachment must exist in the playable source');
assert.match(src,/function updateWorldRibbon\(\)\{[\s\S]*?chooseRealGrainWitness\(\)/,
 'Existing compact ribbon must identify the authentic farm/road documentary');
console.log('W368 authentic original farmer/courier priority, full workday observer, desktop/390 and no-fake-authority dispatch PASS. Running-game A/B + hardware FPS NOT PROVEN.');
