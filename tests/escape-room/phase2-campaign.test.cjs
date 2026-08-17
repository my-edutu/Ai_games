const test = require('node:test');
const assert = require('node:assert/strict');

const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  createInitialEscapeState,
  deriveEscapeDifficulty,
  escapeThemeForRoom,
  deriveEscapeProgressionConfig,
  stepEscapeHazards,
  EscapeRuntime,
  runEscapeCampaign,
} = require('../../dist/games/ai-escape-room/src/index.js');

function config(overrides = {}) {
  return parseEscapeRoomConfig({
    ...DEFAULT_ESCAPE_ROOM_CONFIG,
    puzzleDepth: 7,
    objectCount: 32,
    decoyCount: 4,
    hazardCount: 2,
    maxTicks: 900,
    noProgressTicks: 180,
    intermissionTicks: 2,
    ...overrides,
  });
}

test('difficulty and theme progression are deterministic, bounded and add decisions before raw pressure', () => {
  const sequence = Array.from({length: 12}, (_, index) => escapeThemeForRoom(index + 1));
  assert.deepEqual(sequence.slice(0, 8), [
    'cipher-vault','clockwork-study','chromatic-lab','archive-zero',
    'cipher-vault','clockwork-study','chromatic-lab','archive-zero',
  ]);
  assert.equal(deriveEscapeDifficulty(1, 0), 1);
  assert.equal(deriveEscapeDifficulty(7, 3), 4);
  assert.equal(deriveEscapeDifficulty(10_000, 10_000), 20);

  const base = config({difficulty: 3, puzzleDepth: 4, objectCount: 24, decoyCount: 1, hazardCount: 0});
  const early = deriveEscapeProgressionConfig(base, 1, 0);
  const late = deriveEscapeProgressionConfig(base, 30, 8);
  assert.equal(early.theme, 'cipher-vault');
  assert.equal(late.theme, 'clockwork-study');
  assert.ok(late.difficulty > early.difficulty);
  assert.ok(late.puzzleDepth >= early.puzzleDepth);
  assert.ok(late.decoyCount >= early.decoyCount);
  assert.ok(late.hazardCount >= early.hazardCount);
  assert.ok(late.difficulty <= 20);
  assert.ok(late.puzzleDepth <= 12);
  assert.ok(late.objectCount <= 48);
  assert.ok(late.hazardCount <= 6);
});

test('hazards always telegraph before active, expose phase transitions and honor suppression', () => {
  const cfg = config({hazardCount: 1});
  let state = createInitialEscapeState(cfg, 'hazard-cycle', 'hazard-cycle-run', NamedRng.fromSeed('hazard-cycle'));
  const hazard = state.room.hazards[0];
  const observed = [];
  const transitions = [];
  for (let tick = 1; tick <= hazard.periodTicks * 2; tick++) {
    state.tick = tick;
    const result = stepEscapeHazards(state);
    state = result.state;
    observed.push(state.hazardStates[hazard.id].phase);
    transitions.push(...result.events.map(event => event.payload.phase));
  }
  const firstActive = observed.indexOf('active');
  assert.ok(firstActive >= hazard.telegraphTicks);
  assert.ok(observed.slice(0, firstActive).includes('telegraph'));
  assert.ok(transitions.includes('telegraph'));
  assert.ok(transitions.includes('active'));
  assert.ok(transitions.includes('idle'));

  state.hazardStates[hazard.id].suppressedUntilTick = state.tick + hazard.periodTicks;
  state.tick += 1;
  const suppressed = stepEscapeHazards(state);
  assert.equal(suppressed.state.hazardStates[hazard.id].phase, 'idle');
  assert.equal(suppressed.activeHazardIds.length, 0);
});

