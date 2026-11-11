'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=file=>import(pathToFileURL(path.resolve(__dirname, '../../public/infinite-tower-climb/visuals/',file)).href);

test('source polling keeps a 100ms start-to-start target without overlapping requests',async()=>{
 const {nextTowerStatePollDelay}=await load('live-state-cadence.mjs');
 assert.equal(nextTowerStatePollDelay({startedAtMs:100,completedAtMs:140,failures:0}),60);
 assert.equal(nextTowerStatePollDelay({startedAtMs:100,completedAtMs:260,failures:0}),16);
 assert.equal(nextTowerStatePollDelay({startedAtMs:100,completedAtMs:99,failures:0}),100);
 assert.equal(nextTowerStatePollDelay({startedAtMs:100,completedAtMs:110,failures:1}),400);
 assert.equal(nextTowerStatePollDelay({startedAtMs:100,completedAtMs:600,failures:8}),3000);
 assert.throws(()=>nextTowerStatePollDelay({startedAtMs:0,completedAtMs:10,failures:-1}),/failures/);
});

test('only genuinely accepted and returned Three.js submissions create bounded source-transition witnesses',async()=>{
 const {createRenderProgress}=await load('render-progress.mjs');
 const progress=createRenderProgress();
 const eight={tick:440,floor:8,runToken:'run-A',lifecycle:'running'};
 const nine={tick:451,floor:9,runToken:'run-A',lifecycle:'running'};
 progress.received(eight,100,1100);
 progress.received(eight,110,1110);
 progress.submitted(eight,120,1120);
 progress.received(nine,200,1200);
 let transitions=progress.diagnostics(200).sourceTransitions;
 assert.deepEqual(transitions.map(x=>x.phase),['browser-accepted','renderer-submitted','browser-accepted']);
 assert.equal(transitions.at(-1).floor,9);
 assert.equal(transitions.at(-1).tick,451);
 progress.submitted(nine,250,1250);
 progress.submitted(nine,270,1270);
 transitions=progress.diagnostics(270).sourceTransitions;
 assert.deepEqual(transitions.map(x=>x.phase),[
  'browser-accepted','renderer-submitted','browser-accepted','renderer-submitted'
 ]);
 assert.equal(transitions.at(-1).atWallMs,1250);
 assert.equal(progress.diagnostics(270).sourceTransitionProof,'browser-acceptance-and-renderer-return-only-NOT-native-video');
 for(let i=0;i<100;i++)progress.received({tick:i,floor:i,runToken:'run-B',lifecycle:'running'},300+i,1300+i);
 assert.equal(progress.diagnostics(500).sourceTransitions.length,64);
 assert.ok(progress.diagnostics(500).sourceTransitions.every(x=>x.runToken !== 'forged'));
});
