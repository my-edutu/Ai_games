'use strict';

const {
  COMMAND_SCHEMA_VERSION,
  createDefaultConfig,
  createInitialState,
  checksumState,
  stepSimulation,
} = require('../dist/games/eko-street-run/src/index.js');

const DEFAULT_SEED = 'eko-phase1-ci';
const MAX_TICKS = 10000;

function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function runFoundationRoute(seed, measure) {
  const config = createDefaultConfig({ seed });
  let state = createInitialState(config);
  let sourceSequence = 0;
  const checkpointChecksums = [];
  const tickDurationsMs = [];

  while (state.lifecycle === 'running' && state.tick < MAX_TICKS) {
    const command = {
      schemaVersion: COMMAND_SCHEMA_VERSION,
      runId: state.runId,
      targetTick: state.tick,
      priority: 0,
      sourceId: 'headless-foundation-driver',
      sourceSequence: sourceSequence++,
      type: 'move',
      payload: { axis: 1 },
    };

    const started = measure ? process.hrtime.bigint() : 0n;
    const result = stepSimulation(state, [command]);
    if (measure) tickDurationsMs.push(Number(process.hrtime.bigint() - started) / 1e6);

    state = result.state;
    if (result.events.some((event) => event.type === 'checkpoint.reached')) {
      checkpointChecksums.push(result.checksum);
    }
  }

  if (state.lifecycle !== 'completed') {
    throw new Error(`Foundation Route did not complete within ${MAX_TICKS} ticks; lifecycle=${state.lifecycle}`);
  }

  const sorted = [...tickDurationsMs].sort((left, right) => left - right);
  return {
    gameVersion: state.gameVersion,
    deterministicVersion: state.deterministicVersion,
    seed,
    routeId: state.route.id,
    lifecycle: state.lifecycle,
    ticks: state.tick,
    checkpointCount: checkpointChecksums.length,
    checkpointChecksums,
    finalChecksum: checksumState(state),
    timing: {
      samples: tickDurationsMs.length,
      p99Ms: percentile(sorted, 0.99),
      worstMs: sorted.length === 0 ? 0 : sorted[sorted.length - 1],
    },
  };
}

function main() {
  const seed = process.argv[2] || DEFAULT_SEED;
  // Warm one isolated route so module/JIT startup does not masquerade as authoritative tick cost.
  runFoundationRoute(`${seed}:warmup`, false);
  const summary = runFoundationRoute(seed, true);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

main();
