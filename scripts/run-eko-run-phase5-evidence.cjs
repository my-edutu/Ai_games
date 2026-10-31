'use strict';
const { performance } = require('node:perf_hooks');
const eko = require('../dist/games/eko-street-run/src/index.js');

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

function finiteTree(value) {
  let finite = true;
  JSON.stringify(value, (_key, item) => {
    if (typeof item === 'number' && !Number.isFinite(item)) finite = false;
    return item;
  });
  return finite;
}

function run(seed) {
  const config = eko.createDefaultConfig({ seed });
  let state = eko.createPhase5State(config);
  const samples = [];
  for (let tick = 0; tick < 3000; tick += 1) {
    const start = performance.now();
    state = eko.stepSimulation(state, [], config).state;
    samples.push(performance.now() - start);
  }
  return { state, samples, checksum: eko.checksumState(state) };
}

const seed = 'eko-phase5-evidence';
const first = run(seed);
const second = run(seed);
const contracts = eko.getPhase5HazardContracts(seed).sort((a, b) => a.baseX - b.baseX);
let minimumIndependentGap = Infinity;
for (let index = 0; index < contracts.length - 1; index += 1) {
  const current = contracts[index];
  const next = contracts[index + 1];
  const gap = (next.baseX - next.warningDistance) - (current.baseX + current.width * 0.5);
  minimumIndependentGap = Math.min(minimumIndependentGap, gap);
}
const snapshot = eko.createRenderSnapshot(first.state, []);
const sanitizedSnapshot = !('rootSeed' in snapshot) && !('commandWatermarks' in snapshot)
  && snapshot.hazards.every(item => !('warningTick' in item) && !('phaseOffsetTicks' in item));
const summary = {
  phase: 5,
  seed,
  routeId: first.state.route.id,
  hazardContracts: contracts.length,
  deterministicChecksum: first.checksum,
  repeatChecksum: second.checksum,
  determinismPass: first.checksum === second.checksum,
  finiteStatePass: finiteTree(first.state),
  sanitizedSnapshotPass: sanitizedSnapshot,
  minimumIndependentGapMeters: minimumIndependentGap,
  requiredIndependentGapMeters: 3.5,
  independentGapPass: minimumIndependentGap >= 3.5,
  warningGracePass: contracts.every(item => item.minResponseTicks >= 24),
  timing: {
    samples: first.samples.length,
    p50Ms: percentile(first.samples, 0.50),
    p95Ms: percentile(first.samples, 0.95),
    p99Ms: percentile(first.samples, 0.99),
    worstMs: Math.max(...first.samples),
  },
  budgets: { p99Ms: 4, worstMs: 16.67 },
};
summary.budgets.p99Pass = summary.timing.p99Ms < summary.budgets.p99Ms;
summary.budgets.worstPass = summary.timing.worstMs < summary.budgets.worstMs;
console.log(JSON.stringify(summary));
if (!summary.determinismPass || !summary.finiteStatePass || !summary.sanitizedSnapshotPass || !summary.independentGapPass || !summary.warningGracePass || !summary.budgets.p99Pass || !summary.budgets.worstPass) process.exit(1);
