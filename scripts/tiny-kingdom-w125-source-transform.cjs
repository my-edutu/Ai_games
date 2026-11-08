'use strict';
/* W125 reproducible source migration; PURE input HTML -> output HTML.
 * Exact anchors fail closed rather than overwriting concurrently developed work.
 * The target is only PR #64; this script never makes any GitHub changes.
 */
function transform(html){
 if(html.includes('/* W125 ECONOMY BEGIN */'))return html;
 const change=(old,next,why)=>{
  const i=html.indexOf(old);
  if(i<0||html.indexOf(old,i+old.length)>=0)
   throw Error('W125 source anchor not unique: '+why);
  html=html.slice(0,i)+next+html.slice(i+old.length);
 };
 const economy=String.raw`/* W125 ECONOMY BEGIN */
// A real unloaded farmer receipt may reserve some of the SAME town stock.
// The authoritative stock does not increase when these ledgers are created.
const HOUSEHOLD_MARKET_TARGET=[-3.5,4.1];
const MARKET_PROVISION_LOT_CAP=48,MARKET_PROVISION_HISTORY_CAP=24;
function marketReservedFood(){
 return Math.round((state.marketLots||[]).reduce((sum,lot)=>sum+lot.remaining,0)*1000)/1000;
}
function recordMarketReceipt(receipt){
 if(!receipt||receipt.resource!=='food'||receipt.creditedAtUnloading!==true||
  !Number.isFinite(receipt.amount)||receipt.amount<=0||typeof receipt.id!=='string'||
  !receipt.id||!Number.isFinite(receipt.time))return false;
 const lots=state.marketLots||(state.marketLots=[]);
 if(lots.some(lot=>lot.id===receipt.id))return false;
 if(lots.length>=MARKET_PROVISION_LOT_CAP){
  const empty=lots.findIndex(lot=>lot.remaining===0);
  if(empty===-1)return false; // Never discard still-owned reserves.
  lots.splice(empty,1);
 }
 const free=Math.max(0,state.food-marketReservedFood());
 if(free+1e-7<receipt.amount)return false;
 lots.push({id:receipt.id,citizen:receipt.citizen,
  remaining:Math.round(receipt.amount*1000)/1000,time:receipt.time});
 return true;
}
function acquireHouseholdFood(p){
 if(!p||p.provisions||p.job==='merchant'||!dayShiftAt(state.t)||
  p.path?.length||!['Traveling to market for food','Waiting for market merchant']
   .includes(p.activity)||Math.hypot(p.x-HOUSEHOLD_MARKET_TARGET[0],
   p.z-HOUSEHOLD_MARKET_TARGET[1])>1.6)return false;
 const merchant=people.find(worker=>worker!==p&&worker.job==='merchant'&&
  isWorkingAtSite(worker)&&Math.hypot(worker.x-HOUSEHOLD_MARKET_TARGET[0],
   worker.z-HOUSEHOLD_MARKET_TARGET[1])<6);
 if(!merchant)return false; // No phantom counter staff.
 const lot=(state.marketLots||[]).find(row=>row.remaining>=.85);
 if(!lot)return false;
 const amount=Math.min(1,lot.remaining,state.food);
 if(amount<.85||!Number.isFinite(amount))return false;
 const issued=Math.round(amount*1000)/1000;
 if(state.food+1e-7<issued)return false;
 state.food-=issued;
 lot.remaining=Math.max(0,Math.round((lot.remaining-issued)*1000)/1000);
 const transfer={id:p.name+':provision:'+Math.floor(state.t*30),
  citizen:p.name,merchant:merchant.name,receiptId:lot.id,amount:issued,
  homeIndex:citizenHomeIndex(p),time:state.t};
 state.marketTransactions=[transfer,...(state.marketTransactions||[])]
  .slice(0,MARKET_PROVISION_HISTORY_CAP);
 p.provisions={id:transfer.id,receiptId:lot.id,amount:issued,time:state.t};
 p.activity='Carrying provisions home';
 p.target=citizenHomeDestination(p);
 routeCitizen(p);p.workTimer=0;
 return true;
}
function consumeHouseholdFood(p){
 if(!p||!p.provisions||p.path?.length||p.activity!=='Carrying provisions home')
  return false;
 const home=citizenHomeDestination(p);
 if(Math.hypot(p.x-home[0],p.z-home[1])>.62)return false;
 const parcel=p.provisions,before=p.hunger;
 // Eating consumes the basket already debited at market, not town stock twice.
 p.hunger=Math.max(0,p.hunger-28*parcel.amount);
 p.energy=Math.min(100,p.energy+5*parcel.amount);
 const meal={id:parcel.id,citizen:p.name,receiptId:parcel.receiptId,
  amount:parcel.amount,homeIndex:citizenHomeIndex(p),
  time:state.t,hungerBefore:before,hungerAfter:p.hunger};
 state.householdMeals=[meal,...(state.householdMeals||[])]
  .slice(0,MARKET_PROVISION_HISTORY_CAP);
 delete p.provisions;
 return true;
}
function getFarmMarketHouseholdAudit(){
 return {source:'authoritative-receipt-backed-physical-market-home',
  reservedMarketFood:marketReservedFood(),
  remainingMarketLots:(state.marketLots||[]).filter(lot=>lot.remaining>0)
   .map(lot=>({id:lot.id,remaining:lot.remaining})),
  outstandingBaskets:people.filter(p=>p.provisions).map(p=>({
   citizen:p.name,receiptId:p.provisions.receiptId,
   amount:p.provisions.amount,position:[p.x,p.z],activity:p.activity})),
  latestTrade:(state.marketTransactions||[])[0]||null,
  latestMeal:(state.householdMeals||[])[0]||null,
  tradeCount:(state.marketTransactions||[]).length,
  mealCount:(state.householdMeals||[]).length};
}
/* W125 ECONOMY END */

`;
 change('function marketSupplyView(){',economy+'function marketSupplyView(){','economic authority');
 change('  resources:{food:state.food,wood:state.wood,gold:state.gold},\n  inTransit,escrowed,creditedInTransit,',
  '  resources:{food:state.food,wood:state.wood,gold:state.gold},\n  reservedMarketFood:marketReservedFood(),inTransit,escrowed,creditedInTransit,','stocks read');
 change(' deliveryReceipts.unshift({id:d.id,citizen:p.name,job:p.job,\n  resource:d.resource,amount:d.amount,origin:d.origin.slice(),\n  destination:d.destination.slice(),time:state.t,\n  creditedAtUnloading:d.escrowed===true});\n if(deliveryReceipts.length>12)deliveryReceipts.length=12;',
  ` const receipt={id:d.id,citizen:p.name,job:p.job,
  resource:d.resource,amount:d.amount,origin:d.origin.slice(),
  destination:d.destination.slice(),time:state.t,
  creditedAtUnloading:d.escrowed===true};
 deliveryReceipts.unshift(receipt);
 if(deliveryReceipts.length>12)deliveryReceipts.length=12;
 if(d.escrowed===true)recordMarketReceipt(receipt);`,'receipt to lot credit');
 change('function choose(p){if(p.delivery){routeLoadedWorker(p);return}\n  if(!dayShiftAt(state.t)){',
  `function choose(p){if(p.delivery){routeLoadedWorker(p);return}
  if(p.provisions){
   p.activity='Carrying provisions home';
   p.target=citizenHomeDestination(p);routeCitizen(p);return;
  }
  if(!dayShiftAt(state.t)){`,'loaded resident priority');
 change('  let dest;if(p.energy<30||p.hunger>88){dest=[-3,2];p.activity=\'Resting and gathering food\'}else{',
  `  if(p.job!=='merchant'&&p.hunger>=55&&p.energy>=30&&
   marketReservedFood()>=.85&&p.marketErrandDay!==Math.floor(state.t/24)){
    p.marketErrandDay=Math.floor(state.t/24);
    p.activity='Traveling to market for food';
    p.target=HOUSEHOLD_MARKET_TARGET.slice();routeCitizen(p);return;
  }
  let dest;if(p.energy<30||p.hunger>88){dest=[-3,2];p.activity='Resting and gathering food'}else{`,'market autonomy');
 change("}else if(p.job==='merchant'&&state.food>people.length*5){state.food-=1.5;state.gold+=1.2}",
  "}else if(p.job==='merchant'&&state.food-marketReservedFood()>people.length*5){state.food-=1.5;state.gold+=1.2}",'merchant trade reserve');
 change("const onRoad=p.activity==='Returning home at dusk'||p.activity.startsWith('Traveling to ')||p.activity.startsWith('Traveling with ');",
  "const onRoad=p.activity==='Returning home at dusk'||p.activity==='Carrying provisions home'||p.activity.startsWith('Traveling to ')||p.activity.startsWith('Traveling with ');",'visible loaded gait');
 change("const move=Math.min(remaining,dt*((homeward?2.25:workbound?2.35:.75)+i%4*.09));",
  "const move=Math.min(remaining,dt*((homeward?2.25:workbound?2.35:p.activity==='Carrying provisions home'?2.1:.75)+i%4*.09));",'road pace');
 change("}else if(p.activity.startsWith('Traveling to ')){\n if(p.energy<30||p.hunger>88)choose(p);",
  `}else if(p.activity==='Traveling to market for food'||
 p.activity==='Waiting for market merchant'){
 p.activity='Waiting for market merchant';
 if(!acquireHouseholdFood(p)&&(p.workTimer>=4||!onShift)){
  p.workTimer=0;choose(p);
 }
}else if(p.activity==='Carrying provisions home'){
 if(consumeHouseholdFood(p)){p.workTimer=0;choose(p)}
 else {p.workTimer=0;choose(p)}
}else if(p.activity.startsWith('Traveling to ')){
 if(p.energy<30||p.hunger>88)choose(p);`,'real arrival to home meal');
 change("state.food=Math.max(0,state.food-dt*people.length*.016);",
  "state.food=Math.max(marketReservedFood(),state.food-dt*people.length*.016);",'conserved reserved food');
 change("const payload={seed:seed>>>0,state:cloneData(state),city:cloneData(city),people:cloneData(people),stories:cloneData(stories)};return {",
  "const payload={seed:seed>>>0,state:cloneData(state),city:cloneData(city),people:cloneData(people),stories:cloneData(stories)};if(deliveryReceipts.length)Object.assign(payload,{deliveryReceipts:cloneData(deliveryReceipts)});return {",'receipt save persistence');
 change("state=q.state;city.splice(0,city.length,...q.city);people=q.people;stories=q.stories;accumulator=0;",
  "state=q.state;city.splice(0,city.length,...q.city);people=q.people;stories=q.stories;if(q.deliveryReceipts)deliveryReceipts.push(...q.deliveryReceipts);accumulator=0;",'receipt restore');
 change("getDeliveryEconomyAudit:()=>cloneData(getDeliveryEconomyAudit()),getDeliveryReceipts:",
  "getDeliveryEconomyAudit:()=>cloneData(getDeliveryEconomyAudit()),getFarmMarketHouseholdAudit:()=>cloneData(getFarmMarketHouseholdAudit()),getDeliveryReceipts:",'public audit');
 const validation=String.raw`
 // W125 opt-in additive fields preserve pre-W125 snapshots.
 if(s.marketLots!==undefined&&(!Array.isArray(s.marketLots)||
  s.marketLots.length>MARKET_PROVISION_LOT_CAP||
  !s.marketLots.every(lot=>lot&&validText(lot.id,100)&&
   validText(lot.citizen,40)&&validScalar(lot.remaining,0,1e5)&&
   validScalar(lot.time,0,s.t))||
  new Set(s.marketLots.map(lot=>lot.id)).size!==s.marketLots.length||
  s.marketLots.reduce((total,lot)=>total+lot.remaining,0)>s.food+.002))
  throw Error('Save contains invalid market reservations');
 for(const key of ['marketTransactions','householdMeals']){
  if(s[key]!==undefined&&(!Array.isArray(s[key])||
   s[key].length>MARKET_PROVISION_HISTORY_CAP||
   !s[key].every(e=>e&&validText(e.id,120)&&
    validText(e.citizen,40)&&validText(e.receiptId,100)&&
    validScalar(e.amount,.001,1e5)&&validScalar(e.time,0,s.t)&&
    Number.isInteger(e.homeIndex)&&e.homeIndex>=0&&e.homeIndex<q.city.length)))
   throw Error('Save contains invalid '+key);
 }
 if(q.deliveryReceipts!==undefined&&(!Array.isArray(q.deliveryReceipts)||
  q.deliveryReceipts.length>12||!q.deliveryReceipts.every(r=>
   r&&validText(r.id,100)&&validText(r.citizen,40)&&
   ['food','wood'].includes(r.resource)&&validScalar(r.amount,.001,1e5)&&
   validScalar(r.time,0,s.t)&&validPoint(r.origin)&&
   validPoint(r.destination)&&typeof r.creditedAtUnloading==='boolean')))
  throw Error('Save contains invalid market receipts');
 if(q.people.some(p=>
  (p.marketErrandDay!==undefined&&(!Number.isInteger(p.marketErrandDay)||
   p.marketErrandDay<0||p.marketErrandDay>Math.floor(s.t/24)))||
  (p.provisions!==undefined&&(!p.provisions||
   !validText(p.provisions.id,120)||!validText(p.provisions.receiptId,100)||
   !validScalar(p.provisions.amount,.001,1e5)||
   !validScalar(p.provisions.time,0,s.t)))))
  throw Error('Save contains invalid household errands');
`;
 change(" if(!Array.isArray(q.stories)||q.stories.length>6||!q.stories.every(e=>e&&Number.isInteger(e.day)&&e.day>0&&validText(e.text,240)))throw Error('Save contains invalid chronicles');",
 " if(!Array.isArray(q.stories)||q.stories.length>6||!q.stories.every(e=>e&&Number.isInteger(e.day)&&e.day>0&&validText(e.text,240)))throw Error('Save contains invalid chronicles');\n"+validation,'save payload validation');
 const meshes=String.raw`/* W125: reserved market stock, authentic carried baskets and earned home
 * meals have physical representations at their REAL world coordinates. */
function renderMarketHouseholdEvidence(){
 const lot=(state.marketLots||[]).find(row=>row.remaining>=.85);
 if(lot){
  const stall=MARKET_STALLS[0],stacks=Math.min(3,Math.floor(lot.remaining/.85));
  materialScope(MATERIAL.GENERAL,()=>{
   for(let i=0;i<stacks;i++){
    const x=stall.x+(i-1)*.48,z=stall.z+stall.face*.2;
    const y=terrain(x,z)+1.14;
    ellipsoid(x,y,z,.19,.19,.18,rgb(i%2?0xc4b289:0xddc6a1),6);
    box(x,y+.18,z,.23,.025,.25,rgb(0x927b58));
   }
  });
 }
 materialScope(MATERIAL.GENERAL,()=>{
  for(const p of people)if(p.provisions){
   const y=terrain(p.x,p.z)+1.2;
   ellipsoid(p.x+.22,y,p.z+.17,.19,.23,.17,rgb(0xc9b18c),6);
   box(p.x+.22,y+.19,p.z+.17,.17,.028,.18,rgb(0x937b5b));
  }
 });
 const meal=(state.householdMeals||[])[0];
 if(meal&&state.t>=meal.time&&state.t-meal.time<3){
  const lot=city[meal.homeIndex];
  if(lot){
   const x=lot[0]+1.45,z=lot[1]+1.75,y=terrain(x,z);
   materialScope(MATERIAL.WOOD,()=>{
    box(x,y+.025,z,.42,.16,.34,rgb(0x76523e));
    ellipsoid(x,y+.18,z,.22,.13,.17,rgb(0xbfa878),6);
   });
  }
 }
}
`;
 change('function renderDeliveryReceipts(){',meshes+'function renderDeliveryReceipts(){','earned world geometry');
 change('renderDeliveryReceipts();\nrenderMarketHandoffs();',
  'renderDeliveryReceipts();\nrenderMarketHouseholdEvidence();\nrenderMarketHandoffs();','render world evidence');
 change(' <div class="supply-stage"><small>Market receipt</small><output id="supply-receipt">No delivery recorded</output></div>\n  <div class="supply-stage"><small>Households</small><output id="supply-home">Waiting for residents</output></div>',
  ' <div class="supply-stage"><small>Market receipt</small><output id="supply-receipt">No delivery recorded</output></div>\n  <div class="supply-stage"><small>Market exchange</small><output id="supply-trade">No provisions issued</output></div>\n  <div class="supply-stage"><small>Household meal</small><output id="supply-meal">No meal verified</output></div>\n  <div class="supply-stage"><small>Households</small><output id="supply-home">Waiting for residents</output></div>',
  'on-screen receipt-to-home trail');
 change('  latestReceipt:latest?{id:latest.id,citizen:latest.citizen,\n    resource:latest.resource,amount:latest.amount,time:latest.time,\n    creditedAtUnloading:latest.creditedAtUnloading===true}:null,\n  homeTime:',
  '  latestReceipt:latest?{id:latest.id,citizen:latest.citizen,\n    resource:latest.resource,amount:latest.amount,time:latest.time,\n    creditedAtUnloading:latest.creditedAtUnloading===true}:null,\n  household:getFarmMarketHouseholdAudit(),\n  homeTime:',
  'observed household ledger');
 change(" const labels=[['supply-field',field],['supply-cargo',carried],\n  ['supply-receipt',received],['supply-home',shelter]];",
 ` const trade=flow.household.latestTrade,meal=flow.household.latestMeal;
 const exchanged=trade?'Day '+(Math.floor(trade.time/24)+1)+': '+
  trade.citizen+' collected '+trade.amount.toFixed(1)+' food from '+trade.merchant:
  'No provisions issued';
 const eaten=meal?'Day '+(Math.floor(meal.time/24)+1)+': '+
  meal.citizen+' ate at home · hunger '+Math.floor(meal.hungerBefore)+
  ' → '+Math.floor(meal.hungerAfter):'No meal verified';
 const labels=[['supply-field',field],['supply-cargo',carried],
  ['supply-receipt',received],['supply-trade',exchanged],
  ['supply-meal',eaten],['supply-home',shelter]];`,'concise genuine UI labels');
 for(const token of ['/* W125 ECONOMY BEGIN */','renderMarketHouseholdEvidence();',
  'getFarmMarketHouseholdAudit:()=>cloneData(getFarmMarketHouseholdAudit())',
  'deliveryReceipts:cloneData(deliveryReceipts)','...q.deliveryReceipts',
  'id="supply-trade"','id="supply-meal"']){
  if(!html.includes(token))throw Error('W125 missing resulting token '+token);
 }
 return html;
}
module.exports=transform;
if(require.main===module){
 const fs=require('node:fs'),file='public/tiny-kingdom/index.html';
 const old=fs.readFileSync(file,'utf8'),updated=transform(old);
 if(old!==updated)fs.writeFileSync(file,updated);
 process.stdout.write('W125 transformed '+(updated.length-old.length)+' bytes\\n');
}
