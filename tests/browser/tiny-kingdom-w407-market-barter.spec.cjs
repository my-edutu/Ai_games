'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function genuineMarketBarterWitness(');
const end=html.indexOf('let marketBarterLensBuilds=',start);
test('W407 authentic bartering camera gate is isolated from economics',()=>{
 assert.ok(start>0&&end>start,'genuine live game camera and validity gate are present');
 const source=html.slice(start,end);
 const residents=[{name:'Mira',x:1.32,z:3.36,activity:'Bartering at market',job:'merchant'}];
 const ctx={Math,Number,follow:true,people:residents,selectedCitizen:0,
  MARKET_STALLS:[{x:4.45,z:2.95},{x:-5.4,z:2.25}]};
 vm.createContext(ctx);vm.runInContext(source,ctx,{timeout:500});
 assert.equal(ctx.genuineMarketBarterWitness(residents[0]),true);
 assert.equal(ctx.genuineMarketBarterWitness({...residents[0],activity:'Traveling to farm'}),false);
 assert.equal(ctx.genuineMarketBarterWitness({...residents[0],x:100}),false);
 assert.equal(ctx.genuineMarketBarterWitness({...residents[0],name:'Other'}),false);
 ctx.follow=false;assert.equal(ctx.genuineMarketBarterWitness(residents[0]),false);
 assert.doesNotMatch(source,/state\s*\.|\.activity\s*=|\.delivery\s*=/,
  'no mutation of activity, stock, saved world or deliveries');
});
test('W407 trade lens rejects false clear views, keeps visible citizen and physical posts',()=>{
 const ctx={Math,Number};
 vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx,{timeout:500});
 const shot={eyeCollision:{clear:true},blockers:0,marketPostSightline:{centerCover:.02},
  foregroundSceneCover:.16,foregroundActorCoreCover:.08,foregroundCargoCover:.05,
  vegetationFaceBlockers:0,projectedWorkerHeightFraction:.21};
 const framing={blockedBodyRays:0,handBlockers:0,
  foregroundCitizenBlockers:0,cameraProximityWarnings:0};
 assert.equal(ctx.readableMarketBarterShot(shot,framing,true),true);
 for(const change of [{blockers:1},{eyeCollision:{clear:false}},
  {marketPostSightline:{centerCover:.30}},{foregroundActorCoreCover:.50},
  {projectedWorkerHeightFraction:.01}]){
  assert.equal(ctx.readableMarketBarterShot({...shot,...change},framing,true),false,JSON.stringify(change));
 }
});
test('W407 trade is an actual physically inspected camera branch, not an invented task',()=>{
 assert.match(html,/marketBarterBest\?marketBarterFraming/);
 assert.match(html,/\(unloading\|\|marketBarter\)\?marketCourierPostSightline\(/);
 assert.match(html,/marketBarterReadableCandidates:marketBarterReadable/);
 assert.match(html,/genuineMarketBarterWitness\(citizen\)/);
 assert.match(html,/getMarketBarterWitnessAudit/);
});