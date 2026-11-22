'use strict';
// W514 RED-first: original source 27/31m hysteresis disagrees when
// entering identical camera positions from different histories (28m/30m).
// GREEN: same physical view decides truthful rooted crop quality consistently.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('const FARM_FIELD_STABLE_NEAR_DISTANCE=');
const end=html.indexOf('function planViewFarmTriangleBudget(',start);
assert(start>=0&&end>start,'RED: stable original field camera LOD missing');
const src=html.slice(start,end);
const a=src.indexOf('function farmFieldLodChoice(');
const b=src.indexOf('// W245:',a);
assert(a>=0&&b>a,'original field LOD function missing');
const choose=new Function('const FARM_FIELD_STABLE_NEAR_DISTANCE=29;'+
 src.slice(a,b)+'return farmFieldLodChoice;')();
for(const distance of [0,20,26.9,27,28,28.999,29,30,31,40,120]){
 const expected=distance<29?'near':'far';
 assert.equal(choose(distance,'near'),expected);
 assert.equal(choose(distance,'far'),expected);
}
for(const invalid of [-1,NaN,Infinity]){
 assert.throws(()=>choose(invalid),/invalid actual crop camera distance/);
}
assert(html.includes('wantsNear:realWork||'),
 'authentic working farmland should request genuine near detail');
assert(html.includes('chooseBudgetedFarmPlotModes(requests,'),
 'strict full-scene crop budget remains');
const live=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(row=>row[1].includes('function render(now)'));
assert(live,'real playable game missing');new vm.Script(live[1]);
console.log('W514 original farm LOD + real-work priority source PASS; running video and FPS separately required');
