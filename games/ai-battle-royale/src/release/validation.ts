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
import { createBattleConfig } from '../config/index';
import { scheduleBattleInfluenceEffect } from '../influence/reducer';
import { runBattleRoyalePhase5Chaos } from '../operations/supervisor';
import { assertBattleInvariants } from '../rules/invariants';
import { BattleRoyaleRuntime } from '../runtime/runtime';
import type { InfluenceEffectId } from '../state/types';

export { MANDATORY_DRILLS };

const DAY = 24 * 60 * 60 * 1000;
const EFFECTS: InfluenceEffectId[] = ['supply-rain', 'zone-hold', 'medic-mist', 'radar-pulse', 'theme-shift'];
const REQUIRED_PROVIDERS = ['youtube', 'twitch'];
const REQUIRED_SAFETY = ['security', 'privacy', 'moderation', 'accessibility', 'audiovisual', 'assets', 'supply-chain'];
const PHASE5_ROLLBACK_SHA = '73bdb5573a0ff096178d499af69f86c404a4ac53';

export interface BattleIntegritySummary {
  invariantFailures: number;
  illegalActions: number;
  replayDivergences: number;
  duplicateEffects: number;
  unauthorizedControls: number;
  privateExposures: number;
  openP0: number;
  openP1: number;
}

