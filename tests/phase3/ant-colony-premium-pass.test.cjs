'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const file=relative=>path.join(root,relative);
const read=relative=>fs.readFileSync(file(relative),'utf8');

test('render metrics have one order-independent shared contract',()=>{
  const contractPath='public/ai-ant-colony/render-contract.js';
  assert.equal(fs.existsSync(file(contractPath)),true,'render-contract.js must own the shared browser metrics schema');
  const contract=read(contractPath);
  const html=read('public/ai-ant-colony/index.html');
  const host=read('scripts/serve-ant-colony-stream.cjs');
  assert.match(contract,/ensureAntRenderMetrics/);
  assert.match(contract,/frameSamples/);
  assert.match(contract,/effectFpsSamples/);
  assert.match(contract,/activeParticles/);
  assert.match(contract,/overlayParticles/);
  assert.match(html,/render-contract\.js[\s\S]*director\.js/);
  assert.match(host,/render-contract\.js/);
});

test('macro nature dressing is anchored to world coordinates instead of the viewport',()=>{
  const organic=read('public/ai-ant-colony/organic-presenter.js');
  assert.match(organic,/worldSurfacePoint/);
  assert.match(organic,/worldX\s*=\s*hash01\(seed\)\s*\*\s*snapshot\.world\.width/);
  assert.match(organic,/drawForegroundRoots[\s\S]*transform\.point/);
  assert.match(organic,/drawSurfaceLife[\s\S]*transform\.point/);
});

test('near ants expose task-specific interaction poses so AI is visible through the body',()=>{
  const entities=read('public/ai-ant-colony/entity-renderer.js');
  assert.match(entities,/interactionPose/);
  assert.match(entities,/drawInteractionDetails/);
  for(const cue of['groom','nurse','dig','carry','fight','forage'])assert.match(entities,new RegExp(cue,'i'));
  assert.match(entities,/antennaSweep/);
});

test('combat presentation uses bounded swarm choreography instead of connection lines',()=>{
  const entities=read('public/ai-ant-colony/entity-renderer.js');
  assert.match(entities,/MAX_COMBAT_CONTACTS/);
  assert.match(entities,/combatSlot/);
  assert.match(entities,/predatorReaction/);
  assert.match(entities,/drawCombatChoreography/);
  assert.doesNotMatch(entities,/function drawCombat\([^)]*\)[\s\S]*lineTo\(b\.x,b\.y\)/);
});

test('surface ecology contains bounded weather-aware ambient organisms',()=>{
  const organic=read('public/ai-ant-colony/organic-presenter.js');
  assert.match(organic,/MAX_AMBIENT_INSECTS\s*=\s*18/);
  assert.match(organic,/MAX_AMBIENT_WORMS\s*=\s*8/);
  assert.match(organic,/drawAmbientEcosystem/);
  assert.match(organic,/rain|storm/);
  assert.match(organic,/ambientInsects/);
  assert.doesNotMatch(organic,/Math\.random/);
});

test('documentary camera keeps bounded shot history and lead-room composition',()=>{
  const director=read('public/ai-ant-colony/director.js');
  assert.match(director,/MAX_SHOT_HISTORY/);
  assert.match(director,/shotHistory/);
  assert.match(director,/leadRoom/);
  assert.match(director,/rememberShot/);
  assert.match(director,/continuityPenalty/);
});

test('soundscape distinguishes surface and underground acoustic spaces',()=>{
  const sound=read('public/ai-ant-colony/soundscape.js');
  assert.match(sound,/spatialMix/);
  assert.match(sound,/createBiquadFilter/);
  assert.match(sound,/underground/i);
  assert.match(sound,/surface/i);
  assert.match(sound,/acousticZone/);
  assert.match(sound,/MAX_AUDIO_VOICES\s*=\s*6/);
});
