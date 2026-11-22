'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const source = fs.readFileSync(path.join(root,'public/snake-stream/cinematic-director.mjs'),'utf8');
const app = fs.readFileSync(path.join(root,'public/snake-stream/app.js'),'utf8');
const renderer = fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
const load = () => import(`file://${path.join(root,'public/snake-stream/cinematic-director.mjs')}?t3dwell`);
const snapshot = (step, overrides={}) => ({
  runToken:'seeded-run', lifecycle:'running', movementStep:step,
  width:28,height:16,snake:[{cell:8+6*28},{cell:7+6*28}],
  food:{cell:15+6*28},dangerLevel:0,goal:96,length:40,...overrides,
});
const queue = completed => ({supported:true,failed:false,skipped:140,
  lastObservedLatencyMs:1500,completed,submitted:completed+2,pending:2});

test('RED: one real shot survives concurrent starving GPU fences, then commits a truthful shot after verified completion',async()=>{
  const {createGpuEvidencedCinematicDirector}=await load();
  const director=createGpuEvidencedCinematicDirector();
  const a=director.resolve({mode:'cinematic',snapshot:snapshot(10),nowMs:1000,queue:queue(20)});
  assert.equal(a,'detail');
  // The ordinary camera storyboard would switch after 3s, but the real GPU
  // has not completed the preceding entire world view. Keep the true pose.
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(40),nowMs:4000,queue:queue(20)}),'detail');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:7400,queue:queue(20)}),'detail');
  // This is not a fabricated timer-FPS pass: the same FIFO gained completed
  // GPU fences and enough shot dwell; live simulation and HUD still advance.
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:9200,queue:queue(22)}),'follow');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(110),nowMs:10000,queue:queue(22)}),'follow');
});

test('RED: danger, portal breaks, restart, manual overview, reduced-motion and missing GPU proof never trap spectators',async()=>{
  const {createGpuEvidencedCinematicDirector}=await load();
  const director=createGpuEvidencedCinematicDirector();
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10),nowMs:0,queue:queue(1)}),'detail');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10,{dangerLevel:2}),nowMs:100,queue:queue(1)}),'overview');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10),nowMs:200,queue:queue(1)}),'detail');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10,{snake:[{cell:12},{cell:400}]}),nowMs:300,queue:queue(1)}),'overview');
  assert.equal(director.resolve({mode:'overview',snapshot:snapshot(65),nowMs:400,queue:queue(1)}),'overview');
  assert.equal(director.resolve({mode:'follow',snapshot:snapshot(65),nowMs:500,queue:queue(1)}),'follow');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10),reducedMotion:true,nowMs:600,queue:queue(1)}),'overview');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:700,queue:queue(1)}),'follow');
  // Fail-open for absent hardware evidence, not a frame-rate fabrication.
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(40),nowMs:800,queue:null}),'overview');
  // Historical long-latency evidence must not trap the camera after the GPU
  // queue actually drains. A previous 1500ms fence is not current pressure.
  director.resolve({mode:'cinematic',snapshot:snapshot(10),nowMs:810,queue:queue(1)});
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:820,
    queue:{...queue(1),pending:0}}),'follow');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(10,{runToken:'new-run'}),nowMs:900,queue:queue(1)}),'detail');
});

test('RED: 16-second bounded rescue, source rendering, reactive overview and immutable snapshot authority',async()=>{
  const {createGpuEvidencedCinematicDirector}=await load();
  const director=createGpuEvidencedCinematicDirector();
  const frame=snapshot(10),frozen=JSON.stringify(frame);
  director.resolve({mode:'cinematic',snapshot:frame,nowMs:1000,queue:queue(3)});
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:15500,queue:queue(3)}),'detail');
  assert.equal(director.resolve({mode:'cinematic',snapshot:snapshot(65),nowMs:17100,queue:queue(3)}),'follow');
  assert.equal(JSON.stringify(frame),frozen);
  assert.match(app,/createGpuEvidencedCinematicDirector\(/);
  assert.match(app,/gpuQueueStats\?\.\(/);
  assert.match(renderer,/gpuQueueStats:\s*\(\)\s*=>\s*frameGate\.stats\(\)/);
  assert.match(app,/overview\.update\(.*resolveSpectatorShot\(cameraMode, (?:frame|next)\.snapshot, reducedMotion\)/);
  assert.match(app,/renderer\.draw\(frame, previousFrame, alpha, timestamp, \{ reducedMotion, cameraMode: activeShot \}\)/);
  assert.match(fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8'),/actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
