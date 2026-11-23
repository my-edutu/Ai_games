'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(process.env.RENDERER_SOURCE || path.resolve(__dirname, '../../public/snake-stream/renderer.mjs'), 'utf8');
async function actualExports() {
  // Import production pure renderer helpers unchanged, omitting browser-only static imports.
  const standalone = source.replace(/^import\s+.*?;\s*$/gm, '');
  return import('data:text/javascript;base64,' + Buffer.from(standalone).toString('base64'));
}
const healthy = { supported: true, failed: false, submitted: 2, completed: 1, lastObservedLatencyMs: 26, skipped: 0 };

test('new world must not burst HDR/depth/display-cache construction before a real completed full-scene fence', async () => {
  const { shouldAdmitFullSceneCache } = await actualExports();
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,completed:0}, directDraws:0, submittedAtWorldBuild:0 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: healthy, directDraws:0, submittedAtWorldBuild:0 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: healthy, directDraws:1, submittedAtWorldBuild:1 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: healthy, directDraws:1, submittedAtWorldBuild:0 }), true);
  // Rebuilding a board while old GPU fences are pending must not misread a
  // previous world's completed fence as a safe first frame for this world.
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,completed:21,submitted:25}, directDraws:1, submittedAtWorldBuild:24 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,completed:25,submitted:27}, directDraws:1, submittedAtWorldBuild:24 }), true);
});

test('slow or missing fences keep the exact complete 3D scene, while recovery permits cache admission', async () => {
  const { shouldAdmitFullSceneCache } = await actualExports();
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,lastObservedLatencyMs:412}, directDraws:5, submittedAtWorldBuild:0 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,lastObservedLatencyMs:NaN}, directDraws:1, submittedAtWorldBuild:0 }), false);
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,lastObservedLatencyMs:0}, directDraws:1, submittedAtWorldBuild:0 }), false);
  // Historical cumulative skips must not lock a recovered GPU out forever.
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,skipped:747}, directDraws:5, submittedAtWorldBuild:0 }), true);
});

test('valid higher-raster cache hit and unsupported/failed sync preserve existing fallback', async () => {
  const { shouldAdmitFullSceneCache } = await actualExports();
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,completed:0}, cacheHit:true, directDraws:0, submittedAtWorldBuild:0 }), true);
  assert.equal(shouldAdmitFullSceneCache({ queue: {supported:false}, directDraws:0 }), true);
  assert.equal(shouldAdmitFullSceneCache({ queue: {...healthy,failed:true}, directDraws:0 }), true);
});

test('production native gate acts on real full-scene direct draws, latches actual fence health, and resets on world build', () => {
  assert.match(source, /if \(!cacheAdmissionReady\s*&&\s*!shouldAdmitFullSceneCache\(/);
  assert.match(source, /cacheProbeDirectFrames\s*=\s*Math\.min\(\d+,\s*cacheProbeDirectFrames\s*\+\s*1\)/);
  assert.match(source, /cacheProbeDirectFrames\s*=\s*Math\.min\([\s\S]*?renderer\.render\(scene, camera\);\s*return/);
  assert.match(source, /cacheAdmissionReady\s*=\s*true;/);
  assert.match(source, /cacheAdmissionReady\s*=\s*false;\s*cacheProbeDirectFrames\s*=\s*0;\s*submittedAtWorldBuild\s*=\s*frameGate\.stats\(\)\.submitted/);
  assert.match(source, /const cacheHit = canReuseStaticWorldCache\(/);
  assert.match(source, /cameraOffset\.distanceToSquared\(desiredPosition\) > 0\) \{[\s\S]*?if \(staticMeshCount && !cacheAdmissionReady\)[\s\S]*?cacheProbeDirectFrames = Math\.min\(1048576, cacheProbeDirectFrames \+ 1\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(source, /staticCache:\s*\{[\s\S]*?probeDirectFrames:\s*cacheProbeDirectFrames/);
  assert.doesNotMatch(source,/partialSceneFastPath|diagnosticOnlyDraw/);
});

test('real two-slot GPU fence FIFO proves the completed sample belongs to the newly created world', async () => {
  const {createGpuFrameGate, shouldAdmitFullSceneCache} = await actualExports();
  let clock = 0, serial = 0, flushes = 0;
  const ready = new Set();
  const gl = {SYNC_GPU_COMMANDS_COMPLETE:9,ALREADY_SIGNALED:1,CONDITION_SATISFIED:3,TIMEOUT_EXPIRED:2,
    fenceSync:()=>({id:++serial}),clientWaitSync:sync=>ready.has(sync.id)?1:2,
    deleteSync:()=>{},flush:()=>{flushes++},isContextLost:()=>false};
  const gate=createGpuFrameGate(gl,{now:()=>clock,maxFrames:2});
  assert.equal(gate.canDraw(),true);gate.submitted(); // prior world frame 1
  clock=10;assert.equal(gate.canDraw(),true);gate.submitted(); // prior world frame 2
  const submittedAtWorldBuild=gate.stats().submitted;
  // Complete only prior-world frame 1, allowing an authentic new-world direct draw.
  clock=20;ready.add(1);assert.equal(gate.canDraw(),true);
  assert.equal(gate.stats().completed,1);gate.submitted(); // new world full-scene frame 3
  const before={queue:gate.stats(),directDraws:1,submittedAtWorldBuild};
  assert.equal(shouldAdmitFullSceneCache(before),false);
  // Complete prior-world frame 2; this is STILL not evidence of the new view.
  clock=30;ready.add(2);assert.equal(gate.canDraw(),true);
  assert.equal(shouldAdmitFullSceneCache({...before,queue:gate.stats()}),false);
  // Only the new world's real completed fence permits future HDR cache work.
  clock=40;ready.add(3);assert.equal(gate.canDraw(),true);
  assert.equal(gate.stats().lastObservedLatencyMs,20);
  assert.equal(shouldAdmitFullSceneCache({...before,queue:gate.stats()}),true);
  assert.equal(flushes,3);gate.dispose();
});

test('original strict genuine-complete submission and public authority remain untouched', () => {
  assert.match(source,/if\s*\(!frameGate\.canDraw\(\)\)\s*return false/);
  assert.match(source,/frameGate\.submitted\(\)/);
  assert.match(source,/world\.update\(snapshot,/);
  assert.match(source,/serpent\.update\(motion\.paths,/);
  assert.match(source,/liveCacheQuad\.visible\s*=\s*true/);
  assert.match(source,/const frameGate = createGpuFrameGate\(gl\)/);
});
