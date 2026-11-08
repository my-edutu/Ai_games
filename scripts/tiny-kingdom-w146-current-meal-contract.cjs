'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new Function(script),'full original playable JavaScript');
const a=html.indexOf('/* W146 VERIFIED HOME MEAL WITNESS BEGIN');
const b=html.indexOf('/* W146 VERIFIED HOME MEAL WITNESS END',a);
assert.ok(a>0&&b>a,'real authoritative meal witness source exists');
const code=html.slice(a,b);
const resident={name:'Dara',job:'merchant',activity:'Resting at home',
 x:2.4,z:1.1,target:[2.4,1.1],path:[],phase:1.4,provisions:.6,
 provisionReceiptId:'lot-7',provisionTradeId:'trade-9',provisionMealRecorded:true};
const receipt={id:'lot-7',job:'farmer',resource:'food',amount:2,time:21,creditedAtUnloading:true};
const trade={id:'trade-9',citizen:'Dara',receiptId:'lot-7',amount:.8,time:22};
const meal={id:'trade-9',citizen:'Dara',receiptId:'lot-7',homeIndex:0,time:23,amount:.01,remainingBefore:.8};
const state={t:23.5,householdMeals:[meal],householdTrades:[trade]};
const people=[resident],city=[[2.5,1.2,1]],deliveryReceipts=[receipt],data=[];
const assembly=new Function('people','state','city','deliveryReceipts','citizenHomeIndex',
 'citizenRigPose','citizenEmbodiedPose','terrain','data','materialScope',
 'MATERIAL','rgb','ellipsoid','limbSegment',
 code+'return {evidence:verifiedHouseholdMealEvidence,hand:getVerifiedHomeMealHand,draw:renderVerifiedHomeMeal,stats:()=>actualHouseholdMealVisualStats}');
const bread=[];
const api=assembly(people,state,city,deliveryReceipts,()=>0,
 ()=>({arms:[{wrist:[-.25,.58,.21]},{wrist:[.19,1.05,.20]}]}),
 ()=>({spineShift:0,forwardLean:0,rise:0}),()=>1,data,
 (_,fn)=>fn(),{GENERAL:1},()=>[.8,.7,.5],
 (...a)=>{bread.push(a);data.push(...Array(30).fill(0));},
 ()=>data.push(...Array(30).fill(0)));
const original=JSON.stringify({resident,state,city,deliveryReceipts});
assert.equal(api.evidence(resident).receiptId,'lot-7');
assert.equal(api.hand(resident).wrist.length,3);api.draw(resident);
assert.equal(api.stats().actors,1);assert.equal(api.stats().linkedLots,1);
assert.ok(api.stats().triangles>0);assert.equal(bread.length,2);
assert.equal(api.evidence({...resident}),null,'not a foreign anonymous actor');
function reject(set,restore){
 const cleanup=set();assert.equal(api.evidence(resident),null);cleanup();
 assert.ok(api.evidence(resident),'valid real chain restored');
}
reject(()=>{resident.activity='Traveling home with provisions';return ()=>resident.activity='Resting at home'});
reject(()=>{resident.provisions=0;return ()=>resident.provisions=.6});
reject(()=>{resident.target=[30,30];return ()=>resident.target=[2.4,1.1]});
reject(()=>{resident.provisionMealRecorded=false;return ()=>resident.provisionMealRecorded=true});
reject(()=>{state.t=28;return ()=>state.t=23.5});
reject(()=>{meal.homeIndex=2;return ()=>meal.homeIndex=0});
reject(()=>{meal.receiptId='lot-foreign';return ()=>meal.receiptId='lot-7'});
reject(()=>{trade.citizen='Someone else';return ()=>trade.citizen='Dara'});
reject(()=>{trade.id='other';return ()=>trade.id='trade-9'});
reject(()=>{receipt.creditedAtUnloading=false;return ()=>receipt.creditedAtUnloading=true});
reject(()=>{receipt.job='merchant';return ()=>receipt.job='farmer'});
reject(()=>{trade.time=25;return ()=>trade.time=22});
reject(()=>{resident.path=[[4,4]];return ()=>resident.path=[]});
assert.match(script,/const verifiedMeal=verifiedHouseholdMealEvidence\(p\)/);
assert.match(script,/for\(const person of people\)renderVerifiedHomeMeal\(person\)/);
assert.match(script,/getVerifiedHomeMealRenderStats/);
assert.equal(JSON.stringify({resident,state,city,deliveryReceipts}),original);
console.log('W146 source-only: valid credited farmer-to-original-buyer meal; 13 rejection cases, shared rig and static resource invariants PASS');
