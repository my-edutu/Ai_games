'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {createFloorsRenderSnapshot}=require('../../dist/games/ai-vs-1000-floors/src/presentation/snapshot.js');
const {floorsManifest}=require('../../dist/games/ai-vs-1000-floors/src/manifest.js');

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
  assert.equal(typeof snapshot.sectorIdentity.id,'string');
  assert.equal(typeof snapshot.sectorIdentity.name,'string');
  assert.equal(typeof snapshot.sectorIdentity.tone,'string');
  const json=JSON.stringify(snapshot);
  for(const forbidden of ['seed','runId','rng','operator','token','stack','prompt','queued','applied'])assert.equal(json.includes(forbidden),false,forbidden);
});

test('floors presentation exposes exact next-step hazard timing without inventing simulation state',()=>{
  const runtime=FloorsRuntime.create({},'phase3-hazard-presentation');
  const state=structuredClone(runtime.state);
  state.floor.ticks=10;
  state.floor.hazards=[{id:'hazard-visible-test',kind:'beam',cell:state.player.cell,damage:2,period:6,phase:1}];
  const snapshot=createFloorsRenderSnapshot(state,[]);
  const cell=snapshot.cells.find(candidate=>candidate.index===state.player.cell);
  assert.equal(cell.hazard,'beam');
  assert.deepEqual(cell.hazardState,{telegraph:'line warning',period:6,ticksUntilActive:1,activeNextStep:true});
});

test('floors sector identity comes from the live content catalogue',()=>{
  const runtime=FloorsRuntime.create({},'phase3-sector-presentation');
  const snapshot=createFloorsRenderSnapshot(runtime.state,[]);
  assert.deepEqual(snapshot.sectorIdentity,{index:1,id:'intake-vaults',name:'Intake Vaults',tone:'orientation'});
});

test('floors manifest advertises the implemented broadcast presentation',()=>{
  assert.notEqual(floorsManifest.presentationVersion,'not-implemented');
  assert.ok(floorsManifest.capabilities.includes('broadcast-presentation'));
  assert.ok(floorsManifest.capabilities.includes('quality-presets'));
});

test('floors browser surface exposes the revision 3 game-first UX and accessibility contract',()=>{
  const html=fs.readFileSync('public/ai-vs-1000-floors/index.html','utf8');
  const css=fs.readFileSync('public/ai-vs-1000-floors/styles.css','utf8');
  const js=fs.readFileSync('public/ai-vs-1000-floors/app.js','utf8');
  assert.match(html,/data-ux-revision="3"/);
  assert.match(html,/canvas[^>]+id="tower"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/id="quality"/);
  assert.match(html,/id="details-toggle"/);
  assert.match(html,/class="telemetry-drawer"/);
  assert.match(css,/--color-progress\s*:/);
  assert.match(css,/--color-danger\s*:/);
  assert.match(css,/--sector-accent\s*:/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/max-width|max-height/);
  assert.match(js,/requestAnimationFrame/);
  assert.match(js,/qualityPresets/);
});
