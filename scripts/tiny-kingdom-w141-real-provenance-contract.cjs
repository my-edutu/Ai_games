'use strict';
// W141: no invented work, food, citizens or market receipts. The pure helper
// consumes ONLY the existing authoritative snapshots and receipt provenance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'tiny-kingdom-inline.js'});
const begin=js.indexOf('function planRealGrainJourney(');
const end=js.indexOf('function getRealGrainJourneyAudit()',begin);
assert(begin>=0&&end>begin,'read-only documentary planner must exist');
const plan=Function(js.slice(begin,end)+';return planRealGrainJourney')();
const farmer=(delivery=null,activity='Harvesting grain')=>({
 name:'Amin',job:'farmer',activity,delivery
});
const source={producer:'Amin',deliveryId:null};
const load={id:'grain-5',resource:'food',stage:'hauling',amount:11};
const receipt={id:'grain-5',resource:'food',citizen:'Amin',job:'farmer',amount:11,time:12,creditedAtUnloading:true};
const trade={id:'trade-3',receiptId:'grain-5',citizen:'Hala',amount:.8,time:13};
const meal={id:'trade-3',receiptId:'grain-5',citizen:'Hala',amount:.01,time:14,homeIndex:1};
const household={name:'Hala',job:'builder'};
const expectStage=(row,stage)=>assert.equal(row.stage,stage);
expectStage(plan(source,[farmer()],[],[],[]),'harvesting');
expectStage(plan(source,[farmer(null,'Walking')],[],[],[]),'awaiting-harvest');
let row=plan(source,[farmer(load)],[],[],[]);
expectStage(row,'hauling');assert.equal(row.deliveryId,'grain-5');
expectStage(plan({...source,deliveryId:'grain-5'},[farmer({...load,stage:'unloading'})],[],[],[]),'unloading');
expectStage(plan({...source,deliveryId:'grain-5'},[farmer(null,'Walking')],[],[],[]),'awaiting-receipt');
expectStage(plan({...source,deliveryId:'grain-5'},[farmer()],[receipt],[],[]),'received');
row=plan({...source,deliveryId:'grain-5'},[farmer(),household],[receipt],[trade],[]);
expectStage(row,'provisioning');assert.equal(row.citizen,'Hala');
row=plan({...source,deliveryId:'grain-5'},[farmer(),household],[receipt],[trade],[meal]);
expectStage(row,'consumed');assert.equal(row.mealId,'trade-3');
// A different farmer's receipt cannot become this farmer's meal.
expectStage(plan({...source,deliveryId:'grain-5'},[farmer()],
 [{...receipt,id:'grain-6'}],[{...trade,receiptId:'grain-6'}],
 [{...meal,receiptId:'grain-6'}]),'awaiting-receipt');
// Paid-for provisions must never be inferred from a receipt alone.
assert.equal(plan({...source,deliveryId:'grain-5'},[farmer()],[receipt],[],[]).tradeId,undefined);
// The presentation helper is a pure projection of saved authority.
const before=JSON.stringify({source,load,receipt,trade,meal});
plan({...source,deliveryId:'grain-5'},[farmer(load),household],[receipt],[trade],[meal]);
assert.equal(before,JSON.stringify({source,load,receipt,trade,meal}));
assert(js.includes('if(grainJourney)advanceRealGrainJourney()'));
assert(js.includes("getRealGrainJourneyAudit,watchRealGrainJourney,stopRealGrainJourney,planRealGrainJourney"));
console.log('W141 source syntax and 11 pure real-provenance assertions PASS. Real WebGL/30fps/Day120 NOT TESTED here.');
