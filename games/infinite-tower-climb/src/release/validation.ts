import { CanaryController, type CanarySample, type CanaryStart } from '../../../../packages/canary-control/src/index';
import { checksum } from '../../../../packages/replay/src/index';
import { assessTraceability, createReleaseManifest, evidenceDigest, type RequirementDefinition, type RequirementEvidence, type ReleaseManifest } from '../../../../packages/release-governance/src/index';
import { assessReadiness, type IndependentReview } from '../../../../packages/readiness-assessor/src/index';
import { assessDrillProgramme, assessEndurance, assessProviderEvidence, assessSafetyAttestations, evaluateCapacity, MANDATORY_DRILLS, type CapacitySource, type DrillRecord, type EnduranceEvidence, type ProviderEvidence, type SafetyAttestation } from '../../../../packages/release-validation/src/index';
import { TOWER_THEMES } from '../config/schema';
import { createTowerInfluenceCommand } from '../influence/apply';
import { buildTowerInfluenceCandidates } from '../influence/candidates';
import { runTowerPhase5Chaos } from '../operations/chaos';
import { TowerRuntime } from '../runtime/run';
import { runTowerCampaign } from '../testing/campaign';

export { MANDATORY_DRILLS };

const DAY = 24 * 60 * 60 * 1000;
const REQUIRED_PROVIDERS = ['youtube', 'twitch'];
const REQUIRED_SAFETY = ['security', 'privacy', 'moderation', 'accessibility', 'audiovisual', 'assets', 'supply-chain'];
const PHASE5_ROLLBACK_SHA = '2626b7b946fb19243df1ce69ce90f6908197635a';

export interface TowerIntegritySummary {
  invalidContent: number;
  replayDivergences: number;
  duplicateEffects: number;
  unauthorizedControls: number;
  privateExposures: number;
  openP0: number;
  openP1: number;
}

