'use strict';
/* W125 test-first: source from the shipped playable game, not a second economy.
 * This must fail RED before implementing the authoritative market-to-home link.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(script,{filename:'tiny-kingdom-playable-inline.js'});
const begin=script.indexOf('/* W125 ECONOMY BEGIN */');
const end=script.indexOf('/* W125 ECONOMY END */',begin);
assert(begin>=0&&end>begin,'W125 authoritative market/household ledger does not yet exist');
for(const token of [
 'function marketReservedFood()','function recordMarketReceipt(receipt)',
 'function acquireHouseholdFood(p)','function consumeHouseholdFood(p)',
 'function getFarmMarketHouseholdAudit()',
 "p.activity==='Traveling to market for food'",
 "p.activity==='Carrying provisions home'",
 'getFarmMarketHouseholdAudit:()=>cloneData(getFarmMarketHouseholdAudit())',
 'renderMarketHouseholdEvidence();',
 'id="supply-trade"','id="supply-meal"'
])assert(html.includes(token),'W125 missing production contract '+token);
assert(html.includes('deliveryReceipts:cloneData(deliveryReceipts)'),
 'W125 real receipts must be part of the validated saved payload');
assert(html.includes('...q.deliveryReceipts'),
 'W125 saved receipts must restore, not vanish at reload');

const state={t:100,food:31,wood:10,gold:5};
const people=[
 {name:'Real Resident',job:'builder',x:-3.5,z:4.1,target:[-3.5,4.1],
  path:[],hunger:77,energy:35,activity:'Waiting for market merchant',workTimer:3},
 {name:'Real Merchant',job:'merchant',x:-2.6,z:4.6,target:[-2.6,4.6],
  path:[],activity:'Bartering at market',working:true}
];
const mock={
 state,people,city:[[4,6,0]],
 isWorkingAtSite:p=>p.working===true,
 routeCitizen:p=>{p.path=[p.target.slice()]},
 citizenHomeIndex:()=>0,
 citizenHomeDestination:()=>[4,6],
 dayShiftAt:()=>true
};
const units=new Function(...Object.keys(mock),
 script.slice(begin,end)+
 ';return {marketReservedFood,recordMarketReceipt,acquireHouseholdFood,'+
 'consumeHouseholdFood,getFarmMarketHouseholdAudit}')( ...Object.values(mock));
const received={id:'Farmer:32',resource:'food',amount:2.8,
 time:99,citizen:'Farmer',creditedAtUnloading:true};
assert.equal(units.recordMarketReceipt(received),true);
assert.equal(units.recordMarketReceipt(received),false,'same physical receipt cannot reserve twice');
assert.equal(units.recordMarketReceipt({...received,id:'prepaid',creditedAtUnloading:false}),false);
assert.equal(state.food,31,'recording the receipt is NOT another inventory credit');
assert.equal(units.marketReservedFood(),2.8);
const shopper=people[0];
assert.equal(units.acquireHouseholdFood(shopper),true);
assert.equal(state.food,30,'market transfer debits shared village stock once');
assert.equal(units.marketReservedFood(),1.8);
assert.equal(shopper.provisions.receiptId,received.id);
assert.equal(shopper.provisions.amount,1);
assert.equal(units.acquireHouseholdFood(shopper),false,'duplicate issue prohibited');
assert.equal(state.food,30);
assert.equal(units.consumeHouseholdFood(shopper),false,'cannot consume before physical home arrival');
shopper.x=4;shopper.z=6;shopper.path=[];
const hungerBefore=shopper.hunger;
assert.equal(units.consumeHouseholdFood(shopper),true);
assert(shopper.hunger<hungerBefore,'real resident benefits from actual provisions');
assert.equal(state.food,30,'home meal consumes the already transferred basket, not twice');
assert.equal(units.consumeHouseholdFood(shopper),false,'same basket cannot feed twice');
const audit=units.getFarmMarketHouseholdAudit();
assert.equal(audit.latestTrade.receiptId,received.id);
assert.equal(audit.latestMeal.receiptId,received.id);
assert.equal(audit.latestMeal.citizen,'Real Resident');
assert.equal(audit.reservedMarketFood,1.8);
console.log('W125 original-source economy RED/GREEN contract PASS (browser, 120-day, film separate).');
