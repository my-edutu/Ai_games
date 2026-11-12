'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const scriptStart=html.indexOf('<script>'),scriptEnd=html.indexOf('</script>',scriptStart);
assert(scriptStart>=0&&scriptEnd>scriptStart,'original running game executable exists');
new vm.Script(html.slice(scriptStart+8,scriptEnd));
const slice=(begin,end)=>{
 const a=html.indexOf(begin),b=html.indexOf(end,a+begin.length);
 assert(a>=0&&b>a,'missing original source block '+begin);
 return html.slice(a,b);
};
const pContext={MARKET_STALLS:[0,1,2,3],Math,Number,Error};
vm.createContext(pContext);
vm.runInContext(slice('function marketStallProfile(index){','// W196 original two-storey'),pContext);
const profiles=[0,1,2,3].map(i=>pContext.marketStallProfile(i));
assert(profiles.every(p=>p.peak>p.eave+.70&&p.postHeight>=p.eave-.16),'real roofs and uprights');
assert(profiles[0].eave>=3.85&&profiles[1].eave>=3.65,'permanent inhabited merchant upper floors are spatially substantial');
assert(profiles[0].peak-profiles[2].peak>=.85&&profiles[1].peak-profiles[3].peak>=.85,
 'genuine stone-and-oak merchant shops visually rise ABOVE open textile/herb trading shelters');
const trade=slice('function grainwardTradehouseEnvelope(','// W257:');
assert.match(trade,/upperCasement|upperWindowBay/,'original upper occupied market room must be daylight-lit');
assert.match(trade,/materialScope\(MATERIAL\.WINDOW_GLOW/);
assert.match(trade,/groundLevelBuyerWallCount:0/,'no blocked courier/buyer aisle');
const camera=slice('function physicallyReadableCourierRouteShot(','function planCitizenCamera(');
assert(!/\b(?:state|people|deliveryReceipts|city|Math\.random)\b/.test(camera),'read-only physical camera');
const scope={};
vm.createContext(scope);
vm.runInContext(camera+'\nthis.check=physicallyReadableCourierRouteShot;',scope);
const shot={eyeCollision:{clear:true},blockers:0,projectedWorkerHeightFraction:.17,
 foregroundSceneCover:.06,foregroundCargoCover:.04,foregroundVegetationCover:.11,
 vegetationFaceBlockers:0};
const framing={blockedBodyRays:0,foregroundCitizenBlockers:0,handBlockers:0,cameraProximityWarnings:0};
assert.equal(scope.check(shot,framing,true),true,'genuine clear mobile courier earns a readable view');
assert.equal(scope.check({...shot,foregroundSceneCover:.70},framing,true),false,'cannot hide real market/building mass');
assert.equal(scope.check({...shot,eyeCollision:{clear:false}},framing,true),false,'no camera through physical roofs');
assert.equal(scope.check({...shot,projectedWorkerHeightFraction:.08},framing,true),false,'do not endorse miniature citizen');
assert.equal(scope.check(shot,{...framing,foregroundCitizenBlockers:1},true),false,'no obscured real worker');
assert.match(html,/physicallyReadableCourierRouteShot\(shot,framing,portraitLens\)/,'evaluate actual surveyed route candidates');
assert.match(html,/routeBest\|\|/,'prioritize physically legal readable route shot');
console.log('W259 PASS: original merchant shop skyline, actual second-floor casements, physically legal human-scale courier film');
