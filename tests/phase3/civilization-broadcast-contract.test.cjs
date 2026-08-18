'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}

test('browser source contains semantic landmarks, primary hierarchy and accessibility controls',()=>{
  const html=read('public/ai-civilization/index.html');
  const css=read('public/ai-civilization/styles.css');
  const js=read('public/ai-civilization/app.js');
  for(const token of ['<header','<main','aria-live','id="kingdom-map"','id="ruler-card"','id="goal"','id="danger"','id="audio-toggle"','id="motion-toggle"','id="contrast-toggle"','id="text-toggle"'])assert.ok(html.includes(token),token);
  assert.match(html,/AI Civilization/i);
  assert.match(css,/@media\s*\(max-width:\s*700px\)/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css,/min-height:\s*100dvh/);
  assert.match(js,/EventSource/);
  assert.match(js,/\/civilization\/state/);
  assert.match(js,/reconnect/i);
  assert.match(js,/audio-toggle[\s\S]*aria-pressed[\s\S]*String\(state\.audioEnabled\)/);
  assert.doesNotMatch(js,/String\(!state\.audioEnabled\)/);
  assert.match(js,/const preferences=.*try.*localStorage/s);
  assert.equal(/https?:\/\//.test(html+css+js),false);
});

test('stream server self-test exercises health, state, events, SSE and static routes',()=>{
  const result=spawnSync(process.execPath,['scripts/serve-civilization-stream.cjs','--self-test'],{cwd:root,encoding:'utf8',timeout:20000});
  assert.equal(result.status,0,result.stderr||result.stdout);
  const report=JSON.parse(result.stdout);
  assert.equal(report.pass,true);
  assert.equal(report.routes.health,200);
  assert.equal(report.routes.state,200);
  assert.equal(report.routes.events,200);
  assert.equal(report.routes.stream,200);
  assert.equal(report.routes.index,200);
  assert.equal(report.privacySafe,true);
});
