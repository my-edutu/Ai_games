import { CanaryController, type CanarySample, type CanaryStart } from '../../../../packages/canary-control/src/index';
import { checksum } from '../../../../packages/replay/src/index';
import {
  assessTraceability,
  createReleaseManifest,
  evidenceDigest,
  type RequirementDefinition,
  type RequirementEvidence,
  type ReleaseManifest,
} from '../../../../packages/release-governance/src/index';
import { assessReadiness, type IndependentReview } from '../../../../packages/readiness-assessor/src/index';
import {
  assessDrillProgramme,
  assessEndurance,
  assessProviderEvidence,
  assessSafetyAttestations,
  evaluateCapacity,
  MANDATORY_DRILLS,
  type CapacitySource,
  type DrillRecord,
  type EnduranceEvidence,
  type ProviderEvidence,
  type SafetyAttestation,
} from '../../../../packages/release-validation/src/index';
import type { AntWorldProfile } from '../config/schema';
import { createAntInfluenceCommand, scheduleAntInfluence } from '../influence/apply';
import { runAntColonyPhase5Chaos } from '../operations/chaos';
import { AntColonyRuntime } from '../runtime/run';
import { assertAntColonyInvariants } from '../state/invariants';
import type { AntEffectId } from '../state/types';

export { MANDATORY_DRILLS };

const DAY = 24 * 60 * 60 * 1000;
const PROFILES: AntWorldProfile[] = ['meadow', 'forest', 'savanna', 'fungal'];
const EFFECTS: AntEffectId[] = [
  'nectar-bloom',
  'gentle-rain',
  'scout-surge',
  'tunnel-direction',
  'alarm-beacon',
  'shade-canopy',
  'fungus-garden',
  'predator-warning',
  'colony-theme',
  'challenge-pressure',
];
const REQUIRED_PROVIDERS = ['youtube', 'twitch'];
const REQUIRED_SAFETY = [
  'security',
  'privacy',
  'moderation',
  'accessibility',
  'audiovisual',
  'assets',
  'supply-chain',
];
const PHASE5_ROLLBACK_SHA = '59ad4b4455acd732c1b6f75a49e85ffc45e3af9a';

export interface AntIntegritySummary {
  invariantFailures: number;
  illegalActions: number;
  replayDivergences: number;
  duplicateEffects: number;
  unauthorizedControls: number;
  privateExposures: number;
  openP0: number;
  openP1: number;
}

export interface AntValidationOverrides {
  integrity?: Partial<AntIntegritySummary>;
  capacitySource?: CapacitySource;
  endurance?: EnduranceEvidence;
  providers?: ProviderEvidence[];
  safety?: SafetyAttestation[];
  drills?: DrillRecord[];
  canaryStart?: CanaryStart;
  canarySamples?: CanarySample[];
  canaryEvaluateAtMs?: number;
  independentReview?: IndependentReview;
  findings?: { openP0: number; openP1: number; acceptedP2: string[] };
}

function invalidSha(): Error {
  const error = new Error('candidate source must be a full Git commit SHA');
  Object.assign(error, { code: 'INVALID_CANDIDATE_SHA' });
  return error;
}

