'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function release() {
  return require('../../dist/games/ai-maze-escape/src/release/validation.js');
}

const SHA_A = 'cccccccccccccccccccccccccccccccccccccccc';
const SHA_B = 'dddddddddddddddddddddddddddddddddddddddd';
const STALE_PHASE3_DIGEST = 'sha256:525cebe808ae30164617849ee7db39dfa2053f17712cf08e2a08317255f423b1';

test('Maze release-manifest evidence artifacts are candidate-bound software contracts', () => {
  const { createMazeReleaseManifest } = release();
  const first = createMazeReleaseManifest(SHA_A);
  const second = createMazeReleaseManifest(SHA_B);
  const firstDigests = first.artifacts.map(artifact => artifact.digest);
  const secondDigests = second.artifacts.map(artifact => artifact.digest);

  assert.notDeepEqual(firstDigests, secondDigests);
  assert.equal(first.artifacts.some(artifact => artifact.digest === STALE_PHASE3_DIGEST), false);
  assert.ok(first.artifacts.every(artifact => artifact.kind === 'software-evidence'));
  for (const digest of firstDigests) assert.match(digest, /^checksum:[a-f0-9]{8}$/);
});

test('the production drill catalogue is backed by a real Maze operations runbook', () => {
  const { MANDATORY_DRILLS } = release();
  const runbookPath = path.resolve(__dirname, '../../docs/operations/ai-maze-escape-runbook.md');
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
