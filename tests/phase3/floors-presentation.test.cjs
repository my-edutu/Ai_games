'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {createFloorsRenderSnapshot}=require('../../dist/games/ai-vs-1000-floors/src/presentation/snapshot.js');

test('floors render snapshot is bounded, public and gameplay-complete',()=>{
  const runtime=FloorsRuntime.create({},'phase3-render');
  for(let i=0;i<40;i++)runtime.step();
  const snapshot=createFloorsRenderSnapshot(runtime.state,runtime.peekEvents());
  assert.equal(snapshot.gameId,'ai-vs-1000-floors');
  assert.ok(snapshot.floor>=1&&snapshot.floor<=1000);
  assert.ok(snapshot.progressPermille>=0&&snapshot.progressPermille<=1000);
  assert.ok(snapshot.cells.length<=runtime.state.floor.width*runtime.state.floor.height);
  assert.ok(snapshot.enemies.length<=runtime.state.floor.enemies.length);
  assert.ok(snapshot.events.length<=8);
  const json=JSON.stringify(snapshot);
  for(const forbidden of ['seed','runId','rng','operator','token','stack','prompt'])assert.equal(json.includes(forbidden),false,forbidden);
});

test('floors browser surface exposes the R5 game-first UX and accessibility contract',()=>{
  const html=fs.readFileSync('public/ai-vs-1000-floors/index.html','utf8');
  const css=fs.readFileSync('public/ai-vs-1000-floors/styles.css','utf8');
  const app=fs.readFileSync('public/ai-vs-1000-floors/app.js','utf8');
  assert.match(html,/data-ux-revision="3"/);
  assert.match(html,/canvas[^>]+id="tower"/);
  assert.match(html,/id="quality"[^>]*aria-label="Rendering quality"/);
  for(const tier of ['low','balanced','high','ultra'])assert.match(html,new RegExp(`value="${tier}"`));
  assert.match(html,/id="sector-name"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(css,/--color-progress\s*:/);
  assert.match(css,/--color-danger\s*:/);
  assert.match(css,/#broadcast\[data-quality="low"\]/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/max-width|max-height/);
  assert.match(app,/const SECTORS\s*=/);
  assert.match(app,/const QUALITY\s*=/);
  assert.match(app,/requestAnimationFrame\(frame\)/);
  assert.match(app,/enemy\.telegraph==='attack'\|\|enemy\.telegraph==='charge'/);
});
