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
    const fronds=guardian.group.getObjectByName('unfurled sea-glass wing fronds 1');
    const sail=guardian.group.getObjectByName('articulated tidal sail 1');
    const tailVane=guardian.group.getObjectByName('articulated guardian tail vane 1');
    const jaw=guardian.group.getObjectByName('hinged guardian lower mandible');
    const body=guardian.group.getObjectByName('armored body');
    const leg=guardian.group.getObjectByName('hip 0'); // inspect separately if a model revision renames it
    assert.ok(wing&&jaw&&body&&fronds&&tailVane&&sail);
    assert.equal(sail.parent,fronds,
      'the authentic articulated sail must remain joined to its elytron');
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
      moving:false,time:1,delta:.016,reducedMotion};
    guardian.update({...cue,encounterBeat:0});
    const firstAngle=Math.abs(wing.rotation.z), firstHeight=body.position.y;
    const firstJaw=jaw.rotation.x;
    const firstSail=fronds.scale.y, firstTail=Math.abs(tailVane.rotation.z);
    const firstFold=sail.rotation.x;
    guardian.update({...cue,encounterBeat:.5});
    const middleHeight=body.position.y, middleTail=Math.abs(tailVane.rotation.z);
    const middleFold=sail.rotation.x;
    guardian.update({...cue,encounterBeat:1});
    const lastAngle=Math.abs(wing.rotation.z), lastJaw=jaw.rotation.x;
    const lastSail=fronds.scale.y, lastTail=Math.abs(tailVane.rotation.z);
    const lastFold=sail.rotation.x;
    assert.ok(firstAngle>.20,'visible attention keeps original armoured shape');
    assert.ok(firstFold<-.85 && middleFold<-.85,
      'true recognition and grounded brace must fold the connected tall sails back');
    assert.equal(lastFold,0,
      'source-authentic final shell release restores the entire original full-height sail');
    assert.ok(lastFold-firstFold>.85,
      'a 390px true release must have a major physical sail-hinge change');
    assert.ok(firstSail<.60 && lastSail>1.20 && lastSail>firstSail+.6,
      'connected physical sails must UNFURL visibly across true public encounter phases');
    assert.ok(middleTail>firstTail+.18 && lastTail>firstTail+.25,
      'real rooted tail fans must first brace outward during the witnessed encounter');
    assert.ok(firstAngle<lastAngle*.35,
      'genuine recognition keeps most of the connected armor closed before the release');
    assert.ok(lastAngle>firstAngle+.55,
      'the source-authentic final phase must change the actual shell silhouette substantially');
    assert.ok(lastJaw>firstJaw+.16,
      'the physical mandible must participate in the true late defensive display');
    assert.ok(middleHeight<firstHeight-.012,'physical armored body plants feet before shell reveal');
    assert.ok(lastJaw>.3,'connected jaw participates in the observed performance');
    const same=[wing.rotation.z,body.position.y,jaw.rotation.x];
    guardian.update({...cue,encounterBeat:1});
    assert.deepEqual([wing.rotation.z,body.position.y,jaw.rotation.x],same,
      'same public snapshot and source clock must retain the same pose');
    guardian.update({...cue,attentionStrength:0,attentionHeading:undefined,encounterBeat:0});
    assert.equal(wing.rotation.z,0,'lost public witness closes real shell');
    assert.equal(jaw.rotation.x,0,'lost public witness retracts jaw');
    assert.equal(fronds.scale.y,1,'no visible public threat restores neutral sail proportions');
    assert.equal(sail.rotation.x,0,'retreat cannot leave an old sail folded');
    assert.equal(fronds.rotation.z,0,'disclosed shell bloom cannot persist after visibility clears');
    assert.equal(tailVane.rotation.z,0,'no stale fan after losing public testimony');
    guardian.update({...cue,result:'capture',encounterBeat:1});
    assert.equal(wing.rotation.z,0,'terminal result overrides remembered presentation');
    assert.equal(fronds.scale.y,1,'terminal state cancels staged botanical warning');
    assert.equal(sail.rotation.x,0,'terminal state restores real sail hinge neutrality');
    assert.equal(tailVane.rotation.z,0,'terminal state cancels staged leg and tail signals');
    guardian.dispose();
    assert.equal(guardian.group.children.length,0);
  }
});

