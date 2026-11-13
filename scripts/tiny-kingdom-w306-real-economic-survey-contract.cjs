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
  assert.equal(result.inspectedHomeLots.length,10);
  for(const p of result.inspectedHomeLots)assert(homes.slice(12)
   .some(h=>h[0]===p[0]&&h[1]===p[1]),'no fabricated cottage survey');
 }
}
const day1=vm.runInContext('planRealEconomicSurvey('+JSON.stringify(homes.slice(0,12))+',[29,-5],'+JSON.stringify(fields)+',[-1,10.2],1024,640,"homes")',ctx);
assert.equal(day1.grownHomes,0);
assert.equal(JSON.stringify(homes),original);
assert(html.includes('id="camera-survey"'));
assert(html.includes("button('camera-survey',advanceRealEconomicSurvey)"));
assert(html.includes('getRealEconomicSurveyAudit,advanceRealEconomicSurvey'));
console.log('W306 source PASS: genuine connected farm/market/grown-home sightlines, no simulated activity invented');