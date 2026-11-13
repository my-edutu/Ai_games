'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { createMazeObservation } = require('../../dist/games/ai-maze-escape/src/ai/observation.js');
const { chooseMazeAction } = require('../../dist/games/ai-maze-escape/src/ai/policy.js');
const { stepMazeThreats } = require('../../dist/games/ai-maze-escape/src/threats/step.js');

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
      '1': beliefCell(1, [0, 2]),
      '2': beliefCell(2, [1]),
      '5': beliefCell(5, [0]),
    },
    doors: {},
    keys: {},
    threats: { threat: { id: 'threat', cell: 2, lastSeenTick: 0 } },
    frontiers: [],
    revision: 1,
    lastUpdatedTick: 0,
  };
  const observation = {
    schemaVersion: 1,
    tick: 0,
    currentCell: 0,
    visibleCells: [0, 1, 2, 5],
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
    threats: [{ id: 'threat', cell: 2, lastSeenTick: 0 }],
    inventory: [],
    health: 1,
    timeRemaining: 100,
    exitCell: null,
    recentCells: [0],
  };

  const decision = chooseMazeAction(state, observation, belief);
  assert.equal(decision.intent.mode, 'evading-threat');
  assert.equal(decision.action.targetCell, 5, 'cell 5 is three Manhattan steps from threat cell 2; cell 1 is only one');
});

