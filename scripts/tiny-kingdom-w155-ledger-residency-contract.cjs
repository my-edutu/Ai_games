'use strict';
// W155: Source-level negative/positive residency-key regression. Does NOT
// replace browser, GPU, same-seed film, hardware or deterministic replay.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const block=html.match(/function ledgerWitnessResidencyKey\([\s\S]*?\n}\n(?=function ledgerWitnessResidencyRequested)/);
assert.ok(block,'Missing pure physical/economic ledger witness key');
const key=vm.runInNewContext('('+block[0].trim()+')');
const real=[{id:'lot-1',time:12,resource:'food',amount:2.5,destination:[-1,10],creditedAtUnloading:true}];
const trade=[{id:'sale-1',time:12.4,citizen:'Amina'}];
const meal=[{id:'meal-1',time:13,citizen:'Amina',homeIndex:0}];
const people=[{name:'Amina',x:-1,z:10}];
const homes=[[12,-4,1]];
const market=[-1,10];
const signature=(now,receipts=real,trades=trade,meals=meal,residents=people,lots=homes)=>
 key(now,receipts,trades,meals,residents,lots,market);
assert.equal(signature(12.5),signature(12.7),'unchanged physical event geometry must be resident');
assert.notEqual(signature(12.5),signature(15),'expired receipts must disappear');
assert.notEqual(signature(12.5),signature(12.5,[{...real[0],amount:3.5}]),
 'quantity changes must not reuse an obsolete sack count');
assert.notEqual(signature(12.5),signature(12.5,[{...real[0],destination:[2,8]}]),
 'same-ID relocated destination must invalidate geometry');
assert.notEqual(signature(12.5),signature(12.5,[],[],[]),
 'uncredited/absent evidence cannot invent receipts');
assert.notEqual(signature(12.5),signature(12.5,real,trade,meal,[{name:'Amina',x:20,z:20}]),
 'market gesture must follow genuine current resident proximity');
assert.notEqual(signature(13.2),signature(13.2,real,trade,meal,people,[[14,-4,1]]),
 'same-count restored home relocation must invalidate meal prop');
assert.notEqual(signature(13.2),signature(13.2,real,trade,[]),
 'unverified household meal cannot appear');
assert.notEqual(signature(13.2),signature(13.2,real,[],meal),
 'a missing sale cannot trigger a market exchange');
assert.equal(signature(16),signature(17),
 'expired witness windows must reuse a complete empty mesh');
assert.match(html,/if\(!prepareLedgerWitnessResidentMesh\(\)\)\{/);
assert.match(html,/drawLedgerWitnessResidentMesh\(\)/);
assert.match(html,/disposeLedgerWitnessResidentMesh\(\)/);
assert.match(html,/getLedgerWitnessResidencyAudit/);
assert.match(html,/renderMarketHandoffs\(\)/);
console.log('W155 ledger residency source-contract PASS; real Chromium/WebGL NOT assessed');