test('autonomous runtime waits through live hazards while unsafe manual action has a causal fair failure', () => {
  const cfg = config({hazardCount: 2, puzzleDepth: 8, objectCount: 36, maxTicks: 1200});
  const autonomous = EscapeRuntime.create({config: cfg, seed: 'hazard-autonomy', runId: 'hazard-auto', policy: 'autonomous'});
  let activeWaits = 0;
  while (!autonomous.state.result && autonomous.state.tick < cfg.maxTicks) {
    const result = autonomous.step();
    if (result.action?.kind === 'wait' && Object.values(autonomous.state.hazardStates).some(item => item.phase === 'active')) activeWaits += 1;
  }
  assert.equal(autonomous.state.result.reason, 'escape');
  assert.ok(activeWaits > 0);

  const manual = EscapeRuntime.create({config: cfg, seed: 'manual-hazard', runId: 'manual-hazard', policy: 'manual'});
  const hazard = manual.state.room.hazards[0];
  manual.state.tick = hazard.periodTicks - hazard.phaseOffset + hazard.telegraphTicks - 1;
  const targetId = manual.state.visibleObjectIds.find(id => manual.state.objectStates[id] && !manual.state.objectStates[id].inspected);
  const failed = manual.step({kind:'inspect', targetId});
  assert.equal(failed.state.result.reason, 'hazard-failure');
  assert.ok(failed.events.some(event => event.type === 'hazard-failure'));
});

test('continuous runtime applies declared progression at the next-room boundary', () => {
  const cfg = config({difficulty: 2, puzzleDepth: 4, objectCount: 24, hazardCount: 0});
  const runtime = EscapeRuntime.create({config: cfg, seed: 'progression-runtime', runId: 'progression-runtime', policy: 'autonomous'});
  while (!runtime.state.result) runtime.step();
  const firstDifficulty = runtime.state.config.difficulty;
  runtime.step();
  while (runtime.state.lifecycle === 'intermission') runtime.step();
  assert.equal(runtime.state.roomIndex, 2);
  assert.equal(runtime.state.config.theme, escapeThemeForRoom(2));
  assert.ok(runtime.state.config.difficulty >= firstDifficulty);
  assert.equal(runtime.snapshotMaterial().baseConfig.difficulty, cfg.difficulty);
});

test('stratified campaign is deterministic and separates technical evidence from fair outcomes', () => {
  const options = {
    baseConfig: config({puzzleDepth: 6, objectCount: 32, decoyCount: 4, hazardCount: 1, maxTicks: 1200}),
    seeds: ['campaign-a','campaign-b','campaign-c'],
    themes: ['cipher-vault','clockwork-study','chromatic-lab','archive-zero'],
    difficulties: [2, 7, 12, 18],
    maxRuns: 48,
  };
  const a = runEscapeCampaign(options);
  const b = runEscapeCampaign(options);
  assert.deepEqual(a, b);
  assert.equal(a.runCount, 48);
  assert.equal(a.technicalCount, 0);
  assert.equal(a.fairOutcomeCount, a.runCount);
  assert.equal(a.outcomes.escape, a.runCount);
  assert.equal(a.invalidContentCount, 0);
  assert.equal(a.rejectedActionCount, 0);
  assert.ok(a.maxPlannerExpansions <= 64);
  assert.ok(a.p95Ticks > 0);
  assert.ok(a.uniqueFeatureSignatures >= 8);
  assert.ok(a.dramaticPatterns.length >= 4);
  assert.match(a.summaryChecksum, /^[0-9a-f]{8}$/);
  assert.equal(a.summaryChecksum, checksum({...a, summaryChecksum: undefined}));
});

test('campaign explicitly records fallback content without counting it as a legitimate game loss', () => {
  const summary = runEscapeCampaign({
    baseConfig: config({puzzleDepth: 12, objectCount: 6, decoyCount: 0, hazardCount: 0, generationAttempts: 1, maxTicks: 400}),
    seeds: ['fallback-campaign'],
    themes: ['cipher-vault'],
    difficulties: [20],
    maxRuns: 1,
  });
  assert.equal(summary.runCount, 1);
  assert.equal(summary.fallbackCount, 1);
  assert.equal(summary.technicalCount, 0);
  assert.equal(summary.outcomes.escape, 1);
  assert.equal(summary.fairOutcomeCount, 1);
});
