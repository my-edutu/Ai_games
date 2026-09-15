const test = require('node:test');
const assert = require('node:assert/strict');

const { NamedRng } = require('../../dist/packages/seeded-rng/src/index.js');
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,
  parseEscapeRoomConfig,
  generateEscapeRoom,
  solveEscapeRoom,
  validateEscapeRoom,
  escapeRoomFeatureVector,
} = require('../../dist/games/ai-escape-room/src/index.js');

function config(overrides = {}) {
  return parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG, ...overrides});
}

test('parseEscapeRoomConfig enforces exact production bounds', () => {
  const invalid = [
    ['difficulty', 0], ['difficulty', 21], ['maxTicks', 49], ['maxTicks', 1000001],
    ['intermissionTicks', -1], ['intermissionTicks', 10001], ['puzzleDepth', 1], ['puzzleDepth', 13],
    ['objectCount', 5], ['objectCount', 49], ['decoyCount', -1], ['decoyCount', 13],
    ['hazardCount', -1], ['hazardCount', 7], ['hintBudget', -1], ['hintBudget', 7],
    ['generationAttempts', 0], ['generationAttempts', 33], ['noProgressTicks', 19], ['noProgressTicks', 100001],
    ['factHistoryLimit', 15], ['factHistoryLimit', 513], ['commandHistoryLimit', 15], ['commandHistoryLimit', 4097],
  ];
  for (const [key, value] of invalid) {
    assert.throws(() => config({[key]: value}), new RegExp(key));
  }
  assert.throws(() => config({theme: 'unknown'}), /theme/);
  assert.throws(() => config({strategy: 'oracle'}), /strategy/);
  assert.deepEqual(config(), DEFAULT_ESCAPE_ROOM_CONFIG);
});

test('same seed and configuration produce identical room and diagnostics', () => {
  const cfg = config({theme: 'cipher-vault', difficulty: 9, puzzleDepth: 7, objectCount: 20, decoyCount: 4, hazardCount: 2});
  const a = generateEscapeRoom(cfg, NamedRng.fromSeed('vault-17'));
  const b = generateEscapeRoom(cfg, NamedRng.fromSeed('vault-17'));
  assert.deepEqual(a, b);
  assert.equal(a.seed, 'vault-17');
  assert.equal(a.definition.theme, 'cipher-vault');
});

test('cosmetic random draws do not perturb authoritative generation streams', () => {
  const cfg = config({difficulty: 12, puzzleDepth: 8, objectCount: 24});
  const normal = NamedRng.fromSeed('stream-isolation');
  const noisy = NamedRng.fromSeed('stream-isolation');
  for (let i = 0; i < 200; i++) noisy.nextInt('escape.cosmetics.v1', 10_000);
  assert.deepEqual(generateEscapeRoom(cfg, normal), generateEscapeRoom(cfg, noisy));
});

test('generated room has stable unique IDs, constructively ordered prerequisites and a solver route', () => {
  const cfg = config({difficulty: 16, puzzleDepth: 10, objectCount: 36, decoyCount: 8, hazardCount: 4});
  const generated = generateEscapeRoom(cfg, NamedRng.fromSeed('dependency-order'));
  const ids = generated.definition.objects.map(object => object.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(generated.definition.puzzles.length, cfg.puzzleDepth);
  assert.ok(generated.definition.objects.length <= cfg.objectCount);
  const solution = solveEscapeRoom(generated.definition);
  assert.ok(solution);
  assert.ok(solution.actions.length > cfg.puzzleDepth);
  assert.equal(solution.actions.at(-1).kind, 'exit');
  assert.deepEqual(validateEscapeRoom(generated.definition, cfg), {
    valid: true,
    diagnostics: [],
    solutionLength: solution.actions.length,
    featureVector: escapeRoomFeatureVector(generated.definition, solution),
  });
});

test('mandatory clue families have non-color redundant cues and hazards preserve response windows', () => {
  const cfg = config({theme: 'chromatic-lab', difficulty: 20, puzzleDepth: 12, objectCount: 48, hazardCount: 6});
  const {definition} = generateEscapeRoom(cfg, NamedRng.fromSeed('accessibility-proof'));
  for (const puzzle of definition.puzzles) {
    for (const clueId of puzzle.clueIds) {
      const clue = definition.objects.find(object => object.id === clueId);
      assert.ok(clue, `missing clue ${clueId}`);
      assert.ok(clue.publicShape || clue.publicSymbol || clue.publicTextKey, `clue ${clueId} depends on color alone`);
    }
  }
  for (const hazard of definition.hazards) {
    assert.ok(hazard.telegraphTicks >= 3);
    assert.ok(hazard.activeTicks >= 1);
    assert.ok(hazard.periodTicks > hazard.telegraphTicks + hazard.activeTicks);
    assert.equal(hazard.mandatoryPath, false);
  }
});

test('validator reports typed diagnostics for duplicate IDs and broken prerequisites', () => {
  const cfg = config();
  const generated = generateEscapeRoom(cfg, NamedRng.fromSeed('diagnostics'));
  const duplicate = structuredClone(generated.definition);
  duplicate.objects[1].id = duplicate.objects[0].id;
  const duplicateResult = validateEscapeRoom(duplicate, cfg);
  assert.equal(duplicateResult.valid, false);
  assert.ok(duplicateResult.diagnostics.some(item => item.code === 'duplicate-id'));

  const broken = structuredClone(generated.definition);
  broken.puzzles[0].prerequisitePuzzleIds = ['missing-puzzle'];
  const brokenResult = validateEscapeRoom(broken, cfg);
  assert.equal(brokenResult.valid, false);
  assert.ok(brokenResult.diagnostics.some(item => item.code === 'missing-prerequisite'));
});

test('bounded failed attempts use the versioned known-good fallback with observable diagnostics', () => {
  const cfg = config({generationAttempts: 1, puzzleDepth: 12, objectCount: 6, decoyCount: 0, hazardCount: 0});
  const generated = generateEscapeRoom(cfg, NamedRng.fromSeed('force-fallback'));
  assert.equal(generated.diagnostics.usedFallback, true);
  assert.equal(generated.diagnostics.attempts, 1);
  assert.equal(generated.diagnostics.fallbackVersion, 'escape-fallback-v1');
  assert.ok(generated.diagnostics.failures.length > 0);
  assert.equal(validateEscapeRoom(generated.definition, cfg).valid, true);
  assert.ok(solveEscapeRoom(generated.definition));
});
