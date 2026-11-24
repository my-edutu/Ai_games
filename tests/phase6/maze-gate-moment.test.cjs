'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('visual gate time gives an overloaded renderer multiple truthful opening poses', async () => {
  const {advanceGateVisualClock:advance,MAX_GATE_VISUAL_FRAME_SECONDS:max} =
    await import('../../public/ai-maze-escape/gate-moment.mjs');
  assert.equal(max, .035);
  assert.equal(advance(2,.016),2.016,'normal frames keep real-time animation');
  assert.ok(Math.abs(advance(2,5)-2.035)<1e-12,'one 5-second software-frame stall cannot skip gate motion');
  assert.ok(Math.abs(advance(2,.2)-2.035)<1e-12);
  assert.equal(advance(2,-1),2);
  assert.equal(advance(2,Infinity),2);
  assert.equal(advance(NaN,.016),0);
  assert.equal(advance(-1,.016),0);
  let visualTime=0;
  for(let i=0;i<10;i++) visualTime=advance(visualTime,3);
  assert.ok(visualTime>.30&&visualTime<.40,'ten genuinely delivered WebGL frames preserve an observable middle phase');
  for(let i=0;i<20;i++) visualTime=advance(visualTime,3);
  assert.ok(visualTime>.85,'the sequence completes after sufficient rendered frames instead of freezing forever');
  assert.equal(advance(visualTime,0),visualTime,'without frames the model does not advance');
});

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
  // Our source-hashed real 1280px Pass66 screenshot was captured at 0.595s:
  // the previous cubic ease-out left ~2.7% bars, visually an empty arch.
  // Preserve a physically legible intermediate grille under the same
  // genuine game event and unchanged 0.85s completion/accessibility rules.
  const realScreenshotAge = gateRetractionPose(.595);
  assert.ok(realScreenshotAge.scaleY > .48,
    'a real mid-lift capture must retain substantial moving metal');
  assert.ok(realScreenshotAge.raise < .81,
    'the counterweighted gate is actually in transit, not almost settled');
  assert.ok(gateRetractionPose(.3).scaleY > realScreenshotAge.scaleY,
    'the rising grille must move monotonically without a fake second event');
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
  const twoStep = {...newer,currentCell:43,cells:[
    {cell:43,blocked:false,neighbors:[60]},
    {cell:60,blocked:false,neighbors:[43,77]},
    {cell:77,blocked:false,neighbors:[60,94]},
    {cell:94,blocked:false,neighbors:[77]}
  ]};
  assert.deepEqual(publicGateOpeningCameraCue({...old,currentCell:43},twoStep),
    {...cue,steps:2},'a physically connected PUBLIC two-step approach retains the real portcullis performance');
  assert.equal(publicGateOpeningCameraCue(old,{...twoStep,cells:twoStep.cells.map(cell=>
    cell.cell===60?{...cell,neighbors:[43]}:cell)}),null,
    'one-way or broken public passages cannot trigger a gate cut');
  assert.equal(publicGateOpeningCameraCue(old,{...twoStep,currentCell:26,cells:[
    {cell:26,blocked:false,neighbors:[43]},...twoStep.cells
  ]}),null,'a remote three-link gate never steals the gameplay camera');
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
