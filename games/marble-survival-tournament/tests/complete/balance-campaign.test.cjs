'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '../../scripts/run-balance-campaign.cjs');

function loadCampaign() {
  assert.equal(fs.existsSync(scriptPath), true, 'run-balance-campaign.cjs must exist');
  delete require.cache[require.resolve(scriptPath)];
  return require(scriptPath);
}

test('balance campaign is deterministic and reports full tournament outcomes', () => {
  const campaign = loadCampaign();
  const seeds = ['marble-balance-test-a', 'marble-balance-test-b'];
  const first = campaign.runCampaign({ seeds, maxStepsPerSeed: 30_000 });
  const second = campaign.runCampaign({ seeds, maxStepsPerSeed: 30_000 });

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.sampleCount, seeds.length);
  assert.equal(first.completed + first.technical + first.stepLimit, seeds.length);
  assert.equal(first.completed, seeds.length, JSON.stringify(first.runs, null, 2));
  assert.equal(first.technical, 0);
  assert.equal(first.stepLimit, 0);
  assert.equal(first.fallbackArenas, 0);
  assert.equal(first.roundDurationTicks.count, seeds.length * 5);
  assert.ok(first.roundDurationTicks.p95 >= first.roundDurationTicks.p50);
  assert.ok(Object.keys(first.championArchetypes).length >= 1);
  assert.ok(first.totalEvents > 0);
});

test('balance percentile helper is integer, bounded and stable', () => {
  const { percentile } = loadCampaign();
  assert.equal(percentile([], 0.95), 0);
  assert.equal(percentile([9, 1, 5, 3, 7], 0.5), 5);
  assert.equal(percentile([9, 1, 5, 3, 7], 0.95), 9);
  assert.equal(percentile([9, 1, 5, 3, 7], 0), 1);
});
