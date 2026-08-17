'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { createMazeObservation } = require('../../dist/games/ai-maze-escape/src/ai/observation.js');
const { chooseMazeAction } = require('../../dist/games/ai-maze-escape/src/ai/policy.js');

function beliefCell(cell, neighbors) {
  return {
    cell,
    neighbors,
    lastSeenTick: 0,
    confidencePermille: 1000,
    visits: 0,
    trap: false,
    blocked: false,
    checkpoint: false,
    clue: false,
    exit: false,
  };
}

test('threat evasion uses grid geometry instead of flattened cell-id distance', () => {
  const runtime = MazeRuntime.create({ width: 5, height: 5, profile: 'tree', visibilityRadius: 1 }, 'review-evasion-distance');
  const state = structuredClone(runtime.state);
  state.explorer.cell = 0;
  state.ai.recentCells = [0];
  const belief = {
    schemaVersion: 1,
    cells: {
      '0': beliefCell(0, [1, 5]),
      '1': beliefCell(1, [0]),
      '3': beliefCell(3, []),
      '5': beliefCell(5, [0]),
    },
    doors: {},
    keys: {},
    threats: { threat: { id: 'threat', cell: 3, lastSeenTick: 0 } },
    frontiers: [],
    revision: 1,
    lastUpdatedTick: 0,
  };
  const observation = {
    schemaVersion: 1,
    tick: 0,
    currentCell: 0,
    visibleCells: [0, 1, 3, 5],
    rememberedCells: [],
    cells: Object.values(belief.cells).map(cell => ({
      cell: cell.cell,
      neighbors: [...cell.neighbors],
      visible: true,
      lastSeenTick: 0,
      trap: false,
      blocked: false,
      checkpoint: false,
      clue: false,
      exit: false,
    })),
    doors: [],
    keys: [],
    threats: [{ id: 'threat', cell: 3, lastSeenTick: 0 }],
    inventory: [],
    health: 1,
    timeRemaining: 100,
    exitCell: null,
    recentCells: [0],
  };

  const decision = chooseMazeAction(state, observation, belief);
  assert.equal(decision.intent.mode, 'evading-threat');
  assert.equal(decision.action.targetCell, 5, 'cell 5 is four Manhattan steps from threat cell 3; cell 1 is only two');
});

test('a paused threat remains visible and avoidable while it is still collidable', () => {
  const runtime = MazeRuntime.create({ width: 11, height: 9, profile: 'hunter', visibilityRadius: 3, threatCount: 1 }, 'review-paused-threat');
  const state = structuredClone(runtime.state);
  const visibleThreatCell = state.visibleCells.find(cell => cell !== state.explorer.cell);
  assert.notEqual(visibleThreatCell, undefined);
  state.world.threats = [{
    id: 'paused-threat',
    cell: visibleThreatCell,
    route: [visibleThreatCell, state.explorer.cell],
    routeIndex: 0,
    direction: 1,
    lastSeenTick: state.tick,
    active: true,
    pausedUntilTick: state.tick + 20,
  }];

  const observation = createMazeObservation(state);
  assert.equal(observation.threats.length, 1);
  assert.equal(observation.threats[0].cell, visibleThreatCell);
});
