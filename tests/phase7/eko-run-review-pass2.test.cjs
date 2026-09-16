'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function model(seed = 'phase7-review2') {
  const state = eko.createPhase6State(eko.createDefaultConfig({ seed }));
  const snapshot = eko.createRenderSnapshot(state);
  const options = {
    viewport: { width: 1280, height: 720, devicePixelRatio: 1, safeArea: { top: 24, right: 24, bottom: 24, left: 24 } },
    quality: 'high',
    accessibility: { muted: false, reducedMotion: false, reducedFlash: false },
    presentationHz: 60,
  };
  return { state, snapshot, options };
}

function mutable(value) {
  return JSON.parse(JSON.stringify(value));
}

test('review 2: non-finite public progress fails closed before HUD composition', () => {
  const { snapshot, options } = model('phase7-r2-progress');
  const tampered = mutable(snapshot);
  tampered.progress = Number.NaN;
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_INVALID_PUBLIC_SNAPSHOT/);
});

test('review 2: impossible negative public reward totals fail closed', () => {
  const { snapshot, options } = model('phase7-r2-rewards');
  const tampered = mutable(snapshot);
  tampered.resources.ekoTokens = -1;
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_INVALID_PUBLIC_SNAPSHOT/);
});

test('review 2: warned or hit danger without a legal response is rejected rather than shown as actionable', () => {
  const { snapshot, options } = model('phase7-r2-danger');
  const tampered = mutable(snapshot);
  const hazard = tampered.hazards[0];
  hazard.phase = 'warned';
  hazard.active = true;
  hazard.legalResponses = [];
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_INVALID_PUBLIC_SNAPSHOT/);
});

test('review 2: public composition never exposes private authority seed/random/command fields after serialization', () => {
  const { snapshot, options } = model('phase7-r2-privacy');
  const output = JSON.stringify(eko.createBroadcastPresentation(snapshot, options));
  for (const forbidden of ['rootSeed', 'randomStreams', 'commandWatermarks', 'sourceSequence']) {
    assert.equal(output.includes(forbidden), false, `${forbidden} leaked into public presentation`);
  }
});
