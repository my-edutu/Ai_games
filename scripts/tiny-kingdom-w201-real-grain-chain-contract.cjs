'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=h.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script);new vm.Script(script[1]);
const m=h.match(/function realGrainChainStages\(trace,plan,flow\)\{[\s\S]*?\n\}/);
assert.ok(m,'test first: exact-ID proof projection');const fn=vm.runInNewContext('('+m[0]+')',{Number});
const t={producer:'Mira'},p={citizen:'Mira',stage:'harvesting'};
assert.equal(fn(t,p).stages.field,'active');
const x={...p,stage:'hauling',deliveryId:'lotA',hasActualLoad:true};
assert.equal(fn(t,x).stages.road,'active');
assert.equal(fn(t,x).stages.market,'waiting');
const r={...x,stage:'received',receiptId:'lotA',hasActualReceipt:true,linkedToReceipt:true};
assert.equal(fn(t,r).stages.market,'verified');
assert.equal(fn(t,r).stages.purchase,'waiting');
const b={...r,stage:'provisioning',tradeId:'trade1',hasVerifiedTrade:true};
assert.equal(fn(t,b).stages.purchase,'verified');
const a={...b,stage:'consumed',mealId:'trade1',homeIndex:4,hasVerifiedMeal:true};
assert.equal(fn(t,a).stages.meal,'verified');
assert.equal(fn(t,{...a,receiptId:'other'}).stages.meal,'waiting');
assert.equal(fn(t,{...a,homeIndex:-1}).stages.meal,'waiting');
assert.equal(fn({...t,deliveryId:'wrong'},a).linked,false);
const u=fn(null,null,{farmer:{job:'farmer'},cargo:{resource:'food',stage:'unloading'},latestReceipt:{id:'unrelated'}});
assert.equal(Object.values(u.stages).includes('verified'),false);
assert.equal(u.stages.market,'live-unlinked');
for(const [n,id] of [['field','supply-field'],['road','supply-cargo'],
 ['market','supply-receipt'],['purchase','supply-trade'],['meal','supply-meal']]){
 assert.ok(h.includes('id="grain-chain-'+n+'"'));
 assert.ok(h.includes('data-target="'+id+'"'));
}
assert.match(h,/renderRealGrainChain\(grainJourney,chainPlan,flow\)/);
assert.match(h,/row\.focus\(\{preventScroll:true\}\)/);
assert.match(h,/#grain-chain-steps button:focus-visible/);
assert.match(h,/@media\(max-width:520px\)[\s\S]*?#grain-chain-steps/);
console.log('W201 real parcel proof / mobile / source: PASS');
