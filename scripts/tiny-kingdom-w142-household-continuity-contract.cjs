'use strict';
// W142: test the actual original-source read-only planner, not a duplicate.
// RED on previous W141 source: first trade belonged to Hala, but an
// unrelated later Dara meal made it falsely report consumed.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'original-tiny-kingdom-game.js'});
const begin=js.indexOf('function planRealGrainJourney(');
const end=js.indexOf('function getRealGrainJourneyAudit()',begin);
assert(begin>=0&&end>begin);
const plan=Function(js.slice(begin,end)+';return planRealGrainJourney')();
const actors=[{name:'Amin',job:'farmer',activity:'Harvesting grain'},
 {name:'Hala',job:'builder',activity:'Traveling home with provisions'},
 {name:'Dara',job:'smith',activity:'Resting at home'}];
const trace={producer:'Amin',deliveryId:'Amin:5'};
const receipt={id:'Amin:5',citizen:'Amin',job:'farmer',resource:'food',
 amount:11,time:42,creditedAtUnloading:true};
const first={id:'Hala:1350',citizen:'Hala',receiptId:'Amin:5',amount:.8,time:45};
const second={id:'Dara:1380',citizen:'Dara',receiptId:'Amin:5',amount:1,time:46};
const firstMeal={id:first.id,citizen:'Hala',receiptId:'Amin:5',amount:.2,time:48,homeIndex:1};
const secondMeal={id:second.id,citizen:'Dara',receiptId:'Amin:5',amount:.2,time:47,homeIndex:2};
const same=plan(trace,actors,[receipt],[second,first],[secondMeal]);
assert.equal(same.stage,'provisioning',"a different family\'s meal is not the first buyer\'s");
assert.equal(same.citizen,'Hala');
assert.equal(same.tradeId,first.id);
const completed=plan({...trace,tradeId:first.id},actors,[receipt],[second,first],[secondMeal,firstMeal]);
assert.equal(completed.stage,'consumed');
assert.equal(completed.consumer,'Hala');
assert.equal(completed.mealId,first.id);
assert.equal(completed.homeIndex,1);
assert.equal(completed.purchasedAmount,.8);
assert.equal(completed.amount,.2);
const stage=(r,t,m)=>plan(trace,actors,r,t,m).stage;
assert.equal(stage([{...receipt,citizen:'Dara'}],[first],[firstMeal]),'awaiting-receipt');
assert.equal(stage([{...receipt,creditedAtUnloading:false}],[first],[firstMeal]),'awaiting-receipt');
assert.equal(stage([receipt],[{...first,time:40}],[firstMeal]),'received');
assert.equal(stage([receipt],[{...first,amount:20}],[firstMeal]),'received');
assert.equal(stage([receipt],[first],[{...firstMeal,id:second.id}]),'provisioning');
assert.equal(stage([receipt],[first],[{...firstMeal,time:40}]),'provisioning');
assert.equal(stage([receipt],[first],[{...firstMeal,homeIndex:-1}]),'provisioning');
assert.equal(stage([receipt],[first],[{...firstMeal,amount:1}]),'provisioning');
assert.equal(stage([receipt],[first],[{...firstMeal,citizen:'Dara'}]),'provisioning');
assert.equal(plan({...trace,tradeId:'nonexistent'},actors,[receipt],[second,first],[firstMeal]).stage,
 'received','a pinned household cannot silently switch owners');
assert(js.includes("viewMode==='household'"),'real in-world tag must remain on for the consumer');
assert(js.includes('cameraTransfer:\'eased-physical-follow-no-staged-teleport\''));
assert(js.includes("if(changed)updateSupplyTrail(true)"));
assert(js.includes("'No verified home meal from this purchase'"));
console.log('W142 strict single-family grain provenance and real-world UI wiring PASS (source-only; no FPS/visual acceptance).');
