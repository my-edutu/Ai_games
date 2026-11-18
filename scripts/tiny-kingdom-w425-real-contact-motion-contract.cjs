'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
test('W425 one real recorded meal animates wrist and facial expression during stationary consumption',()=>{
 const begin=html.indexOf('function realRecordedMealMotion(');
 const end=html.indexOf('function getRealRecordedMealMotionAudit(',begin);
 assert.ok(begin>0&&end>begin);
 const source=html.slice(begin,end);
 assert.doesNotMatch(source,/Math\.random|state\s*\.|people\.push|\.provisions\s*=|\.delivery\s*=/);
 const context={Math,Number,HOME_MEAL_ACTION_HOURS:2};
 vm.createContext(context);
 vm.runInContext(source,context,{timeout:800});
 const none=context.realRecordedMealMotion(null);
 assert.equal(none.active,false);
 assert.equal(none.lift,0);
 assert.equal(context.realRecordedMealMotion({elapsedHours:-1}).active,false);
 const first=context.realRecordedMealMotion({elapsedHours:.22});
 const later=context.realRecordedMealMotion({elapsedHours:.43});
 assert.equal(first.active,true);
 assert.equal(later.active,true);
 assert.ok(first.lift>=0&&first.lift<=1&&first.chew>=0&&first.chew<=1);
 assert.notEqual(first.lift,later.lift);
 assert.notEqual(first.chew,later.chew);
 assert.equal(context.realRecordedMealMotion({elapsedHours:.22}).lift,first.lift);
 assert.equal(context.realRecordedMealMotion({elapsedHours:2.5}).active,false);
 const rig=html.slice(html.indexOf('function citizenRigPose('),
  html.indexOf('function renderRollingBoot('));
 assert.match(rig,/const mealMotion=realRecordedMealMotion\(verifiedMeal\)/);
 assert.match(rig,/const bite=mealMotion\.lift/);
 assert.doesNotMatch(rig,/const bite=\.5\+\.5\*Math\.sin\(p\.phase/);
 const face=html.slice(html.indexOf('function citizenFacialActing('),
  html.indexOf('function getCitizenActingAudit('));
 assert.match(face,/realRecordedMealMotion\(actualMeal\)/);
 assert.match(face,/mouthOpen:mealMotion\.active/);
});
test('W425 original followed hand and exact courier shelf carry contact anatomy, without extra simulated parcels',()=>{
 const hand=html.slice(html.indexOf('function renderArticulatedHand('),
  html.indexOf('// A few intentional, large forms'));
 assert.match(hand,/person===people\[selectedCitizen\]&&follow/);
 assert.match(hand,/verifiedHouseholdMealEvidence\(person\)/);
 assert.match(hand,/taperedMedievalLimb\(/);
 assert.doesNotMatch(hand,/Math\.random|people\.push|state\s*\.\w+\s*=/);
 const market=html.slice(html.indexOf('function renderMarketHandoffs('),
  html.indexOf('\/\* G112: one after-dark worksite lamp'));
 assert.match(market,/getMarketParcelDeliveryPose\(h\.id\)/);
 assert.match(market,/parcel\.phase-\.64/);
 assert.match(market,/emitLivedCanvasSack\(px,py-\.03\*settled/);
 assert.doesNotMatch(market,/state\.food\s*=(?!=)|deliveryReceipts\.push|Math\.random/);
});
