'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const eko = require('../dist/games/eko-street-run/src/index.js');

const OUTPUT = path.join(process.cwd(), 'evidence', 'eko-run', 'phase6', 'phase6-evidence.json');
const GENERATION_P99_BUDGET_MS = 5;
const GENERATION_WORST_BUDGET_MS = 16.67;
const SIMULATION_P99_BUDGET_MS = 4;
const SIMULATION_WORST_BUDGET_MS = 16.67;
const PLAYER_MAX_SPEED = 7;
const RISK_WEIGHT = { safe: 0, balanced: 1, bold: 2 };

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function timingSummary(values) {
  return {
    samples: values.length,
    p50Ms: percentile(values, 0.50),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    worstMs: Math.max(...values),
  };
}

function riskScore(content) {
  return content.decisions.reduce((sum, decision) => sum + RISK_WEIGHT[decision.risk], 0);
}

function advanceCommand(state, sequence) {
  return {
    schemaVersion: 1,
    runId: state.runId,
    targetTick: state.tick,
    priority: 0,
    sourceId: 'phase6-evidence',
    sourceSequence: sequence,
    type: 'advance',
    payload: {},
  };
}

const generationTimings = [];
const fingerprints = new Set();
let generatedCount = 0;
let validCount = 0;
let fallbackCount = 0;
let repairedCount = 0;
let minimumResponseMargin = Number.POSITIVE_INFINITY;
const districtMetrics = [];

for (let districtIndex = 0; districtIndex < eko.PHASE6_DISTRICT_IDS.length; districtIndex += 1) {
  const districtId = eko.PHASE6_DISTRICT_IDS[districtIndex];
  const reference = {};
  for (const cycle of [0, 4, 8]) {
    let hazardTotal = 0;
    let riskTotal = 0;
    const localFingerprints = new Set();
    for (let sample = 0; sample < 24; sample += 1) {
      const seed = `phase6-evidence-${districtIndex}-${sample}`;
      const started = performance.now();
      const content = eko.generateDistrict(seed, districtIndex, cycle);
      generationTimings.push(performance.now() - started);
      generatedCount += 1;
      const validation = eko.validateGeneratedDistrict(content);
      if (validation.valid) validCount += 1;
      if (content.validation.fallbackUsed) fallbackCount += 1;
      if (content.validation.repairCount > 0) repairedCount += 1;
      const recomputed = eko.fingerprintGeneratedDistrict(content);
      if (recomputed !== content.fingerprint) throw new Error(`fingerprint mismatch for ${districtId} cycle ${cycle}`);
      fingerprints.add(content.fingerprint);
      localFingerprints.add(content.fingerprint);
      hazardTotal += content.hazards.length;
      riskTotal += riskScore(content);
      for (const hazard of content.hazards) {
        const minimumTravelDistance = (PLAYER_MAX_SPEED + (hazard.maxHazardSpeed || 0)) * (hazard.minResponseTicks / 60);
        minimumResponseMargin = Math.min(minimumResponseMargin, hazard.warningDistance - minimumTravelDistance);
      }
    }
    reference[cycle] = {
      meanHazards: hazardTotal / 24,
      meanRiskScore: riskTotal / 24,
      uniqueFingerprints: localFingerprints.size,
    };
  }
  districtMetrics.push({ districtId, cycles: reference });
}

const determinismChecks = [];
for (let districtIndex = 0; districtIndex < eko.PHASE6_DISTRICT_IDS.length; districtIndex += 1) {
  for (const cycle of [0, 1, 4, 8, 16]) {
    const seed = `phase6-repeat-${districtIndex}-${cycle}`;
    const first = eko.generateDistrict(seed, districtIndex, cycle);
    const second = eko.generateDistrict(seed, districtIndex, cycle);
    const pass = JSON.stringify(first) === JSON.stringify(second) && first.fingerprint === second.fingerprint;
    determinismChecks.push({ districtId: first.districtId, cycle, fingerprint: first.fingerprint, pass });
    if (!pass) throw new Error(`generation repeat failed for ${first.districtId} cycle ${cycle}`);
  }
}

for (const metric of districtMetrics) {
  if (!(metric.cycles[8].meanHazards > metric.cycles[0].meanHazards)) throw new Error(`${metric.districtId} did not increase real hazard density`);
  if (!(metric.cycles[8].meanRiskScore > metric.cycles[0].meanRiskScore)) throw new Error(`${metric.districtId} did not increase optional risk pressure`);
}
if (minimumResponseMargin < -1e-9) throw new Error(`fairness response margin fell below zero: ${minimumResponseMargin}`);

let tokenState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-token' }));
const token = tokenState.progression.activeContent.tokens[0];
tokenState.player.position.x = token.x;
let tokenResult = eko.stepSimulation(tokenState, []);
const firstTokenBalance = tokenResult.state.resources.ekoTokens;
const firstEarnedTotal = tokenResult.state.resources.earnedTokenTotal;
tokenState = structuredClone(tokenResult.state);
tokenState.player.position.x = token.x;
tokenResult = eko.stepSimulation(tokenState, []);
const tokenIdempotencyPass = tokenResult.state.resources.ekoTokens === firstTokenBalance
  && tokenResult.state.resources.earnedTokenTotal === firstEarnedTotal
  && tokenResult.state.resources.collectedTokenIds.filter(id => id === token.id).length === 1;
