'use strict';

const {
  COMMAND_SCHEMA_VERSION,
  createDefaultConfig,
  createInitialState,
  createMovementGrayboxRoute,
  stepSimulation,
  createSnapshot,
  restoreSnapshot,
  checksumState,
} = require('../dist/games/eko-street-run/src/index.js');

const DEFAULT_SEED = 'eko-phase2-ci';
const P99_BUDGET_MS = 4;
const WORST_BUDGET_MS = 16.67;

function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function flatStressRoute(id) {
  const route = createMovementGrayboxRoute();
  route.id = id;
  route.checkpointXs = [];
  route.finishX = 28;
  route.groundSegments = [{ id: `${id}-ground`, minX: route.minX, maxX: route.maxX, y: 0 }];
  route.slopes = [];
  route.colliders = [];
  return route;
}

function prepareState(seed, route, position = { x: 0, y: 0 }) {
  const config = createDefaultConfig({ seed });
  const state = createInitialState(config);
  state.route = clone(route);
  state.player.position = { ...position };
  state.player.velocity = { x: 0, y: 0 };
  state.player.movementState = 'grounded';
  state.player.coyoteTicksRemaining = config.coyoteTicks;
  state.player.jumpBufferTicksRemaining = 0;
  state.player.jumpCutConsumed = false;
  state.player.landingCompressionTicksRemaining = 0;
  state.player.slideTicksRemaining = 0;
  state.player.stumbleTicksRemaining = 0;
  state.player.vault = null;
  state.player.checkpointIndex = 0;
  state.player.progress = Math.max(0, position.x - state.route.startX);
  state.record.maxProgress = state.player.progress;
  state.record.completedTick = null;
  state.lifecycle = 'running';
  state.commandWatermarks = {};
  return { config, state };
}

function moveCommand(state, sequence, payload) {
  return {
    schemaVersion: COMMAND_SCHEMA_VERSION,
    runId: state.runId,
    targetTick: state.tick,
    priority: 0,
    sourceId: 'phase2-headless-driver',
    sourceSequence: sequence,
    type: 'move',
    payload,
  };
}

function accumulateEvents(target, events) {
  for (const event of events) target[event.type] = (target[event.type] ?? 0) + 1;
}

function runTicks({ state, config, count, commandForTick, measure, timings, eventCounts, sequenceStart = 0 }) {
  let current = state;
  let sequence = sequenceStart;
  for (let localTick = 0; localTick < count; localTick += 1) {
    const payload = commandForTick ? commandForTick(current, localTick) : null;
    const commands = payload ? [moveCommand(current, sequence++, payload)] : [];
    const started = measure ? process.hrtime.bigint() : 0n;
    const result = stepSimulation(current, commands, config);
    if (measure) timings.push(Number(process.hrtime.bigint() - started) / 1e6);
    accumulateEvents(eventCounts, result.events);
    current = result.state;
    if (current.lifecycle !== 'running') break;
  }
  return { state: current, nextSequence: sequence };
}

function runFlatControl(seed, measure, timings, eventCounts) {
  const { config, state } = prepareState(seed, flatStressRoute('phase2-control-stress-001'));
  const result = runTicks({
    state,
    config,
    count: 900,
    measure,
    timings,
    eventCounts,
    commandForTick: (_current, tick) => {
      const cycle = tick % 180;
      return {
        axis: cycle < 90 ? 1 : -1,
        jumpPressed: cycle === 20,
        jumpReleased: cycle === 28,
        slide: cycle === 80,
        vault: false,
      };
    },
  });
  if (result.state.lifecycle !== 'running') throw new Error(`flat control scenario terminated unexpectedly: ${result.state.lifecycle}`);
  return { id: 'flat-control', ticks: result.state.tick, checksum: checksumState(result.state), finalState: result.state };
}

function runVault(seed, measure, timings, eventCounts) {
  const route = flatStressRoute('phase2-vault-stress-001');
  route.colliders = [{ id: 'stress-vault-block', minX: 2.8, maxX: 3.4, minY: 0, maxY: 0.75, kind: 'vault' }];
  const { config, state } = prepareState(seed, route, { x: 2, y: 0 });
  const result = runTicks({
    state,
    config,
    count: 30,
    measure,
    timings,
    eventCounts,
    commandForTick: (_current, tick) => ({ axis: tick < 2 ? 1 : 0, jumpPressed: false, jumpReleased: false, slide: false, vault: tick === 0 }),
  });
  if ((eventCounts['player.vaulted'] ?? 0) < 1) throw new Error('vault scenario did not emit player.vaulted');
  return { id: 'vault', ticks: result.state.tick, checksum: checksumState(result.state), finalState: result.state };
}

function runStumble(seed, measure, timings, eventCounts) {
  const route = flatStressRoute('phase2-stumble-stress-001');
  const { config, state } = prepareState(seed, route, { x: 2, y: 8 });
  state.player.velocity = { x: 1, y: -13 };
  state.player.movementState = 'falling';
  state.player.coyoteTicksRemaining = 0;
  const result = runTicks({
    state,
    config,
    count: 120,
    measure,
    timings,
    eventCounts,
    commandForTick: () => ({ axis: 0.25, jumpPressed: false, jumpReleased: false, slide: false, vault: false }),
  });
  if ((eventCounts['player.stumbled'] ?? 0) < 1) throw new Error('stumble scenario did not emit player.stumbled');
  if (result.state.player.movementState !== 'grounded') throw new Error(`stumble scenario failed to recover: ${result.state.player.movementState}`);
  return { id: 'stumble-recovery', ticks: result.state.tick, checksum: checksumState(result.state), finalState: result.state };
}