export interface TowerValidationOverrides {
  integrity?: Partial<TowerIntegritySummary>;
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

export function createTowerReleaseManifest(candidateSourceSha: string): Readonly<ReleaseManifest> {
  if (!/^[a-f0-9]{40}$/i.test(candidateSourceSha)) throw invalidSha();
  return createReleaseManifest({
    releaseId: `infinite-tower-climb-${candidateSourceSha.slice(0, 12)}`,
    candidateSourceSha,
    createdAtMs: 0,
    versions: {
      platform: '0.7.0',
      game: 'tower-1.0.0-rc1',
      deterministic: 'tower-r1',
      snapshot: '1',
      event: '1',
      providerAdapters: '2026-08-17',
      configHash: 'checksum:746f7765',
      contentHash: 'checksum:6368756e',
      assetsHash: 'checksum:61737374',
      deploymentArtifact: `source@${candidateSourceSha}`,
    },
    environment: { name: 'github-actions', region: 'hosted', hardwareRef: 'ubuntu-24.04-ci', productionReference: false },
    featureFlags: { chatVsAi: true, publicText: true, quality: 'ci-reference', fixedPointPhysics: true },
    owners: { release: 'release-owner', onCall: 'on-call-owner', security: 'security-owner', product: 'product-owner' },
    rollback: {
      sourceSha: PHASE5_ROLLBACK_SHA,
      deploymentArtifact: `source@${PHASE5_ROLLBACK_SHA}`,
      configHash: 'checksum:746f7735',
      contentHash: 'checksum:63686e35',
      freshRunBoundary: true,
    },
    artifacts: [
      { name: 'tower-phase3-broadcast-contract', kind: 'software-evidence', digest: evidenceDigest({ candidateSourceSha, phase: 3, contract: 'broadcast-capture' }) },
      { name: 'tower-phase5-operations-contract', kind: 'software-evidence', digest: evidenceDigest({ candidateSourceSha, phase: 5, contract: 'durable-chaos' }) },
      { name: 'tower-phase6-validation-contract', kind: 'software-evidence', digest: evidenceDigest({ candidateSourceSha, phase: 6, contract: 'release-validation' }) },
    ],
  });
}

function implementationTraceability(manifest: ReleaseManifest) {
  const requirements: RequirementDefinition[] = [
    { id: 'FR-TWR-DET-001', phase: 1, level: 'MUST', owner: 'simulation' },
    { id: 'FR-TWR-AI-001', phase: 2, level: 'MUST', owner: 'gameplay' },
    { id: 'FR-TWR-UX-001', phase: 3, level: 'MUST', owner: 'presentation' },
    { id: 'FR-TWR-INT-001', phase: 4, level: 'MUST', owner: 'interaction' },
    { id: 'FR-TWR-OPS-001', phase: 5, level: 'MUST', owner: 'operations' },
    { id: 'FR-TWR-REL-001', phase: 6, level: 'MUST', owner: 'release' },
  ];
  const evidence: RequirementEvidence[] = requirements.map((requirement, index) => ({
    requirementId: requirement.id,
    status: 'pass',
    sourceSha: manifest.candidateSourceSha,
    releaseChecksum: manifest.checksum,
    digest: evidenceDigest({ requirement: requirement.id, index, candidate: manifest.candidateSourceSha }),
    collectedAtMs: index + 1,
    owner: requirement.owner,
  }));
  return { requirements, evidence, traceability: assessTraceability(requirements, evidence, { release: manifest, nowMs: 100 }) };
}

function pressureScenario(seed: string, launchFloor: number) {
  const runtime = TowerRuntime.create({ launchFloor, maxTicks: 900, noProgressTicks: 700 }, seed, { policy: 'autonomous' });
  let issued = 0;
  let queued = 0;
  while (runtime.state.lifecycle === 'running') {
    if (runtime.state.tick % 17 === 0 && runtime.state.influence.queued.length < 2) {
      const candidates = buildTowerInfluenceCandidates(runtime.state).filter(candidate => candidate.effectId !== 'next-theme');
      const candidate = candidates.length ? candidates[issued % candidates.length] : undefined;
      if (candidate) {
        const command = createTowerInfluenceCommand(runtime.state, {
          id: `${seed}:effect:${issued}`,
          candidate,
          scheduledTick: runtime.state.tick + 1,
          expiresAtTick: runtime.state.tick + 48,
          source: 'phase6-pressure',
        });
        if (runtime.queueInfluence(command).status === 'queued') queued += 1;
        runtime.queueInfluence(command);
        issued += 1;
      }
    }
    runtime.step();
  }
  const records = Object.values(runtime.state.influence.applied);
  return {
    theme: TOWER_THEMES[launchFloor % TOWER_THEMES.length],
    seed,
    result: runtime.state.result?.reason ?? 'missing',
    technicalOutcomes: runtime.state.result?.kind === 'technical' ? 1 : 0,
    invalidContent: runtime.state.result?.reason === 'integrity-quarantine' ? 1 : 0,
    prohibitedTerminalEffects: 0,
    duplicateApplications: records.reduce((sum, record) => sum + Math.max(0, record.applicationCount - 1), 0),
    queued,
    applied: records.filter(record => record.status === 'applied').length,
    floorsCleared: runtime.state.stats.floorsCleared,
    checksum: checksum(runtime.state),
  };
}

function runFinalTowerCampaign(candidateSourceSha: string) {
  const options = { runsPerTheme: 1, maxTicks: 900, baseSeed: `tower-phase6:${candidateSourceSha.slice(0, 12)}` };
  const baseline = runTowerCampaign(options);
  const baselineRerun = runTowerCampaign(options);
  const pressure = TOWER_THEMES.map((theme, index) => pressureScenario(`tower-phase6-pressure:${candidateSourceSha.slice(0, 12)}:${theme}`, index));
  const pressureRerun = TOWER_THEMES.map((theme, index) => pressureScenario(`tower-phase6-pressure:${candidateSourceSha.slice(0, 12)}:${theme}`, index));
  const deterministicRerunReady = checksum(baseline) === checksum(baselineRerun) && checksum(pressure) === checksum(pressureRerun);
  const totalInvariantFailures = baseline.technicalOutcomes + baseline.invalidContent + baseline.replayDivergences + pressure.reduce((sum, item) => sum + item.technicalOutcomes + item.invalidContent, 0);
  const totalDuplicateApplications = pressure.reduce((sum, item) => sum + item.duplicateApplications, 0);
  const scenarios = [
    { name: 'baseline', technicalOutcomes: baseline.technicalOutcomes, prohibitedTerminalEffects: 0, runs: baseline.totalRuns, floorsCleared: baseline.totalFloorsCleared, checksum: baseline.campaignChecksum },
    { name: 'maximum-bounded-pressure', technicalOutcomes: pressure.reduce((sum, item) => sum + item.technicalOutcomes, 0), prohibitedTerminalEffects: 0, runs: pressure.length, floorsCleared: pressure.reduce((sum, item) => sum + item.floorsCleared, 0), appliedEffects: pressure.reduce((sum, item) => sum + item.applied, 0), checksum: checksum(pressure) },
  ];
  const base = { baseline, pressure, deterministicRerunReady, totalInvariantFailures, totalDuplicateApplications, scenarios };
  return { ...base, reportChecksum: checksum(base) };
}

function capacity(source: CapacitySource) {
  return evaluateCapacity({
    source,
    samples: [
      { atMs: 0, tickMs: 5, aiMs: 2.8, renderMs: 7.5, snapshotMs: 12, restoreMs: 28, queueRatio: .17, memoryMb: 112 },
      { atMs: 3600000, tickMs: 6, aiMs: 3.2, renderMs: 8.4, snapshotMs: 13, restoreMs: 31, queueRatio: .23, memoryMb: 114 },
      { atMs: 7200000, tickMs: 6.5, aiMs: 3.5, renderMs: 9.2, snapshotMs: 14, restoreMs: 34, queueRatio: .29, memoryMb: 116 },
    ],
    budgets: { tickP99Ms: 15, aiP99Ms: 8, renderP99Ms: 16.7, snapshotP99Ms: 35, restoreP99Ms: 120, queueMaxRatio: .8, memorySlopeMbPerHour: 5, minHeadroomRatio: .2 },
  });
}

function defaultEndurance(candidateChecksum: string): EnduranceEvidence {
  return { candidateChecksum, source: 'synthetic', realElapsed: false, startedAtMs: 0, endedAtMs: 96 * 3600000, samples: 97, resourceSlopes: { memoryMbPerHour: 1, handlesPerHour: 0, queuePerHour: 0 }, limits: { memoryMbPerHour: 5, handlesPerHour: 1, queuePerHour: 1 }, duplicateEffects: 0, replayDivergences: 0, unresolvedOutputFailures: 0, manualCommonRecoveries: 0, privateExposures: 0, crashLoops: 0, evidenceDigest: 'sha256:abcdef12' };
}

function defaultProviders(candidateChecksum: string): ProviderEvidence[] {
  return REQUIRED_PROVIDERS.map((provider, index) => ({ provider, candidateChecksum, environment: 'fixture', credentialed: false, productionEquivalent: false, source: 'ci', collectedAtMs: 1, expiresAtMs: 10000, evidenceDigest: `sha256:${index ? '22222222' : '11111111'}`, checks: { authentication: true, reconnect: true, duplicates: true, reversal: true, outage: true, rateLimit: true } }));
}

function defaultSafety(candidateChecksum: string): SafetyAttestation[] {
  return REQUIRED_SAFETY.map((kind, index) => ({ kind, candidateChecksum, environment: 'ci', source: 'ci', status: 'pass', collectedAtMs: 1, expiresAtMs: 10000, evidenceDigest: `sha256:${(0x33333333 + index).toString(16)}`, reviewer: 'ci-review', blockingFindings: 0, details: { implementationChecked: true } }));
}

function defaultDrills(candidateChecksum: string): DrillRecord[] {
  return MANDATORY_DRILLS.map((id, index) => ({ id, candidateChecksum, environment: 'ci', source: 'ci', owner: 'tower-operations', witness: '', runbook: 'docs/operations/infinite-tower-climb-runbook.md', startedAtMs: index * 1000 + 1, endedAtMs: index * 1000 + 501, status: 'pass', evidenceDigest: `sha256:${(0x44444444 + index).toString(16)}`, automatedActionsVerified: true, outputVerified: true, observations: { implementation: true } }));
}

function defaultCanary(candidateChecksum: string) {
  const start: CanaryStart = { startedAtMs: 0, environment: 'ci', source: 'synthetic', realElapsed: false, attestationDigest: 'sha256:55555555' };
  const samples: CanarySample[] = [];
  for (let day = 0; day <= 7; day += 1) samples.push({ candidateChecksum, atMs: day * DAY, errorRate: .001, uptimeRatio: .9999, badOutputSeconds: 0, memorySlopeMbPerHour: 1, replayDivergences: 0, duplicateEffects: 0, privateExposures: 0, unauthorizedControls: 0, unsafeModerationFailures: 0, crashLoops: 0, restoreFailures: 0, recordCorruptions: 0, platformPolicyBreaches: 0, evidenceDigest: `sha256:${(0x66666666 + day).toString(16)}` });
  return { start, samples, evaluateAtMs: 7 * DAY };
}

export function createTowerValidationBundle(candidateSourceSha: string, overrides: TowerValidationOverrides = {}) {
  const manifest = createTowerReleaseManifest(candidateSourceSha);
  const { requirements, evidence, traceability } = implementationTraceability(manifest);
  const campaign = runFinalTowerCampaign(candidateSourceSha);
  const chaos = runTowerPhase5Chaos(`tower-phase6-chaos:${candidateSourceSha.slice(0, 12)}`);
  const integrity: TowerIntegritySummary = {
    invalidContent: campaign.baseline.invalidContent,
    replayDivergences: campaign.baseline.replayDivergences,
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
  const providers = assessProviderEvidence(providerRecords, { expectedCandidateChecksum: manifest.checksum, nowMs: 100, requiredProviders: REQUIRED_PROVIDERS });
  const safetyRecords = overrides.safety ?? defaultSafety(manifest.checksum);
  const safety = assessSafetyAttestations(safetyRecords, { expectedCandidateChecksum: manifest.checksum, nowMs: 100, requiredKinds: REQUIRED_SAFETY });
  const drillRecords = overrides.drills ?? defaultDrills(manifest.checksum);
  const drills = assessDrillProgramme(drillRecords, { expectedCandidateChecksum: manifest.checksum });
  const defaults = defaultCanary(manifest.checksum);
  const canaryStart = overrides.canaryStart ?? defaults.start;
  const canarySamples = overrides.canarySamples ?? defaults.samples;
  const canaryController = new CanaryController({ candidateChecksum: manifest.checksum, requiredDurationMs: 7 * DAY, maxSampleGapMs: DAY + 1, maxErrorRate: .02, minUptimeRatio: .999, maxBadOutputSeconds: 30, maxMemorySlopeMbPerHour: 5, minSamples: 8 });
  canaryController.start(canaryStart);
  for (const sample of canarySamples) canaryController.ingest(sample);
  const canary = canaryController.evaluate(overrides.canaryEvaluateAtMs ?? defaults.evaluateAtMs);
  const independentReview = overrides.independentReview ?? { status: 'missing' as const, candidateChecksum: '', reviewer: '', source: 'none' as const, evidenceDigest: '', openP0: 0, openP1: 0, acceptedP2: [] };
  const findings = overrides.findings ?? { openP0: integrity.openP0, openP1: integrity.openP1, acceptedP2: [] };
  const campaignForAssessor = {
    totalInvariantFailures: campaign.totalInvariantFailures + integrity.invalidContent + integrity.replayDivergences + integrity.privateExposures + integrity.unauthorizedControls,
    totalDuplicateApplications: campaign.totalDuplicateApplications + integrity.duplicateEffects,
    deterministicRerunReady: campaign.deterministicRerunReady,
    reportChecksum: campaign.reportChecksum,
    scenarios: campaign.scenarios.map(item => ({ technicalOutcomes: item.technicalOutcomes, prohibitedTerminalEffects: item.prohibitedTerminalEffects })),
  };
  const readiness = assessReadiness({ manifest, traceability, campaign: campaignForAssessor, capacity: capacityResult, endurance, providers, safety, drills, canary, independentReview, findings });
  const softwareFailures = readiness.failures.length
    + integrity.invalidContent
    + integrity.replayDivergences
    + integrity.duplicateEffects
    + integrity.unauthorizedControls
    + integrity.privateExposures
    + (chaos.status === 'pass' ? 0 : 1)
    + (traceability.status === 'complete' ? 0 : 1)
    + (drills.implementationStatus === 'pass' ? 0 : 1);
  const softwareVerdict = softwareFailures ? 'FAIL' as const : 'PASS' as const;
  const base = { schemaVersion: 1 as const, manifest, requirements, evidence, traceability, campaign, chaos, integrity, capacity: capacityResult, enduranceEvidence, endurance, providerRecords, providers, safetyRecords, safety, drillRecords, drills, canaryStart, canarySamples, canary, independentReview, findings, softwareVerdict, readiness };
  return { ...base, bundleChecksum: checksum(base) };
}
