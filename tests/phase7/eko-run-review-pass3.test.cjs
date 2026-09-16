'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function fixture(seed = 'phase7-review3') {
  const state = eko.createPhase6State(eko.createDefaultConfig({ seed }));
  const snapshot = eko.createRenderSnapshot(state);
  const options = {
    viewport: { width: 1366, height: 768, devicePixelRatio: 1, safeArea: { top: 24, right: 32, bottom: 24, left: 32 } },
    quality: 'high',
    accessibility: { muted: false, reducedMotion: false, reducedFlash: false },
    presentationHz: 60,
  };
  return { state, snapshot, options };
}

function mutable(value) {
  return JSON.parse(JSON.stringify(value));
}

test('review 3: oversized recent-event input fails closed before sort/allocation work can grow without bound', () => {
  const { snapshot, options } = fixture('phase7-r3-events');
  const tampered = mutable(snapshot);
  tampered.recentEvents = Array.from({ length: 257 }, (_, index) => ({
    schemaVersion: 1,
    sequence: index + 1,
    tick: tampered.tick,
    type: 'player.landed',
    data: {},
  }));
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_PUBLIC_SNAPSHOT_BUDGET_EXCEEDED/);
});

test('review 3: oversized hazard input fails closed before public presentation work can grow without bound', () => {
  const { snapshot, options } = fixture('phase7-r3-hazards');
  const tampered = mutable(snapshot);
  const template = tampered.hazards[0] ?? {
    id: 'template', family: 'pothole', x: 10, y: 0, width: 1, height: 0.4,
    active: false, phase: 'unseen', legalResponses: ['jump'], captionKey: 'hazard.pothole', visualToken: 'pothole',
  };
  tampered.hazards = Array.from({ length: 129 }, (_, index) => ({ ...template, id: `hazard-${index}`, x: 10 + index }));
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_PUBLIC_SNAPSHOT_BUDGET_EXCEEDED/);
});

test('review 3: malformed semantic events fail closed instead of creating ambiguous public cue identities', () => {
  const { snapshot, options } = fixture('phase7-r3-event-shape');
  const tampered = mutable(snapshot);
  tampered.recentEvents = [{ schemaVersion: 1, sequence: -1, tick: -1, type: 'hazard.warned', data: {} }];
  assert.throws(() => eko.createBroadcastPresentation(tampered, options), /PHASE7_INVALID_PUBLIC_SNAPSHOT/);
});

test('review 3: 30/60/120 presentation sampling preserves semantic HUD, feedback, captions, audio and VFX', () => {
  const { snapshot, options } = fixture('phase7-r3-sampling');
  const outputs = [30, 60, 120].map(presentationHz => eko.createBroadcastPresentation(snapshot, { ...options, presentationHz }));
  for (const output of outputs.slice(1)) {
    assert.deepEqual(output.hud, outputs[0].hud);
    assert.deepEqual(output.feedback, outputs[0].feedback);
    assert.deepEqual(output.captions, outputs[0].captions);
    assert.deepEqual(output.audio, outputs[0].audio);
    assert.deepEqual(output.vfx, outputs[0].vfx);
  }
});

test('review 3: repeated reconstruction is stateless, deeply immutable and leaves the public snapshot unchanged', () => {
  const { snapshot, options } = fixture('phase7-r3-repeat');
  const before = JSON.stringify(snapshot);
  const first = eko.createBroadcastPresentation(snapshot, options);
  const expected = JSON.stringify(first);
  for (let index = 0; index < 250; index += 1) {
    const next = eko.createBroadcastPresentation(snapshot, options);
    assert.equal(JSON.stringify(next), expected);
    assert.equal(Object.isFrozen(next), true);
    assert.equal(Object.isFrozen(next.hud), true);
    assert.equal(Object.isFrozen(next.feedback), true);
  }
  assert.equal(JSON.stringify(snapshot), before);
});
