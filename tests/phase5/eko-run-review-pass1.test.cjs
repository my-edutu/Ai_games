'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const MAX_SPEED = 7;
const STUMBLE_RECOVERY_TICKS = 18;
const FRESH_DECISION_TICKS = 12;

test('review 1: consecutive hazards preserve recovery plus a fresh independent decision window', () => {
  const contracts = [...eko.getPhase5HazardContracts('review1-spacing')].sort((a, b) => a.baseX - b.baseX);
  const requiredClearMeters = MAX_SPEED * ((STUMBLE_RECOVERY_TICKS + FRESH_DECISION_TICKS) / 60);
  for (let index = 0; index < contracts.length - 1; index += 1) {
    const current = contracts[index];
    const next = contracts[index + 1];
    const currentExit = current.baseX + current.width * 0.5;
    const nextWarningStart = next.baseX - next.warningDistance;
    const clearMeters = nextWarningStart - currentExit;
    assert.ok(
      clearMeters + 1e-9 >= requiredClearMeters,
      `${current.id} -> ${next.id} leaves only ${clearMeters.toFixed(2)}m, needs ${requiredClearMeters.toFixed(2)}m`,
    );
  }
});
