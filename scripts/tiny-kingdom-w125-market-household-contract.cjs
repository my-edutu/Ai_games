'use strict';
/* Test-first W125 GREEN: extract the actual shipped economic functions.
 * This isn't a simulated actor or a claim that a full browser video passed.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const src=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(src,{filename:'tiny-kingdom-live-inline.js'});
const start=src.indexOf('/* W125 PROVENANCE BEGIN */');
const end=src.indexOf('/* W125 PROVENANCE END */',start);
assert(start>=0&&end>start,'W125 receipt-provenance production code missing');
const segment=src.slice(start,end);
for(const x of ['function receiptReservedFood()','function registerFarmerReceipt(receipt)',
 'function issueReceiptGrain(p,amount)','function receiptHouseholdAudit()',
 'getReceiptHouseholdAudit:()=>cloneData(receiptHouseholdAudit())',
 'deliveryReceipts:cloneData(deliveryReceipts)','...q.deliveryReceipts',
 'person.provisionMealRecorded','state.householdMeals=[',
 "p.activity='Traveling home with provisions'",'id="supply-trade"',
 'id="supply-meal"']){
 assert(html.includes(x),'W125 actual code requires: '+x);
}
const state={t:100,food:31};
const people=[];
const f=new Function('state','people',segment+
  ';return {receiptReservedFood,registerFarmerReceipt,issueReceiptGrain,receiptHouseholdAudit}');
const a=f(state,people);
const courierReceipt={id:'Farmer:32',job:'farmer',resource:'food',amount:2.8,
 citizen:'Farmer',time:99,creditedAtUnloading:true};
assert.equal(a.registerFarmerReceipt({...courierReceipt,job:'gatherer'}),false,
 'Only genuine farmer loads can qualify');
assert.equal(a.registerFarmerReceipt({...courierReceipt,creditedAtUnloading:false}),false,
 'No pre-credit receipt may reserve an unloaded market lot');
assert.equal(a.registerFarmerReceipt(courierReceipt),true);
assert.equal(a.registerFarmerReceipt(courierReceipt),false,'Replay may not reserve twice');
assert.equal(state.food,31,'Receipt reserves existing stock, cannot mint new food');
assert.equal(a.receiptReservedFood(),2.8);
const resident={name:'Real Resident',provisions:0};
assert.equal(a.issueReceiptGrain(resident,.8),courierReceipt.id);
assert.equal(resident.provisions,.8);
assert.equal(resident.provisionReceiptId,courierReceipt.id);
assert.equal(resident.provisionTradeId,a.receiptHouseholdAudit().latestVerifiedTrade.id,
 'Meal must carry unique original market transaction ID, not only original lot ID');
assert.equal(state.food,30.2,'Original town inventory debited exactly once');
assert.equal(a.receiptReservedFood(),2);
assert.equal(a.issueReceiptGrain(resident,.8),null,'Cannot hand a second parcel to the same holder');
assert.equal(state.food,30.2);
assert.equal(a.receiptHouseholdAudit().latestVerifiedTrade.receiptId,courierReceipt.id);
assert.equal(a.receiptHouseholdAudit().issuedCount,1);
assert.match(src,/state\.food=Math\.max\(receiptReservedFood\(\),state\.food-communityConsumption\)/,
 'Market receipt food must be conserved during background consumption');
assert.match(src,/if\(stock>0\)\{\s*\/\/ Only a resident actually resting/,
 'Household meal must be earned by real in-home stock consumption');
assert.match(src,/state\.householdMeals=\[\{id:person\.provisionTradeId\|\|/,
 'Meal is keyed to the unique original market transfer');
assert.match(src,/registerFarmerReceipt\(receipt\)/,
 'Only original real courier unload may introduce provenance');
assert.match(src,/const staffed=people\.some/,
 'A real merchant must be physically working for traceable market transfer');
console.log('W125 source + real farmer-credit provenance + duplicate protection + stock debit + bounded home consumption PASS');
