'use strict';

const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { MarbleRuntime } = require('../../../dist/games/marble-survival/src/index.js');

const P99_BUDGET_MS = 8;

function percentile(values, quantile) {
  const sorted = values.slice().sort((left, right) => left - right);
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function summarize(values, memoryBefore, memoryAfter) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    samples: values.length,
    p50Ms: Number(percentile(values, .50).toFixed(4)),
    p95Ms: Number(percentile(values, .95).toFixed(4)),
    p99Ms: Number(percentile(values, .99).toFixed(4)),
    worstMs: Number(Math.max(...values).toFixed(4)),
    meanMs: Number((total / Math.max(1, values.length)).toFixed(4)),
    heapDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
    rssDeltaBytes: memoryAfter.rss - memoryBefore.rss,
  };
}

function runScenario(name, options = {}) {
  const runtime = MarbleRuntime.create({
    rosterSize: 32,
    roundQuotas: [16, 8, 4, 2, 1],
    roundIntroTicks: 0,
    roundTimeoutTicks: 100_000,
  }, `performance-${name}`);
  const samples = [];
  const warmupTicks = options.warmupTicks ?? 120;
  const measuredTicks = options.measuredTicks ?? 720;

  if (options.prepareOnce) options.prepareOnce(runtime);
  for (let tick = 0; tick < warmupTicks; tick++) {
    if (options.prepareTick) options.prepareTick(runtime, tick);
    runtime.step();
  }

  const memoryBefore = process.memoryUsage();
  for (let tick = 0; tick < measuredTicks; tick++) {
    if (options.prepareTick) options.prepareTick(runtime, tick + warmupTicks);
    const start = performance.now();
    runtime.step();
    samples.push(performance.now() - start);
  }
  const memoryAfter = process.memoryUsage();
  return summarize(samples, memoryBefore, memoryAfter);
}

function prepareContactStorm(runtime) {
  runtime.state.arena.hazards = [];
  runtime.state.arena.windZones = [];
  runtime.state.arena.sweepers = [];
  runtime.state.arena.obstacles = [];
  runtime.state.arena.bumpers = [];
}

function packContactStorm(runtime, tick) {
  const active = runtime.state.marbles.filter(marble => marble.status === 'active' && marble.roundStatus === 'racing');
  const radius = runtime.state.config.marbleRadius;
  const spacing = Math.max(1, Math.floor(radius * 1.55));
  const centerX = Math.floor(runtime.state.arena.width / 2);
  const centerY = Math.floor(runtime.state.arena.height / 2);
  const left = centerX - Math.floor((7 * spacing) / 2);
  const top = centerY - Math.floor((3 * spacing) / 2);
  for (let index = 0; index < active.length; index++) {
    const column = index % 8;
    const row = Math.floor(index / 8);
    active[index].position.x = left + column * spacing;
    active[index].position.y = top + row * spacing;
    active[index].velocity.x = (index % 2 === 0 ? 1 : -1) * Math.floor(runtime.state.config.maxSpeed * .55);
    active[index].velocity.y = ((index + tick) % 3 === 0 ? 1 : -1) * Math.floor(runtime.state.config.maxSpeed * .35);
  }
}

const ordinary = runScenario('ordinary', { warmupTicks: 180, measuredTicks: 900 });
const contactStorm = runScenario('contact-storm', {
  warmupTicks: 60,
  measuredTicks: 360,
  prepareOnce: prepareContactStorm,
  prepareTick: packContactStorm,
});

const maximumP99 = Math.max(ordinary.p99Ms, contactStorm.p99Ms);
const report = {
  generatedAt: new Date().toISOString(),
  benchmark: 'Game 7 MarbleRuntime authoritative tick',
  deterministicVersion: 'marble-physics-v2',
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cpu: os.cpus()[0]?.model || 'unknown',
  logicalTickRateHz: 60,
  rosterSize: 32,
  p99BudgetMs: P99_BUDGET_MS,
  scenarios: { ordinary, contactStorm },
  maximumP99Ms: Number(maximumP99.toFixed(4)),
  passesP99Budget: maximumP99 < P99_BUDGET_MS,
  note: 'Node-side authority benchmark only; browser FPS/GPU performance requires separate capture-chain evidence.',
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (process.argv.includes('--enforce') && !report.passesP99Budget) process.exitCode = 1;
