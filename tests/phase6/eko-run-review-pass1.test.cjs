'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function phase6(seed = 'phase6-review-1') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

test('generated content carries explicit district/cycle/generator provenance', () => {
  const state = phase6('phase6-review-provenance');
  const content = state.progression.activeContent;
  assert.equal(content.generatorVersion, eko.PHASE6_GENERATOR_VERSION);
  assert.equal(content.districtIndex, state.progression.districtIndex);
  assert.equal(content.cycle, state.progression.cycle);
});

test('state invariants reject district index/id/content disagreement', () => {
  const state = phase6('phase6-review-index-mismatch');
  state.progression.districtIndex = 5;
  assert.throws(
    () => eko.assertStateInvariants(state),
    error => error && error.code === 'PROGRESSION_ROUTE_MISMATCH',
  );
});

test('state invariants reject cycle/content provenance disagreement', () => {
  const state = phase6('phase6-review-cycle-mismatch');
  state.progression.cycle += 1;
  assert.throws(
    () => eko.assertStateInvariants(state),
    error => error && error.code === 'PROGRESSION_ROUTE_MISMATCH',
  );
});

test('token identities remain distinct when a district repeats in a later endless cycle', () => {
  const first = eko.generateDistrict('phase6-review-token-cycle', 0, 0);
  const later = eko.generateDistrict('phase6-review-token-cycle', 0, 1);
  const firstIds = new Set(first.tokens.map(token => token.id));
  assert.equal(later.tokens.some(token => firstIds.has(token.id)), false);
});
