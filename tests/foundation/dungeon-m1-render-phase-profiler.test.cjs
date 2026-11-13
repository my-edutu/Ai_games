'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/postfx-budget.js'),'utf8')).toString('base64'));

test('real frame phases use finite, bounded ring sampling without claiming GPU timings',async()=>{
 const {createRenderPhaseProfiler}=await load();
 const p=createRenderPhaseProfiler(8);
 assert.equal(p.summary().sampleCount,0);
 assert.equal(p.observe({sceneMs:20,submitMs:200,overlayMs:2}),true);
 assert.equal(p.observe({sceneMs:NaN,submitMs:300,overlayMs:4}),false);
 for(let i=1;i<=9;i++)
  assert.equal(p.observe({sceneMs:i,submitMs:300+i,overlayMs:0}),true);
 const s=p.summary();
 assert.equal(s.sampleCount,8);
 assert.equal(s.invalidSamples,1);
 assert.equal(s.submit.worstMs,309);
 assert.equal(s.submit.p95Ms,309);
 assert.equal(s.scene.p95Ms,9);
 assert.equal(s.overlay.p50Ms,0);
 assert.match(s.description,/excludes compositor/);
 const q=createRenderPhaseProfiler(8);
 assert.equal(q.observe({sceneMs:1,submitMs:99999,overlayMs:3}),true);
 assert.equal(q.summary().submit.worstMs,60000);
 assert.equal(q.summary().clampedSamples,1);
 assert.equal(q.observe({sceneMs:-1,submitMs:1,overlayMs:1}),false);
});

test('original production source still parses after profiling and deferring optional metrics',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/ai-dungeon/app.js')],{encoding:'utf8',timeout:12000});
 assert.equal(check.status,0,check.stderr);
 assert.match(app,/renderPhaseProfiler\.observe\(/);
 assert.match(app,/deferRenderDiagnostics\(diagnostics,/);
});
