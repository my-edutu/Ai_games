'use strict';

const path = require('node:path');

const COMPILED_RUNTIME = path.resolve(
  __dirname,
  '../../../dist/games/marble-survival-tournament/src/index.js',
);

function loadAuthority() {
  try {
    return require(COMPILED_RUNTIME);
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      const wrapped = new Error('Marble Survival compiled authority is missing. Run `npm run build` before the balance campaign.');
      wrapped.cause = error;
      throw wrapped;
    }
    throw error;
  }
}

function percentile(values, quantile) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const boundedQuantile = Number.isFinite(quantile) ? Math.max(0, Math.min(1, quantile)) : 0;
  const sorted = values
    .map((value) => Math.round(Number(value) || 0))
    .sort((left, right) => left - right);
  const index = Math.round((sorted.length - 1) * boundedQuantile);
  return sorted[index];
}

function summarize(values) {
  return {
    count: values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    max: values.length === 0 ? 0 : Math.max(...values),
  };
}

function runOne(seed, maxStepsPerSeed, config) {
  const { MarbleRuntime } = loadAuthority();
  const runtime = MarbleRuntime.create(config, seed);
  let steps = 0;
  let totalEvents = runtime.drainEvents().length;
  let fallbackArenas = 0;
  const seenArenaIds = new Set();

  function observeArena() {
    const arena = runtime.state.arena;
    if (seenArenaIds.has(arena.id)) return;
    seenArenaIds.add(arena.id);
    if (arena.fallbackUsed) fallbackArenas += 1;
  }

  observeArena();
  while (
    steps < maxStepsPerSeed
    && runtime.state.lifecycle !== 'tournament-result'
    && runtime.state.lifecycle !== 'quarantined'
  ) {
    runtime.step();
    steps += 1;
    observeArena();
    totalEvents += runtime.drainEvents().length;
  }

  const state = runtime.state;
  let outcome = 'step-limit';
  if (state.lifecycle === 'quarantined' || state.result?.kind === 'technical') outcome = 'technical';
  else if (state.lifecycle === 'tournament-result' && state.result?.kind === 'champion') outcome = 'completed';

  const champion = state.result?.kind === 'champion'
    ? state.marbles.find((marble) => marble.id === state.result.championId) ?? null
    : null;

  return {
    seed,
    outcome,
    steps,
    tournamentTicks: state.tournamentTick,
    championId: state.result?.kind === 'champion' ? state.result.championId : null,
    championArchetype: champion?.archetype ?? null,
    roundDurations: state.roundResults.map((round) => round.durationTicks),
    roundResolutions: state.roundResults.map((round) => round.resolution),
    fallbackArenas,
    totalEvents,
    lifecycle: state.lifecycle,
  };
}

function runCampaign(options = {}) {
  const seeds = Array.isArray(options.seeds) ? options.seeds.map(String) : [];
  const maxStepsPerSeed = Number.isInteger(options.maxStepsPerSeed) && options.maxStepsPerSeed > 0
    ? options.maxStepsPerSeed
    : 30_000;
  const config = options.config && typeof options.config === 'object' ? options.config : {};
  const runs = seeds.map((seed) => runOne(seed, maxStepsPerSeed, config));
  const roundDurations = runs.flatMap((run) => run.roundDurations);
  const championArchetypes = {};

  for (const run of runs) {
    if (!run.championArchetype) continue;
    championArchetypes[run.championArchetype] = (championArchetypes[run.championArchetype] || 0) + 1;
  }

  return {
    schemaVersion: 1,
    sampleCount: runs.length,
    completed: runs.filter((run) => run.outcome === 'completed').length,
    technical: runs.filter((run) => run.outcome === 'technical').length,
    stepLimit: runs.filter((run) => run.outcome === 'step-limit').length,
    fallbackArenas: runs.reduce((sum, run) => sum + run.fallbackArenas, 0),
    totalEvents: runs.reduce((sum, run) => sum + run.totalEvents, 0),
    roundDurationTicks: summarize(roundDurations),
    championArchetypes,
    runs,
  };
}

if (require.main === module) {
  const seeds = Array.from({ length: 24 }, (_, index) => `marble-balance-${String(index + 1).padStart(3, '0')}`);
  process.stdout.write(`${JSON.stringify(runCampaign({ seeds }), null, 2)}\n`);
}

module.exports = { percentile, runCampaign };