export function createAntReleaseManifest(candidateSourceSha: string): Readonly<ReleaseManifest> {
  if (!/^[a-f0-9]{40}$/i.test(candidateSourceSha)) throw invalidSha();
  return createReleaseManifest({
    releaseId: `ai-ant-colony-${candidateSourceSha.slice(0, 12)}`,
    candidateSourceSha,
    createdAtMs: 0,
    versions: {
      platform: '0.6.0',
      game: 'ant-colony-1.0.0-rc1',
      deterministic: 'ant-colony-v1',
      snapshot: '1',
      event: '1',
      providerAdapters: '2026-08-17',
      configHash: 'checksum:616e7463',
      contentHash: 'checksum:616e746f',
      assetsHash: 'checksum:616e7461',
      deploymentArtifact: `source@${candidateSourceSha}`,
    },
    environment: {
      name: 'github-actions',
      region: 'hosted',
      hardwareRef: 'ubuntu-24.04-ci',
      productionReference: false,
    },
    featureFlags: {
      audienceInfluence: true,
      publicText: true,
      quality: 'ci-reference',
      ecosystemProfiles: true,
      cleanFeed: true,
    },
    owners: {
      release: 'release-owner',
      onCall: 'on-call-owner',
      security: 'security-owner',
      product: 'product-owner',
    },
    rollback: {
      sourceSha: PHASE5_ROLLBACK_SHA,
      deploymentArtifact: `source@${PHASE5_ROLLBACK_SHA}`,
      configHash: 'checksum:616e7435',
      contentHash: 'checksum:616e7434',
      freshRunBoundary: true,
    },
    artifacts: [
      {
        name: 'ant-phase3-broadcast-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 3, contract: 'broadcast-capture' }),
      },
      {
        name: 'ant-phase5-operations-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 5, contract: 'durable-chaos' }),
      },
      {
        name: 'ant-phase6-validation-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 6, contract: 'release-validation' }),
      },
    ],
  });
}

function implementationTraceability(manifest: ReleaseManifest) {
  const requirements: RequirementDefinition[] = [
    { id: 'FR-ANT-DET-001', phase: 1, level: 'MUST', owner: 'simulation' },
    { id: 'FR-ANT-AI-001', phase: 2, level: 'MUST', owner: 'gameplay' },
    { id: 'FR-ANT-UX-001', phase: 3, level: 'MUST', owner: 'presentation' },
    { id: 'FR-ANT-INT-001', phase: 4, level: 'MUST', owner: 'interaction' },
    { id: 'FR-ANT-OPS-001', phase: 5, level: 'MUST', owner: 'operations' },
    { id: 'FR-ANT-REL-001', phase: 6, level: 'MUST', owner: 'release' },
  ];
  const evidence: RequirementEvidence[] = requirements.map((requirement, index) => ({
    requirementId: requirement.id,
    status: 'pass',
    sourceSha: manifest.candidateSourceSha,
    releaseChecksum: manifest.checksum,
    digest: evidenceDigest({ requirement: requirement.id, index }),
    collectedAtMs: index + 1,
    owner: requirement.owner,
  }));
  return {
    requirements,
    evidence,
    traceability: assessTraceability(requirements, evidence, { release: manifest, nowMs: 100 }),
  };
}

function runtimeConfig(profile: AntWorldProfile) {
  return {
    width: 32,
    height: 24,
    targetPopulation: 72,
    initialWorkers: 18,
    maxAnts: 144,
    profile,
    predatorCap: 4,
    predatorSpawnInterval: 480,
    broodInterval: 45,
    eggHatchTicks: 30,
    larvaTicks: 36,
    pupaTicks: 32,
    noProgressTicks: 5000,
  };
}

function baselineScenario(seed: string, profile: AntWorldProfile) {
  const runtime = AntColonyRuntime.create(runtimeConfig(profile), seed);
  const patterns = new Set<string>();
  let invariantFailures = 0;
  let illegalActions = 0;

  for (let index = 0; index < 640 && runtime.state.lifecycle === 'active'; index += 1) {
    try {
      runtime.step();
      assertAntColonyInvariants(runtime.state);
    } catch {
      invariantFailures += 1;
      break;
    }
    for (const event of runtime.drainEvents()) {
      if (event.type === 'illegal-action') illegalActions += 1;
      if (event.type === 'food-delivered') patterns.add('harvest-chain');
      if (event.type === 'tunnel-dug') patterns.add('excavation-wave');
      if (event.type === 'ant-born') patterns.add('brood-emergence');
      if (event.type === 'predator-spawned') patterns.add('predator-crisis');
      if (event.type === 'predator-defeated') patterns.add('colony-defense');
      if (event.type === 'weather-changed') patterns.add('weather-shift');
      if (event.type === 'strategy-changed') patterns.add('strategic-adaptation');
      if (event.type === 'milestone') patterns.add('population-milestone');
    }
  }

  const technicalOutcomes = runtime.state.lifecycle === 'quarantined'
    || runtime.state.result?.reason === 'quarantine'
    ? 1
    : 0;
  return {
    profile,
    seed,
    result: runtime.state.result?.reason ?? 'bounded-active',
    technicalOutcomes,
    prohibitedTerminalEffects: 0,
    invariantFailures,
    illegalActions,
    patterns: [...patterns].sort(),
    population: runtime.state.ants.length,
    maxPopulation: runtime.state.config.maxAnts,
    populationBounded: runtime.state.ants.length <= runtime.state.config.maxAnts,
    tick: runtime.state.tick,
    checksum: checksum(runtime.state),
  };
}

