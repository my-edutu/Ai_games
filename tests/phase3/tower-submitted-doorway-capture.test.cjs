'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {summarizePhysicalDoorwaySubmissions:read}=
  require('../../scripts/tower-physical-doorway-submissions.cjs');
const browser=fs.readFileSync(path.join(__dirname,
  '../../tests/browser/tower-live-motion.spec.cjs'),'utf8');
const sample=(tick,overrides={})=>({
  floor:9,runToken:'expedition-a',crossingTick:451,sourceTick:tick,
  returnedWebglMs:1000+tick,retainedOriginalGpu:true,
  heroNdc:[.2,0,.4],originalGateNdc:[.3,0,.4],
  heroCoreClear:true,originalGateCoreClear:true,
  bothInProjectedSafeFrame:true,...overrides,
});
const observation=(atMs,frames)=>({
  atMs,observedPhysicalDoorwaySubmissionAudit:{frames},
});
test('exports the first source episode from real renderer-return samples and does not mix restart',()=>{
  const out=read([
    observation(25000,[sample(459),sample(461)]),
    observation(26000,[sample(459),sample(463)]),
    observation(67000,[sample(339,{runToken:'expedition-b',crossingTick:335})]),
  ]);
  assert.equal(out.firstEpisode,'expedition-a:451');
  assert.equal(out.observedEpisodeCount,2);
  assert.equal(out.returnedFrameCount,3);
  assert.equal(out.firstReturnedSourceGapTicks,8);
  assert.equal(out.retainedOriginalGpuFrames,3);
  assert.equal(out.rootCause,'BOTH_PROJECTED_NOT_NATIVE_PIXEL_VERIFIED');
  assert.equal(out.nativeVerdict,'NOT EVALUATED');
  assert.deepEqual(out.frames.map(f=>f.sourceTick),[459,461,463]);
});
test('missing archive is NOT EVALUATED rather than negative GPU or native proof',()=>{
  const out=read([{atMs:100,observedPhysicalDoorwaySubmissionAudit:null}]);
  assert.equal(out.state,'NOT EVALUATED');
  assert.equal(out.rootCause,'NO_RETAINED_BROWSER_AUDIT');
  assert.equal(out.returnedFrameCount,0);
});
test('separates missing original mesh, projection failure and blocked core sightline',()=>{
  assert.equal(read([observation(1,[sample(459,{retainedOriginalGpu:false})])]).rootCause,
    'ORIGINAL_GATE_NOT_RETAINED_IN_RETURNED_SCENE');
  assert.equal(read([observation(1,[sample(459,{originalGateNdc:[1.4,0,.4]})])]).rootCause,
    'ORIGINAL_GATE_OUTSIDE_PROJECTED_CAMERA');
  assert.equal(read([observation(1,[sample(459,{heroCoreClear:false,bothInProjectedSafeFrame:false})])]).rootCause,
    'CAMERA_TO_BODY_OR_GATE_CORE_RAY_BLOCKED');
});
test('rejects invalid episode ticks and never infers video pixels from a projection',()=>{
  const out=read([observation(1,[sample(400),sample(460,{
    runToken:'expedition-b',crossingTick:461
  }),sample(459,{originalGateNdc:[.2,0,.4]})])]);
  assert.equal(out.returnedFrameCount,1);
  assert.equal(out.nativeVerdict,'NOT EVALUATED');
  assert.match(out.limitation,/No native WebM pixel/);
  assert.match(browser,/observedPhysicalDoorwaySubmissionAudit: d\.physicalDoorwaySubmissionAudit/);
  assert.match(browser,/physical-doorway-submissions\.json/);
});
