const test = require('node:test');
const assert = require('node:assert/strict');

const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  createInitialEscapeState,
  applyEscapeAction,
  createEscapeObservation,
  createEmptyEscapeBelief,
  updateEscapeBelief,
  publicEscapeBelief,
  planEscapeAction,
  detectEscapePathology,
  EscapeRuntime,
} = require('../../dist/games/ai-escape-room/src/index.js');

function config(overrides = {}) {
  return parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG, puzzleDepth: 6, objectCount: 26, decoyCount: 2, hazardCount: 0, maxTicks: 600, noProgressTicks: 80, ...overrides});
}

function recursivelyHasKey(value, forbidden) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(item => recursivelyHasKey(item, forbidden));
  return Object.entries(value).some(([key, item]) => forbidden.test(key) || recursivelyHasKey(item, forbidden));
}

test('observation, public belief and decision exclude undiscovered solution truth and oracle fields', () => {
  const cfg = config();
  const state = createInitialEscapeState(cfg, 'privacy', 'privacy-run', NamedRng.fromSeed('privacy'));
  const firstPuzzle = state.room.puzzles[0];
  const clue = state.room.objects.find(object => object.id === firstPuzzle.clueIds[0]);
  firstPuzzle.solution = 'SECRET-ZXQ-917';
  clue.hiddenFact.value = 'SECRET-ZXQ-917';

  const observation = createEscapeObservation(state);
  const belief = updateEscapeBelief(createEmptyEscapeBelief(), observation, {maxFacts:64, maxHypotheses:32, maxHistory:32});
  const decision = planEscapeAction(observation, belief, {maxExpansions:24});
  for (const value of [observation, publicEscapeBelief(belief), decision]) {
    const serialized = JSON.stringify(value);
    assert.equal(serialized.includes('SECRET-ZXQ-917'), false);
    assert.equal(recursivelyHasKey(value, /solution|hiddenFact|oracle/i), false);
  }
});

test('inspection makes a fact available to belief without exposing raw code in public intent', () => {
  const cfg = config();
  let state = createInitialEscapeState(cfg, 'fact', 'fact-run', NamedRng.fromSeed('fact'));
  const puzzle = state.room.puzzles[0];
  const clueId = puzzle.clueIds[0];
  const inspected = applyEscapeAction(state, {kind:'inspect', targetId:clueId}, NamedRng.fromSeed('rules'));
  assert.equal(inspected.accepted, true);
  state = inspected.state;
  const observation = createEscapeObservation(state);
  const belief = updateEscapeBelief(createEmptyEscapeBelief(), observation, {maxFacts:64, maxHypotheses:32, maxHistory:32});
  assert.equal(belief.hypotheses[puzzle.id].value, puzzle.solution);
  const decision = planEscapeAction(observation, belief, {maxExpansions:24});
  assert.ok(['enter-code','activate','take','use'].includes(decision.action.kind));
  assert.equal(JSON.stringify(decision.publicIntent).includes(puzzle.solution), false);
});

test('planner selects information gain, prerequisite actions and deterministic puzzle execution', () => {
  const cfg = config({puzzleDepth:8, objectCount:32});
  let state = createInitialEscapeState(cfg, 'planner', 'planner-run', NamedRng.fromSeed('planner'));
  let belief = createEmptyEscapeBelief();
  let observation = createEscapeObservation(state);
  let decision = planEscapeAction(observation, belief, {maxExpansions:12});
  assert.equal(decision.action.kind, 'inspect');
  assert.ok(decision.expansions <= 12);
  const first = applyEscapeAction(state, decision.action, NamedRng.fromSeed('rules'));
  assert.equal(first.accepted, true);
  state = first.state;
  observation = createEscapeObservation(state);
  belief = updateEscapeBelief(belief, observation, {maxFacts:64, maxHypotheses:32, maxHistory:32});
  decision = planEscapeAction(observation, belief, {maxExpansions:12});
  const puzzle = state.room.puzzles[0];
  if (puzzle.kind === 'tool-dependency') assert.equal(decision.action.kind, 'take');
  else if (puzzle.kind === 'switch-network' || puzzle.kind === 'balance-clue') assert.equal(decision.action.kind, 'activate');
  else assert.equal(decision.action.kind, 'enter-code');
});