test('real scene wires the beat solely to public wardens and a grounded 3D contact', () => {
  assert.match(sceneSource,/publicGuardianEncounterBeat\(gateVisualTime-entry\.encounterStart,settings\.reducedMotion\)/);
  assert.match(sceneSource,/entry\.contact\.scale\.set\(1\.22\+brace\*\.16,\.96\+brace\*\.08,1\)/);
  assert.match(sceneSource,/entry\.encounterStart = null/,'context recovery must discard stale presentation');
  assert.match(sceneSource,/entry\.encounterStart === null/,'source truth must gate the visual clock');
  assert.match(sceneSource,/!result && attentionStrength > \.35\s+&& publicLanternWarning\(s, entry\.cell\)/,
    'no stage can start merely from proximity: current public visibility, running lifecycle and disclosed threat must agree');
  assert.match(sceneSource,/encounterBeat:entry\.encounterBeat/,'actual actor consumes its witness timeline');
  assert.match(sceneSource,/witnessedGuardianBeat/,'original WebGL captures can report live physical cue');
  assert.match(sceneSource,/guardianEncounterBeat:closestThreat\?\.encounterBeat/,
    'Pip must consume the identical source-authenticated guardian clock');
  assert.match(sceneSource,/closestThreat\.encounterBeat=entry\.encounterBeat/,
    'guardian must publish its current witnessed beat, not previous frame or solver knowledge');
  assert.match(sceneSource,/witnessedExplorerGuardianPhysicalPose/,
    'native review must expose Pip actual connected rig pose rather than a HUD assertion');
  assert.doesNotMatch(sceneSource,/privateMaze.*encounterBeat|secret.*encounterBeat/i);
});


test('Pip physically answers the same public guardian beat, then fully withdraws', async () => {
  const { createExplorer } = await charactersPromise;
  for (const balanced of [false,true]) for (const reducedMotion of [false,true]) {
    const pip=createExplorer({balanced});
    const torso=pip.group.getObjectByName('breathing torso');
    const head=pip.group.getObjectByName('curious head');
    const lanternShoulder=pip.group.getObjectByName('shoulder 1');
    assert.ok(torso && head && lanternShoulder,'the original connected explorer must own each action');
    const cue={heading:0,attentionHeading:.4,attentionStrength:.8,moving:false,
      danger:.8,time:2,delta:0,reducedMotion};
    const pose=() => [torso.position.y,head.rotation.x,lanternShoulder.rotation.x];
    pip.update({...cue,guardianEncounterBeat:0});
    const recognized=pose();
    pip.update({...cue,guardianEncounterBeat:.5});
    const braced=pose();
    assert.ok(braced[0]<recognized[0]-.07,
      'Pip visibly plants its original torso before the warden opens its shell');
    assert.ok(braced[1]>recognized[1]+.07,
      'actual connected helmet looks down during the grounded brace');
    pip.update({...cue,guardianEncounterBeat:1});
    const answered=pose();
    assert.ok(answered[2]<braced[2]-.3,
      'Pip brings the original lantern arm forward after the public shell reveal');
    assert.ok(answered[0]>braced[0]+.025,
      'Pip comes up from the crouch for the authored lantern answer');
    pip.update({...cue,guardianEncounterBeat:1});
    assert.deepEqual(pose(),answered,'same witnessed frame and clock replay exactly');
    pip.update({...cue,attentionHeading:undefined,attentionStrength:0,guardianEncounterBeat:1});
    const withdrawn=pose();
    pip.update({...cue,attentionHeading:undefined,attentionStrength:0});
    assert.deepEqual(pose(),withdrawn,
      'losing public threat visibility removes all special beat transforms immediately');
    pip.update({...cue,result:'capture',guardianEncounterBeat:1});
    const ended=pose();
    pip.update({...cue,result:'capture'});
    assert.deepEqual(pose(),ended,'terminal gameplay suppresses stale public visual cue');
    pip.dispose();
    assert.equal(pip.group.children.length,0,'all original physical resources dispose');
  }
});

