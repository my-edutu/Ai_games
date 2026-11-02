'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('only a real public same-run closed-to-open door creates a gate moment', async () => {
  const { observedGateOpenings } = await import('../../public/ai-maze-escape/gate-moment.mjs');
  const before = { runToken: 'public-run', tick: 12, doors: [
    { a: 7, b: 8, open: false },
    { a: 3, b: 4, open: true },
  ] };
  const after = { runToken: 'public-run', tick: 13, doors: [
    { a: 8, b: 7, open: true },
    { a: 3, b: 4, open: true },
    { a: 9, b: 10, open: true }, // first observed already open: no invented moment
  ] };
  assert.deepEqual(observedGateOpenings(before, after), [{ a: 8, b: 7 }]);
  assert.deepEqual(observedGateOpenings(null, after), []);
  assert.deepEqual(observedGateOpenings(before, {...after, runToken: 'new-run'}), []);
  assert.deepEqual(observedGateOpenings(before, {...after, tick: 11}), []);
  assert.deepEqual(observedGateOpenings(before, {...after, tick: 12}), [],
    'two contradictory snapshots at the same engine tick cannot trigger cosmetic opening action');
  assert.deepEqual(observedGateOpenings(before, {...after, result: {reason:'escape'}}), []);
  assert.deepEqual(observedGateOpenings(before, {...after, doors: [{a:7,b:8,open:false}]}), []);
  assert.deepEqual(observedGateOpenings(before, {...after, doors: [{a:7,b:8,open:true}, {a:-1,b:5,open:true}]}), [{a:7,b:8}]);
});

test('render-only portcullis retracts upwards, completes and respects reduced motion', async () => {
  const { gateRetractionPose, GATE_RETRACTION_SECONDS } = await import('../../public/ai-maze-escape/gate-moment.mjs');
  const begin = gateRetractionPose(0);
  const midway = gateRetractionPose(GATE_RETRACTION_SECONDS / 2);
  const end = gateRetractionPose(GATE_RETRACTION_SECONDS);
  assert.deepEqual(begin, { visible: true, raise: 0, scaleY: 1 });
  assert.equal(midway.visible, true);
  assert.ok(midway.raise > 0 && midway.raise < 1.55);
  assert.ok(midway.scaleY > 0 && midway.scaleY < 1);
  assert.equal(end.visible, false);
  assert.equal(gateRetractionPose(GATE_RETRACTION_SECONDS + 5).visible, false);
  assert.equal(gateRetractionPose(.01, true).visible, false);
  assert.equal(gateRetractionPose(NaN).visible, false);
  assert.deepEqual(gateRetractionPose(.2), gateRetractionPose(.2));
});


test('real-opening camera beat is nearby, same-run, public-only and never invented', async () => {
  const { publicGateOpeningCameraCue } = await import('../../public/ai-maze-escape/map-view.mjs');
  const old = Object.freeze({
    runToken: 'real-public', tick: 7, width: 17, height: 11,
    currentCell: 77, inventory: ['bronze-key'],
    doors: Object.freeze([{a:77,b:94,open:false,requiredKeyId:'bronze-key'}])
  });
  const newer = Object.freeze({
    runToken:'real-public', tick:8, width:17, height:11,
    currentCell:77, cells:Object.freeze([{cell:77,blocked:false},{cell:94,blocked:false}]),
    doors:Object.freeze([{a:94,b:77,open:true,requiredKeyId:'bronze-key'}])
  });
  const cue = publicGateOpeningCameraCue(old,newer);
  assert.deepEqual(cue,{a:94,b:77,steps:0,keyed:true});
  assert.deepEqual(publicGateOpeningCameraCue(old,newer),cue,'camera cue is deterministic');
  assert.equal(publicGateOpeningCameraCue(null,newer),null);
  assert.equal(publicGateOpeningCameraCue(old,{...newer,runToken:'another-run'}),null);
  assert.equal(publicGateOpeningCameraCue(old,{...newer,tick:7}),null);
  assert.equal(publicGateOpeningCameraCue(old,{...newer,result:{reason:'escape'}}),null);
  assert.equal(publicGateOpeningCameraCue({...old,result:{reason:'capture'}},newer),null);
  assert.equal(publicGateOpeningCameraCue({...old,doors:[]},newer),null,
    'first disclosure already-open is never an authored unlock event');
  assert.equal(publicGateOpeningCameraCue(old,{...newer,doors:[{a:94,b:77,open:false}]}),null);
  assert.equal(publicGateOpeningCameraCue(old,{...newer,currentCell:70,cells:[{cell:70,blocked:false}]}),null,
    'no remote or unknown gate camera cut');
  assert.equal(publicGateOpeningCameraCue(old,{...newer,cells:[]}),null);
  assert.equal(publicGateOpeningCameraCue(old,{...newer,doors:[{a:77,b:96,open:true}]}),null,
    'diagonal or non-neighbor edges are not camera cues');
  assert.deepEqual(publicGateOpeningCameraCue({...old,inventory:[]},newer),
    {...cue,keyed:false},'an uncarried key never produces a key closeup');
  assert.equal(cue.privatePath,undefined);
  assert.equal(old.doors[0].open,false,'cosmetic beat does not unlock anything');
  assert.equal(newer.doors[0].open,true,'authoritative already-open state is not modified');
});
