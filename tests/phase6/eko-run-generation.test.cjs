'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const EXPECTED_DISTRICTS = [
  'mainland-morning',
  'market-rush',
  'danfo-junction',
  'rainy-lagos',
  'island-night',
  'bridge-run',
];

test('Phase 6 exposes a stable six-district ladder', () => {
  assert.deepEqual(eko.PHASE6_DISTRICT_IDS, EXPECTED_DISTRICTS);
});

test('same seed district and cycle generate identical validated content', () => {
  assert.equal(typeof eko.generateDistrict, 'function');
  assert.equal(typeof eko.validateGeneratedDistrict, 'function');
  const a = eko.generateDistrict('phase6-repeat', 2, 4);
  const b = eko.generateDistrict('phase6-repeat', 2, 4);
  assert.deepEqual(a, b);
  const report = eko.validateGeneratedDistrict(a);
  assert.equal(report.valid, true, JSON.stringify(report));
  assert.ok(a.fingerprint && a.fingerprint === b.fingerprint);
});

test('generated district always contains a continuous mandatory backbone and ordered checkpoints', () => {
  assert.equal(typeof eko.generateDistrict, 'function');
  for (let districtIndex = 0; districtIndex < EXPECTED_DISTRICTS.length; districtIndex += 1) {
    for (let i = 0; i < 24; i += 1) {
      const generated = eko.generateDistrict(`phase6-valid-${districtIndex}-${i}`, districtIndex, i % 3);
      assert.equal(generated.validation.valid, true, JSON.stringify(generated.validation));
      const route = generated.route;
      assert.ok(route.groundSegments.some(segment => segment.minX <= route.startX && segment.maxX >= route.finishX), `${generated.districtId} missing backbone`);
      assert.ok(route.checkpointXs.length >= 2);
      assert.deepEqual([...route.checkpointXs].sort((a, b) => a - b), route.checkpointXs);
      assert.ok(route.checkpointXs.every(x => x > route.startX && x < route.finishX));
      assert.ok(generated.hazards.every(h => h.baseX > route.startX && h.baseX < route.finishX));
      assert.ok(generated.tokens.every(token => token.x > route.startX && token.x < route.finishX));
    }
  }
});

test('generator repair and fallback policy is bounded and observable', () => {
  assert.equal(typeof eko.PHASE6_MAX_REPAIR_ATTEMPTS, 'number');
  assert.ok(eko.PHASE6_MAX_REPAIR_ATTEMPTS > 0 && eko.PHASE6_MAX_REPAIR_ATTEMPTS <= 3);
  for (let i = 0; i < 120; i += 1) {
    const generated = eko.generateDistrict(`phase6-bounded-${i}`, i % 6, Math.floor(i / 6));
    assert.ok(generated.validation.repairCount >= 0 && generated.validation.repairCount <= eko.PHASE6_MAX_REPAIR_ATTEMPTS);
    assert.equal(typeof generated.validation.fallbackUsed, 'boolean');
    assert.equal(generated.validation.valid, true);
  }
});

test('seed corpus has real structural diversity and difficulty changes across multiple axes', () => {
  const fingerprints = new Set();
  const profiles = [];
  for (let i = 0; i < 60; i += 1) {
    const generated = eko.generateDistrict(`phase6-diversity-${i}`, i % 6, Math.floor(i / 6));
    fingerprints.add(generated.fingerprint);
    profiles.push(JSON.stringify(generated.difficulty));
  }
  assert.ok(fingerprints.size >= 45, `only ${fingerprints.size} unique fingerprints`);
  assert.ok(new Set(profiles).size >= 12, 'difficulty profiles are not meaningfully multi-axis');
  const bridge = eko.generateDistrict('phase6-difficulty', 5, 2).difficulty;
  assert.ok(Object.keys(bridge).length >= 6);
  const distinctValues = new Set(Object.values(bridge));
  assert.ok(distinctValues.size >= 3, 'difficulty is effectively one-dimensional');
});
