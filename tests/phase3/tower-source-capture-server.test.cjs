'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sourceCaptureConfig } = require('../../scripts/tower-source-capture-server.cjs');
const root = path.resolve(__dirname, '../..');

test('neutral Tower evidence runner shares genuine scenario settings without replacing source host', () => {
  const env = { CI: 'true', TOWER_LAUNCH_FLOOR: '8',
    TOWER_MOTION_SCENARIO: 'danger', TOWER_CAPTURE_UNALTERED_SOURCE: '1' };
  assert.deepEqual(sourceCaptureConfig(env), { launchFloor: 8 });
  assert.deepEqual(sourceCaptureConfig({ ...env, TOWER_LAUNCH_FLOOR: '0', TOWER_MOTION_SCENARIO: 'outcome' }),
    { launchFloor: 0, maxTicks: 900, noProgressTicks: 850, intermissionTicks: 100 });
  assert.deepEqual(sourceCaptureConfig({ ...env, CI: 'false', TOWER_MOTION_SCENARIO: 'outcome' }),
    { launchFloor: 8 }, 'non-CI source uses the unchanged game defaults');
  for (const floor of ['Infinity', '-1', '9007199254740992', 'foo']) {
    assert.throws(() => sourceCaptureConfig({ ...env, TOWER_LAUNCH_FLOOR: floor }), RangeError);
  }
  const workflow = fs.readFileSync(path.join(root,
    '.github/workflows/tower-transformation-visual-evidence.yml'), 'utf8');
  assert.ok(!/cp current-harness\/scripts\/serve-tower-stream\.cjs/.test(workflow),
    'the original frozen gameplay host must never be overwritten');
  assert.match(workflow, /source-game-host-blob\.txt/,
    'source-origin host blobs must be pinned beside WebM evidence');
  assert.match(workflow, /git -C source diff --exit-code -- scripts\/serve-tower-stream\.cjs/,
    'verify unmodified checked-out host before recording');
});
