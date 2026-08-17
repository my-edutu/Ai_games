const test = require('node:test');
const assert = require('node:assert/strict');

const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  createInitialEscapeState,
  listLegalEscapeActions,
  applyEscapeAction,
  EscapeRuntime,
  encodeEscapeSnapshot,
  restoreEscapeRuntime,
  runEscapeHeadless,
  solveEscapeRoom,
} = require('../../dist/games/ai-escape-room/src/index.js');

function config(overrides = {}) {
  return parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG, puzzleDepth: 5, objectCount: 24, decoyCount: 2, hazardCount: 0, intermissionTicks: 2, ...overrides});
}

function actionKey(action) {
  return JSON.stringify(action, Object.keys(action).sort());
}

test('initial state is bounded, valid and exposes only currently legal atomic actions', () => {
  const cfg = config();
  const state = createInitialEscapeState(cfg, 'runtime-seed', 'run-1', NamedRng.fromSeed('runtime-seed'));
  assert.equal(state.lifecycle, 'running');
  assert.equal(state.tick, 0);
  assert.equal(state.runId, 'run-1');
  assert.ok(state.room.objects.length <= cfg.objectCount);
  assert.ok(state.visibleObjectIds.length > 0);
  assert.ok(state.actionHistory.length <= cfg.factHistoryLimit);
  const legal = listLegalEscapeActions(state);
  assert.ok(legal.some(action => action.kind === 'inspect'));
  assert.ok(legal.some(action => action.kind === 'wait'));
  assert.equal(new Set(legal.map(actionKey)).size, legal.length);
});

test('inspect reveals one fact, take carries portable tools and rejected actions are atomic', () => {
  const cfg = config({puzzleDepth: 8, objectCount: 32});
  let state = createInitialEscapeState(cfg, 'action-seed', 'run-actions', NamedRng.fromSeed('action-seed'));
  const firstClue = state.room.puzzles[0].clueIds[0];
  const before = checksum(state);
  const rejected = applyEscapeAction(state, {kind: 'enter-code', targetId: 'missing', code: '999'}, NamedRng.fromSeed('rules'));
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, 'illegal-action');
  assert.equal(checksum(rejected.state), before);

  const inspected = applyEscapeAction(state, {kind: 'inspect', targetId: firstClue}, NamedRng.fromSeed('rules'));
  assert.equal(inspected.accepted, true);
  assert.equal(Object.keys(inspected.state.discoveredFacts).length, 1);
  assert.ok(inspected.events.some(event => event.type === 'clue-discovered'));
  state = inspected.state;

  const object = state.room.objects.find(item => item.id === firstClue);
  if (object.portable) {
    const taken = applyEscapeAction(state, {kind: 'take', targetId: firstClue}, NamedRng.fromSeed('rules'));
    assert.equal(taken.accepted, true);
    assert.deepEqual(taken.state.inventory, [firstClue]);
  }
});

test('combine is deterministic and bounded when two carried items are present', () => {
  const cfg = config();
  const state = createInitialEscapeState(cfg, 'combine-seed', 'run-combine', NamedRng.fromSeed('combine-seed'));
  const prepared = structuredClone(state);
  prepared.inventory = ['item-b', 'item-a'];
  prepared.objectStates['item-a'] = {visible:true, inspected:true, carried:true, solved:false, labelVariant:0};
  prepared.objectStates['item-b'] = {visible:true, inspected:true, carried:true, solved:false, labelVariant:0};
  const result = applyEscapeAction(prepared, {kind:'combine', targetId:'item-b', withId:'item-a'}, NamedRng.fromSeed('rules'));
  assert.equal(result.accepted, true);
  assert.deepEqual(result.state.combinedItems, ['item-a+item-b']);
  assert.ok(result.events.some(event => event.type === 'items-combined'));
});