function runMovingSweep(seed, measure, timings, eventCounts) {
  const route = flatStressRoute('phase2-moving-sweep-stress-001');
  route.colliders = [{
    id: 'stress-fast-moving-solid',
    minX: 2.5,
    maxX: 3,
    minY: 0,
    maxY: 1.5,
    kind: 'moving',
    motion: { minOffsetX: -2, maxOffsetX: 2, periodTicks: 2 },
  }];
  const { config, state } = prepareState(seed, route, { x: 2, y: 0 });
  const beforeX = state.player.position.x;
  const result = runTicks({ state, config, count: 1, measure, timings, eventCounts });
  if (Math.abs(result.state.player.position.x - beforeX) < config.playerHalfWidth) throw new Error('moving sweep scenario did not displace player');
  return { id: 'moving-sweep', ticks: result.state.tick, checksum: checksumState(result.state), finalState: result.state };
}

function snapshotContinuity(seed) {
  const route = flatStressRoute('phase2-snapshot-vault-001');
  route.colliders = [{ id: 'snapshot-vault-block', minX: 2.8, maxX: 3.4, minY: 0, maxY: 0.75, kind: 'vault' }];
  const { config, state } = prepareState(seed, route, { x: 2, y: 0 });
  let sequence = 0;
  let current = stepSimulation(state, [moveCommand(state, sequence++, { axis: 1, jumpPressed: false, jumpReleased: false, slide: false, vault: true })], config).state;
  for (let index = 0; index < 4; index += 1) current = stepSimulation(current, [], config).state;
  if (current.player.movementState !== 'vaulting') throw new Error('snapshot continuity fixture did not reach mid-vault state');
  let uninterrupted = current;
  let resumed = restoreSnapshot(createSnapshot(current));
  for (let index = 0; index < config.vaultDurationTicks + 4; index += 1) {
    uninterrupted = stepSimulation(uninterrupted, [], config).state;
    resumed = stepSimulation(resumed, [], config).state;
  }
  const uninterruptedChecksum = checksumState(uninterrupted);
  const resumedChecksum = checksumState(resumed);
  return {
    pass: uninterruptedChecksum === resumedChecksum,
    uninterruptedChecksum,
    resumedChecksum,
  };
}

function runSuite(seed, measure) {
  const timings = [];
  const eventCounts = {};
  const scenarios = [
    runFlatControl(`${seed}:control`, measure, timings, eventCounts),
    runVault(`${seed}:vault`, measure, timings, eventCounts),
    runStumble(`${seed}:stumble`, measure, timings, eventCounts),
    runMovingSweep(`${seed}:moving`, measure, timings, eventCounts),
  ];
  return {
    scenarios: scenarios.map(({ id, ticks, checksum }) => ({ id, ticks, checksum })),
    eventCounts,
    timings,
  };
}

function sameDeterministicSummary(left, right) {
  return JSON.stringify({ scenarios: left.scenarios, eventCounts: left.eventCounts })
    === JSON.stringify({ scenarios: right.scenarios, eventCounts: right.eventCounts });
}

function main() {
  const seed = process.argv[2] || DEFAULT_SEED;
  runSuite(`${seed}:warmup`, false);
  const measured = runSuite(seed, true);
  const repeat = runSuite(seed, false);
  const snapshot = snapshotContinuity(`${seed}:snapshot`);

  const sorted = [...measured.timings].sort((a, b) => a - b);
  const timing = {
    samples: sorted.length,
    p50Ms: percentile(sorted, 0.50),
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    worstMs: sorted.length === 0 ? 0 : sorted[sorted.length - 1],
  };
  const budgets = {
    p99Ms: P99_BUDGET_MS,
    worstMs: WORST_BUDGET_MS,
    p99Pass: timing.p99Ms < P99_BUDGET_MS,
    worstPass: timing.worstMs < WORST_BUDGET_MS,
  };
  const determinismPass = sameDeterministicSummary(measured, repeat);
  const requiredEventsPass = (measured.eventCounts['player.jumped'] ?? 0) >= 4
    && (measured.eventCounts['player.slid'] ?? 0) >= 4
    && (measured.eventCounts['player.vaulted'] ?? 0) >= 1
    && (measured.eventCounts['player.stumbled'] ?? 0) >= 1
    && (measured.eventCounts['player.landed'] ?? 0) >= 4;

  const summary = {
    scenarioId: 'phase2-graybox-authority-001',
    seed,
    gameVersion: createDefaultConfig({ seed }).gameVersion,
    deterministicVersion: createDefaultConfig({ seed }).deterministicVersion,
    scenarios: measured.scenarios,
    eventCounts: measured.eventCounts,
    determinism: {
      repeatPass: determinismPass,
      snapshotRestorePass: snapshot.pass,
      snapshotUninterruptedChecksum: snapshot.uninterruptedChecksum,
      snapshotResumedChecksum: snapshot.resumedChecksum,
    },
    requiredEventsPass,
    timing,
    budgets,
  };

  process.stdout.write(`${JSON.stringify(summary)}\n`);

  if (!determinismPass || !snapshot.pass || !requiredEventsPass || !budgets.p99Pass || !budgets.worstPass) {
    process.exitCode = 1;
  }
}

main();
