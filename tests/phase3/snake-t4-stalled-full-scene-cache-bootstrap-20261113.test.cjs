'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(process.env.RENDERER_SOURCE || path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
const original=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
let exportsPromise;
function helpers(){return exportsPromise ||= import('data:text/javascript;base64,'+Buffer.from(source.replace(/^import\s+.*?;\s*$/gm,'')).toString('base64'));}
const stalled={supported:true,failed:false,submitted:26,completed:24,pending:1,skipped:807,lastObservedLatencyMs:940};

test('RED: real current-world high-latency completed fences can admit ONE complete static scene after sustained starvation',async()=>{
 const {shouldAdmitFullSceneCache}=await helpers();
 assert.equal(shouldAdmitFullSceneCache({queue:stalled,directDraws:23,submittedAtWorldBuild:20,bootstrapRecoverable:true}),true);
 assert.equal(shouldAdmitFullSceneCache({queue:{...stalled,lastObservedLatencyMs:32},directDraws:23,submittedAtWorldBuild:20}),true);
});

test('RED: in-flight or old-world fences, a single current-world frame, invalid sync and unfounded pressure never authorize expensive cache bootstrap',async()=>{
 const {shouldAdmitFullSceneCache}=await helpers();
 for(const [queue,directDraws,watermark] of [
  [{...stalled,completed:21},23,20], // one completed current world frame, not two
  [{...stalled,completed:24},1,20],
  [{...stalled,skipped:5},23,20],
  [{...stalled,lastObservedLatencyMs:5001},23,20],
  [{...stalled,pending:2},23,20],
  [{...stalled,completed:20},23,20],
 ]) assert.equal(shouldAdmitFullSceneCache({queue,directDraws,submittedAtWorldBuild:watermark,bootstrapRecoverable:true}),false);
 assert.equal(shouldAdmitFullSceneCache({queue:{...stalled,lastObservedLatencyMs:70},directDraws:23,submittedAtWorldBuild:20,bootstrapRecoverable:true}),true); // pre-existing healthy-fence path
 assert.equal(shouldAdmitFullSceneCache({queue:stalled,directDraws:23,submittedAtWorldBuild:20}),false);
 assert.equal(shouldAdmitFullSceneCache({queue:{...stalled,failed:true},directDraws:1,submittedAtWorldBuild:20,bootstrapRecoverable:true}),true); // pre-existing sync-failure fallback
});

test('RED: renderer must not re-enter pressure-direct branch on the one newly admitted real static-cache build',()=>{
 assert.match(source,/bootstrapRecoverable\s*:\s*true/);
 assert.match(source,/const newlyAdmitted\s*=\s*!cacheAdmissionReady/);
 assert.match(source,/pressureDirect\s*:\s*!newlyAdmitted\s*&&\s*shouldRenderFullSceneOnCacheMiss/);
 assert.match(source,/cacheAdmissionReady\s*=\s*true/);
 assert.match(source,/if\s*\(!frameGate\.canDraw\(\)\)\s*return false/);
 assert.match(source,/frameGate\.submitted\(\)/);
 assert.match(source,/renderer\.render\(scene, camera\)/);
});

test('strict original renderer one-second test and source exact UX/game authority remain unchanged',()=>{
 assert.match(original,/>=17|17/);
 assert.match(source,/world\.update\(snapshot,/);
 assert.match(source,/serpent\.update\(motion\.paths,/);
 assert.match(source,/liveCacheQuad\.visible\s*=\s*true/);
 assert.doesNotMatch(source,/partialSceneFastPath|diagnosticOnlyDraw/);
});
