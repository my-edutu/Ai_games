'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function modules() {
  return {
    ...require('../../dist/games/ai-ant-colony/src/release/validation.js'),
    ...require('../../dist/games/ai-ant-colony/src/release/score.js'),
  };
}

test('current verified Ant Colony software candidate scores 88/100 but is not production ready', () => {
  const { createAntValidationBundle, scoreAntReadiness } = modules();
  const bundle = createAntValidationBundle(SHA);
  const score = scoreAntReadiness(bundle);
  assert.equal(score.score, 88);
  assert.equal(score.grade, 'Production Candidate');
  assert.equal(score.verdict, 'BLOCKED');
  assert.equal(score.highestTruthfulReadiness, 'R4');
  assert.equal(score.productionReady, false);
  assert.equal(score.categories.productionEvidence.score, 0);
  assert.equal(score.categories.productionEvidence.max, 12);
  assert.match(score.scoreChecksum, /^[0-9a-f]{8}$/);
});

test('Ant Colony integrity failure caps readiness below 60 even when engineering gates pass', () => {
  const { createAntValidationBundle, scoreAntReadiness } = modules();
  const bundle = createAntValidationBundle(SHA, { integrity: { invariantFailures: 1 } });
  const score = scoreAntReadiness(bundle);
  assert.equal(score.verdict, 'FAIL');
  assert.ok(score.score <= 59, JSON.stringify(score));
  assert.equal(score.grade, 'Integrity Blocked');
});

test('Ant Colony score cannot exceed 89 while any external R5 gate remains blocked', () => {
  const { createAntValidationBundle, scoreAntReadiness } = modules();
  const score = scoreAntReadiness(createAntValidationBundle(SHA));
  assert.ok(score.score <= 89);
  assert.ok(score.blockers.length > 0);
});
