'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase6(seed = 'phase6-review-3') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

test('state invariants reject outcome-relevant generated content mutated behind a stale fingerprint', () => {
  const state = phase6('phase6-review-stale-fingerprint');
  state.progression.activeContent.hazards[0].baseX += 0.5;
  assert.throws(
    () => eko.assertStateInvariants(state),
    error => error && error.code === 'GENERATED_CONTENT_FINGERPRINT_MISMATCH',
  );
});

test('state invariants independently revalidate generated constraints even if a new fingerprint is supplied', () => {
  const state = phase6('phase6-review-invalid-rehashed');
  const token = state.progression.activeContent.tokens[0];
  token.x = state.route.finishX + 5;
  assert.equal(typeof eko.fingerprintGeneratedDistrict, 'function');
  state.progression.activeContent.fingerprint = eko.fingerprintGeneratedDistrict(state.progression.activeContent);
  state.progression.activeContent.validation = { valid: true, repairCount: 0, fallbackUsed: false, codes: [] };
  assert.throws(
    () => eko.assertStateInvariants(state),
    error => error && error.code === 'INVALID_GENERATED_CONTENT',
  );
});

test('snapshot creation fails closed when active generated content was mutated after generation', () => {
  const state = phase6('phase6-review-snapshot-integrity');
  state.progression.activeContent.decisions[0].risk = 'bold';
  assert.throws(
    () => eko.createSnapshot(state),
    error => error && (error.code === 'GENERATED_CONTENT_FINGERPRINT_MISMATCH' || error.code === 'INVALID_GENERATED_CONTENT'),
  );
});

test('freshly generated content fingerprint is stable and validator-clean across a seed campaign', () => {
  for (let district = 0; district < eko.PHASE6_DISTRICT_IDS.length; district += 1) {
    for (let cycle = 0; cycle < 12; cycle += 1) {
      const content = eko.generateDistrict(`phase6-review-integrity-${district}-${cycle}`, district, cycle);
      assert.equal(content.fingerprint, eko.fingerprintGeneratedDistrict(content));
      assert.equal(eko.validateGeneratedDistrict(content).valid, true);
    }
  }
});
