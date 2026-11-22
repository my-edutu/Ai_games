'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const source=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(source,'playable original game source');
new vm.Script(source,{filename:'W306-original-actual-game.js'});
const start=source.indexOf('const REAL_ECONOMIC_SURVEY_STAGES=');
const end=source.indexOf('function requestSettlementOverview(){',start);
assert(start>0&&end>start,'connected original game journey missing');
const body=source.slice(start,end);
assert(!/people\.push\(|city\.push\(|state\.(food|wood|gold)\s*[+\-*/]?=|Math\.random\(/.test(body),
 'presentation must not counterfeit population, economic state or authority');
const ctx=vm.createContext({Math,Array,Number,Object,Error,JSON});
vm.runInContext(body,ctx);
const homes=Array.from({length:35},(_,i)=>[-16+(i%7)*3.3,-12+Math.floor(i/7)*4.1,i%3]),
 fields=[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]],
 original=JSON.stringify(homes);
for(const stage of ['farm','market','homes']){
 const result=vm.runInContext('planRealEconomicSurvey('+JSON.stringify(homes)+',[29,-5],'+JSON.stringify(fields)+',[-1,10.2],390,844,'+JSON.stringify(stage)+')',ctx);
 assert.equal(result.stage,stage);assert.equal(result.recordedHomes,35);
 assert.equal(result.grownHomes,23);
 assert(result.zoom>=7.5&&result.zoom<=85);
 assert(result.focus.every(n=>Number.isFinite(n)&&Math.abs(n)<=40));
 if(stage==='homes'){
  assert(result.inspectedHomeLots.length>=4&&result.inspectedHomeLots.length<=8,
   'actual inhabited district, not an isolated roof');
  assert.equal(result.districtHomeCount,result.inspectedHomeLots.length);
  assert.equal(result.districtSource,'grown');
  assert(result.zoom<=45,'a legible actual house scale on narrow screens');
  for(const p of result.inspectedHomeLots)assert(homes.slice(12)
   .some(h=>h[0]===p[0]&&h[1]===p[1]),'no fabricated cottage survey');
 }
}
const day1=vm.runInContext('planRealEconomicSurvey('+JSON.stringify(homes.slice(0,12))+',[29,-5],'+JSON.stringify(fields)+',[-1,10.2],1024,640,"homes")',ctx);
assert.equal(day1.grownHomes,0);
assert.equal(day1.districtSource,'inhabited-core');
assert(day1.districtHomeCount>=4,'founding street not one remote cottage');
const early=vm.runInContext('planRealEconomicSurvey('+JSON.stringify([...homes.slice(0,12),[-17,-14]])+',[29,-5],'+JSON.stringify(fields)+',[-1,10.2],1024,640,"homes")',ctx);
assert.equal(early.grownHomes,1);
assert.equal(early.districtSource,'inhabited-core');
assert(early.districtHomeCount>=4,'one newly built isolated house must not become an empty-land tour');
assert(early.zoom<=33,'real house scale, not distant empty meadow');
const mockControl={dataset:{},textContent:'',setAttribute(name,value){this[name]=value}};
const observed=[];
Object.assign(ctx,{
 people:[{name:'Bram',job:'farmer',x:17,z:-3,activity:'Harvesting grain'}],
 selectedCitizen:0,city:homes.slice(0,12),presentationEpoch:0,
 watchLiveWorkday:()=>({citizen:'Bram',active:true,activity:'Harvesting grain'}),
 document:{getElementById:id=>id==='camera-survey'?mockControl:null},
 showToast:value=>observed.push(value),setCommandView:()=>{}
});
vm.runInContext('realEconomicSurveyIndex=2',ctx);
const real=vm.runInContext('advanceRealEconomicSurvey()',ctx);
assert.equal(real.accepted,true);
assert.equal(real.stage,'workday');
assert.equal(real.citizen,'Bram');
assert.equal(real.activity,'Harvesting grain');
assert.equal(real.activeProduction,true);
assert.equal(real.actualWorker,true);
assert.equal(real.authorityChanged,false);
assert.equal(mockControl.dataset.stage,'workday');
assert.equal(mockControl['aria-label'],'Continue real economic survey to farm');
const audit=vm.runInContext('getRealEconomicSurveyAudit()',ctx);
assert.equal(audit.last.citizen,'Bram');
assert.equal(audit.last.inspectedHomeLots.length,0);
ctx.watchLiveWorkday=()=>null;
vm.runInContext('realEconomicSurveyIndex=2',ctx);
const rejected=vm.runInContext('advanceRealEconomicSurvey()',ctx);
assert.equal(rejected.accepted,false);
assert.equal(rejected.reason,'no-real-worker-now');
assert.equal(vm.runInContext('realEconomicSurveyIndex',ctx),2,
 'camera tour must not advance when no real work is observable');
assert.equal(mockControl.dataset.stage,'workday',
 'failure does not invent a new citizen or alter the previous genuine shot');
assert.equal(JSON.stringify(homes),original);
assert(html.includes('id="camera-survey"'));
assert(html.includes("button('camera-survey',advanceRealEconomicSurvey)"));
assert(html.includes('getRealEconomicSurveyAudit,advanceRealEconomicSurvey'));
console.log('W308 source PASS: genuine farm/market/homes to actual worker, no invented shift, empty work refusal and authority isolation. Browser motion unproven.');