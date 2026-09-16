'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase7State(seed = 'phase7-hud') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function normalOptions(overrides = {}) {
  return {
    viewport: { width: 1366, height: 768, devicePixelRatio: 1, safeArea: { top: 24, right: 32, bottom: 24, left: 32 } },
    quality: 'high',
    accessibility: { muted: false, reducedMotion: false, reducedFlash: false },
    presentationHz: 60,
    ...overrides,
  };
}

test('Phase 7 exports the broadcast composition surface and exact nine-bus audio taxonomy', () => {
  assert.equal(typeof eko.createBroadcastPresentation, 'function');
  assert.equal(typeof eko.renderBroadcastOverlayHtml, 'function');
  assert.deepEqual(eko.PHASE7_AUDIO_BUSES, [
    'master', 'music', 'ambience', 'movement-foley', 'danger-vehicle',
    'gameplay-impacts', 'ui', 'audience-acknowledgement', 'system-emergency',
  ]);
});

test('public render snapshot exposes sanitized record comparison facts without private authority internals', () => {
  const state = phase7State('phase7-record');
  state.record.maxProgress = 42.5;
  const snapshot = eko.createRenderSnapshot(state);
  assert.equal(snapshot.record.maxProgress, 42.5);
  const text = JSON.stringify(snapshot);
  assert.equal(text.includes('rootSeed'), false);
  assert.equal(text.includes('randomStreams'), false);
  assert.equal(text.includes('commandWatermarks'), false);
});

test('broadcast HUD promotes progress, district/cycle, record and Eko Tokens while future systems remain honest', () => {
  const state = phase7State('phase7-primary');
  state.record.maxProgress = 28;
  state.resources.ekoTokens = 3;
  state.resources.earnedTokenTotal = 3;
  const snapshot = eko.createRenderSnapshot(state);
  const model = eko.createBroadcastPresentation(snapshot, normalOptions());

  assert.equal(model.hud.primary.districtId, snapshot.progression.districtId);
  assert.equal(model.hud.primary.cycle, snapshot.progression.cycle);
  assert.equal(model.hud.primary.progress, snapshot.progress);
  assert.equal(model.hud.record.maxProgress, 28);
  assert.equal(model.hud.resources.ekoTokens, 3);
  assert.equal(model.hud.future.aiIntent.status, 'not-enabled');
  assert.equal(model.hud.future.viewerWindow.status, 'not-enabled');
});

test('broadcast composition is deeply immutable and reconstructible from the same public snapshot/options', () => {
  const snapshot = eko.createRenderSnapshot(phase7State('phase7-reconstruct'));
  const options = normalOptions();
  const first = eko.createBroadcastPresentation(snapshot, options);
  const second = eko.createBroadcastPresentation(snapshot, options);
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.hud), true);
  assert.equal(Object.isFrozen(first.feedback), true);
});
