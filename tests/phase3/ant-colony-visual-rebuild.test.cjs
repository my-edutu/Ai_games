'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ant=require('../../dist/games/ai-ant-colony/src/index.js');

const root=path.resolve(__dirname,'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const config={width:40,height:26,surfaceRow:6,targetPopulation:60,initialWorkers:16,dayLengthTicks:120,seasonLengthTicks:480,broodInterval:18,eggHatchTicks:10,larvaTicks:10,pupaTicks:10,predatorCap:2,predatorSpawnInterval:60,noProgressTicks:1000};

function snapshot(seed='visual-contract'){
  const runtime=ant.AntColonyRuntime.create(config,seed);
  for(let i=0;i<37;i++)runtime.step();
  return{runtime,snapshot:ant.createAntRenderSnapshot(runtime.state,runtime.drainEvents())};
}

test('public ecosystem snapshot exposes presentation-safe temporal and queen detail without leaking authority internals',()=>{
  const{runtime,snapshot:frame}=snapshot('temporal');
  const before=ant.stateChecksum(runtime.state);
  assert.equal(typeof frame.environment.dayProgress,'number');
  assert.ok(frame.environment.dayProgress>=0&&frame.environment.dayProgress<1);
  assert.equal(typeof frame.environment.seasonProgress,'number');
  assert.ok(frame.environment.seasonProgress>=0&&frame.environment.seasonProgress<1);
  assert.equal(frame.queen.eggsLaid,runtime.state.queen.eggsLaid);
  assert.equal(JSON.stringify(frame).includes('dayLengthTicks'),false);
  assert.equal(JSON.stringify(frame).includes('seasonLengthTicks'),false);
  assert.equal(JSON.stringify(frame).includes('"seed"'),false);
  assert.equal(ant.stateChecksum(runtime.state),before);
});

test('broadcast shell is world-first with layered canvases, compact hud, observer disclosure and clean-feed support',()=>{
  const html=read('public/ai-ant-colony/index.html');
  const css=read('public/ai-ant-colony/styles.css');
  assert.match(html,/id="ecosystem-stage"/);
  assert.match(html,/id="terrain-canvas"/);
  assert.match(html,/id="entity-canvas"/);
  assert.match(html,/id="effects-canvas"/);
  assert.match(html,/id="compact-hud"/);
  assert.match(html,/id="observer-panel"/);
  assert.match(html,/id="toggle-observer"/);
  assert.match(html,/data-testid="ant-canvas"/);
  assert.match(css,/#ecosystem-stage[^}]*position:\s*absolute|#ecosystem-stage[^}]*position:\s*fixed/s);
  assert.match(css,/body\[data-clean-feed="true"\]/);
  assert.doesNotMatch(html,/id="primary-hud"/);
  assert.doesNotMatch(html,/id="narrative"/);
});

test('renderer contains biological ants, explicit lod, organic world depth and bounded excavation transitions',()=>{
  const world=read('public/ai-ant-colony/world-renderer.js');
  const entities=read('public/ai-ant-colony/entity-renderer.js');
  const app=read('public/ai-ant-colony/app.js');
  assert.match(entities,/getContext\(['"]webgl2['"]/);
  assert.match(entities,/LOD_NEAR/);
  assert.match(entities,/LOD_MID/);
  assert.match(entities,/antenna/i);
  assert.match(entities,/mandible/i);
  assert.match(entities,/drawNearAnt|renderNearAnt/);
  assert.match(entities,/drawQueen|renderQueen/);
  assert.match(entities,/egg|larva|pupa/);
  assert.match(world,/drawSurfaceForeground|renderSurfaceForeground/);
  assert.match(world,/drawSoilStrata|renderSoilStrata/);
  assert.match(world,/root/i);
  assert.match(world,/chamber/i);
  assert.match(world,/pheromone/i);
  assert.match(app,/excavationTransitions/);
  assert.match(app,/MAX_EXCAVATION_TRANSITIONS/);
  assert.match(app,/MAX_PARTICLES/);
  assert.doesNotMatch(`${world}\n${entities}\n${app}`,/Math\.random/);
});

test('ecosystem director and soundscape are bounded and environment-aware',()=>{
  const director=read('public/ai-ant-colony/director.js');
  const sound=read('public/ai-ant-colony/soundscape.js');
  const app=read('public/ai-ant-colony/app.js');
  assert.match(director,/queen-danger/);
  assert.match(director,/predator|combat/);
  assert.match(director,/excavation/);
  assert.match(director,/milestone/);
  assert.match(director,/MIN_SHOT_DWELL_MS/);
  assert.match(director,/SHOT_COOLDOWN_MS/);
  assert.match(app,/dayProgress/);
  assert.match(app,/seasonProgress/);
  assert.match(sound,/MAX_AUDIO_VOICES/);
  assert.match(sound,/ambience/i);
  assert.match(sound,/rain/i);
  assert.match(sound,/dig/i);
  assert.doesNotMatch(`${director}\n${sound}`,/Math\.random/);
});

test('stream host serves the rebuilt ecosystem modules and keeps source budgets explicit',()=>{
  const host=read('scripts/serve-ant-colony-stream.cjs');
  for(const asset of['world-renderer.js','entity-renderer.js','director.js','soundscape.js'])assert.match(host,new RegExp(asset.replace('.','\\.')));
  assert.match(host,/MAX_PARTICLES=|MAX_PARTICLES/);
  assert.match(host,/webgl2/);
  assert.match(host,/dayProgress/);
});