test('planner reacts safely to an active hazard and uses a stable tie-break under equal utility', () => {
  const cfg = config({hazardCount:1});
  const state = createInitialEscapeState(cfg, 'hazard-ai', 'hazard-ai-run', NamedRng.fromSeed('hazard-ai'));
  const hazardId = state.room.hazards[0].id;
  state.hazardStates[hazardId].phase = 'active';
  const observation = createEscapeObservation(state);
  const belief = updateEscapeBelief(createEmptyEscapeBelief(), observation, {maxFacts:64, maxHypotheses:32, maxHistory:32});
  const a = planEscapeAction(observation, belief, {maxExpansions:4});
  const b = planEscapeAction(observation, belief, {maxExpansions:4});
  assert.deepEqual(a, b);
  assert.equal(a.action.kind, 'wait');
  assert.equal(a.publicIntent.intent, 'Holding position until the hazard clears');
  assert.ok(a.expansions <= 4);
});

test('belief is bounded and contradictory facts lower confidence deterministically', () => {
  const base = createEmptyEscapeBelief();
  const observation = {
    schemaVersion:1, tick:1, roomId:'bounded', lifecycle:'running', timerRemaining:100,
    visibleObjects:[], inventory:[], solvedPuzzleIds:[], hazards:[], affordances:[{kind:'wait'}], knownPuzzles:[],
    discoveredFacts:Array.from({length:20}, (_, index) => ({factId:`fact-${index}`, value:`value-${index}`, puzzleId:`puzzle-${index%3}`, sourceObjectId:`clue-${index}`, discoveredTick:index})),
    progressPermille:0,
  };
  const belief = updateEscapeBelief(base, observation, {maxFacts:5, maxHypotheses:2, maxHistory:4});
  assert.equal(Object.keys(belief.facts).length, 5);
  assert.equal(Object.keys(belief.hypotheses).length, 2);
  assert.ok(belief.history.length <= 4);

  const contradiction = structuredClone(observation);
  contradiction.tick = 2;
  contradiction.discoveredFacts = [{factId:'conflict', value:'other', puzzleId:Object.keys(belief.hypotheses)[0], sourceObjectId:'new-clue', discoveredTick:2}];
  const next = updateEscapeBelief(belief, contradiction, {maxFacts:5, maxHypotheses:2, maxHistory:4});
  const hypothesis = next.hypotheses[Object.keys(belief.hypotheses)[0]];
  assert.ok(hypothesis.contradictions >= 1);
  assert.ok(hypothesis.confidencePermille < 900);
});

test('pathology detector classifies repeated actions and no-progress with bounded recovery', () => {
  const cfg = config({noProgressTicks:20});
  const state = createInitialEscapeState(cfg, 'stuck', 'stuck-run', NamedRng.fromSeed('stuck'));
  state.tick = 25;
  state.lastProgressTick = 0;
  const repeated = Array.from({length:6}, () => ({tick:1, actionKey:'{"kind":"inspect","targetId":"same"}', progressPermille:0}));
  const pathology = detectEscapePathology(state, repeated);
  assert.equal(pathology.kind, 'repeated-action');
  assert.equal(pathology.recovery, 'explore-alternate');
  assert.ok(pathology.window <= 8);

  const noProgress = detectEscapePathology(state, []);
  assert.equal(noProgress.kind, 'no-progress');
  assert.equal(noProgress.recovery, 'reset-plan');
});

test('autonomous runtime completes varied rooms without oracle policy or remote model', () => {
  const seeds = ['autonomy-a','autonomy-b','autonomy-c','autonomy-d'];
  for (const seed of seeds) {
    const cfg = config({puzzleDepth:8, objectCount:34, decoyCount:5, maxTicks:700, noProgressTicks:160});
    const runtime = EscapeRuntime.create({config:cfg, seed, runId:`run-${seed}`, policy:'autonomous'});
    const actions = new Set();
    while (!runtime.state.result && runtime.state.tick < cfg.maxTicks) {
      const step = runtime.step();
      if (step.action) actions.add(step.action.kind);
    }
    assert.equal(runtime.state.result.reason, 'escape', seed);
    assert.equal(runtime.state.solvedPuzzleIds.length, runtime.state.room.puzzles.length);
    assert.ok(actions.has('inspect'));
    assert.ok(actions.has('exit'));
    assert.equal(runtime.snapshotMaterial().policy, 'autonomous');
    assert.equal(runtime.snapshotMaterial().oracleActions.length, 0);
  }
});

test('planner falls back to a legal wait when no public affordance can progress', () => {
  const observation = {
    schemaVersion:1, tick:1, roomId:'empty', lifecycle:'running', timerRemaining:100,
    visibleObjects:[], inventory:[], solvedPuzzleIds:[], hazards:[], affordances:[{kind:'wait'}], knownPuzzles:[], discoveredFacts:[], progressPermille:0,
  };
  const decision = planEscapeAction(observation, createEmptyEscapeBelief(), {maxExpansions:1});
  assert.deepEqual(decision.action, {kind:'wait'});
  assert.equal(decision.publicIntent.fallback, true);
  assert.equal(decision.publicIntent.planChangeReason, 'no-progressing-affordance');
});
