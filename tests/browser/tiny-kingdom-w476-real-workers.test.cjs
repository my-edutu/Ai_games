'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('W476 uses only genuinely employed roof-visible actors, bounded at 390px',()=>{
 assert.match(source,/function updateLiveWorkBeacons\(matrix\)/);
 assert.match(source,/if\(!cargo&&!working\)continue/);
 assert.match(source,/followRayBlockers\(eye,point,roofs\)>0/);
 assert.match(source,/getCitizenPickCandidates\(\)\.find\(c=>c\.index===index&&c\.visible\)/);
 assert.match(source,/getLiveWorkBeaconAudit,/);
 assert.match(source,/const limit=width<=520\?2:3/);
 assert.match(source,/createdActors:0,createdTransactions:0/);
 assert.match(source,/#world-live-roles button:focus-visible/);
 assert.match(source,/updateWorldActorTag\(m\);updateLiveWorkBeacons\(m\);/);
 assert.match(source,/<div id="world-live-roles"[^>]* hidden>/);
 assert.ok(source.includes("lastSelectedOriginalWorker:workBeaconFollowChoice"));
 assert.ok(source.includes("workerShot&&anchorSelectedWorkdayCamera(workerShot)"));
 assert.ok(source.includes("document.body.dataset.citizenInspect==='on'"));
 assert.ok(source.includes("lens:physicallySurveyed?"));
});
test('W476 full game syntax and authoritative economy and save remain',()=>{
 for(const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  new Function(match[1]);
 for(const key of ['function exportSnapshot(','function advanceRealGrainJourney(',
  'function getActiveWorksites(','function getActiveDeliveries(',
  'function renderVisibleGrainChain('])assert.ok(source.includes(key),key);
});