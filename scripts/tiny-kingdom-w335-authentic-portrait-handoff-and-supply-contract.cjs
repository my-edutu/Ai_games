'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const director=source.match(/function advanceLiveWorkdayDirector\(\)\{[\s\S]*?\n \}/);
assert(director,'actual source workday director must exist');
assert(source.includes('const physicalMobileWorkerCut=canvas.clientWidth>0&&canvas.clientWidth<=520'),
 'a nearby selected real worker must trigger a viewport-bounded physical cut');
assert(source.includes('if(distance>8||physicalMobileWorkerCut||'),'real camera path not wired');
assert(source.includes('if(distance>8||physicalMobileWorkerCut)liveWorkCuts++'),
 'physical portrait worker switches must be countable');
function run(width,offset){
 const ctx={
  liveWorkday:true,forgeWitness:false,selectedCitizen:0,
  people:[{name:'old',x:0,z:0,activity:'Resting at home'},
   {name:'new',x:offset,z:0,activity:'Working orchard',workTimer:.1}],
  getLiveWorkJourneyAudit:()=>({stage:'none'}),
  isWorkingAtSite:p=>p.name==='new',
  performance:{now:()=>20_000},liveWorkerPresentedAt:0,LIVE_WORKER_MIN_SHOT_MS:2000,
  state:{t:100},liveWorkSwitchHour:0,
  workDuration:()=>1,chooseFilmableWorker:choices=>({...choices[0],shot:{eyeCollision:{clear:true},blockers:0}}),
  genuineWorkdayShotDecision:()=>({safe:true,readable:true}),
  focusPoint:[0,0],liveWorkCursor:0,liveWorkTransitions:0,liveWorkCuts:0,
  liveWorkShotRetryAt:0,liveWorkShotDeferred:0,
  actionCameraZoom:5,actionCameraPitch:.4,lastFollowShot:{},
  window:{matchMedia:()=>({matches:false})},canvas:{clientWidth:width},
  anchorSelectedWorkdayCamera:()=>{ctx.anchored++;return true;},
  updateFollowCamera:()=>{ctx.fallback++;},
  updateLiveWorkdayUI:()=>{ctx.updated++;},
  anchored:0,fallback:0,updated:0,
 };
 const fn=vm.runInNewContext(director[0]+'\nadvanceLiveWorkdayDirector;',ctx);
 assert.equal(fn(),true);
 assert.equal(ctx.selectedCitizen,1);
 assert.equal(ctx.updated,1);
 return ctx;
}
const mobile=run(390,2.1);
assert.equal(mobile.anchored,1,'portrait must immediately place the real next worker in frame');
assert.equal(mobile.liveWorkCuts,1);
const desktop=run(1024,2.1);
assert.equal(desktop.anchored,0,'nearby desktop scene should preserve motion continuity');
assert.equal(desktop.liveWorkCuts,0);
const farDesktop=run(1024,9.1);
assert.equal(farDesktop.anchored,1,'distant actual work still requires physical camera cut');
assert.equal(farDesktop.liveWorkCuts,1);
assert(source.includes('#world-ribbon:has(#world-trace-toggle[aria-expanded="false"])'),
 'portrait closed supply must be an actual disclosure, not a full-width empty panel');
assert(source.includes('#world-ribbon #world-trace-toggle'),
 'actual 44px supply tap target not retained');
assert(!/\b(step|saveWorld|deliveryReceipts\.push)\s*\(/.test(director[0]),
 'director must not simulate work or move authoritative villagers');
console.log('W335 PASS: genuine portrait worker handoff gets safe camera cut, desktop near-worker continuity preserved, Supply disclosure remains tappable; actual running film pending.');