if (!tokenIdempotencyPass) throw new Error('token idempotency/audit failed');

let transitionState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-transition' }));
transitionState.lifecycle = 'intermission';
const transitionSnapshot = eko.createSnapshot(transitionState);
const restoredTransition = eko.restoreSnapshot(JSON.parse(JSON.stringify(transitionSnapshot)));
const directAdvance = eko.stepSimulation(transitionState, [advanceCommand(transitionState, 1)]);
const restoredAdvance = eko.stepSimulation(restoredTransition, [advanceCommand(restoredTransition, 1)]);
const snapshotAdvancePass = directAdvance.checksum === restoredAdvance.checksum
  && directAdvance.state.progression.districtId === 'market-rush';
if (!snapshotAdvancePass) throw new Error('snapshot/restore advance mismatch');

let wrapState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-wrap' }));
for (let sequence = 1; sequence <= 6; sequence += 1) {
  wrapState.lifecycle = 'intermission';
  wrapState = eko.stepSimulation(wrapState, [advanceCommand(wrapState, sequence)]).state;
}
const wrapPass = wrapState.progression.districtIndex === 0
  && wrapState.progression.districtId === 'mainland-morning'
  && wrapState.progression.cycle === 1;
if (!wrapPass) throw new Error('district ladder wrap failed');

const corruptState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-corrupt' }));
corruptState.progression.activeContent.hazards[0].baseX += 0.5;
let staleFingerprintRejected = false;
try {
  eko.assertStateInvariants(corruptState);
} catch (error) {
  staleFingerprintRejected = error && error.code === 'GENERATED_CONTENT_FINGERPRINT_MISMATCH';
}
if (!staleFingerprintRejected) throw new Error('stale generated-content fingerprint was not rejected');

const invalidRehashedState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-rehash' }));
invalidRehashedState.progression.activeContent.tokens[0].x = invalidRehashedState.route.finishX + 4;
invalidRehashedState.progression.activeContent.fingerprint = eko.fingerprintGeneratedDistrict(invalidRehashedState.progression.activeContent);
invalidRehashedState.progression.activeContent.validation = { valid: true, repairCount: 0, fallbackUsed: false, codes: [] };
let invalidRehashRejected = false;
try {
  eko.assertStateInvariants(invalidRehashedState);
} catch (error) {
  invalidRehashRejected = error && error.code === 'INVALID_GENERATED_CONTENT';
}
if (!invalidRehashRejected) throw new Error('invalid rehashed generated content was not rejected');

const simulationTimings = [];
let simState = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase6-evidence-sim-perf' }));
for (let tick = 0; tick < 1800; tick += 1) {
  const started = performance.now();
  const result = eko.stepSimulation(simState, []);
  simulationTimings.push(performance.now() - started);
  simState = result.state;
}

const generationTiming = timingSummary(generationTimings);
const simulationTiming = timingSummary(simulationTimings);
const budgets = {
  generation: {
    p99Ms: GENERATION_P99_BUDGET_MS,
    worstMs: GENERATION_WORST_BUDGET_MS,
    p99Pass: generationTiming.p99Ms <= GENERATION_P99_BUDGET_MS,
    worstPass: generationTiming.worstMs <= GENERATION_WORST_BUDGET_MS,
  },
  simulation: {
    p99Ms: SIMULATION_P99_BUDGET_MS,
    worstMs: SIMULATION_WORST_BUDGET_MS,
    p99Pass: simulationTiming.p99Ms <= SIMULATION_P99_BUDGET_MS,
    worstPass: simulationTiming.worstMs <= SIMULATION_WORST_BUDGET_MS,
  },
};

if (!budgets.generation.p99Pass || !budgets.generation.worstPass || !budgets.simulation.p99Pass || !budgets.simulation.worstPass) {
  throw new Error(`Phase 6 performance budget failed: ${JSON.stringify({ generationTiming, simulationTiming, budgets })}`);
}

const evidence = {
  phase: 6,
  generatorVersion: eko.PHASE6_GENERATOR_VERSION,
  districtIds: eko.PHASE6_DISTRICT_IDS,
  generatedCount,
  validCount,
  validityRate: validCount / generatedCount,
  fallbackCount,
  fallbackRate: fallbackCount / generatedCount,
  repairedCount,
  uniqueFingerprints: fingerprints.size,
  determinismChecks,
  districtMetrics,
  minimumResponseMarginMeters: minimumResponseMargin,
  tokenAudit: {
    idempotencyPass: tokenIdempotencyPass,
    firstTokenBalance,
    firstEarnedTotal,
  },
  replay: {
    snapshotAdvancePass,
    directAdvanceChecksum: directAdvance.checksum,
    restoredAdvanceChecksum: restoredAdvance.checksum,
    wrapPass,
  },
  integrity: {
    staleFingerprintRejected,
    invalidRehashRejected,
  },
  timing: {
    generation: generationTiming,
    simulation: simulationTiming,
  },
  budgets,
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(evidence, null, 2));
