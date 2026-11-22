'use strict';
// W143 exact-game-contract, not a mock or invented economy.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const original=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=original.indexOf('function planRealGrainHomeWitness(');
const b=original.indexOf('function getRealGrainHomeWitness()',a);
assert.ok(a>=0&&b>a,'actual original physical home witness source present');
const f=vm.runInNewContext(original.slice(a,b)+';planRealGrainHomeWitness');
const plan={stage:'consumed',hasVerifiedMeal:true,homeIndex:1,consumer:'Dara',mealId:'Dara:101'};
const residents=[{name:'Dara',x:4.2,z:8.1,activity:'Resting at home'}],homes=[[0,0,1],[4,8,2]];
assert.equal(f(plan,residents,homes).homeIndex,1);
assert.equal(f(plan,residents,homes).atHome,true);
for(const bad of [null,{...plan,stage:'provisioning'},{...plan,hasVerifiedMeal:false},
 {...plan,consumer:'Hala'},{...plan,homeIndex:-1},{...plan,homeIndex:3},
 {...plan,homeIndex:1.5}])assert.equal(f(bad,residents,homes),null);
assert.equal(f(plan,[{...residents[0],x:30,z:40,activity:'At market'}],homes).atHome,false);
assert.equal(f(plan,residents,[[0,0],[Infinity,8]]),null);
assert.match(original,/button\('world-trace-home',toggleRealGrainHomeWitness\)/);
assert.match(original,/historicalMealNotReenacted:true/);
assert.match(original,/body\[data-workday="household"\] #workday-activity/);
assert.match(original,/const v=safeFreeOrbit\(a,t,z,\[home.x,home.z\]\)/);
console.log('W143 real grain-fed home policy: authentic source and 10 witness cases PASS');
