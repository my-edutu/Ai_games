'use strict';
// W274 source-executed stage camera truth contract; the game remains authoritative.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(source,'the live original playable game exists');
new vm.Script(source);
const start=source.indexOf('function inspectRealGrainStage(');
const end=source.indexOf(" for(const name of ['field','road','market','purchase','meal'])",start);
assert(start>=0&&end>start,'the five real economy buttons must inspect live scenes');
const stageSource=source.slice(start,end);
const people=[{name:'Bram',job:'farmer',activity:'Harvesting grain'},
 {name:'Selene',job:'merchant',activity:'Resting at home'}];
const trace={producer:'Bram',deliveryId:null};
let stage='harvesting',verified=false,receipt=false,meal=false;
const events=[],chips=Object.fromEntries(['field','road','market','purchase','meal']
 .map(s=>[s,{dataset:{inspecting:'false'}}]));
const ctx={people,grainJourney:trace,state:{householdTrades:[],householdMeals:[]},
 deliveryReceipts:[],city:[[0,0,0]],selectedCitizen:0,follow:true,streetWalk:false,
 presentationEpoch:0,lastFollowShot:null,liveShotPlanCache:null,
 getSupplyTrailSnapshot:()=>({}),realGrainChainStages:()=>({stages:{
  field:'active',road:'waiting',market:'waiting',purchase:'waiting',meal:'waiting'}}),
 planRealGrainJourney:()=>({stage,citizen:'Bram',producer:'Bram',deliveryId:'parcel-1',
  hasActualReceipt:receipt,receiptId:receipt?'parcel-1':null,
  hasVerifiedTrade:verified,consumer:verified?'Selene':null,
  hasVerifiedMeal:meal,homeIndex:meal?0:null}),
 isWorkingAtSite:p=>p.activity==='Harvesting grain',
 isLoadedCourierOnRoad:p=>p.delivery?.escrowed===true&&p.delivery.stage==='travel',
 isMarketUnloading:p=>p.delivery?.stage==='unloading',
 chooseRealMarketReceiptLens:()=>({source:'physical-receipt-shelves'}),
 planRealGrainHomeWitness:()=>meal?{homeIndex:0}:null,
 chooseRealGrainHomeLens:()=>({source:'real-cottage-front'}),
 setCitizenFollow:v=>events.push(['follow',v]),
 setStreetWalk:v=>events.push(['street',v]),
 updateFollowCamera:()=>events.push(['real-camera']),
 showToast:t=>events.push(['status',t]),
 updateSupplyTrail:()=>{},document:{getElementById:id=>chips[id.replace('grain-chain-','')]},
 };
vm.runInNewContext(stageSource,ctx);
const inspect=vm.runInNewContext('inspectRealGrainStage',ctx);
assert.equal(inspect('road').observed,false,'no real freight means no invented road shot');
assert.equal(inspect('field').observed,true,'real working farmer is inspected');
stage='hauling';people[0].activity='Traveling to market';
people[0].delivery={id:'parcel-1',stage:'travel',escrowed:true};
assert.equal(inspect('road').mode,'real-loaded-road','the existing escrowed courier is followed');
stage='received';people[0].delivery=null;receipt=true;
assert.equal(inspect('market').mode,'real-receiving-shelves','real credited receipt frames original shelves');
stage='provisioning';verified=true;
assert.equal(inspect('market').observed,false,'old receipt is never reenacted');
assert.equal(inspect('purchase').mode,'current-verified-buyer','real buyer follows ledger');
stage='consumed';meal=true;
assert.equal(inspect('meal').mode,'real-recorded-meal-home','home lens uses verified meal and real cottage');
assert.equal(inspect('invalid').observed,false);
assert.equal(events.some(e=>e[0]==='real-camera'),true);
assert.match(stageSource,/chooseRealMarketReceiptLens\(plan\.receiptId\)/);
assert.match(stageSource,/planRealGrainHomeWitness\(plan,people,city\)/);
assert.match(stageSource,/showToast\(note\)/);
console.log('W274 PASS: authentic five-stage interactive economy camera, current actors only; no historical reenactment. Browser/mobile/quality not established.');
