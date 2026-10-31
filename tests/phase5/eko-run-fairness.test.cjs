'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const PLAYER_MAX_SPEED = 7;

test('every Phase 5 hazard exposes a physically sufficient response window at maximum closing speed', () => {
  const contracts = eko.getPhase5HazardContracts('phase5-fairness-window');
  assert.equal(contracts.length, 11);
  for (const item of contracts) {
    const hazardSpeed = item.maxHazardSpeed ?? 0;
    const closingSpeed = PLAYER_MAX_SPEED + hazardSpeed;
    const minimumTravelDistance = closingSpeed * (item.minResponseTicks / 60);
    assert.ok(
      item.warningDistance + 1e-9 >= minimumTravelDistance,
      `${item.id} warningDistance ${item.warningDistance} is below ${minimumTravelDistance.toFixed(3)}m response requirement`,
    );
  }
});

test('dynamic hazards declare bounded periodic motion and active windows', () => {
  const moving = eko.getPhase5HazardContracts('phase5-fairness-motion').filter(item => item.motion);
  assert.ok(moving.length >= 4);
  for (const item of moving) {
    assert.ok(item.maxHazardSpeed > 0);
    assert.ok(Number.isInteger(item.motion.periodTicks) && item.motion.periodTicks >= 2);
    assert.ok(item.motion.minOffsetX <= item.motion.maxOffsetX);
    assert.ok(Number.isInteger(item.motion.activeTicks) && item.motion.activeTicks > 0);
    assert.ok(item.motion.activeTicks <= item.motion.periodTicks);
  }
});

test('all ordinary hazard contracts have at least one explicit legal avoidance response', () => {
  for (const item of eko.getPhase5HazardContracts('phase5-fairness-response')) {
    assert.ok(item.legalResponses.length > 0, `${item.id} has no legal response`);
    assert.equal(item.legalResponses.every(response => ['jump', 'slow', 'wait', 'slide', 'vault'].includes(response)), true);
    assert.ok(['stumble', 'slow', 'fail'].includes(item.consequence));
  }
});
