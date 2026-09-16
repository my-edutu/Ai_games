'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function state(seed = 'phase7-review1') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function opts(viewport = { width: 390, height: 844, devicePixelRatio: 2, safeArea: { top: 28, right: 16, bottom: 28, left: 16 } }, quality = 'high') {
  return { viewport, quality, accessibility: { muted: false, reducedMotion: false, reducedFlash: false }, presentationHz: 60 };
}

function event(source, sequence, tick, type, data = {}) {
  return { schemaVersion: source.schemaVersion, sequence, tick, type, data };
}

test('review 1: terminal integrity truth survives a newer hazard-warning event storm', () => {
  const s = state('phase7-r1-integrity');
  const events = [event(s, 1, s.tick - 5, 'integrity.failure', { code: 'TEST_INTEGRITY' })];
  for (let i = 0; i < 40; i += 1) events.push(event(s, 2 + i, s.tick, 'hazard.warned', { hazardId: `storm-${i}` }));
  const model = eko.createBroadcastPresentation(eko.createRenderSnapshot(s, events), opts());
  assert.ok(model.feedback.some(cue => cue.semanticKey === 'integrity.failure'), 'integrity failure must never be evicted by tactical danger storm');
  assert.ok(model.feedback.length <= eko.PHASE7_MAX_FEEDBACK_CUES);
});

test('review 1: one warned hazard does not consume two danger audio slots through event plus immediate-HUD duplication', () => {
  const s = state('phase7-r1-dedupe');
  const encounter = s.hazards.encounters[0];
  encounter.phase = 'warned';
  encounter.warningTick = s.tick;
  const snapshot = eko.createRenderSnapshot(s, [event(s, 1, s.tick, 'hazard.warned', { hazardId: encounter.id, family: encounter.family })]);
  const model = eko.createBroadcastPresentation(snapshot, opts());
  assert.equal(model.audio.voices.filter(voice => voice.bus === 'danger-vehicle').length, 1);
});

test('review 1: safe-area validation rejects a technically positive but unusably tiny gameplay/HUD frame', () => {
  const s = state('phase7-r1-safe-frame');
  const snapshot = eko.createRenderSnapshot(s);
  const viewport = { width: 390, height: 844, devicePixelRatio: 2, safeArea: { top: 380, right: 180, bottom: 380, left: 180 } };
  assert.throws(() => eko.createBroadcastPresentation(snapshot, opts(viewport)), /PHASE7_INVALID_SAFE_AREA/);
});

test('review 1: portrait low tier keeps progress and immediate danger while limiting persistent secondary density', () => {
  const s = state('phase7-r1-low');
  const encounter = s.hazards.encounters[0];
  encounter.phase = 'warned';
  encounter.warningTick = s.tick;
  const model = eko.createBroadcastPresentation(eko.createRenderSnapshot(s), opts(undefined, 'low'));
  assert.equal(model.layout.mode, 'portrait');
  assert.equal(model.hud.danger.visible, true);
  assert.equal(typeof model.hud.primary.progress, 'number');
  assert.ok(model.layout.maxPersistentSecondaryCards <= 2);
  assert.equal(model.feedback.filter(cue => cue.priority === 'ambient').length, 0);
});
