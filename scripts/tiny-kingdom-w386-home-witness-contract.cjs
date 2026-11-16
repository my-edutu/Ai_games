'use strict';
// W386: the real after-purchase resident is framed only when presently
// visible at the authoritative doorway and the original meal verifies.
const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=source.indexOf('function realGrainHomeFrontage(');
const end=source.indexOf('\n// W204 Phase-1',begin);
assert(begin>=0&&end>begin,'missing original home frontage');
const factory=source.slice(begin,end).trim();
const residents=[{name:'Selene',x:2.1,z:4}];
let mealVerified=true,thereIsDoor=true;
const mocks={city:[[1,4,0]],people:residents,terrain:()=>0,
 verifiedHouseholdMealEvidence:()=>mealVerified?{receiptCredited:true}:null,
 getCottageHomecomingAudit:()=>({doors:thereIsDoor?[{homeIndex:0,
  citizen:'Selene',doorX:2,doorZ:4,nx:1,nz:0}]:[],closedDoors:[]})};
const front=Function(...Object.keys(mocks),factory+';return realGrainHomeFrontage;')(...Object.values(mocks));
const home={homeIndex:0,x:1,z:4,resident:'Selene',atHome:true};
const live=front(home);
assert.equal(live.hasHumanSubject,true,'verified live buyer must have real physical portrait');
assert.deepEqual(live.normal,[1,0],'frame true SIDE entry, not imaginary negative-Z door');
assert.equal(live.aim[0],residents[0].x,'target existing live resident');
assert.equal(live.doorKey.includes('Selene'),true,'retain original citizen identity');
mealVerified=false;
assert.equal(front(home).hasHumanSubject,false,'historical receipt cannot summon current actor');
mealVerified=true;thereIsDoor=false;
assert.equal(front(home).hasHumanSubject,false,'missing genuine entry forbids a fake shot');
thereIsDoor=true;
assert.equal(front({...home,atHome:false}).hasHumanSubject,false,'historical meal cannot claim present resident');
assert.deepEqual(front({...home,atHome:false}).normal,[0,-1],
 'keep original safe outside-negative-Z cottage picture');
residents[0].x=6.0;
assert.equal(front(home).hasHumanSubject,false,'inside/remote resident must not be filmed at door');
assert.match(source,/Math\.atan2\(candidate\.normal\[0\],candidate\.normal\[1\]\)/);
assert.match(source,/physicalFollowEyeClearance\(eye,roofs\)\.clear/);
assert.match(source,/followRayBlockers\(eye,candidate\.aim,roofs\)/);
assert.match(source,/requestedDoorKey!==front\?\.doorKey/);
assert.match(source,/requestedDoorKey!==\s*realGrainHomeFrontage\(realHome\)\?\.doorKey/);
console.log('W386 PASS: verified real meal + present resident + true side-door orientation; physically cleared, historically safe fallback; no staged residents.');
