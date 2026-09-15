'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts', 'run-eko-run-headless.cjs');
const PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function run(seed) {
  return JSON.parse(execFileSync(process.execPath, [SCRIPT, seed], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' },
  }));
}

function authoritativeEvidence(summary) {
  return {
    gameVersion: summary.gameVersion,
    deterministicVersion: summary.deterministicVersion,
    seed: summary.seed,
    routeId: summary.routeId,
    lifecycle: summary.lifecycle,
    ticks: summary.ticks,
    checkpointCount: summary.checkpointCount,
    checkpointChecksums: summary.checkpointChecksums,
    finalChecksum: summary.finalChecksum,
  };
}

test('Phase 1 exposes focused Eko tests and a headless evidence command', () => {
  assert.equal(fs.existsSync(SCRIPT), true, 'missing scripts/run-eko-run-headless.cjs');
  assert.match(PACKAGE.scripts?.['test:eko:phase1'] ?? '', /eko-run-.*\.test\.cjs/);
  assert.match(PACKAGE.scripts?.['eko:headless'] ?? '', /run-eko-run-headless\.cjs/);
});

test('headless Foundation Route completes deterministically with bounded CI tick timing', () => {
  if (!fs.existsSync(SCRIPT)) return;
  const seed = 'eko-phase1-headless-fixture';
  const first = run(seed);
  const second = run(seed);

  assert.deepEqual(authoritativeEvidence(first), authoritativeEvidence(second));
  assert.equal(first.seed, seed);
  assert.equal(typeof first.gameVersion, 'string');
  assert.equal(Number.isInteger(first.deterministicVersion), true);
  assert.equal(typeof first.routeId, 'string');
  assert.equal(first.lifecycle, 'completed');
  assert.equal(Number.isInteger(first.ticks) && first.ticks > 0, true);
  assert.equal(Number.isInteger(first.checkpointCount) && first.checkpointCount >= 1, true);
  assert.equal(Array.isArray(first.checkpointChecksums), true);
  assert.equal(first.checkpointChecksums.length, first.checkpointCount);
  for (const checksum of first.checkpointChecksums) assert.match(checksum, /^[0-9a-f]{16}$/);
  assert.match(first.finalChecksum, /^[0-9a-f]{16}$/);

  assert.equal(Number.isFinite(first.timing?.p99Ms) && first.timing.p99Ms >= 0, true);
  assert.equal(Number.isFinite(first.timing?.worstMs) && first.timing.worstMs >= 0, true);
  assert.ok(first.timing.p99Ms < 4, `p99 ${first.timing.p99Ms}ms exceeded 4ms Phase 1 budget`);
  assert.ok(first.timing.worstMs < 16.67, `worst ${first.timing.worstMs}ms exceeded 16.67ms Phase 1 budget`);
});
