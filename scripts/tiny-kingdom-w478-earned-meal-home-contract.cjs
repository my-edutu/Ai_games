// W478: contract-first evidence that the optional home camera NEVER creates
// a household achievement from unrelated or uncredited stock.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),
 assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function extract(begin,end){
 const i=html.indexOf(begin),j=html.indexOf(end,i+begin.length);
 assert(i>=0&&j>i,'missing exact original source section: '+begin);
 return html.slice(i,j);
}
const ctx=vm.createContext({});
vm.runInContext(
 extract('function planRealGrainJourney(','// W143:')+
 extract('function planRealGrainHomeWitness(','function getRealGrainHomeWitness(')+
 extract('function latestVerifiedGrainHomeTrace(','function inspectLatestVerifiedGrainHome('),ctx);
const farmer={name:'Bram',job:'farmer',activity:'Traveling',x:0,z:0},
 buyer={name:'Selene',job:'gatherer',activity:'Resting at home',x:5,z:5};
const citizens=[farmer,buyer],homes=[[5,5,0]];
const receipt={id:'Bram:32',citizen:'Bram',job:'farmer',
 resource:'food',creditedAtUnloading:true,amount:3.024,time:192.366};
const trade={id:'home:12',citizen:'Selene',
 receiptId:'Bram:32',amount:.8,time:229.066};
const meal={id:'home:12',citizen:'Selene',receiptId:'Bram:32',
 homeIndex:0,amount:.8,time:234.033};
const find=(r=[receipt],t=[trade],m=[meal],p=citizens,c=homes)=>
 ctx.latestVerifiedGrainHomeTrace(r,t,m,p,c);
const found=find();
assert(found&&found.plan.stage==='consumed'&&found.home.homeIndex===0);
assert.equal(found.trace.deliveryId,'Bram:32');
assert.equal(found.plan.consumer,'Selene');
assert.equal(found.home.atHome,true);
assert.equal(found.authorityModified,false);
assert.equal(found.reenactedMeal,false);
assert.equal(find([{...receipt,creditedAtUnloading:false}]),null);
assert.equal(find([{...receipt,job:'builder'}]),null);
assert.equal(find([receipt],[{...trade,receiptId:'unrelated'}]),null);
assert.equal(find([receipt],[trade],[{...meal,amount:1.8}]),null);
assert.equal(find([receipt],[trade],[{...meal,homeIndex:99}]),null);
assert.equal(find([receipt],[trade],[{...meal,citizen:'Bram'}]),null);
assert.equal(find([receipt],[trade],[meal],[farmer]),null);
assert.equal(find([receipt],[trade],[],citizens),null);
assert.equal(find([receipt],[trade],[meal],citizens,[]),null);
assert(html.includes('id="world-verified-home"'));
assert(html.includes("button('world-verified-home',inspectLatestVerifiedGrainHome)"));
assert(html.includes("const earned=latestVerifiedGrainHomeTrace();"));
assert(html.includes('const lens=chooseRealGrainHomeLens(earned.home)'));
assert(html.includes("stagesSeen:['consumed']"));
assert(html.includes('historicalReview:true'));
console.log('W478 verified historic parcel → real home contract PASS; actual browser still required');