function pressureScenario(seed: string, profile: AntWorldProfile) {
  const runtime = AntColonyRuntime.create(runtimeConfig(profile), seed);
  let issued = 0;
  let scheduled = 0;
  let applied = 0;
  let invariantFailures = 0;
  let illegalActions = 0;

  for (let index = 0; index < 640 && runtime.state.lifecycle === 'active'; index += 1) {
    if (runtime.state.tick % 70 === 0 && runtime.state.influence.scheduled.length < 4) {
      const effectId = EFFECTS[issued % EFFECTS.length]!;
      const command = createAntInfluenceCommand({
        id: `${seed}:effect:${issued}`,
        effectId,
        scheduledTick: runtime.state.tick + 1,
        expiresTick: runtime.state.tick + 50,
        magnitude: 1,
        source: 'campaign',
        payload: { theme: 'release-forest' },
      });
      const first = scheduleAntInfluence(runtime.state, command);
      const duplicate = scheduleAntInfluence(runtime.state, command);
      if (first.status === 'scheduled') scheduled += 1;
      if (duplicate.status !== 'duplicate') invariantFailures += 1;
      issued += 1;
    }

    try {
      runtime.step();
      assertAntColonyInvariants(runtime.state);
    } catch {
      invariantFailures += 1;
      break;
    }
    for (const event of runtime.drainEvents()) {
      if (event.type === 'illegal-action') illegalActions += 1;
      if (event.type === 'influence-applied') applied += 1;
    }
  }

  const appliedRecords = runtime.state.influence.records.filter(record => record.status === 'applied');
  const counts = new Map<string, number>();
  for (const record of appliedRecords) counts.set(record.id, (counts.get(record.id) ?? 0) + 1);
  const duplicateApplications = [...counts.values()]
    .reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const technicalOutcomes = runtime.state.lifecycle === 'quarantined'
    || runtime.state.result?.reason === 'quarantine'
    ? 1
    : 0;

  return {
    profile,
    seed,
    result: runtime.state.result?.reason ?? 'bounded-active',
    technicalOutcomes,
    prohibitedTerminalEffects: 0,
    invariantFailures,
    illegalActions,
    issued,
    scheduled,
    applied,
    duplicateApplications,
    population: runtime.state.ants.length,
    maxPopulation: runtime.state.config.maxAnts,
    populationBounded: runtime.state.ants.length <= runtime.state.config.maxAnts,
    tick: runtime.state.tick,
    checksum: checksum(runtime.state),
  };
}

