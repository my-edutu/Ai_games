'use strict';
// W136 Phase 1 rendering spine + truthful economic HUD source contract.
// Source-only executable proof; not browser, compositor, FPS, or visual acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'actual runnable game must be inspected');
new vm.Script(html.slice(start+8,end),{filename:'tiny-kingdom-live.js'});
function between(a,b){
 const left=html.indexOf(a),right=html.indexOf(b,left+a.length);
 assert(left>=0&&right>left,'missing integrated source delimiter: '+a);
 return html.slice(left,right);
}
const plannerSource=between('const SCENIC_DRAW_PLAN_VIEWS_PER_MESH=2;',
 'function drawVisibleStaticChunks(');
let references=0;
const legacy=(ranges,planes,bridge)=>{
 references++;
 return {runs:ranges.map(r=>({first:r.first,count:r.count})),
  visibleTriangles:ranges.reduce((sum,r)=>sum+r.count/3,0),bridge};
};
const planner={planVisibleStaticDraws:legacy};
vm.runInNewContext(plannerSource+
 '\nglobalThis.probe={planRetainedStaticDraws,getScenicDrawPlanCacheAudit};',planner);
const p=planner.probe,ranges=[{first:0,count:6},{first:6,count:12}];
const planes=Array.from({length:6},(_,i)=>[i+1,0,.25,1]);
const first=p.planRetainedStaticDraws(ranges,planes,false);
const same=p.planRetainedStaticDraws(ranges,planes.map(row=>row.slice()),false);
assert.equal(first,same,'exact camera must preserve original draw ranges');
assert.equal(references,1,'unchanged frame must not replan');
const bridged=p.planRetainedStaticDraws(ranges,planes,true);
assert.notEqual(first,bridged,'changing batching must invalidate plan');
assert.equal(references,2);
const moving=p.planRetainedStaticDraws(ranges,
 planes.map(row=>[row[0],row[1],row[2],row[3]+.001]),true);
assert.notEqual(moving,bridged,'real camera movement must replan');
assert.equal(references,3);
p.planRetainedStaticDraws(ranges,planes,false);
assert.equal(references,4,'exact two-plan bound evicts least recently used');
p.planRetainedStaticDraws(ranges.map(row=>({...row})),planes,false);
assert.equal(references,5,'new immutable geometry identity must replan');
const audit=p.getScenicDrawPlanCacheAudit();
assert.equal(audit.hits,1);
assert.equal(audit.builds,5);
assert.equal(audit.evictions,2);
assert.equal(audit.viewsPerMeshLimit,2);
assert.equal(audit.noCitizenOrHouseOmission,true);
assert.equal(audit.authorityChanged,false);
assert(html.includes('const {runs,...audit}=planRetainedStaticDraws(ranges,planes,bridge);'),
 'physical static WebGL draw must use original retained plan');
const hudSource=between('const LIVE_HUD_MAX_WALL_INTERVAL_MS=220;',
 'function render(now){requestAnimationFrame(render);');
function makeHud(software){
 const ctx={swiftGpu:software,gpuAvailable:true,frames:0,calls:[]};
 for(const name of ['updateUI','drawAtlas','updateRealmSignal','updateWorldRibbon'])
  ctx[name]=()=>ctx.calls.push(name);
 vm.runInNewContext(hudSource+
  '\nglobalThis.probe={presentResponsiveWorldHud,getLiveHudCadenceAudit,frames:()=>frames};',
  ctx);
 return ctx;
}
const soft=makeHud(true),hard=makeHud(false);
for(const now of [0,20,100,219,220,441]){
 soft.probe.presentResponsiveWorldHud(now);
 hard.probe.presentResponsiveWorldHud(now);
}
assert.equal(soft.probe.getLiveHudCadenceAudit().updates,6,
 'slow software must show every genuinely submitted authoritative state');
assert.equal(hard.probe.getLiveHudCadenceAudit().updates,3,
 'hardware must use bounded wall-clock UI rhythm');
assert.equal(hard.probe.getLiveHudCadenceAudit().skippedHardwareFrames,3);
assert.equal(soft.probe.frames(),6);
assert.equal(hard.probe.frames(),6);
assert.deepEqual(hard.calls,['updateUI','drawAtlas','updateRealmSignal','updateWorldRibbon',
 'updateUI','drawAtlas','updateRealmSignal','updateWorldRibbon',
 'updateUI','drawAtlas','updateRealmSignal','updateWorldRibbon']);
assert(html.includes('refreshPickedCitizenCaption();presentResponsiveWorldHud(performance.now());'),
 'actual game frame must invoke truthful HUD pacing');
assert(html.includes('getScenicDrawPlanCacheAudit,getLiveHudCadenceAudit'),
 'browser inspectors must expose source-only counters');
console.log('W136 PASS: real-source JS compiles; original static draw ranges preserved across exact-camera reuse; invalidation/bounds and responsive original economy HUD verified. Browser, GL, hardware FPS and visual quality NOT PROVEN.');
