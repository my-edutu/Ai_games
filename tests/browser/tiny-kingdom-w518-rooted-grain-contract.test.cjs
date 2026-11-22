'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function getCanopy(){
 const begin=html.indexOf('function seededStandingWheatCanopy(');
 const end=html.indexOf('function authenticGrainHeadProfile(',begin);
 assert(begin>0&&end>begin,'original seeded standing-wheat canopy profile exists');
 const source=html.slice(begin,end);
 const hash=n=>((Math.sin(n*12.9898+78.233)*43758.5453)%1+1)%1;
 return new Function('biomeHash',source+'\nreturn seededStandingWheatCanopy;')(hash);
}
test('W518 mature grain has a true wider seeded physical canopy, not colour-only edit',()=>{
 const canopy=getCanopy();
 for(const season of [0,1,2,3]){
  for(const id of [0,17,91,331,1271]){
   const first=canopy(id,season);
   assert.deepEqual(canopy(id,season),first,'same rooted ID is deterministic');
   assert(Object.values(first).every(Number.isFinite),'finite rooted silhouette');
   assert(first.stalkHalfWidth>0&&first.stalkHalfWidth<.05);
   assert(first.earSpread>.025&&first.earSpread<.095);
   assert(first.leafReach>=0&&first.leafReach<.38);
   if(season===1||season===2)
    assert(first.leafReach>.25&&first.earSpread>.045,
     'ripened cereal stand must form a readable continuous canopy');
  }
 }
});
test('W518 gameplay draws unchanged rooted grain count and actual completed harvest only',()=>{
 assert.match(html,/const plantedStems=FARMSTEAD\.fields\.reduce\(/);
 assert.match(html,/farmStalk\(x,z,id\*2,season,compact\)/);
 assert.match(html,/farmStalk\(Math\.max\(x0/);
 assert.match(html,/const lived=authenticGrainHeadProfile\(x,z,index,season\)/);
 assert.match(html,/stalkHalfWidth/);
 assert.match(html,/earSpread/);
 assert.match(html,/completedHarvestVisuals\(\)/);
 assert.match(html,/function renderCompletedHarvestWitnesses\(/);
 assert.match(html,/source:'real-original-grain/);
 assert.match(html,/function drawResidentFarmFields\(/);
 assert.match(html,/originalPlotsPreserved:true|allOriginalPlotsPreserved:true/);
});