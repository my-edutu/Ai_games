'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const rendererSource = fs.readFileSync(path.join(root, 'public/snake-stream/renderer.mjs'), 'utf8');
let exportsPromise;
function rendererHelpers() {
  return exportsPromise ||= import('data:text/javascript;base64,' + Buffer.from(
    rendererSource.replace(/^import\s+.*?;\s*$/gm, '')).toString('base64'));
}
const afterOneCompletedCurrentShot = {
  supported: true, failed: false, submitted: 28, completed: 27,
  pending: 1, skipped: 754, lastObservedLatencyMs: 1420,
};

test('RED: a held real follow/detail shot graduates from pressure-direct draws to a full HDR/depth world cache only after its own GPU fence', async () => {
  const { shouldPromoteStableShotCache } = await rendererHelpers();
  assert.equal(shouldPromoteStableShotCache({ queue: afterOneCompletedCurrentShot,
    cacheHit: false, directFrames: 1, submittedAtViewStart: 26 }), true);
  assert.equal(shouldPromoteStableShotCache({ queue: afterOneCompletedCurrentShot,
    cacheHit: false, directFrames: 2, submittedAtViewStart: 28 }), false);
});

test('RED: never promote stale, unsupported, pending, merely RAF-slow, or already cached views', async () => {
  const { shouldPromoteStableShotCache } = await rendererHelpers();
  const base = { queue: afterOneCompletedCurrentShot, cacheHit: false,
    directFrames: 1, submittedAtViewStart: 26 };
  for (const options of [
    { ...base, directFrames: 0 },
    { ...base, cacheHit: true },
    { ...base, queue: { ...base.queue, pending: 2 } },
    { ...base, queue: { ...base.queue, completed: 26 } },
    { ...base, queue: { ...base.queue, supported: false } },
    { ...base, queue: { ...base.queue, failed: true } },
    { ...base, queue: { ...base.queue, skipped: 0 } },
    { ...base, queue: { ...base.queue, lastObservedLatencyMs: 0 } },
    { ...base, queue: { ...base.queue, lastObservedLatencyMs: 5001 } },
    { ...base, submittedAtViewStart: 29 },
  ]) assert.equal(shouldPromoteStableShotCache(options), false);
});

test('RED: cache-recovery integration retains full scene, stable key, shadow and fenced complete draw truth', () => {
  assert.match(rendererSource, /let pressureMissViewKey\s*=\s*''/);
  assert.match(rendererSource, /pressureMissSubmittedAt\s*=\s*currentGpuQueue\.submitted/);
  assert.match(rendererSource, /shouldPromoteStableShotCache\(\{\s*queue:\s*currentGpuQueue/);
  assert.match(rendererSource, /pressureMissDirectFrames\s*\+=\s*1/);
  assert.match(rendererSource, /if \(cachePath === 'direct-preserve'\) \{[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(rendererSource, /liveCacheQuad\.visible = true/);
  assert.match(rendererSource, /frameGate\.submitted\(\)/);
  assert.match(rendererSource, /world\.update\(snapshot,/);
  assert.match(rendererSource, /serpent\.update\(motion\.paths,/);
  const strict=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(strict, /17/);
});