test('visible diagonal, sealed or unconnected guardians cannot hijack autonomous movement before a real open standoff',()=>{
  const runtime=MazeRuntime.create({width:5,height:5,profile:'tree',visibilityRadius:3},'standoff-public-only');
  const state=structuredClone(runtime.state);state.explorer.cell=0;state.ai.recentCells=[0];
  const belief={schemaVersion:1,cells:{
    '0':beliefCell(0,[1,5]),'1':beliefCell(1,[0,2]),
    '2':beliefCell(2,[1]),'5':beliefCell(5,[0]),'6':beliefCell(6,[])},
    doors:{},keys:{},threats:{},frontiers:[],revision:1,lastUpdatedTick:0};
  const observation={schemaVersion:1,tick:0,currentCell:0,
    visibleCells:[0,1,2,5,6],rememberedCells:[],
    cells:Object.values(belief.cells).map(cell=>({...cell,visible:true})),
    doors:[],keys:[],threats:[{id:'threat',cell:6,lastSeenTick:0}],
    inventory:[],health:1,timeRemaining:100,exitCell:null,recentCells:[0]};
  assert.notEqual(chooseMazeAction(state,observation,belief).intent.mode,'evading-threat',
    'diagonal danger can warn but cannot force a fictional straight standoff');
  observation.threats[0].cell=2;
  observation.doors=[{id:'sealed',a:1,b:2,requiredKeyId:'key-X',open:false}];
  assert.notEqual(chooseMazeAction(state,observation,belief).intent.mode,'evading-threat',
    'a closed public door prevents a phantom adjacent-guardian evasion');
  observation.doors=[];
  observation.cells.find(cell=>cell.cell===2).neighbors=[];
  assert.notEqual(chooseMazeAction(state,observation,belief).intent.mode,'evading-threat',
    'a one-way/unknown second link is not a verified open danger path');
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

test('an inactive threat cannot capture the explorer or create danger telemetry', () => {
  const runtime = MazeRuntime.create({ width: 9, height: 7, profile: 'hunter', visibilityRadius: 2, threatCount: 1 }, 'review-inactive-threat');
  const state = structuredClone(runtime.state);
  state.world.threats = [{
    id: 'inactive-threat',
    cell: state.explorer.cell,
    route: [state.explorer.cell],
    routeIndex: 0,
    direction: 1,
    lastSeenTick: state.tick,
    active: false,
    pausedUntilTick: 0,
  }];
  const beforeEncounters = state.stats.threatEncounters;

  const result = stepMazeThreats(state);

  assert.equal(result.captured, false);
  assert.equal(result.encounters, 0);
  assert.equal(result.state.stats.threatEncounters, beforeEncounters);
  assert.equal(result.events.some(event => event.type === 'threat-near'), false);
});

test('public two-cell guardian standoff waits instead of advancing into contact, then takes a real side escape',()=>{
  const runtime=MazeRuntime.create({width:5,height:5,profile:'tree',visibilityRadius:2},'public-standoff-no-suicide');
  const state=structuredClone(runtime.state);
  state.explorer.cell=0;
  state.ai.recentCells=[0];
  const belief={schemaVersion:1,cells:{
    '0':beliefCell(0,[1]),'1':beliefCell(1,[0,2]),'2':beliefCell(2,[1])},
    doors:{},keys:{},threats:{guardian:{id:'guardian',cell:2,lastSeenTick:0}},
    frontiers:[],revision:1,lastUpdatedTick:0};
  const observation={schemaVersion:1,tick:0,currentCell:0,
    visibleCells:[0,1,2],rememberedCells:[],
    cells:Object.values(belief.cells).map(cell=>({...cell,visible:true})),
    doors:[],keys:[],threats:[{id:'guardian',cell:2,lastSeenTick:0}],
    inventory:[],health:1,timeRemaining:100,exitCell:null,recentCells:[0]};
  const standoff=chooseMazeAction(state,observation,belief);
  assert.equal(standoff.intent.mode,'evading-threat');
  assert.deepEqual(standoff.action,{kind:'wait'},
    'Pip must not enter adjacent guardian range from a genuine two-cell stand-off');
  assert.deepEqual(standoff.plannedPath,[0]);
  assert.equal(standoff.targetCell,null);
  assert.equal(standoff.intent.fallbackUsed,true);

  // A truly observed reciprocal SIDE passage changes the real autonomous
  // decision, rather than making Pip wait indefinitely despite a safe exit.
  belief.cells['0'].neighbors.push(5);
  belief.cells['5']=beliefCell(5,[0]);
  observation.visibleCells.push(5);
  observation.cells=Object.values(belief.cells).map(cell=>({...cell,visible:true}));
  const escaped=chooseMazeAction(state,observation,belief);
  assert.equal(escaped.action.kind,'move');
  assert.equal(escaped.action.targetCell,5);
  assert.equal(escaped.intent.fallbackUsed,false);

  // Removing live knowledge cannot produce a ghost guardian reaction.
  const unseen={...observation,threats:[]};
  assert.notEqual(chooseMazeAction(state,unseen,belief).intent.mode,'evading-threat');
  // A presently closed passage does not qualify as a visible duel corridor.
  const sealed={...observation,doors:[{id:'closed',a:1,b:2,open:false,requiredKeyId:'unknown'}]};
  assert.notEqual(chooseMazeAction(state,sealed,belief).intent.mode,'evading-threat');
});

test('a publicly witnessed guardian on a bend cannot be used as a shortcut to a known goal or unknown frontier',()=>{
  const runtime=MazeRuntime.create({width:5,height:5,profile:'tree',visibilityRadius:3},'published-guardian-flank');
  const state=structuredClone(runtime.state);
  state.explorer.cell=0;
  state.ai.recentCells=[0];

  // Short goal route 0→5→6→7 crosses the NOW-VISIBLE guardian at 6.
  // An actual previously discovered, longer flank 0→1→2→3→8→7 exists.
  // The guardian is diagonal from Pip, so the two-cell straight duel logic
  // does not take over. No future patrol positions or world map are consulted.
  const belief={schemaVersion:1,cells:{
    '0':beliefCell(0,[1,5]),'1':beliefCell(1,[0,2]),
    '2':beliefCell(2,[1,3]),'3':beliefCell(3,[2,8]),
    '5':beliefCell(5,[0,6]),'6':beliefCell(6,[5,7]),
    '7':beliefCell(7,[6,8,12]),'8':beliefCell(8,[3,7])},
    doors:{},keys:{},threats:{guardian:{id:'guardian',cell:6,lastSeenTick:0}},
    frontiers:[],revision:1,lastUpdatedTick:0};
  const observation={schemaVersion:1,tick:0,currentCell:0,
    visibleCells:[0,5,6,7],rememberedCells:[1,2,3,8],
    cells:Object.values(belief.cells).map(cell=>({...cell,
      visible:[0,5,6,7].includes(cell.cell)})),
    doors:[],keys:[],threats:[{id:'guardian',cell:6,lastSeenTick:0}],
    inventory:[],health:1,timeRemaining:100,exitCell:7,recentCells:[0]};
  const goal=chooseMazeAction(state,observation,belief);
  assert.equal(goal.intent.mode,'searching-exit');
  assert.deepEqual(goal.action,{kind:'move',targetCell:1},
    'Pip must take the real known longer flank rather than walk into the seen guardian');
  assert.equal(goal.plannedPath.includes(6),false);

  // A frontier beyond that same public threat must use the same protected
  // route, even though the goal cell 12 itself is genuinely still unknown.
  belief.frontiers=[12];
  observation.exitCell=null;
  const frontier=chooseMazeAction(state,observation,belief);
  assert.equal(frontier.intent.mode,'exploring');
  assert.deepEqual(frontier.action,{kind:'move',targetCell:1});
  assert.equal(frontier.plannedPath.includes(6),false);
  assert.equal(frontier.plannedPath.at(-1),12);

  // Once the guardian is no longer PUBLICLY observed, it must not become an
  // omniscient permanent obstacle. The short route is again the valid choice.
  observation.threats=[];
  belief.frontiers=[];
  observation.exitCell=7;
  const cleared=chooseMazeAction(state,observation,belief);
  assert.deepEqual(cleared.action,{kind:'move',targetCell:5});
  assert.equal(cleared.plannedPath.includes(6),true);
});
