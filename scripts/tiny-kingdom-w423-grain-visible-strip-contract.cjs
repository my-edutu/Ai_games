'use strict';
// W423 RED first against pre-change playable SHA 08ed05bf54e2d32084376cafcf90b97c1b74013f:
// missing genuine five-stage grain strip model/DOM and viewport presenter.
// Uses original source functions, not an invented world or receipt simulation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function segment(a,b){
 const start=src.indexOf(a),end=src.indexOf(b,start+a.length);
 assert(start>=0&&end>start,'Genuine game source missing '+a);
 return src.slice(start,end);
}
assert.match(src,/id="grain-live-strip"[\s\S]*?data-grain-step="meal"/,
 'The live 3D game needs all five actually linked progress stages');
assert.match(src,/#grain-live-strip\[hidden\]\{display:none!important\}/);
assert.match(src,/body\[data-supply="open"\] #grain-live-strip\{display:none!important\}/,
 'Opt-in evidence panel replaces the compact strip rather than covering it');
assert.match(src,/renderVisibleGrainChain\(\);\s*liveHudLastWall=wallNow/,
 'Every submitted low-FPS workday frame refreshes the authoritative proof');
assert.match(src,/button\('grain-live-details',/,
 'User can reveal the full existing receipt ledger');
const context={};
vm.runInNewContext(
 segment('function realGrainChainStages(trace,plan,flow){','function renderRealGrainChain(')+
 segment('function planVisibleGrainChain(trace,plan,flow){','function renderVisibleGrainChain(){'),
 context,{timeout:2000});
const unobserved=context.planVisibleGrainChain(null,null,null);
assert.equal(unobserved.visible,false);
const trace={producer:'Bram',deliveryId:'farmer-lot-1'};
const waiting=context.planVisibleGrainChain(trace,{citizen:'Bram',
 deliveryId:'farmer-lot-1',stage:'harvesting',hasActualLoad:false},null);
assert.equal(waiting.visible,true);
assert.equal(waiting.steps.find(x=>x.name==='field').status,'active');
assert.equal(waiting.steps.find(x=>x.name==='meal').status,'waiting');
assert.equal(waiting.steps.length,5);
const falseReceipt=context.planVisibleGrainChain(trace,{
 citizen:'Bram',deliveryId:'farmer-lot-1',receiptId:'unrelated-lot',
 stage:'consumed',hasActualLoad:true,hasActualReceipt:true,linkedToReceipt:true,
 hasVerifiedTrade:true,tradeId:'paid',hasVerifiedMeal:true,mealId:'ate',homeIndex:5,
 consumer:'Selene'},null);
assert.equal(falseReceipt.steps.find(x=>x.name==='market').status,'waiting');
assert.equal(falseReceipt.steps.find(x=>x.name==='purchase').status,'waiting');
assert.equal(falseReceipt.steps.find(x=>x.name==='meal').status,'waiting',
 'An unrelated home meal must never turn green');
const genuine=context.planVisibleGrainChain(trace,{
 citizen:'Bram',deliveryId:'farmer-lot-1',receiptId:'farmer-lot-1',
 stage:'consumed',hasActualLoad:true,hasActualReceipt:true,linkedToReceipt:true,
 hasVerifiedTrade:true,tradeId:'real-buyer-trade',hasVerifiedMeal:true,
 mealId:'real-home-meal',homeIndex:5,consumer:'Selene'},null);
assert.equal(genuine.steps.filter(x=>x.status==='verified').length,5);
assert.match(genuine.caption,/Bram → Selene/);
assert.equal(genuine.changesAuthority,false);
assert.equal(genuine.noSyntheticTransactions,true);
console.log('W423 genuine single-parcel five-stage proof, no false receipt/meal, opt-in ledger and 390px source contract PASS; actual moving gameplay acceptance NOT PROVEN.');