test('oracle action sequence exercises puzzle actions and reaches an explainable escape result', () => {
  const cfg = config({puzzleDepth: 8, objectCount: 32, maxTicks: 500});
  const runtime = EscapeRuntime.create({config: cfg, seed: 'oracle-actions', runId: 'run-oracle', policy: 'oracle-test'});
  const seen = new Set();
  while (!runtime.state.result && runtime.state.tick < cfg.maxTicks) {
    const step = runtime.step();
    if (step.action) seen.add(step.action.kind);
  }
  assert.equal(runtime.state.result.reason, 'escape');
  assert.equal(runtime.state.result.kind, 'game');
  assert.equal(runtime.state.solvedPuzzleIds.length, runtime.state.room.puzzles.length);
  assert.ok(seen.has('inspect'));
  assert.ok(seen.has('enter-code') || seen.has('activate'));
  assert.ok(seen.has('exit'));
  assert.ok(runtime.drainEvents().some(event => event.type === 'escape'));
});

test('result advances to intermission and automatically starts the next deterministic room', () => {
  const cfg = config({puzzleDepth: 3, objectCount: 14, intermissionTicks: 2});
  const runtime = EscapeRuntime.create({config: cfg, seed: 'lifecycle', runId: 'run-life', policy: 'oracle-test'});
  while (!runtime.state.result) runtime.step();
  const firstRoomId = runtime.state.roomId;
  runtime.step();
  assert.equal(runtime.state.lifecycle, 'intermission');
  runtime.step();
  runtime.step();
  assert.equal(runtime.state.lifecycle, 'running');
  assert.equal(runtime.state.roomIndex, 2);
  assert.notEqual(runtime.state.roomId, firstRoomId);
  assert.equal(runtime.state.result, null);
});

test('snapshot checksum and compatibility failures are typed and restore exactly', () => {
  const cfg = config({puzzleDepth: 6, objectCount: 26});
  const uninterrupted = EscapeRuntime.create({config: cfg, seed: 'snapshot', runId: 'run-snapshot', policy: 'oracle-test'});
  for (let i = 0; i < 7; i++) uninterrupted.step();
  const envelope = encodeEscapeSnapshot(uninterrupted);
  const restored = restoreEscapeRuntime(envelope);
  assert.equal(checksum(restored.snapshotMaterial()), checksum(uninterrupted.snapshotMaterial()));
  while (!uninterrupted.state.result) uninterrupted.step();
  while (!restored.state.result) restored.step();
  assert.equal(checksum(restored.snapshotMaterial()), checksum(uninterrupted.snapshotMaterial()));

  const corrupt = structuredClone(envelope);
  corrupt.checksum = '00000000';
  assert.throws(() => restoreEscapeRuntime(corrupt), error => error.code === 'CHECKSUM_MISMATCH');
  const schema = structuredClone(envelope);
  schema.schemaVersion = 99;
  assert.throws(() => restoreEscapeRuntime(schema), error => error.code === 'UNSUPPORTED_SCHEMA');
  const compatibility = structuredClone(envelope);
  compatibility.compatibility.configHash = 'different';
  compatibility.checksum = checksum({...compatibility, checksum: undefined});
  assert.throws(() => restoreEscapeRuntime(compatibility), error => error.code === 'CONFIG_MISMATCH');
});

test('headless execution reuses production rules and reproduces final checksum', () => {
  const cfg = config({puzzleDepth: 7, objectCount: 30, maxTicks: 600});
  const a = runEscapeHeadless({config: cfg, seed: 'headless-proof', runId: 'headless-1'});
  const b = runEscapeHeadless({config: cfg, seed: 'headless-proof', runId: 'headless-1'});
  assert.deepEqual(a, b);
  assert.equal(a.result.reason, 'escape');
  assert.ok(a.actionCount > cfg.puzzleDepth);
  assert.match(a.finalChecksum, /^[0-9a-f]{8}$/);
});

test('manual solution route remains legal step by step without duplicate rules', () => {
  const cfg = config({puzzleDepth: 4, objectCount: 18});
  let state = createInitialEscapeState(cfg, 'route-proof', 'route-run', NamedRng.fromSeed('route-proof'));
  const solution = solveEscapeRoom(state.room);
  assert.ok(solution);
  for (const action of solution.actions) {
    const legal = listLegalEscapeActions(state);
    assert.ok(legal.some(candidate => actionKey(candidate) === actionKey(action)), `expected legal ${actionKey(action)}`);
    const step = applyEscapeAction(state, action, NamedRng.fromSeed('rules'));
    assert.equal(step.accepted, true);
    state = step.state;
  }
  assert.equal(state.result.reason, 'escape');
});