function runFinalAntCampaign(candidateSourceSha: string) {
  const token = candidateSourceSha.slice(0, 12);
  const baseline = PROFILES.map(profile => baselineScenario(`ant-phase6:${token}:${profile}`, profile));
  const baselineRerun = PROFILES.map(profile => baselineScenario(`ant-phase6:${token}:${profile}`, profile));
  const pressure = PROFILES.map(profile => pressureScenario(`ant-phase6-pressure:${token}:${profile}`, profile));
  const pressureRerun = PROFILES.map(profile => pressureScenario(`ant-phase6-pressure:${token}:${profile}`, profile));
  const deterministicRerunReady = checksum(baseline) === checksum(baselineRerun)
    && checksum(pressure) === checksum(pressureRerun);
  const totalInvariantFailures = [...baseline, ...pressure]
    .reduce((sum, item) => sum + item.invariantFailures + item.illegalActions, 0);
  const totalIllegalActions = [...baseline, ...pressure]
    .reduce((sum, item) => sum + item.illegalActions, 0);
  const totalDuplicateApplications = pressure
    .reduce((sum, item) => sum + item.duplicateApplications, 0);
  const patternsObserved = [...new Set(baseline.flatMap(item => item.patterns))].sort();
  const populationBounded = [...baseline, ...pressure].every(item => item.populationBounded);
  const scenarios = [
    {
      name: 'baseline',
      technicalOutcomes: baseline.reduce((sum, item) => sum + item.technicalOutcomes, 0),
      prohibitedTerminalEffects: 0,
      runs: baseline.length,
      ascensions: baseline.filter(item => item.result === 'ascension').length,
      appliedEffects: 0,
      checksum: checksum(baseline),
    },
    {
      name: 'maximum-bounded-pressure',
      technicalOutcomes: pressure.reduce((sum, item) => sum + item.technicalOutcomes, 0),
      prohibitedTerminalEffects: pressure.reduce((sum, item) => sum + item.prohibitedTerminalEffects, 0),
      runs: pressure.length,
      ascensions: pressure.filter(item => item.result === 'ascension').length,
      appliedEffects: pressure.reduce((sum, item) => sum + item.applied, 0),
      checksum: checksum(pressure),
    },
  ];
  const reportBase = {
    baseline,
    pressure,
    deterministicRerunReady,
    totalInvariantFailures,
    totalIllegalActions,
    totalDuplicateApplications,
    patternsObserved,
    populationBounded,
    scenarios,
  };
  return { ...reportBase, reportChecksum: checksum(reportBase) };
}

function capacity(source: CapacitySource) {
  return evaluateCapacity({
    source,
    samples: [
      { atMs: 0, tickMs: 6.5, aiMs: 3.8, renderMs: 8, snapshotMs: 14, restoreMs: 31, queueRatio: 0.18, memoryMb: 118 },
      { atMs: 3_600_000, tickMs: 7, aiMs: 4.1, renderMs: 9, snapshotMs: 15, restoreMs: 34, queueRatio: 0.24, memoryMb: 120 },
      { atMs: 7_200_000, tickMs: 7.5, aiMs: 4.4, renderMs: 10, snapshotMs: 16, restoreMs: 36, queueRatio: 0.3, memoryMb: 122 },
    ],
    budgets: {
      tickP99Ms: 12,
      aiP99Ms: 7,
      renderP99Ms: 16.7,
      snapshotP99Ms: 35,
      restoreP99Ms: 120,
      queueMaxRatio: 0.8,
      memorySlopeMbPerHour: 5,
      minHeadroomRatio: 0.2,
    },
  });
}

function defaultEndurance(candidateChecksum: string): EnduranceEvidence {
  return {
    candidateChecksum,
    source: 'synthetic',
    realElapsed: false,
    startedAtMs: 0,
    endedAtMs: 96 * 3_600_000,
    samples: 97,
    resourceSlopes: { memoryMbPerHour: 1, handlesPerHour: 0, queuePerHour: 0 },
    limits: { memoryMbPerHour: 5, handlesPerHour: 1, queuePerHour: 1 },
    duplicateEffects: 0,
    replayDivergences: 0,
    unresolvedOutputFailures: 0,
    manualCommonRecoveries: 0,
    privateExposures: 0,
    crashLoops: 0,
    evidenceDigest: 'sha256:abcdef12',
  };
}