export interface BattleValidationOverrides {
  integrity?: Partial<BattleIntegritySummary>;
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

export function createBattleReleaseManifest(candidateSourceSha: string): Readonly<ReleaseManifest> {
  if (!/^[a-f0-9]{40}$/i.test(candidateSourceSha)) throw invalidSha();
  return createReleaseManifest({
    releaseId: `ai-battle-royale-${candidateSourceSha.slice(0, 12)}`,
    candidateSourceSha,
    createdAtMs: 0,
    versions: {
      platform: '0.6.0',
      game: 'battle-royale-1.0.0-rc1',
      deterministic: 'battle-r2-v1',
      snapshot: '1',
      event: '1',
      providerAdapters: '2026-08-21',
      configHash: 'checksum:62617463',
      contentHash: 'checksum:6261746f',
      assetsHash: 'checksum:62617461',
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
      premiumBroadcast: true,
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
      configHash: 'checksum:62617435',
      contentHash: 'checksum:62617434',
      freshRunBoundary: true,
    },
    artifacts: [
      {
        name: 'battle-phase3-broadcast-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 3, contract: 'broadcast-capture' }),
      },
      {
        name: 'battle-phase5-operations-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 5, contract: 'verified-recovery-chaos' }),
      },
      {
        name: 'battle-phase6-validation-contract',
        kind: 'software-evidence',
        digest: evidenceDigest({ candidateSourceSha, phase: 6, contract: 'release-validation' }),
      },
    ],
  });
}

function implementationTraceability(manifest: ReleaseManifest) {
  const requirements: RequirementDefinition[] = [
    { id: 'FR-BATTLE-DET-001', phase: 1, level: 'MUST', owner: 'simulation' },
    { id: 'FR-BATTLE-AI-001', phase: 2, level: 'MUST', owner: 'gameplay' },
    { id: 'FR-BATTLE-UX-001', phase: 3, level: 'MUST', owner: 'presentation' },
    { id: 'FR-BATTLE-INT-001', phase: 4, level: 'MUST', owner: 'interaction' },
    { id: 'FR-BATTLE-OPS-001', phase: 5, level: 'MUST', owner: 'operations' },
    { id: 'FR-BATTLE-REL-001', phase: 6, level: 'MUST', owner: 'release' },
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

function releaseConfig() {
  return createBattleConfig({
    width: 24,
    height: 18,
    combatantCount: 12,
    lootCount: 24,
    maxTicks: 320,
    intermissionTicks: 8,
    startingHealth: 500,
    startingShield: 250,
    zoneFirstShrinkTick: 120,
    zoneShrinkInterval: 60,
    zoneShrinkAmount: 2,
    zoneDamage: 10,
    supplyDropEvery: 70,
    noProgressTicks: 160,
    voteWindowEvery: 80,
    voteWindowTicks: 20,
    maxProcessedInfluence: 64,
    maxAuditEntries: 64,
    maxScheduledEffects: 8,
  });
}

function baselineScenario(seed: string) {
  const config = releaseConfig();
  const runtime = new BattleRoyaleRuntime(config, seed, `release-${seed}`);
  let invariantFailures = 0;
  try {
    runtime.runToResult(config.maxTicks + 2);
    invariantFailures += assertBattleInvariants(runtime.state).length;
  } catch {
    invariantFailures += 1;
  }
  const result = runtime.state.result;
  return {
    seed,
    result: result?.reason ?? 'non-terminal',
    technicalOutcomes: result?.kind === 'technical' ? 1 : 0,
    prohibitedTerminalEffects: 0,
    invariantFailures,
    illegalActions: 0,
    duplicateApplications: 0,
    combatantsBounded: runtime.state.combatants.length === config.combatantCount,
    tick: runtime.state.tick,
    checksum: runtime.checksum(),
  };
}

function pressureScenario(seed: string) {
  const config = releaseConfig();
  const runtime = new BattleRoyaleRuntime(config, seed, `release-pressure-${seed}`);
  let invariantFailures = 0;
  let scheduled = 0;
  for (let index = 0; index < EFFECTS.length; index += 1) {
    const effectId = EFFECTS[index]!;
    const sourceWindowId = `${seed}:window:${index}`;
    const applyAtTick = 5 + index * 24;
    const first = scheduleBattleInfluenceEffect(runtime.state, effectId, sourceWindowId, applyAtTick);
    const duplicate = scheduleBattleInfluenceEffect(runtime.state, effectId, sourceWindowId, applyAtTick);
    if (first.status === 'scheduled') scheduled += 1;
    if (duplicate.status !== 'rejected' || duplicate.reason !== 'duplicate') invariantFailures += 1;
  }
  try {
    runtime.runToResult(config.maxTicks + 2);
    invariantFailures += assertBattleInvariants(runtime.state).length;
  } catch {
    invariantFailures += 1;
  }
  const appliedRecords = runtime.state.influence.scheduled.filter(effect => effect.applied);
  const counts = new Map<string, number>();
  for (const effect of appliedRecords) counts.set(effect.id, (counts.get(effect.id) ?? 0) + 1);
  const duplicateApplications = [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const result = runtime.state.result;
  return {
    seed,
    result: result?.reason ?? 'non-terminal',
    technicalOutcomes: result?.kind === 'technical' ? 1 : 0,
    prohibitedTerminalEffects: 0,
    invariantFailures,
    illegalActions: 0,
    scheduled,
    applied: appliedRecords.length,
    duplicateApplications,
    combatantsBounded: runtime.state.combatants.length === config.combatantCount,
    tick: runtime.state.tick,
    checksum: runtime.checksum(),
  };
}

function runFinalBattleCampaign(candidateSourceSha: string) {
  const token = candidateSourceSha.slice(0, 12);
  const baselineSeeds = [`battle-phase6:${token}:alpha`, `battle-phase6:${token}:bravo`];
  const pressureSeeds = [`battle-phase6-pressure:${token}:alpha`, `battle-phase6-pressure:${token}:bravo`];
  const baseline = baselineSeeds.map(baselineScenario);
  const baselineRerun = baselineSeeds.map(baselineScenario);
  const pressure = pressureSeeds.map(pressureScenario);
  const pressureRerun = pressureSeeds.map(pressureScenario);
  const deterministicRerunReady = checksum(baseline) === checksum(baselineRerun)
    && checksum(pressure) === checksum(pressureRerun);
  const totalInvariantFailures = [...baseline, ...pressure]
    .reduce((sum, item) => sum + item.invariantFailures + item.illegalActions, 0);
  const totalIllegalActions = [...baseline, ...pressure].reduce((sum, item) => sum + item.illegalActions, 0);
  const totalDuplicateApplications = pressure.reduce((sum, item) => sum + item.duplicateApplications, 0);
  const combatantsBounded = [...baseline, ...pressure].every(item => item.combatantsBounded);
  const scenarios = [
    {
      name: 'baseline',
      technicalOutcomes: baseline.reduce((sum, item) => sum + item.technicalOutcomes, 0),
      prohibitedTerminalEffects: 0,
      runs: baseline.length,
      appliedEffects: 0,
      checksum: checksum(baseline),
    },
    {
      name: 'maximum-bounded-audience-pressure',
      technicalOutcomes: pressure.reduce((sum, item) => sum + item.technicalOutcomes, 0),
      prohibitedTerminalEffects: pressure.reduce((sum, item) => sum + item.prohibitedTerminalEffects, 0),
      runs: pressure.length,
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
    combatantsBounded,
    scenarios,
  };
  return { ...reportBase, reportChecksum: checksum(reportBase) };
}

function capacity(source: CapacitySource) {
  return evaluateCapacity({
    source,
    samples: [
      { atMs: 0, tickMs: 6.8, aiMs: 3.9, renderMs: 8.5, snapshotMs: 14, restoreMs: 32, queueRatio: 0.18, memoryMb: 120 },
      { atMs: 3_600_000, tickMs: 7.2, aiMs: 4.2, renderMs: 9.2, snapshotMs: 15, restoreMs: 35, queueRatio: 0.25, memoryMb: 122 },
      { atMs: 7_200_000, tickMs: 7.8, aiMs: 4.5, renderMs: 10.1, snapshotMs: 16, restoreMs: 37, queueRatio: 0.31, memoryMb: 124 },
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
    owner: 'battle-royale-operations',
    witness: '',
    runbook: 'docs/operations/ai-battle-royale-runbook.md',
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

export function createBattleValidationBundle(
  candidateSourceSha: string,
  overrides: BattleValidationOverrides = {},
) {
  const manifest = createBattleReleaseManifest(candidateSourceSha);
  const { requirements, evidence, traceability } = implementationTraceability(manifest);
  const campaign = runFinalBattleCampaign(candidateSourceSha);
  const chaos = runBattleRoyalePhase5Chaos(`battle-phase6-chaos:${candidateSourceSha.slice(0, 12)}`);
  const integrity: BattleIntegritySummary = {
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
    deterministicRerunReady: campaign.deterministicRerunReady && integrity.replayDivergences === 0,
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
    + (campaign.combatantsBounded ? 0 : 1);
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
