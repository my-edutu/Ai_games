'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const PLAYER_MAX_SPEED = 7;
const riskWeight = { safe: 0, balanced: 1, bold: 2 };

function riskScore(content) {
  return content.decisions.reduce((sum, decision) => sum + riskWeight[decision.risk], 0);
}

function phase6(seed = 'phase6-review-2') {
  return eko.createPhase6State(eko.createDefaultConfig({ seed }));
}

function advanceCommand(state, sequence) {
  return { schemaVersion: 1, runId: state.runId, targetTick: state.tick, priority: 0, sourceId: 'phase6-review-2', sourceSequence: sequence, type: 'advance', payload: {} };
}

test('later endless cycles increase real authoritative hazard density, not metadata alone', () => {
  for (let district = 0; district < eko.PHASE6_DISTRICT_IDS.length; district += 1) {
    const early = eko.generateDistrict('phase6-review-density', district, 0);
    const later = eko.generateDistrict('phase6-review-density', district, 8);
    assert.ok(later.hazards.length > early.hazards.length, `${early.districtId} did not add authoritative hazard pressure`);
  }
});

test('later endless cycles increase optional route-risk pressure as a second challenge axis', () => {
  for (let district = 0; district < eko.PHASE6_DISTRICT_IDS.length; district += 1) {
    const early = eko.generateDistrict('phase6-review-risk', district, 0);
    const later = eko.generateDistrict('phase6-review-risk', district, 8);
    assert.ok(riskScore(later) > riskScore(early), `${early.districtId} did not increase route-risk pressure`);
  }
});

test('cycle escalation never weakens the Phase 5 physical response-window fairness floor', () => {
  for (let district = 0; district < eko.PHASE6_DISTRICT_IDS.length; district += 1) {
    for (const cycle of [0, 4, 8, 16]) {
      const content = eko.generateDistrict(`phase6-review-fair-${district}`, district, cycle);
      for (const item of content.hazards) {
        const minimumTravelDistance = (PLAYER_MAX_SPEED + (item.maxHazardSpeed ?? 0)) * (item.minResponseTicks / 60);
        assert.ok(
          item.warningDistance + 1e-9 >= minimumTravelDistance,
          `${content.districtId} cycle ${cycle} ${item.id} violates response window`,
        );
      }
    }
  }
});

test('token balance has a bounded lifetime earned-total audit counter that survives district advance', () => {
  let state = phase6('phase6-review-economy-audit');
  assert.equal(state.resources.earnedTokenTotal, 0);
  const token = state.progression.activeContent.tokens[0];
  state.player.position.x = token.x;
  state.player.position.y = state.route.groundY;
  state = eko.stepSimulation(state, []).state;
  assert.equal(state.resources.ekoTokens, token.value);
  assert.equal(state.resources.earnedTokenTotal, token.value);

  state.lifecycle = 'intermission';
  state = eko.stepSimulation(state, [advanceCommand(state, 1)]).state;
  assert.equal(state.resources.earnedTokenTotal, token.value);
  assert.ok(state.resources.earnedTokenTotal >= state.resources.ekoTokens);
  assert.ok(state.resources.earnedTokenTotal <= eko.PHASE6_TOKEN_CAP);
});
