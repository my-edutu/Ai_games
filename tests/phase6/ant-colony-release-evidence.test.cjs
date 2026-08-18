'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function release() {
  return require('../../dist/games/ai-ant-colony/src/release/validation.js');
}

const SHA_A = 'cccccccccccccccccccccccccccccccccccccccc';
const SHA_B = 'dddddddddddddddddddddddddddddddddddddddd';

test('Ant Colony release-manifest evidence artifacts are candidate-bound software contracts', () => {
  const { createAntReleaseManifest } = release();
  const first = createAntReleaseManifest(SHA_A);
  const second = createAntReleaseManifest(SHA_B);
  const firstDigests = first.artifacts.map(artifact => artifact.digest);
  const secondDigests = second.artifacts.map(artifact => artifact.digest);

  assert.notDeepEqual(firstDigests, secondDigests);
  assert.ok(first.artifacts.every(artifact => artifact.kind === 'software-evidence'));
  assert.ok(first.artifacts.some(artifact => artifact.name === 'ant-phase3-broadcast-contract'));
  assert.ok(first.artifacts.some(artifact => artifact.name === 'ant-phase5-operations-contract'));
  assert.ok(first.artifacts.some(artifact => artifact.name === 'ant-phase6-validation-contract'));
  for (const digest of firstDigests) assert.match(digest, /^checksum:[a-f0-9]{8}$/);
});

test('the production drill catalogue is backed by a real Ant Colony operations runbook', () => {
  const { MANDATORY_DRILLS } = release();
  const runbookPath = path.resolve(__dirname, '../../docs/operations/ai-ant-colony-runbook.md');
  assert.equal(fs.existsSync(runbookPath), true, runbookPath);
  const content = fs.readFileSync(runbookPath, 'utf8');
  for (const drillId of MANDATORY_DRILLS) {
    assert.ok(content.includes(`\`${drillId}\``), `missing runbook section for ${drillId}`);
  }
  assert.match(content, /safe scene/i);
  assert.match(content, /verified restore/i);
  assert.match(content, /rollback/i);
  assert.match(content, /independent witness/i);
});

test('Phase 5, Phase 6 and final review documents exist for Game 12', () => {
  const required = [
    '../../games/ai-ant-colony/phases/PHASE-05-RELIABILITY-OPERATIONS.md',
    '../../games/ai-ant-colony/phases/PHASE-06-RELEASE-VALIDATION.md',
    '../../docs/reviews/AI_ANT_COLONY_FINAL_REVIEW.md',
  ];
  for (const relative of required) {
    const file = path.resolve(__dirname, relative);
    assert.equal(fs.existsSync(file), true, file);
    assert.ok(fs.readFileSync(file, 'utf8').length > 500, file);
  }
});
