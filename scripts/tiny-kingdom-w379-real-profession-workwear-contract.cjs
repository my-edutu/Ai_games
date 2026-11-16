'use strict';
// W379: genuine distant citizens retain distinct workwear. Test actual
// production function, original job identities and read-only articulated gait.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/i)?.[1];
assert.ok(script,'must inspect the playable original game');
new vm.Script(script,{filename:'tiny-kingdom-production.js'});
const begin=script.indexOf('function renderCompactOccupationGear(');
const end=script.indexOf('let citizenMidVisualIndices=new Set();',begin);
assert.ok(begin>=0&&end>begin,'real compact profession geometry required');
const production=script.slice(begin,end);
assert.match(production,/function renderCompactOccupationGear\\(p,x,y,z,s,rig\\)/,
 'genuine compact body must respond to the existing original rig');
assert.match(production,/rig\\.traveling/);
assert.match(production,/rig\\.working/);
assert.doesNotMatch(production,/Math\\.random\\(|(?:^|\\W)state\\s*\\.|deliveryReceipts\\.(?:push|splice)/,
 'rendering cannot create authority or random work');
const jobs=['farmer','gatherer','forester','builder','craftsperson','merchant'];
const data=[],points=[];
const add=n=>{for(let i=0;i<n*30;i++)data.push(0)};
const mock={
 Math,data,MATERIAL:{GENERAL:0,WOOD:1},materialScope:(_m,fn)=>fn(),
 rgb:color=>[(color>>16&255)/255,(color>>8&255)/255,(color&255)/255],
 quad:(...args)=>{for(const v of args.slice(0,4)){
   assert.ok(Array.isArray(v)&&v.length===3&&v.every(Number.isFinite),
    'real cloth has finite 3D vertices');points.push(v.slice());
  }add(2)},
 tri:(...args)=>{for(const v of args.slice(0,3)){
   assert.ok(Array.isArray(v)&&v.length===3&&v.every(Number.isFinite));
   points.push(v.slice());
  }add(1)},
 box:(x,y,z,w,h,d)=>{assert.ok([x,y,z,w,h,d].every(Number.isFinite));add(12)},
 cone:(x,y,z,r,h,_c,sides=6)=>{assert.ok([x,y,z,r,h].every(Number.isFinite));add(sides*2)},
 cylinder:(x,y,z,r,h,_c,sides=6)=>{assert.ok([x,y,z,r,h].every(Number.isFinite));add(sides*4)},
 limbSegment:(a,b,r,_c,sides=6)=>{assert.ok([...a,...b,r].every(Number.isFinite));add(sides*2)}
};
vm.runInNewContext(production,mock,{timeout:1500});
for(const job of jobs){
 const p={job,phase:2.1,delivery:null,activity:'Working at existing village site'};
 const rig={traveling:true,working:true,acting:{lean:.27,beat:.63}};
 const start=data.length;const countBefore=points.length;
 const actual=mock.renderCompactOccupationGear(p,12,0,5,1,rig);
 const triangles=(data.length-start)/30;
 assert.ok(triangles>8&&triangles<190,
  job+' must have bounded connected sculpted workwear, not a giant mesh');
 assert.equal(actual.triangles,triangles,job+' audit should match real stream');
 assert.equal(actual.authoritativeTransactionsAdded,0);
 assert.ok(points.length-countBefore>=8,
  job+' must have multiple formed workwear facets, not a box-only icon');
}
const p={job:'farmer',phase:1.7,delivery:null};
const frame=rig=>{points.length=0;data.length=0;
 mock.renderCompactOccupationGear(p,10,.5,3,1,rig);
 return JSON.stringify(points.slice(0,18));
};
const rest=frame({traveling:false,working:false,acting:{lean:0}});
const moving=frame({traveling:true,working:true,acting:{lean:.42}});
assert.notEqual(rest,moving,
 'original farmer workwear geometry must follow real work/gait state');
assert.ok(data.length/30<190);
console.log('W379 genuine six-profession sculpted compact workwear production geometry PASS; no new citizens, jobs or stock; actual browser look/feel/FPS NOT PROVEN.');
