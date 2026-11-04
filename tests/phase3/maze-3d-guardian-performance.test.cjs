'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const charactersSource = fs.readFileSync(path.join(root, 'public/ai-maze-escape/characters.js'), 'utf8');
const sceneSource = fs.readFileSync(path.join(root, 'public/ai-maze-escape/scene.js'), 'utf8');
const three = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const charactersPromise = import('data:text/javascript;base64,' + Buffer.from(
  charactersSource.replace("'./vendor/three.module.js'", JSON.stringify(three))
).toString('base64'));
const beatPromise = import('../../public/ai-maze-escape/public-lantern-encounter.mjs');

function disclosedEncounter() {
  // 5x5: hero 6 (1,1); warden 17 (2,3), sqrt(5) cells apart.
  // This is the actual previously witnessed nearby-warning *distance class*,
  // not an invented adjacent beam or open route.
  return {
    runToken:'public-guardian-stage', width:5, height:5, lifecycle:'running',
    result:null, currentCell:6, visibleCells:[6,17],
    threats:[{id:'public-beetle',cell:17}], doors:[{a:6,b:7,open:false}],
    cells:[
      {cell:6,blocked:false,neighbors:[7]},
      {cell:17,blocked:false,neighbors:[12]},
    ],
  };
}

test('guardian three-beat visual clock has finite, monotone, deterministic stages', async () => {
  const { publicGuardianEncounterBeat: beat } = await beatPromise;
  for (const invalid of [null, undefined, -1, NaN, Infinity, -Infinity, '0.4']) {
    assert.equal(beat(invalid), 0, 'invalid age may not start a visible threat event');
  }
  const samples=[0,.25,.5,.75,1,1.35,2,100].map(age=>beat(age));
  assert.equal(samples[0],0);
  assert.equal(samples[5],1);
  assert.equal(samples.at(-1),1);
  for (let i=1;i<samples.length;i++) assert.ok(samples[i]>=samples[i-1]);
  assert.deepEqual(samples,[0,.25,.5,.75,1,1.35,2,100].map(age=>beat(age)),
    'same disclosed event and frame time must replay exactly');
  assert.equal(beat(.01,true),1,'reduced motion holds the expressive pose, no transition');
  assert.equal(beat(-.01,true),0,'invalid event cannot bypass reduced-motion guard');
});

test('ordinary public sqrt(5) encounter can stage a bodily response without inventing an open beam', async () => {
  const { publicLanternWarning: warning, publicLanternEncounter: beam } = await beatPromise;
  const publicView=disclosedEncounter();
  assert.equal(warning(publicView,17),true);
  assert.equal(beam(publicView,17),false,'distant guardian does not imply line-of-sight passage');
  const hidden=structuredClone(publicView); hidden.visibleCells=[6];
  assert.equal(warning(hidden,17),false,'unknown guardian never initiates the beat');
  const disguised=structuredClone(publicView);
  disguised.privateMaze={threats:[{cell:7}],safeRoute:[6,7]};
  assert.equal(warning(disguised,17),true,'extra private-only data cannot alter public witness');
  assert.equal(beam(disguised,7),false,'secret source never becomes an open route');
  assert.equal(warning({...publicView,lifecycle:'ended'},17),false);
  assert.equal(warning({...publicView,result:{reason:'capture'}},17),false);
});

test('real Thornback rig stages recognition, grounded brace, shell reveal, and complete withdrawal', async () => {
  const { createWarden } = await charactersPromise;
  for (const balanced of [false,true]) for (const reducedMotion of [false,true]) {
    const guardian=createWarden({balanced});
    const wing=guardian.group.getObjectByName('flared elytron 1');
    const jaw=guardian.group.getObjectByName('hinged guardian lower mandible');
    const body=guardian.group.getObjectByName('armored body');
    const leg=guardian.group.getObjectByName('hip 0'); // inspect separately if a model revision renames it
    assert.ok(wing&&jaw&&body);
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
      moving:false,time:1,delta:.016,reducedMotion};
    guardian.update({...cue,encounterBeat:0});
    const firstAngle=Math.abs(wing.rotation.z), firstHeight=body.position.y;
    guardian.update({...cue,encounterBeat:.5});
    const middleHeight=body.position.y;
    guardian.update({...cue,encounterBeat:1});
    const lastAngle=Math.abs(wing.rotation.z), lastJaw=jaw.rotation.x;
    assert.ok(firstAngle>.20,'visible attention keeps original armoured shape');
    assert.ok(lastAngle>firstAngle+.35,'authentic encounter unfolds real wing, not a HUD icon');
    assert.ok(middleHeight<firstHeight-.012,'physical armored body plants feet before shell reveal');
    assert.ok(lastJaw>.3,'connected jaw participates in the observed performance');
    const same=[wing.rotation.z,body.position.y,jaw.rotation.x];
    guardian.update({...cue,encounterBeat:1});
    assert.deepEqual([wing.rotation.z,body.position.y,jaw.rotation.x],same,
      'same public snapshot and source clock must retain the same pose');
    guardian.update({...cue,attentionStrength:0,attentionHeading:undefined,encounterBeat:0});
    assert.equal(wing.rotation.z,0,'lost public witness closes real shell');
    assert.equal(jaw.rotation.x,0,'lost public witness retracts jaw');
    guardian.update({...cue,result:'capture',encounterBeat:1});
    assert.equal(wing.rotation.z,0,'terminal result overrides remembered presentation');
    guardian.dispose();
    assert.equal(guardian.group.children.length,0);
  }
});

test('real scene wires the beat solely to public wardens and a grounded 3D contact', () => {
  assert.match(sceneSource,/publicGuardianEncounterBeat\(gateVisualTime-entry\.encounterStart,settings\.reducedMotion\)/);
  assert.match(sceneSource,/entry\.contact\.scale\.set\(1\.22\+brace\*\.16,\.96\+brace\*\.08,1\)/);
  assert.match(sceneSource,/entry\.encounterStart = null/,'context recovery must discard stale presentation');
  assert.match(sceneSource,/entry\.encounterStart === null/,'source truth must gate the visual clock');
  assert.match(sceneSource,/encounterBeat:entry\.encounterBeat/,'actual actor consumes its witness timeline');
  assert.match(sceneSource,/witnessedGuardianBeat/,'original WebGL captures can report live physical cue');
  assert.doesNotMatch(sceneSource,/privateMaze.*encounterBeat|secret.*encounterBeat/i);
});