function defaultProviders(candidateChecksum: string): ProviderEvidence[] {
  return REQUIRED_PROVIDERS.map((provider, index) => ({
    provider,
    candidateChecksum,
    environment: 'fixture',
    credentialed: false,
    productionEquivalent: false,
    source: 'ci',
    collectedAtMs: 1,
    expiresAtMs: 10_000,
    evidenceDigest: `sha256:${index ? '22222222' : '11111111'}`,
    checks: {
      authentication: true,
      reconnect: true,
      duplicates: true,
      reversal: true,
      outage: true,
      rateLimit: true,
    },
  }));
}

function defaultSafety(candidateChecksum: string): SafetyAttestation[] {
  return REQUIRED_SAFETY.map((kind, index) => ({
    kind,
    candidateChecksum,
    environment: 'ci',
    source: 'ci',
    status: 'pass',
    collectedAtMs: 1,
    expiresAtMs: 10_000,
    evidenceDigest: `sha256:${(0x33333333 + index).toString(16)}`,
    reviewer: 'ci-review',
    blockingFindings: 0,
    details: { implementationChecked: true },
  }));
}

function defaultDrills(candidateChecksum: string): DrillRecord[] {
  return MANDATORY_DRILLS.map((id, index) => ({
    id,
    candidateChecksum,
    environment: 'ci',
    source: 'ci',
    owner: 'ant-colony-operations',
    witness: '',
    runbook: 'docs/operations/ai-ant-colony-runbook.md',
    startedAtMs: index * 1000 + 1,
    endedAtMs: index * 1000 + 501,
    status: 'pass',
    evidenceDigest: `sha256:${(0x44444444 + index).toString(16)}`,
    automatedActionsVerified: true,
    outputVerified: true,
    observations: { implementation: true },
  }));
}

function defaultCanary(candidateChecksum: string) {
  const start: CanaryStart = {
    startedAtMs: 0,
    environment: 'ci',
    source: 'synthetic',
    realElapsed: false,
    attestationDigest: 'sha256:55555555',
  };
  const samples: CanarySample[] = [];
  for (let day = 0; day <= 7; day += 1) {
    samples.push({
      candidateChecksum,
      atMs: day * DAY,
      errorRate: 0.001,
      uptimeRatio: 0.9999,
      badOutputSeconds: 0,
      memorySlopeMbPerHour: 1,
      replayDivergences: 0,
      duplicateEffects: 0,
      privateExposures: 0,
      unauthorizedControls: 0,
      unsafeModerationFailures: 0,
      crashLoops: 0,
      restoreFailures: 0,
      recordCorruptions: 0,
      platformPolicyBreaches: 0,
      evidenceDigest: `sha256:${(0x66666666 + day).toString(16)}`,
    });
  }
  return { start, samples, evaluateAtMs: 7 * DAY };
}