test('real guardian physically lowers its attached mask and torso before rising into the witnessed shell reveal', async () => {
  const {createWarden}=await charactersPromise;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const guardian=createWarden({balanced});
    const body=guardian.group.getObjectByName('armored body');
    const mask=guardian.group.getObjectByName('warden mask');
    const frontHip=guardian.group.getObjectByName('leg 1 0');
    const frontKnee=frontHip?.getObjectByName('claw knee');
    assert.ok(body&&mask&&frontHip&&frontKnee,
      'the public defensive performance uses the original fully connected articulated guardian');
    assert.equal(mask.parent,body,'mask recoil is attached to the moving armored body');
    const resources=new Set();
    guardian.group.traverse(node=>{if(node.geometry)resources.add(node.geometry);if(node.material)resources.add(node.material)});
    const pose=()=>({
      height:body.position.y,bodyPitch:body.rotation.x,maskDepth:mask.position.z,
      maskPitch:mask.rotation.x,hipPitch:frontHip.rotation.x,kneePitch:frontKnee.rotation.x
    });
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
      moving:false,time:1,delta:0,reducedMotion};
    guardian.update({...cue,encounterBeat:0});const notice=pose();
    guardian.update({...cue,encounterBeat:.5});const brace=pose();
    guardian.update({...cue,encounterBeat:1});const release=pose();
    assert.ok(brace.height<notice.height-.12,
      'whole original carapace plants low during a true published guardian warning');
    assert.ok(brace.bodyPitch<notice.bodyPitch-.20,
      'the actual connected armor leans into the foreclaw brace, not a fabricated attack');
    assert.ok(brace.maskDepth>notice.maskDepth+.11 && brace.maskPitch<notice.maskPitch-.18,
      'the bronze mask thrusts forward and down as part of the genuine contact preparation');
    assert.ok(brace.hipPitch<notice.hipPitch-.50
      && brace.kneePitch>notice.kneePitch+.38,
      'both original knee and hip visibly bear the planted carapace');
    assert.ok(release.height>brace.height+.16
      && release.bodyPitch>brace.bodyPitch+.25,
      'witnessed shell release visibly rises back out of the guarded crouch');
    assert.ok(release.maskDepth<brace.maskDepth-.12
      && release.maskPitch>brace.maskPitch+.22,
      'the full bronze face withdraws and lifts as the existing shell opens');
    guardian.update({...cue,encounterBeat:1});
    assert.deepEqual(pose(),release,'identical public event age reproduces the connected pose');
    guardian.update({...cue,attentionHeading:undefined,attentionStrength:0,encounterBeat:1});
    const neutral=pose();
    guardian.update({...cue,attentionHeading:undefined,attentionStrength:0});
    assert.deepEqual(pose(),neutral,'hidden guardian clears every special beat transform');
    guardian.update({...cue,result:'capture',encounterBeat:1});
    const terminal=pose();
    guardian.update({...cue,result:'capture'});
    assert.deepEqual(pose(),terminal,'terminal truth outranks old guardian warnings');
    const after=new Set();
    guardian.group.traverse(node=>{if(node.geometry)after.add(node.geometry);if(node.material)after.add(node.material)});
    assert.deepEqual(after,resources,'no GPU geometry or material is allocated by a beat');
    guardian.dispose();
    assert.equal(guardian.group.children.length,0);
  }
});
