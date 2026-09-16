'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase7State(seed = 'phase7-accessibility') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function options(accessibility, quality = 'high') {
  return {
    viewport: { width: 390, height: 844, devicePixelRatio: 2, safeArea: { top: 28, right: 16, bottom: 28, left: 16 } },
    quality,
    accessibility,
    presentationHz: 60,
  };
}

function warnedSnapshot(seed = 'phase7-danger') {
  const state = phase7State(seed);
  const encounter = state.hazards?.encounters?.[0];
  assert.ok(encounter, 'Phase 6 state should provide at least one generated hazard encounter');
  encounter.phase = 'warned';
  encounter.warningTick = state.tick;
  const event = {
    schemaVersion: state.schemaVersion,
    sequence: 1,
    tick: state.tick,
    type: 'hazard.warned',
    data: { hazardId: encounter.id, family: encounter.family },
  };
  return eko.createRenderSnapshot(state, [event]);
}

test('immediate danger stays visible on mobile and carries an authoritative legal response', () => {
  const snapshot = warnedSnapshot('phase7-mobile-danger');
  const model = eko.createBroadcastPresentation(snapshot, options({ muted: false, reducedMotion: false, reducedFlash: false }));
  assert.equal(model.layout.mode, 'portrait');
  assert.equal(model.hud.danger.visible, true);
  assert.ok(model.hud.danger.legalResponses.length >= 1);
  assert.ok(model.hud.danger.captionKey);
});

test('muted mode removes audio voices while preserving critical or important visual/caption meaning', () => {
  const snapshot = warnedSnapshot('phase7-muted');
  const model = eko.createBroadcastPresentation(snapshot, options({ muted: true, reducedMotion: false, reducedFlash: false }));
  assert.equal(model.audio.voices.length, 0);
  assert.ok(model.feedback.some(cue => cue.priority === 'critical' || cue.priority === 'important'));
  assert.ok(model.captions.some(caption => caption.priority === 'critical' || caption.priority === 'important'));
});

test('reduced motion and reduced flash preserve semantic cue identities with stricter effect bounds', () => {
  const snapshot = warnedSnapshot('phase7-reduced');
  const normal = eko.createBroadcastPresentation(snapshot, options({ muted: false, reducedMotion: false, reducedFlash: false }));
  const reduced = eko.createBroadcastPresentation(snapshot, options({ muted: false, reducedMotion: true, reducedFlash: true }));
  const normalCritical = normal.feedback.filter(cue => cue.priority === 'critical' || cue.priority === 'important').map(cue => cue.semanticKey);
  const reducedCritical = reduced.feedback.filter(cue => cue.priority === 'critical' || cue.priority === 'important').map(cue => cue.semanticKey);
  assert.deepEqual(reducedCritical, normalCritical);
  assert.ok(reduced.vfx.maxCameraImpulse <= normal.vfx.maxCameraImpulse);
  assert.ok(reduced.vfx.maxFlashIntensity <= normal.vfx.maxFlashIntensity);
});

test('low quality keeps primary progress and danger while dropping or reducing ambient density', () => {
  const snapshot = warnedSnapshot('phase7-low');
  const high = eko.createBroadcastPresentation(snapshot, options({ muted: false, reducedMotion: false, reducedFlash: false }, 'high'));
  const low = eko.createBroadcastPresentation(snapshot, options({ muted: false, reducedMotion: false, reducedFlash: false }, 'low'));
  assert.equal(low.hud.primary.progress, high.hud.primary.progress);
  assert.equal(low.hud.danger.visible, true);
  assert.ok(low.feedback.filter(c => c.priority === 'ambient').length <= high.feedback.filter(c => c.priority === 'ambient').length);
});