export function createAntValidationBundle(
  candidateSourceSha: string,
  overrides: AntValidationOverrides = {},
) {
  const manifest = createAntReleaseManifest(candidateSourceSha);
  const { requirements, evidence, traceability } = implementationTraceability(manifest);
  const campaign = runFinalAntCampaign(candidateSourceSha);
  const chaos = runAntColonyPhase5Chaos(`ant-phase6-chaos:${candidateSourceSha.slice(0, 12)}`);
  const integrity: AntIntegritySummary = {
    invariantFailures: campaign.totalInvariantFailures,
    illegalActions: campaign.totalIllegalActions,
    replayDivergences: 0,
    duplicateEffects: campaign.totalDuplicateApplications,
    unauthorizedControls: 0,
    privateExposures: 0,
    openP0: 0,
    openP1: 0,
    ...overrides.integrity,
  };
  const capacityResult = capacity(overrides.capacitySource ?? { kind: 'ci-reference', attested: true });
  const enduranceEvidence = overrides.endurance ?? defaultEndurance(manifest.checksum);
  const endurance = assessEndurance(enduranceEvidence, 72, { expectedCandidateChecksum: manifest.checksum });
  const providerRecords = overrides.providers ?? defaultProviders(manifest.checksum);
  const providers = assessProviderEvidence(providerRecords, {
    expectedCandidateChecksum: manifest.checksum,
    nowMs: 100,
    requiredProviders: REQUIRED_PROVIDERS,
  });
  const safetyRecords = overrides.safety ?? defaultSafety(manifest.checksum);
  const safety = assessSafetyAttestations(safetyRecords, {
    expectedCandidateChecksum: manifest.checksum,
    nowMs: 100,
    requiredKinds: REQUIRED_SAFETY,
  });
  const drillRecords = overrides.drills ?? defaultDrills(manifest.checksum);
  const drills = assessDrillProgramme(drillRecords, { expectedCandidateChecksum: manifest.checksum });
  const canaryDefaults = defaultCanary(manifest.checksum);
  const canaryController = new CanaryController({
    candidateChecksum: manifest.checksum,
    requiredDurationMs: 7 * DAY,
    maxSampleGapMs: DAY + 1,
    maxErrorRate: 0.02,
    minUptimeRatio: 0.999,
    maxBadOutputSeconds: 30,
    maxMemorySlopeMbPerHour: 5,
    minSamples: 8,
  });
  const canaryStart = overrides.canaryStart ?? canaryDefaults.start;
  const canarySamples = overrides.canarySamples ?? canaryDefaults.samples;
  canaryController.start(canaryStart);
  for (const sample of canarySamples) canaryController.ingest(sample);
  const canary = canaryController.evaluate(overrides.canaryEvaluateAtMs ?? canaryDefaults.evaluateAtMs);
  const independentReview = overrides.independentReview ?? {
    status: 'missing' as const,
    candidateChecksum: '',
    reviewer: '',
    source: 'none' as const,
    evidenceDigest: '',
    openP0: 0,
    openP1: 0,
    acceptedP2: [],
  };
  const findings = overrides.findings ?? {
    openP0: integrity.openP0,
    openP1: integrity.openP1,
    acceptedP2: [],
  };
  const campaignForAssessor = {
    totalInvariantFailures: campaign.totalInvariantFailures
      + integrity.invariantFailures
      + integrity.illegalActions
      + integrity.replayDivergences
      + integrity.privateExposures
      + integrity.unauthorizedControls,
    totalDuplicateApplications: campaign.totalDuplicateApplications + integrity.duplicateEffects,
    deterministicRerunReady: campaign.deterministicRerunReady,
    reportChecksum: campaign.reportChecksum,
    scenarios: campaign.scenarios.map(item => ({
      technicalOutcomes: item.technicalOutcomes,
      prohibitedTerminalEffects: item.prohibitedTerminalEffects,
    })),
  };
  const readiness = assessReadiness({
    manifest,
    traceability,
    campaign: campaignForAssessor,
    capacity: capacityResult,
    endurance,
    providers,
    safety,
    drills,
    canary,
    independentReview,
    findings,
  });
  const softwareFailures = readiness.failures.length
    + integrity.invariantFailures
    + integrity.illegalActions
    + integrity.replayDivergences
    + integrity.duplicateEffects
    + integrity.unauthorizedControls
    + integrity.privateExposures
    + (chaos.status === 'pass' ? 0 : 1)
    + (traceability.status === 'complete' ? 0 : 1)
    + (drills.implementationStatus === 'pass' ? 0 : 1)
    + (campaign.populationBounded ? 0 : 1);
  const softwareVerdict = softwareFailures ? 'FAIL' as const : 'PASS' as const;
  const base = {
    schemaVersion: 1 as const,
    manifest,
    requirements,
    evidence,
    traceability,
    campaign,
    chaos,
    integrity,
    capacity: capacityResult,
    enduranceEvidence,
    endurance,
    providerRecords,
    providers,
    safetyRecords,
    safety,
    drillRecords,
    drills,
    canaryStart,
    canarySamples,
    canary,
    independentReview,
    findings,
    softwareVerdict,
    readiness,
  };
  return { ...base, bundleChecksum: checksum(base) };
}
